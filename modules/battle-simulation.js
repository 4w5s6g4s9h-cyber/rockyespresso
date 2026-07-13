import { baseSpecies, defensiveMultiplier, pokemonUsesMegaSlot } from "./team-analysis.js";

const DEFAULT_FORMAT = { maxTeamSize: 6, selectionSize: 3, label: "Single 3v3" };

// De matchup-score blijft een heuristiek (geen volledige damage-berekening),
// maar Choice-items en Life Orb verschuiven matchups zó sterk dat ze als
// statmodifier meegenomen worden.
const ITEM_MODIFIERS = {
  "Choice Band": { atk: 1.5 },
  "Choice Specs": { spa: 1.5 },
  "Choice Scarf": { spe: 1.5 },
  "Life Orb": { atk: 1.3, spa: 1.3 }
};

function heldItem(build = {}) {
  return String(build.item ?? "").split("/")[0].trim();
}

export function effectiveBattleStats(pokemon, build = {}) {
  const mods = ITEM_MODIFIERS[heldItem(build)] ?? {};
  return {
    atk: (pokemon.atk ?? 0) * (mods.atk ?? 1),
    spa: (pokemon.spa ?? 0) * (mods.spa ?? 1),
    spe: (pokemon.spe ?? 0) * (mods.spe ?? 1)
  };
}

export function selectedBattleMembers(team = [], selection = [], format = DEFAULT_FORMAT) {
  const limit = format.selectionSize ?? DEFAULT_FORMAT.selectionSize;
  const byName = new Map(team.map((pokemon) => [pokemon.name, pokemon]));
  const picked = selection.map((name) => byName.get(name)).filter(Boolean);
  const seen = new Set(picked.map((pokemon) => pokemon.name));
  team.forEach((pokemon) => {
    if (picked.length < limit && !seen.has(pokemon.name)) {
      picked.push(pokemon);
      seen.add(pokemon.name);
    }
  });
  return picked.slice(0, limit);
}

export function generateOpponentTeam({
  pokemon = [],
  playerTeam = [],
  playerRoster = [],
  format = DEFAULT_FORMAT,
  mode = "counter",
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" })
} = {}) {
  const maxTeamSize = format.maxTeamSize ?? DEFAULT_FORMAT.maxTeamSize;
  const playerBases = new Set(playerTeam.map((member) => baseSpecies(member.name)));
  const team = [];

  const referenceTeam = playerTeam.length ? playerTeam : playerRoster;
  const referenceProfile = teamProfile(referenceTeam, selectedBuild, roleFor);
  const candidates = [...pokemon]
    .filter((candidate) => !playerBases.has(baseSpecies(candidate.name)))
    .map((candidate) => ({
      pokemon: candidate,
      score: opponentCandidateScore(candidate, {
        mode,
        playerTeam,
        referenceProfile,
        selectedBuild,
        moveDetails,
        roleFor
      })
    }))
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst || a.pokemon.name.localeCompare(b.pokemon.name));

  for (const { pokemon: candidate } of candidates) {
    if (team.length >= maxTeamSize) break;
    if (!isLegalOpponentMember(candidate, team, selectedBuild)) continue;
    team.push(candidate);
  }

  return team;
}

