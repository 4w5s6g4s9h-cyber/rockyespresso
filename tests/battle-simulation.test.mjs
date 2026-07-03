import assert from "node:assert/strict";
import {
  confidenceScore,
  counterRecommendations,
  generateOpponentTeam,
  matchupLabel,
  matchupScore,
  recommendBattleSelection,
  scoreTeamPreview,
  selectedBattleMembers,
  simulateBattle
} from "../modules/battle-simulation.js";

const single3 = { label: "Single 3v3", maxTeamSize: 6, selectionSize: 3 };
const double4 = { label: "Double 4v4", maxTeamSize: 6, selectionSize: 4 };

const charizard = mon("Charizard", ["Fire", "Flying"], 78, 104, 78, 159, 115, 100, 634);
const blastoise = mon("Blastoise", ["Water"], 79, 83, 100, 85, 105, 78, 530);
const ferrothorn = mon("Ferrothorn", ["Grass", "Steel"], 74, 94, 131, 54, 116, 20, 489);
const dragapult = mon("Dragapult", ["Dragon", "Ghost"], 88, 120, 75, 100, 75, 142, 600);
const alakazam = mon("Alakazam", ["Psychic"], 55, 50, 45, 135, 95, 120, 500);
const toxapex = mon("Toxapex", ["Water", "Poison"], 50, 63, 152, 53, 142, 35, 495);
const garchomp = mon("Garchomp", ["Dragon", "Ground"], 108, 130, 95, 80, 85, 102, 600);
const dragonite = mon("Dragonite", ["Dragon", "Flying"], 91, 134, 95, 100, 100, 80, 600);
const corviknight = mon("Corviknight", ["Flying", "Steel"], 98, 87, 105, 53, 85, 67, 495);
const starmie = mon("Starmie", ["Water", "Psychic"], 60, 75, 85, 100, 85, 115, 520);
const tyranitarMega = mon("Tyranitar-Mega", ["Rock", "Dark"], 100, 164, 150, 95, 120, 71, 700);
const specter = mon("Specter", ["Ghost"], 70, 60, 70, 120, 80, 110, 510);

const moveDb = {
  Flamethrower: { type: "Fire", category: "Special" },
  HydroPump: { type: "Water", category: "Special" },
  ShadowBall: { type: "Ghost", category: "Special" },
  Earthquake: { type: "Ground", category: "Physical" },
  Psychic: { type: "Psychic", category: "Special" }
};

const builds = new Map([
  ["Charizard", { status: "smogon-champions", moves: ["Flamethrower"] }],
  ["Blastoise", { status: "smogon-champions", moves: ["HydroPump"] }],
  ["Dragapult", { status: "smogon-sv", moves: ["ShadowBall"] }],
  ["Specter", { status: "smogon-sv", moves: ["ShadowBall"] }],
  ["Garchomp", { status: "smogon-champions", moves: ["Earthquake"] }],
  ["Starmie", { status: "smogon-sv", moves: ["HydroPump", "Psychic"] }],
  ["Tyranitar-Mega", { status: "smogon-champions", item: "Tyranitarite", moves: ["Earthquake"] }]
]);

const helpers = {
  selectedBuild: (pokemon) => builds.get(pokemon.name) ?? { status: "generated", moves: [] },
  moveDetails: (move) => moveDb[move] ?? {},
  roleFor: (pokemon) => {
    if (pokemon.spe >= 110) return { label: "Sweeper" };
    if (pokemon.hp + pokemon.def + pokemon.spd >= 300) return { label: "Wall" };
    return { label: "Allrounder" };
  }
};

assert.equal(selectedBattleMembers([garchomp, dragonite, corviknight, starmie], ["Starmie", "Garchomp"], single3).length, 3);
assert.equal(selectedBattleMembers([garchomp, dragonite, corviknight, starmie], ["Starmie"], double4).length, 4);

const fireIntoSteel = matchupScore(charizard, ferrothorn, helpers);
const fireIntoWater = matchupScore(charizard, blastoise, helpers);
assert.ok(fireIntoSteel.score > fireIntoWater.score, "typevoordeel moet matchup-score verhogen");

const ghostIntoNormalImmune = matchupScore(specter, mon("Lopunny", ["Normal"], 65, 136, 94, 54, 96, 135, 580), helpers);
const ghostIntoNeutral = matchupScore(specter, alakazam, helpers);
assert.ok(ghostIntoNormalImmune.score < ghostIntoNeutral.score, "immunity/resist verlaagt dreiging");

const fastIntoFrail = matchupScore(dragapult, alakazam, helpers);
const slowIntoFrail = matchupScore(ferrothorn, alakazam, helpers);
assert.ok(fastIntoFrail.score > slowIntoFrail.score, "snelle offensive Pokemon scoort beter tegen frailere targets");

const bulkyIntoWater = matchupScore(toxapex, blastoise, helpers);
const frailIntoWater = matchupScore(alakazam, blastoise, helpers);
assert.ok(bulkyIntoWater.score > frailIntoWater.score, "bulky Pokemon krijgt defensieve waarde");

const pool = [charizard, blastoise, ferrothorn, dragapult, alakazam, toxapex, garchomp, dragonite, corviknight, starmie, tyranitarMega];
const opponent = generateOpponentTeam({
  pokemon: pool,
  playerTeam: [charizard, garchomp, starmie],
  format: single3,
  mode: "counter",
  ...helpers
});
assert.equal(opponent.length, 6);
assert.equal(new Set(opponent.map((pokemon) => pokemon.name)).size, 6);
assert.equal(opponent.filter((pokemon) => pokemon.name.includes("-Mega")).length <= 1, true);

