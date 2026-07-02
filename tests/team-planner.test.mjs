import assert from "node:assert/strict";
import { evaluateTeam, chooseBestBattleSelection, planTeam, suggestTeamAdditions, suggestTeamReplacements } from "../modules/team-planner.js";
import { baseSpecies, pokemonUsesMegaSlot } from "../modules/team-analysis.js";

const formats = {
  single3: { label: "Single 3v3", maxTeamSize: 6, selectionSize: 3 },
  double4: { label: "Double 4v4", maxTeamSize: 6, selectionSize: 4 }
};

const styles = {
  balanced: { label: "Balanced", targets: { physical: 2, special: 2, fast: 1, bulky: 2 } },
  sun: { label: "Sun", targets: { physical: 2, special: 2, fast: 2, bulky: 1 } },
  rain: { label: "Rain", targets: { physical: 2, special: 2, fast: 2, bulky: 1 } },
  trickroom: { label: "Trick Room", targets: { physical: 2, special: 2, fast: 0, bulky: 3 } },
  doublesupport: { label: "Double support", targets: { physical: 1, special: 1, fast: 2, bulky: 3 } }
};

const torkoal = mon("Torkoal", ["Fire"], 70, 85, 140, 85, 70, 20, 470, ["Drought"]);
const ninetales = mon("Ninetales", ["Fire"], 73, 76, 75, 109, 100, 100, 533, ["Drought"]);
const venusaur = mon("Venusaur", ["Grass", "Poison"], 80, 82, 83, 100, 100, 80, 525, ["Chlorophyll"]);
const arcanine = mon("Arcanine", ["Fire"], 90, 110, 80, 100, 80, 95, 555, ["Intimidate"]);
const rotomWash = mon("Rotom-Wash", ["Electric", "Water"], 50, 65, 107, 105, 107, 86, 520, ["Levitate"]);
const dragonite = mon("Dragonite", ["Dragon", "Flying"], 91, 134, 95, 100, 100, 80, 600, ["Inner Focus"]);
const steelix = mon("Steelix", ["Steel", "Ground"], 75, 85, 200, 55, 65, 30, 510, ["Sturdy"]);
const pelipper = mon("Pelipper", ["Water", "Flying"], 60, 50, 100, 95, 70, 65, 440, ["Drizzle"]);
const basculegion = mon("Basculegion", ["Water", "Ghost"], 120, 112, 65, 80, 75, 78, 530, ["Swift Swim"]);
const ludicolo = mon("Ludicolo", ["Water", "Grass"], 80, 70, 70, 100, 100, 70, 490, ["Swift Swim"]);
const hatterene = mon("Hatterene", ["Psychic", "Fairy"], 57, 90, 95, 136, 103, 29, 510, ["Magic Bounce"]);
const conkeldurr = mon("Conkeldurr", ["Fighting"], 105, 140, 95, 55, 65, 45, 505, ["Guts"]);
const slowbro = mon("Slowbro", ["Water", "Psychic"], 95, 75, 110, 100, 80, 30, 490, ["Regenerator"]);
const incineroar = mon("Incineroar", ["Fire", "Dark"], 95, 115, 90, 80, 90, 60, 530, ["Intimidate"]);
const whimsicott = mon("Whimsicott", ["Grass", "Fairy"], 60, 67, 85, 77, 75, 116, 480, ["Prankster"]);
const maushold = mon("Maushold", ["Normal"], 74, 75, 70, 65, 75, 111, 470, ["Friend Guard"]);
const charizard = mon("Charizard", ["Fire", "Flying"], 78, 104, 78, 159, 115, 100, 634, ["Drought"]);
const garchompMega = mon("Garchomp-Mega", ["Dragon", "Ground"], 108, 170, 115, 120, 95, 92, 700, ["Sand Force"]);
const garchomp = mon("Garchomp", ["Dragon", "Ground"], 108, 130, 95, 80, 85, 102, 600, ["Rough Skin"]);
const rainTitan = mon("RainTitan", ["Water"], 110, 140, 100, 130, 100, 95, 675, ["Drizzle"]);
const glassA = mon("Glass-A", ["Psychic"], 55, 50, 45, 150, 75, 130, 505, ["Magic Guard"]);
const glassB = mon("Glass-B", ["Dark"], 60, 145, 55, 50, 75, 125, 510, ["Pressure"]);
const fairySteel = mon("Fairy-Steel", ["Fairy", "Steel"], 85, 95, 110, 90, 110, 70, 560, ["Sturdy"]);
const waterRock = mon("Water-Rock", ["Water", "Rock"], 90, 110, 105, 70, 85, 60, 520, ["Solid Rock"]);
const fastFlex = mon("Fast-Flex", ["Electric"], 70, 80, 70, 115, 80, 120, 535, ["Static"]);
const badMoves = mon("Bad-Moves", ["Dragon"], 100, 160, 95, 100, 95, 100, 650, ["Pressure"]);