export function simulateBattle({
  playerTeam = [],
  opponentTeam = [],
  playerSelection = [],
  opponentSelection = [],
  format = DEFAULT_FORMAT,
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" })
} = {}) {
  const playerMembers = selectedBattleMembers(playerTeam, playerSelection, format);
  const opponentMembers = selectedBattleMembers(opponentTeam, opponentSelection, format);
  const pairings = playerMembers.flatMap((player) => opponentMembers.map((opponent) => {
    const result = matchupScore(player, opponent, { selectedBuild, moveDetails, roleFor });
    return { player, opponent, ...result };
  }));
  const matchupMatrix = createMatchupMatrix(playerMembers, opponentMembers, pairings);

  const playerScore = aggregateTeamScore(playerMembers, opponentMembers, { selectedBuild, moveDetails, roleFor });
  const opponentScore = aggregateTeamScore(opponentMembers, playerMembers, { selectedBuild, moveDetails, roleFor });
  const matchupIndex = clamp(Math.round(50 + (playerScore - opponentScore) / 6), 5, 95);
  const advantage = matchupIndex >= 62 ? "Voordeel" : matchupIndex <= 38 ? "Lastig" : "Evenwichtig";
  const teamMetrics = scoreTeamPreview(playerMembers, opponentMembers, { selectedBuild, moveDetails, roleFor, matchupIndex, playerScore, opponentScore });
  const selectionAdvice = recommendBattleSelection(playerTeam, opponentMembers, format, { selectedBuild, moveDetails, roleFor });
  const confidence = confidenceScore([...playerMembers, ...opponentMembers], { selectedBuild, moveDetails });

  return {
    formatLabel: format.label ?? DEFAULT_FORMAT.label,
    playerMembers,
    opponentMembers,
    matchupIndex,
    advantage,
    playerScore: Math.round(playerScore),
    opponentScore: Math.round(opponentScore),
    bestMatchups: pairings
      .filter((pairing) => pairing.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    threats: pairings
      .filter((pairing) => pairing.score < 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
    leads: selectionAdvice.leads,
    notes: battleNotes(playerMembers, opponentMembers, matchupIndex),
    matchupMatrix,
    selectionAdvice,
    teamMetrics,
    confidence,
    pairings
  };
}

export function matchupScore(attacker, defender, {
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" })
} = {}) {
  const attackBuild = selectedBuild(attacker) ?? {};
  const defendBuild = selectedBuild(defender) ?? {};
  const attackingTypes = offensiveTypes(attacker, attackBuild, moveDetails);
  const defendingTypes = offensiveTypes(defender, defendBuild, moveDetails);
  const bestAttack = bestTypePressure(attackingTypes, defender.types);
  const bestDefense = bestTypePressure(defendingTypes, attacker.types);
  const attackerStats = effectiveBattleStats(attacker, attackBuild);
  const defenderStats = effectiveBattleStats(defender, defendBuild);
  const offense = Math.max(attackerStats.atk, attackerStats.spa);
  const opposingOffense = Math.max(defenderStats.atk, defenderStats.spa);
  const bulk = attacker.hp + attacker.def + attacker.spd;
  const opposingBulk = defender.hp + defender.def + defender.spd;
  const speedDelta = Math.round(attackerStats.spe - defenderStats.spe);
  const role = roleFor(attacker).label ?? "";
  const opposingRole = roleFor(defender).label ?? "";

  let score = 0;
  score += (bestAttack.multiplier - bestDefense.multiplier) * 36;
  score += (offense - opposingBulk / 2) * 0.18;
  score += (bulk / 2 - opposingOffense) * 0.12;
  score += speedDelta * speedWeight(attacker, defender, role, opposingRole);
  score += setQualityBonus(attackBuild) - setQualityBonus(defendBuild);

  if (bestAttack.multiplier === 0) score -= 28;
  if (bestDefense.multiplier === 0) score += 22;
  if (/wall|pivot|support/i.test(role) && bestDefense.multiplier <= 0.5) score += 12;
  if (/sweeper|wallbreaker|speed/i.test(role) && bestAttack.multiplier >= 2) score += 14;

  const roundedScore = Math.round(score);
  const metrics = {
    offensePressure: clamp(Math.round(50 + (bestAttack.multiplier - 1) * 28 + (offense - opposingBulk / 2) * 0.22), 0, 100),
    defensiveAnswer: clamp(Math.round(50 + (1 - bestDefense.multiplier) * 30 + (bulk / 2 - opposingOffense) * 0.16), 0, 100),
    speedAdvantage: clamp(Math.round(50 + speedDelta * 0.45), 0, 100),
    moveCoverage: clamp(Math.round(bestAttack.multiplier * 42), 0, 100),
    setReliability: clamp(Math.round(50 + setQualityBonus(attackBuild) * 5), 0, 100)
  };

  return {
    score: roundedScore,
    label: matchupLabel({ score: roundedScore, attackMultiplier: bestAttack.multiplier, defenseMultiplier: bestDefense.multiplier, speedDelta, role }),
    attackMultiplier: bestAttack.multiplier,
    defenseMultiplier: bestDefense.multiplier,
    attackType: bestAttack.type,
    defenseType: bestDefense.type,
    speedDelta,
    metrics,
    reasons: matchupReasons({
      attacker,
      defender,
      bestAttack,
      bestDefense,
      speedDelta,
      role,
      build: attackBuild
    })
  };
}

export function scoreTeamPreview(team = [], opponents = [], {
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" }),
  matchupIndex = 50,
  playerScore = null,
  opponentScore = null
} = {}) {
  const helpers = { selectedBuild, moveDetails, roleFor };
  const matrix = team.flatMap((pokemon) => opponents.map((opponent) => matchupScore(pokemon, opponent, helpers)));
  const positive = matrix.filter((item) => item.score > 0);
  const negative = matrix.filter((item) => item.score < 0);
  const speedWins = matrix.filter((item) => item.speedDelta > 0).length;
  const defensiveAnswers = matrix.filter((item) => item.metrics.defensiveAnswer >= 62).length;
  const coverageHits = matrix.filter((item) => item.attackMultiplier >= 2).length;
  const total = Math.max(1, matrix.length);
  return {
    matchupIndex,
    previewScore: clamp(Math.round(50 + ((playerScore ?? aggregateTeamScore(team, opponents, helpers)) - (opponentScore ?? aggregateTeamScore(opponents, team, helpers))) / 8), 0, 100),
    speedControl: clamp(Math.round(speedWins / total * 100), 0, 100),
    defensiveSafety: clamp(Math.round(defensiveAnswers / total * 100), 0, 100),
    coverage: clamp(Math.round(coverageHits / total * 100), 0, 100),
    positiveCount: positive.length,
    negativeCount: negative.length
  };
}

export function recommendBattleSelection(team = [], opponents = [], format = DEFAULT_FORMAT, helpers = {}) {
  const limit = format.selectionSize ?? DEFAULT_FORMAT.selectionSize;
  const ranked = team
    .map((pokemon) => {
      const pairScores = opponents.map((opponent) => matchupScore(pokemon, opponent, helpers));
      const best = Math.max(...pairScores.map((item) => item.score), 0);
      const average = pairScores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, pairScores.length);
      const defensive = pairScores.reduce((sum, item) => sum + item.metrics.defensiveAnswer, 0) / Math.max(1, pairScores.length);
      const score = Math.round(best * 0.52 + average * 0.38 + defensive * 0.18 + pokemon.spe * 0.12);
      return {
        pokemon,
        score,
        reason: selectionReason(pokemon, pairScores)
      };
    })
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst)
    .slice(0, limit);

  return {
    picks: ranked,
    leads: ranked.slice(0, Math.min(2, ranked.length)),
    actions: battleActions(ranked, opponents, helpers)
  };
}