const result = simulateBattle({
  playerTeam: [garchomp, dragonite, corviknight, starmie],
  opponentTeam: opponent,
  playerSelection: ["Garchomp"],
  opponentSelection: opponent.map((pokemon) => pokemon.name),
  format: single3,
  ...helpers
});
assert.equal(result.playerMembers.length, 3);
assert.equal(result.opponentMembers.length, 3);
assert.ok(result.winChance >= 5 && result.winChance <= 95);
assert.ok(result.bestMatchups.length || result.threats.length);
assert.equal(result.matchupMatrix.length, 3);
assert.equal(result.matchupMatrix[0].cells.length, 3);
assert.equal(result.selectionAdvice.picks.length, 3);
assert.equal(result.teamMetrics.winChance, result.winChance);
assert.ok(result.confidence.value > 0);

const advice4 = recommendBattleSelection([garchomp, dragonite, corviknight, starmie], opponent, double4, helpers);
assert.equal(advice4.picks.length, 4);

const metrics = scoreTeamPreview([charizard, dragapult, toxapex], [ferrothorn, alakazam, blastoise], { ...helpers, winChance: 61 });
assert.equal(metrics.winChance, 61);
assert.ok(metrics.previewScore >= 0 && metrics.previewScore <= 100);

const counters = counterRecommendations(ferrothorn, pool, helpers, { limit: 3 });
assert.equal(counters[0].pokemon.name, "Charizard");
assert.ok(counters[0].score > counters.at(-1).score);
const countersWithMegaUsed = counterRecommendations(blastoise, [tyranitarMega, garchomp, starmie], helpers, {
  existingTeam: [charizard],
  selectedBuild: (pokemon) => pokemon.name === "Charizard" ? { item: "Charizardite Y", moves: ["Flamethrower"] } : helpers.selectedBuild(pokemon),
  limit: 3
});
assert.equal(countersWithMegaUsed.some((item) => item.pokemon.name === "Tyranitar-Mega"), false);

const bulkyTeam = generateOpponentTeam({ pokemon: pool, playerTeam: [charizard, garchomp, starmie], format: single3, mode: "bulky", ...helpers });
const offenseTeam = generateOpponentTeam({ pokemon: pool, playerTeam: [charizard, garchomp, starmie], format: single3, mode: "offense", ...helpers });
const bulkyAverage = average(bulkyTeam, (pokemon) => pokemon.hp + pokemon.def + pokemon.spd);
const offenseSpeedAverage = average(offenseTeam, (pokemon) => pokemon.spe);
assert.ok(bulkyAverage >= average(offenseTeam, (pokemon) => pokemon.hp + pokemon.def + pokemon.spd), "bulky mode moet bulkier teamprofiel geven");
assert.ok(offenseSpeedAverage >= average(bulkyTeam, (pokemon) => pokemon.spe), "offense mode moet sneller teamprofiel geven");

const highConfidence = confidenceScore([charizard, garchomp], helpers);
const lowConfidence = confidenceScore([ferrothorn, alakazam], helpers);
assert.ok(highConfidence.value > lowConfidence.value, "confidence daalt bij generated/unknown data");

// Item-modifiers: Choice Scarf draait het speed-voordeel om (Dragonite 80 → 120 vs Starmie 115).
const scarfHelpers = {
  ...helpers,
  selectedBuild: (pokemon) => pokemon.name === "Dragonite" ? { status: "generated", item: "Choice Scarf", moves: [] } : helpers.selectedBuild(pokemon)
};
const noItemMatchup = matchupScore(dragonite, starmie, helpers);
const scarfMatchup = matchupScore(dragonite, starmie, scarfHelpers);
assert.ok(noItemMatchup.speedDelta < 0, "zonder item is Dragonite langzamer dan Starmie");
assert.ok(scarfMatchup.speedDelta > 0, "Choice Scarf moet het speed-voordeel omdraaien");
assert.ok(scarfMatchup.score > noItemMatchup.score, "Choice Scarf moet de matchup-score verhogen");

// Choice Band verhoogt de offensieve druk.
const bandHelpers = {
  ...helpers,
  selectedBuild: (pokemon) => pokemon.name === "Dragonite" ? { status: "generated", item: "Choice Band", moves: [] } : helpers.selectedBuild(pokemon)
};
assert.ok(matchupScore(dragonite, starmie, bandHelpers).score > noItemMatchup.score, "Choice Band moet offensieve druk verhogen");

assert.equal(matchupLabel({ score: 30, attackMultiplier: 2, defenseMultiplier: 1, speedDelta: 10 }), "Sterk");
assert.equal(matchupLabel({ score: -30, attackMultiplier: 0, defenseMultiplier: 1, speedDelta: 0 }), "Coverage nodig");
assert.equal(matchupLabel({ score: 12, attackMultiplier: 1, defenseMultiplier: 0, speedDelta: -10 }), "Wallt");
assert.equal(matchupLabel({ score: 5, attackMultiplier: 1, defenseMultiplier: 1, speedDelta: 40 }), "Outspeeds");

console.log("battle-simulation tests passed");

function mon(name, types, hp, atk, def, spa, spd, spe, bst) {
  return { name, types, hp, atk, def, spa, spd, spe, bst, abilities: [], evos: [] };
}

function average(items, valueFor) {
  return items.reduce((sum, item) => sum + valueFor(item), 0) / Math.max(1, items.length);
}