const moveDb = {
  Flamethrower: { type: "Fire", category: "Special" },
  SolarBeam: { type: "Grass", category: "Special" },
  Growth: { type: "Normal", category: "Status" },
  Surf: { type: "Water", category: "Special" },
  HydroPump: { type: "Water", category: "Special" },
  Hurricane: { type: "Flying", category: "Special" },
  TrickRoom: { type: "Psychic", category: "Status" },
  DrainPunch: { type: "Fighting", category: "Physical" },
  Protect: { type: "Normal", category: "Status" },
  FakeOut: { type: "Normal", category: "Physical" },
  Tailwind: { type: "Flying", category: "Status" },
  HelpingHand: { type: "Normal", category: "Status" },
  Earthquake: { type: "Ground", category: "Physical" },
  Moonblast: { type: "Fairy", category: "Special" },
  StoneEdge: { type: "Rock", category: "Physical" },
  Thunderbolt: { type: "Electric", category: "Special" },
  Psychic: { type: "Psychic", category: "Special" },
  Crunch: { type: "Dark", category: "Physical" },
  Toxic: { type: "Poison", category: "Status" }
};

const builds = new Map([
  ["Torkoal", build("smogon-champions", ["Flamethrower", "Protect"])],
  ["Ninetales", build("smogon-champions", ["Flamethrower", "SolarBeam"])],
  ["Venusaur", build("smogon-champions", ["SolarBeam", "Growth"])],
  ["Arcanine", build("smogon-champions", ["Flamethrower", "Protect"])],
  ["Rotom-Wash", build("smogon-sv", ["HydroPump", "Thunderbolt"])],
  ["Dragonite", build("smogon-sv", ["Earthquake"])],
  ["Steelix", build("custom", ["Earthquake", "Protect"])],
  ["Pelipper", build("smogon-champions", ["Surf", "Hurricane", "Tailwind"])],
  ["Basculegion", build("smogon-champions", ["HydroPump"])],
  ["Ludicolo", build("smogon-champions", ["Surf", "SolarBeam"])],
  ["Hatterene", build("smogon-champions", ["TrickRoom", "Moonblast", "Protect"])],
  ["Conkeldurr", build("smogon-champions", ["DrainPunch", "Protect"])],
  ["Slowbro", build("smogon-sv", ["TrickRoom", "Surf", "Protect"])],
  ["Incineroar", build("smogon-champions", ["FakeOut", "Protect"])],
  ["Whimsicott", build("smogon-champions", ["Tailwind", "HelpingHand", "Protect"])],
  ["Maushold", build("smogon-champions", ["HelpingHand", "Protect"])],
  ["Charizard", { ...build("smogon-champions", ["Flamethrower", "SolarBeam"]), item: "Charizardite Y" }],
  ["Garchomp-Mega", build("smogon-champions", ["Earthquake"])],
  ["Garchomp", build("smogon-sv", ["Earthquake"])],
  ["RainTitan", build("smogon-champions", ["HydroPump"])],
  ["Glass-A", build("smogon-champions", ["Psychic"])],
  ["Glass-B", build("smogon-champions", ["Crunch"])],
  ["Fairy-Steel", build("custom", ["Moonblast", "Protect"])],
  ["Water-Rock", build("custom", ["Surf", "StoneEdge"])],
  ["Fast-Flex", build("smogon-sv", ["Thunderbolt"])],
  ["Bad-Moves", { ...build("smogon-champions", ["Toxic"]), championsCompatibility: { ok: false, issues: [{ move: "Toxic" }] } }]
]);

const meta = {
  threats: [
    { name: "Garchomp", priority: "high", formats: ["single3", "double4"], tags: ["physical breaker"], attackTypes: ["Dragon", "Ground"], answers: ["Ice", "Fairy", "Flying"] },
    { name: "Charizard", priority: "high", formats: ["single3", "double4"], tags: ["Sun", "special breaker"], attackTypes: ["Fire", "Flying"], answers: ["Rock", "Water", "Dragon"] },
    { name: "Incineroar", priority: "high", formats: ["double4"], tags: ["Double support"], attackTypes: ["Fire", "Dark"], answers: ["Water", "Ground", "Fighting"] }
  ]
};