export function counterRecommendations(target, candidates = [], helpers = {}, {
  limit = 6,
  existingTeam = [],
  selectedBuild = helpers.selectedBuild ?? (() => ({}))
} = {}) {
  if (!target) return [];
  const existingBases = new Set(existingTeam.map((pokemon) => baseSpecies(pokemon.name)));
  const existingMega = existingTeam.some((pokemon) => pokemonUsesMegaSlot(pokemon, selectedBuild(pokemon)));

  return candidates
    .filter((candidate) => candidate?.name && candidate.name !== target.name)
    .filter((candidate) => !existingBases.has(baseSpecies(candidate.name)))
    .filter((candidate) => !existingMega || !pokemonUsesMegaSlot(candidate, selectedBuild(candidate)))
    .map((candidate) => {
      const matchup = matchupScore(candidate, target, helpers);
      const reverse = matchupScore(target, candidate, helpers);
      const score = Math.round(matchup.score - reverse.score * 0.35 + setQualityBonus(selectedBuild(candidate)) * 5);
      return {
        pokemon: candidate,
        score,
        matchup,
        reason: counterReason(candidate, target, matchup, reverse)
      };
    })
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst || a.pokemon.name.localeCompare(b.pokemon.name))
    .slice(0, limit);
}

export function matchupLabel({ score = 0, attackMultiplier = 1, defenseMultiplier = 1, speedDelta = 0, role = "" } = {}) {
  if (attackMultiplier === 0) return "Coverage nodig";
  if (defenseMultiplier === 0 && score >= 8) return "Wallt";
  if (attackMultiplier >= 2 && speedDelta >= 0) return "Sterk";
  if (speedDelta >= 25 && score > -5) return "Outspeeds";
  if (/wall|pivot|support/i.test(role) && defenseMultiplier <= 0.5) return "Wallt";
  if (score <= -18) return "Risky";
  if (score >= 18) return "Sterk";
  return "Neutraal";
}

