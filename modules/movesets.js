import { fetchJson, localData } from "./data.js";
import { MOVE_LEARNSET_BLOCKLIST, MOVE_REPLACEMENTS } from "./constants.js";
import { baseSpeciesLabel } from "./team-analysis.js";

export async function loadMovesets({ pokemon, generatedMovePlan }) {
  try {
    const [movesetData, moveData, learnsetData] = localData()
      ? [localData().movesets, localData().moves, localData().learnsets]
      : await Promise.all([
        fetchJson("data/champions-movesets.json", "Movesets konden niet worden geladen"),
        fetchJson("data/champions-moves.json", "Move-details konden niet worden geladen"),
        fetchJson("data/champions-learnsets.json", "Learnsets konden niet worden geladen")
      ]);

    const movesets = movesetData.sets ?? {};
    const movesetSources = Object.fromEntries((movesetData.sources ?? []).map((source) => [source.id, source]));
    const moveDetails = moveData.moves ?? {};
    const learnsets = learnsetData?.learnsets ?? {};

    enrichGeneratedMovesets({ movesets, pokemon, generatedMovePlan });
    enrichChampionsCompatibility({ movesets, pokemon, moveDetails, learnsets, generatedMovePlan });
    return { movesets, movesetSources, moveDetails, learnsets };
  } catch (error) {
    console.warn("Moveset database niet geladen; de app gebruikt fallback-richtlijnen.", error);
    return { movesets: {}, movesetSources: {}, moveDetails: {}, learnsets: {} };
  }
}

function enrichChampionsCompatibility({ movesets, pokemon, moveDetails, learnsets, generatedMovePlan }) {
  for (const [name, sets] of Object.entries(movesets)) {
    const matchingPokemon = pokemon.find((item) => item.name === name);
    sets.forEach((set) => {
      const fallbackMoves = matchingPokemon ? generatedMovePlan(matchingPokemon, generatedModeFromSet(set, matchingPokemon)) : [];
      set.championsCompatibility = validateMoveSlots(name, set.moves, moveDetails, { fallbackMoves, learnsets });
    });
  }
}

export function validateMoveSlots(pokemonName, moves = [], moveDetails = {}, { fallbackMoves = [], learnsets = {} } = {}) {
  const issues = [];
  const suggestedMoves = [];
  const replacementMoves = [];
  moves.forEach((slot) => {
    const options = splitMoveOptions(slot);
    const allowedOptions = options.filter((move) => !isMoveBlockedForPokemon(pokemonName, move, learnsets));
    const blockedOptions = options.filter((move) => isMoveBlockedForPokemon(pokemonName, move, learnsets));

    blockedOptions.forEach((move) => {
      issues.push({
        move,
        reason: `${displayPokemonName(pokemonName)} kan ${move} niet leren in Champions.`
      });
    });

    if (allowedOptions.length) {
      suggestedMoves.push(allowedOptions.join(" / "));
      return;
    }

    const replacements = replacementMovesForSlot(pokemonName, slot, moveDetails, suggestedMoves, fallbackMoves, moves, learnsets);
    const replacement = replacements[0] ?? "";
    if (replacement) replacementMoves.push(replacement);
    replacements.slice(1).forEach((move) => {
      if (!replacementMoves.includes(move)) replacementMoves.push(move);
    });
    suggestedMoves.push(replacement);
  });
  return {
    ok: issues.length === 0,
    issues,
    suggestedMoves: suggestedMoves.filter(Boolean).slice(0, 4),
    replacementMoves
  };
}

export function isMoveBlockedForPokemon(pokemonName, move, learnsets = {}) {
  const learnset = learnsetForPokemon(pokemonName, learnsets);
  if (learnset && !learnset.has(move)) return true;

  const blocked = MOVE_LEARNSET_BLOCKLIST[move];
  if (!blocked) return false;
  const baseName = baseSpeciesLabel(pokemonName);
  return blocked.includes(pokemonName) || blocked.includes(baseName);
}

export function pokemonCanLearnMoves(pokemonName, moves = [], learnsets = {}, moveDetails = {}) {
  const wantedMoves = [...new Set(moves.map((move) => String(move).trim()).filter(Boolean))];
  if (!wantedMoves.length) {
    return { ok: true, known: [], unknown: [], blocked: [] };
  }

  const unknown = wantedMoves.filter((move) => moveDetails && Object.keys(moveDetails).length && !moveDetails[move]);
  const blocked = wantedMoves
    .filter((move) => !unknown.includes(move))
    .filter((move) => isMoveBlockedForPokemon(pokemonName, move, learnsets));

  return {
    ok: unknown.length === 0 && blocked.length === 0,
    known: wantedMoves.filter((move) => !unknown.includes(move) && !blocked.includes(move)),
    unknown,
    blocked
  };
}

function learnsetForPokemon(pokemonName, learnsets = {}) {
  const exact = learnsets[pokemonName];
  const baseName = baseSpeciesLabel(pokemonName);
  const base = learnsets[baseName];
  const moves = exact?.length ? exact : base;
  return moves?.length ? new Set(moves) : null;
}