const pool = [
  torkoal, ninetales, venusaur, arcanine, rotomWash, dragonite, steelix, pelipper, basculegion, ludicolo,
  hatterene, conkeldurr, slowbro, incineroar, whimsicott, maushold, charizard, garchompMega, garchomp,
  rainTitan, glassA, glassB, fairySteel, waterRock, fastFlex, badMoves
];

const baseContext = {
  pokemon: pool,
  battleFormats: formats,
  teamStyles: styles,
  championsMeta: meta,
  selectedBuild: (pokemon) => builds.get(pokemon.name) ?? build("generated", []),
  roleFor: (pokemon) => {
    if (pokemon.name === "Whimsicott" || pokemon.name === "Incineroar" || pokemon.name === "Maushold") return { label: "Support" };
    if (pokemon.spe >= 110) return { label: "Sweeper" };
    if (pokemon.hp + pokemon.def + pokemon.spd >= 300) return { label: "Wall" };
    if (Math.max(pokemon.atk, pokemon.spa) >= 130) return { label: "Wallbreaker" };
    return { label: "Allrounder" };
  }
};

const legalPlan = planTeam({
  ...baseContext,
  team: [charizard],
  core: [charizard],
  lockedNames: ["Charizard"],
  battleFormat: "single3",
  teamStyle: "balanced"
});
assert.equal(legalPlan.variants[0].team.length, 6);
assert.equal(legalPlan.variants[0].team[0].name, "Charizard");
assert.equal(new Set(legalPlan.variants[0].team.map((pokemon) => baseSpecies(pokemon.name))).size, 6);
assert.equal(legalPlan.variants[0].team.filter((pokemon) => pokemonUsesMegaSlot(pokemon, builds.get(pokemon.name))).length <= 1, true);
assert.ok(legalPlan.variants[0].scoreBreakdown.some((item) => item.id === "redundancy"));
assert.ok(Array.isArray(legalPlan.variants[0].risks));
assert.ok(legalPlan.variants[0].confidence.value >= 0);
assert.ok(legalPlan.suggestions[0].scoreBreakdown.some((item) => item.id === "redundancy"));
assert.ok(Array.isArray(legalPlan.suggestions[0].risks));

const suggestionOnlyPlan = planTeam({
  ...baseContext,
  team: [charizard],
  core: [charizard],
  lockedNames: ["Charizard"],
  battleFormat: "single3",
  teamStyle: "balanced"
}, {
  includeVariants: false,
  includeReplacements: false,
  suggestionLimit: legalPlan.suggestions.length
});
const helperSuggestions = suggestTeamAdditions({
  ...baseContext,
  team: [charizard],
  core: [charizard],
  lockedNames: ["Charizard"],
  battleFormat: "single3",
  teamStyle: "balanced"
}, { limit: legalPlan.suggestions.length });
assert.deepEqual(suggestionOnlyPlan.variants, []);
assert.deepEqual(suggestionOnlyPlan.replacementSuggestions, []);
assert.deepEqual(
  suggestionOnlyPlan.suggestions.map((item) => item.pokemon.name),
  legalPlan.suggestions.map((item) => item.pokemon.name),
  "suggestion-only planning should preserve broad planner top suggestions"
);
assert.deepEqual(
  helperSuggestions.map((item) => item.pokemon.name),
  suggestionOnlyPlan.suggestions.map((item) => item.pokemon.name),
  "suggestion helper should return the same shape and ranking"
);

const fullTeam = legalPlan.variants[0].team;
const replacementOnlyPlan = planTeam({
  ...baseContext,
  team: fullTeam,
  core: fullTeam,
  lockedNames: ["Charizard"],
  battleFormat: "single3",
  teamStyle: "balanced"
}, {
  includeVariants: false,
  includeSuggestions: false,
  replacementLimit: 4
});
const helperReplacements = suggestTeamReplacements({
  ...baseContext,
  team: fullTeam,
  core: fullTeam,
  lockedNames: ["Charizard"],
  battleFormat: "single3",
  teamStyle: "balanced"
}, { limit: 4 });
assert.deepEqual(replacementOnlyPlan.variants, []);
assert.deepEqual(replacementOnlyPlan.suggestions, []);
assert.equal(Array.isArray(replacementOnlyPlan.replacementSuggestions), true);
assert.deepEqual(
  helperReplacements.map((item) => item.pokemon.name),
  replacementOnlyPlan.replacementSuggestions.map((item) => item.pokemon.name),
  "replacement helper should match replacement-only planning"
);