function counterReason(candidate, target, matchup, reverse) {
  const parts = [];
  if (matchup.attackMultiplier >= 2) parts.push(`${matchup.attackType} raakt ${target.name} super effectief`);
  if (reverse.attackMultiplier === 0) parts.push(`immuun voor ${reverse.attackType}`);
  else if (reverse.attackMultiplier <= 0.5) parts.push(`vangt ${reverse.attackType} goed op`);
  if (matchup.speedDelta > 0) parts.push(`sneller met +${matchup.speedDelta} Spe`);
  if (matchup.metrics.defensiveAnswer >= 68) parts.push("sterke defensieve marge");
  return parts.slice(0, 2).join(" · ") || `${matchup.label} matchup met score ${matchup.score > 0 ? "+" : ""}${matchup.score}`;
}

export function confidenceScore(members = [], { selectedBuild = () => ({}), moveDetails = () => ({}) } = {}) {
  if (!members.length) return { value: 0, label: "Geen data", issues: ["Geen preview gekozen"] };
  const issues = [];
  const raw = members.reduce((sum, pokemon) => {
    const build = selectedBuild(pokemon) ?? {};
    let value = 58 + setQualityBonus(build) * 4;
    if (build.status === "generated") {
      value -= 18;
      issues.push(`${pokemon.name}: generated set`);
    }
    const moves = build.moves ?? [];
    if (moves.length < 4) {
      value -= 8;
      issues.push(`${pokemon.name}: incomplete moveset`);
    }
    const unknownMoves = moves
      .flatMap((move) => String(move).split("/").map((part) => part.trim()))
      .filter((move) => {
        const details = moveDetails(move);
        return !details?.type || details.type === "Unknown";
      });
    if (unknownMoves.length) {
      value -= 10;
      issues.push(`${pokemon.name}: onbekende move-data`);
    }
    return sum + clamp(value, 15, 96);
  }, 0);
  const value = Math.round(raw / members.length);
  return {
    value,
    label: value >= 76 ? "Hoog" : value >= 52 ? "Middel" : "Laag",
    issues: [...new Set(issues)].slice(0, 4)
  };
}

function aggregateTeamScore(team, opponents, helpers) {
  if (!team.length || !opponents.length) return 0;
  return team.reduce((sum, member) => {
    const scores = opponents
      .map((opponent) => matchupScore(member, opponent, helpers).score)
      .sort((a, b) => b - a);
    const best = scores[0] ?? 0;
    const average = scores.reduce((total, score) => total + score, 0) / Math.max(1, scores.length);
    return sum + best * 0.58 + average * 0.42 + member.bst / 18;
  }, 0);
}

function opponentCandidateScore(candidate, { mode, playerTeam, referenceProfile, selectedBuild, moveDetails, roleFor }) {
  const build = selectedBuild(candidate);
  const role = roleFor(candidate).label ?? "";
  const bulk = candidate.hp + candidate.def + candidate.spd;
  const offense = Math.max(candidate.atk, candidate.spa);
  if (mode === "random") return randomTeamScore(candidate, build);
  if (mode === "bulky") return bulk * 1.35 + candidate.bst * 0.45 + /wall|pivot|support/i.test(role) * 90 + setQualityBonus(build) * 8;
  if (mode === "offense") return offense * 1.45 + candidate.spe * 1.15 + candidate.bst * 0.35 + /sweeper|wallbreaker|speed/i.test(role) * 90 + setQualityBonus(build) * 8;
  if (mode === "mirror") {
    const physicalFit = referenceProfile.physical >= referenceProfile.special ? candidate.atk : candidate.spa;
    const speedFit = Math.max(0, 120 - Math.abs(candidate.spe - referenceProfile.averageSpeed));
    const bulkFit = Math.max(0, 330 - Math.abs(bulk - referenceProfile.averageBulk));
    return candidate.bst * 0.45 + physicalFit + speedFit + bulkFit * 0.5 + setQualityBonus(build) * 8;
  }
  return counterCandidateScore(candidate, playerTeam, { selectedBuild, moveDetails, roleFor });
}

