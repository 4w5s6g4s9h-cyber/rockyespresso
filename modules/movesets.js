import { fetchJson, localData } from "./data.js";

export async function loadMovesets({ pokemon, generatedMovePlan }) {
  try {
    const [movesetData, moveData] = localData()
      ? [localData().movesets, localData().moves]
      : await Promise.all([
        fetchJson("data/champions-movesets.json", "Movesets konden niet worden geladen"),
        fetchJson("data/champions-moves.json", "Move-details konden niet worden geladen")
      ]);

    const movesets = movesetData.sets ?? {};
    const movesetSources = Object.fromEntries((movesetData.sources ?? []).map((source) => [source.id, source]));
    const moveDetails = moveData.moves ?? {};

    enrichGeneratedMovesets({ movesets, pokemon, generatedMovePlan });
    return { movesets, movesetSources, moveDetails };
  } catch (error) {
    console.warn("Moveset database niet geladen; de app gebruikt fallback-richtlijnen.", error);
    return { movesets: {}, movesetSources: {}, moveDetails: {} };
  }
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