function replacementMovesForSlot(pokemonName, slot, moveDetails, currentMoves, fallbackMoves = [], originalMoves = [], learnsets = {}) {
  const curated = splitMoveOptions(slot)
    .flatMap((move) => {
      const baseName = baseSpeciesLabel(pokemonName);
      return [
        ...(MOVE_REPLACEMENTS[move]?.[pokemonName] ?? []),
        ...(MOVE_REPLACEMENTS[move]?.[baseName] ?? [])
      ];
    });
  const blockedMoves = splitMoveOptions(slot);
  const scored = [...curated, ...fallbackMoves]
    .filter((move) => moveDetails[move])
    .filter((move) => !isMoveBlockedForPokemon(pokemonName, move, learnsets))
    .filter((move) => !currentMoves.some((slot) => splitMoveOptions(slot).includes(move)))
    .map((move) => ({
      move,
      score: replacementMoveScore(move, blockedMoves, moveDetails, currentMoves, originalMoves)
    }))
    .sort((a, b) => b.score - a.score);
  const good = scored.filter(({ score }) => score >= -10).slice(0, 3).map(({ move }) => move);
  return good.length ? good : scored.slice(0, 1).map(({ move }) => move);
}

function splitMoveOptions(value) {
  return String(value).split("/").map((part) => part.trim()).filter(Boolean);
}

function replacementMoveScore(candidate, blockedMoves, moveDetails, currentMoves, originalMoves) {
  const details = moveDetails[candidate] ?? {};
  const candidateTags = moveFunctionTags(candidate, details);
  const blockedTags = new Set(blockedMoves.flatMap((move) => moveFunctionTags(move, moveDetails[move] ?? {})));
  const existingMoves = [...new Set([...currentMoves, ...originalMoves]
    .flatMap(splitMoveOptions)
    .filter((move) => !blockedMoves.includes(move)))];
  const existingTagSets = existingMoves.map((move) => new Set(moveFunctionTags(move, moveDetails[move] ?? {})));
  let score = 0;

  candidateTags.forEach((tag) => {
    if (blockedTags.has(tag)) score += 12;
  });
  if (details.category === "Status" && blockedMoves.some((move) => moveDetails[move]?.category === "Status")) score += 8;
  if (details.category !== "Status" && blockedMoves.every((move) => moveDetails[move]?.category !== "Status")) score += 4;
  if (details.accuracy === "-") score += 2;
  score += (Number(details.pp) || 0) / 20;

  existingTagSets.forEach((tags) => {
    candidateTags.forEach((tag) => {
      if (tags.has(tag)) score -= duplicatePenalty(tag);
    });
  });

  return score;
}

function moveFunctionTags(move, details = {}) {
  const text = `${move} ${details.effect ?? ""}`.toLowerCase();
  const tags = [];
  if (details.category === "Status") tags.push("status");
  if (/toxic|poison|burn|paraly/.test(text)) tags.push("status-condition");
  if (/protects|protect/.test(text)) tags.push("protect");
  if (/forces? .* out|switch to a random ally|whirlwind|roar|dragon tail/.test(text)) tags.push("phazing");
  if (/stealth rock|spikes|sticky web|entry hazard|sets .*hazard/.test(text)) tags.push("hazard");
  if (/recover|restores|heals|roost|slack off|synthesis|wish/.test(text)) tags.push("recovery");
  if (/raises|boost|swords dance|calm mind|curse|nasty plot|dragon dance/.test(text)) tags.push("setup");
  if (details.category && details.category !== "Status") tags.push("damage");
  if (details.category && details.type) tags.push(`${details.category}:${details.type}`);
  if (details.type) tags.push(`type:${details.type}`);
  return tags;
}

function duplicatePenalty(tag) {
  if (tag.startsWith("type:")) return 8;
  if (tag.includes(":")) return 10;
  if (tag === "damage") return 3;
  return 5;
}

function displayPokemonName(name) {
  return String(name).replace(/-Mega(?:-[XY])?$/, "").replace(/-/g, " ");
}

function enrichGeneratedMovesets({ movesets, pokemon, generatedMovePlan }) {
  for (const [name, sets] of Object.entries(movesets)) {
    const matchingPokemon = pokemon.find((item) => item.name === name);
    if (!matchingPokemon) continue;

    sets.forEach((set) => {
      if (set.status !== "generated") return;
      if (!hasPlaceholderMoves(set.moves)) return;

      const mode = generatedModeFromSet(set, matchingPokemon);
      set.label = generatedLabelForMode(mode);
      set.moves = generatedMovePlan(matchingPokemon, mode);
      set.generatedNote = "Moves automatisch voorgesteld uit de lokale move-database; nog valideren voor Champions.";
    });
  }
}

function hasPlaceholderMoves(moves = []) {
  return moves.some((move) => /STAB|coverage|utility|setup|priority|recovery|pivot|team gaps|walls|checks|betrouwbare/i.test(move));
}

function generatedModeFromSet(set, pokemon) {
  const haystack = `${set.id ?? ""} ${set.label ?? ""} ${set.role ?? ""}`.toLowerCase();
  if (haystack.includes("bulky") || haystack.includes("wall")) return "bulky";
  if (haystack.includes("special")) return "special";
  if (haystack.includes("physical")) return "physical";
  if (pokemon.spa >= pokemon.atk + 15) return "special";
  if (pokemon.atk >= pokemon.spa + 15) return "physical";
  return "mixed";
}

function generatedLabelForMode(mode) {
  if (mode === "physical") return "Physical";
  if (mode === "special") return "Special";
  if (mode === "bulky") return "Bulky";
  return "Mixed";
}