function counterCandidateScore(candidate, playerTeam, helpers) {
  if (!playerTeam.length) return randomTeamScore(candidate, helpers.selectedBuild(candidate));
  const scores = playerTeam.map((player) => matchupScore(candidate, player, helpers).score);
  const best = Math.max(...scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return best * 1.5 + average + candidate.bst / 7 + candidate.spe * 0.2;
}

function randomTeamScore(pokemon, build = {}) {
  return Math.random() * 320 + pokemon.bst * 0.35 + Math.max(pokemon.atk, pokemon.spa) * 0.35 + pokemon.spe * 0.2 + setQualityBonus(build) * 5;
}

function isLegalOpponentMember(candidate, team, selectedBuild) {
  if (team.some((member) => member.name === candidate.name)) return false;
  if (team.some((member) => baseSpecies(member.name) === baseSpecies(candidate.name))) return false;
  const candidateUsesMega = pokemonUsesMegaSlot(candidate, selectedBuild(candidate));
  if (candidateUsesMega && team.some((member) => pokemonUsesMegaSlot(member, selectedBuild(member)))) return false;
  return true;
}

function recommendLeads(team, opponents, helpers) {
  return team
    .map((pokemon) => {
      const scores = opponents.map((opponent) => matchupScore(pokemon, opponent, helpers).score);
      const pressure = scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length);
      return { pokemon, score: Math.round(pressure + pokemon.spe * 0.22 + Math.max(pokemon.atk, pokemon.spa) * 0.08) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function createMatchupMatrix(playerMembers, opponentMembers, pairings) {
  return playerMembers.map((player) => ({
    player,
    cells: opponentMembers.map((opponent) => {
      const pairing = pairings.find((item) => item.player.name === player.name && item.opponent.name === opponent.name);
      return {
        opponent,
        score: pairing?.score ?? 0,
        label: pairing?.label ?? "Neutraal",
        tone: matrixTone(pairing?.score ?? 0),
        attackMultiplier: pairing?.attackMultiplier ?? 1,
        defenseMultiplier: pairing?.defenseMultiplier ?? 1,
        speedDelta: pairing?.speedDelta ?? 0,
        reasons: pairing?.reasons ?? []
      };
    })
  }));
}

function matrixTone(score) {
  if (score >= 18) return "good";
  if (score <= -18) return "bad";
  return "neutral";
}

function selectionReason(pokemon, pairScores) {
  const best = [...pairScores].sort((a, b) => b.score - a.score)[0];
  if (!best) return `${pokemon.name} is een flex pick.`;
  if (best.attackMultiplier >= 2) return `Beste druk via ${best.attackType}-coverage.`;
  if (best.speedDelta >= 20) return "Geeft je preview speed control.";
  if (best.metrics.defensiveAnswer >= 70) return "Veilige defensieve pivot in deze preview.";
  return best.reasons[0] ?? "Solide algemene matchup.";
}

function battleActions(ranked, opponents, helpers) {
  const actions = [];
  if (ranked[0]) actions.push({ label: "Beste lead", text: `Open met ${ranked[0].pokemon.name}: ${ranked[0].reason}` });
  const allPairings = ranked.flatMap(({ pokemon }) => opponents.map((opponent) => ({ pokemon, opponent, ...matchupScore(pokemon, opponent, helpers) })));
  const worst = [...allPairings].sort((a, b) => a.score - b.score)[0];
  if (worst) actions.push({ label: "Vermijd", text: `Laat ${worst.pokemon.name} niet gratis tegenover ${worst.opponent.name} staan (${worst.label}).` });
  const wincon = [...allPairings].sort((a, b) => b.score - a.score)[0];
  if (wincon) actions.push({ label: "Wincon", text: `Speel rond ${wincon.pokemon.name}; beste druk is tegen ${wincon.opponent.name}.` });
  return actions.slice(0, 3);
}

function teamProfile(team, selectedBuild, roleFor) {
  if (!team.length) return { physical: 0, special: 0, averageSpeed: 80, averageBulk: 280 };
  const totals = team.reduce((profile, pokemon) => {
    if (pokemon.atk >= pokemon.spa) profile.physical += 1;
    else profile.special += 1;
    profile.speed += pokemon.spe;
    profile.bulk += pokemon.hp + pokemon.def + pokemon.spd;
    const build = selectedBuild(pokemon);
    const role = roleFor(pokemon).label ?? build.role ?? "";
    if (/wall|pivot|support/i.test(role)) profile.support += 1;
    return profile;
  }, { physical: 0, special: 0, speed: 0, bulk: 0, support: 0 });
  return {
    ...totals,
    averageSpeed: totals.speed / team.length,
    averageBulk: totals.bulk / team.length
  };
}

function battleNotes(playerMembers, opponentMembers, matchupIndex) {
  const notes = ["Indicatie op basis van types, stats, items en sets — geen volledige damage-berekening."];
  if (matchupIndex >= 62) notes.push("Je selectie heeft duidelijk momentum; speel rond je positieve pairings.");
  else if (matchupIndex <= 38) notes.push("Deze matchup vraagt strakke preview-keuzes; vermijd je slechtste pairing als lead.");
  else notes.push("De matchup is close; lead-keuze en setkeuze maken hier veel verschil.");
  if (playerMembers.some((pokemon) => pokemon.spe >= 110) && !opponentMembers.some((pokemon) => pokemon.spe >= 110)) {
    notes.push("Je hebt de hoogste speed-tier in deze preview.");
  }
  if (opponentMembers.some((pokemon) => pokemon.hp + pokemon.def + pokemon.spd >= 320)) {
    notes.push("De tegenstander heeft stevige switch-ins; let op welke breaker daar het beste doorheen komt.");
  }
  return notes;
}

function offensiveTypes(pokemon, build = {}, moveDetails) {
  const moveTypes = (build.moves ?? [])
    .flatMap((move) => String(move).split("/").map((part) => part.trim()))
    .map((move) => moveDetails(move).type)
    .filter((type) => type && type !== "Unknown");
  return [...new Set([...pokemon.types, ...moveTypes])];
}

function bestTypePressure(types, defenderTypes = []) {
  return types
    .map((type) => ({ type, multiplier: defensiveMultiplier(defenderTypes, type) }))
    .sort((a, b) => b.multiplier - a.multiplier)[0] ?? { type: "Unknown", multiplier: 1 };
}

function speedWeight(attacker, defender, role, opposingRole) {
  const frailTarget = defender.hp + defender.def + defender.spd < 250;
  if (/sweeper|wallbreaker|speed/i.test(role) || frailTarget) return 0.18;
  if (/wall|pivot|support/i.test(opposingRole)) return 0.08;
  return 0.12;
}

function setQualityBonus(build = {}) {
  if (build.status === "smogon-champions") return 10;
  if (build.status === "smogon-sv") return 7;
  if (build.status === "custom") return 5;
  if (build.status === "generated") return -4;
  return 2;
}

function matchupReasons({ attacker, defender, bestAttack, bestDefense, speedDelta, role, build }) {
  const reasons = [];
  if (bestAttack.multiplier >= 2) reasons.push(`${bestAttack.type}-druk raakt ${defender.name} super effective`);
  else if (bestAttack.multiplier === 0) reasons.push(`${defender.name} is immuun voor je beste ${bestAttack.type}-druk`);
  else if (bestAttack.multiplier < 1) reasons.push(`${defender.name} resist je beste ${bestAttack.type}-druk`);
  else reasons.push(`${attacker.name} heeft neutrale druk`);

  if (bestDefense.multiplier === 0) reasons.push(`${attacker.name} heeft een immunity terug`);
  else if (bestDefense.multiplier <= 0.5) reasons.push(`${attacker.name} kan belangrijke coverage opvangen`);
  if (speedDelta >= 20) reasons.push(`${attacker.name} is sneller`);
  if (speedDelta <= -20) reasons.push(`${defender.name} is sneller`);
  if (/wall|pivot|support/i.test(role)) reasons.push("defensieve rol geeft extra marge");
  if (build.status && build.status !== "generated") reasons.push("betrouwbare setdata");
  return reasons.slice(0, 4);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