const sunContext = { ...baseContext, battleFormat: "single3", teamStyle: "sun" };
const sunPlan = planTeam({ ...sunContext, team: [torkoal], core: [torkoal] });
const greedySun = greedyByBst([torkoal], pool, sunContext);
assert.ok(
  evaluateTeam(sunPlan.variants[0].team, sunContext).total > evaluateTeam(greedySun, sunContext).total,
  "beam planner should beat naive BST greedy team on sun fixture"
);
assert.ok(sunPlan.variants[0].team.some((pokemon) => pokemon.name === "Venusaur"), "sun planner should prefer lower-BST Chlorophyll synergy over raw power");
assert.equal(sunPlan.variants[0].team.some((pokemon) => pokemon.name === "RainTitan"), false, "sun planner should reject high-BST conflicting weather");

const selection = chooseBestBattleSelection([glassA, glassB, fairySteel, waterRock, fastFlex], {
  ...baseContext,
  battleFormat: "single3",
  teamStyle: "balanced"
});
assert.equal(selection.picks.length, 3);
assert.ok(selection.picks.includes("Fairy-Steel"), "best 3 should include defensive threat answer, not only top loose attackers");

const doubleNoTools = [glassA, glassB, fairySteel, waterRock];
const doubleTools = [incineroar, whimsicott, maushold, waterRock];
const doubleContext = { ...baseContext, battleFormat: "double4", teamStyle: "doublesupport" };
assert.ok(
  evaluateTeam(doubleTools, doubleContext).diagnostics.format.value > evaluateTeam(doubleNoTools, doubleContext).diagnostics.format.value,
  "Double 4v4 should reward Protect, speed control and utility"
);

const rainPlan = planTeam({ ...baseContext, battleFormat: "single3", teamStyle: "rain", team: [pelipper], core: [pelipper] });
assert.ok(rainPlan.variants[0].diagnostics.styleChecks.find((check) => check.label === "Swift Swim-abuser")?.done);
const roomPlan = planTeam({ ...baseContext, battleFormat: "double4", teamStyle: "trickroom", team: [hatterene], core: [hatterene] });
assert.ok(roomPlan.variants[0].diagnostics.styleChecks.find((check) => check.label === "Trick Room abuser")?.done);
assert.ok(sunPlan.variants[0].diagnostics.styleChecks.find((check) => check.label === "Chlorophyll-abuser")?.done);

const manual = { ...build("custom", ["Earthquake", "Protect"]), id: "manual-steelix" };
const lockBuilds = new Map(builds);
lockBuilds.set("Steelix", manual);
const setContext = {
  ...baseContext,
  battleFormat: "single3",
  teamStyle: "balanced",
  selectedBuild: (pokemon) => lockBuilds.get(pokemon.name) ?? build("generated", [])
};
const setPlan = planTeam({ ...setContext, team: [steelix], core: [steelix] });
assert.equal(lockBuilds.get("Steelix"), manual, "planner must not mutate manual/custom set objects");
assert.equal(setPlan.suggestions.some((item) => item.pokemon.name === "Bad-Moves"), false, "illegal Champions moves should be pushed out of top suggestions");
assert.equal(setPlan.variants[0].risks.some((risk) => /Bad-Moves/.test(risk)), false);

const redundantPressure = evaluateTeam([glassA, glassB, fastFlex, badMoves], {
  ...baseContext,
  battleFormat: "single3",
  teamStyle: "balanced"
});
const balancedCoverage = evaluateTeam([dragonite, fairySteel, slowbro, arcanine], {
  ...baseContext,
  battleFormat: "single3",
  teamStyle: "balanced"
});
assert.ok(
  balancedCoverage.diagnostics.redundancy.value > redundantPressure.diagnostics.redundancy.value,
  "redundancy score should punish repeated pressure slots and low-confidence sets"
);

console.log("team-planner tests passed");

function mon(name, types, hp, atk, def, spa, spd, spe, bst, abilities = []) {
  return { name, types, hp, atk, def, spa, spd, spe, bst, abilities, evos: [] };
}

function build(status, moves) {
  return { status, moves, item: status === "custom" ? "Leftovers" : "Life Orb", championsCompatibility: { ok: true, issues: [] } };
}

function greedyByBst(core, candidates, context) {
  const team = [...core];
  for (const candidate of [...candidates].sort((a, b) => b.bst - a.bst || a.name.localeCompare(b.name))) {
    if (team.length >= formats.single3.maxTeamSize) break;
    if (team.some((member) => member.name === candidate.name)) continue;
    const next = [...team, candidate];
    if (new Set(next.map((member) => baseSpecies(member.name))).size !== next.length) continue;
    if (next.filter((member) => pokemonUsesMegaSlot(member, context.selectedBuild(member))).length > 1) continue;
    team.push(candidate);
  }
  return team;
}
