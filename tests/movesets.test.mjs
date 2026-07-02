import assert from "node:assert/strict";
import fs from "node:fs";
import { isMoveBlockedForPokemon, pokemonCanLearnMoves, validateMoveSlots } from "../modules/movesets.js";
import { generatedMovePlan, legalMovePlan } from "../scripts/update-smogon-movesets.mjs";

const moveDetails = {
  "Stealth Rock": {
    type: "Rock",
    category: "Status",
    power: "-",
    accuracy: "-",
    pp: "20",
    effect: "Sets entry hazard that punishes switches."
  },
  Earthquake: {
    type: "Ground",
    category: "Physical",
    power: "100",
    accuracy: "100",
    pp: "10",
    effect: "Strong Ground STAB."
  },
  "Gyro Ball": {
    type: "Steel",
    category: "Physical",
    power: "?",
    accuracy: "100",
    pp: "5",
    effect: "More power the slower the user than the target."
  },
  Toxic: {
    type: "Poison",
    category: "Status",
    power: "-",
    accuracy: "90",
    pp: "10",
    effect: "Badly poisons the target. Poison types can't miss."
  },
  "Heavy Slam": {
    type: "Steel",
    category: "Physical",
    power: "?",
    accuracy: "100",
    pp: "10",
    effect: "More power the heavier the user than the target."
  },
  "Dragon Tail": {
    type: "Dragon",
    category: "Physical",
    power: "60",
    accuracy: "90",
    pp: "10",
    effect: "Forces the target out; negative priority."
  },
  Roar: {
    type: "Normal",
    category: "Status",
    power: "-",
    accuracy: "-",
    pp: "20",
    effect: "Forces the target to switch to a random ally."
  },
  Protect: {
    type: "Normal",
    category: "Status",
    power: "-",
    accuracy: "-",
    pp: "10",
    effect: "Protects from moves."
  },
  Flamethrower: {
    type: "Fire",
    category: "Special",
    power: "90",
    accuracy: "100",
    pp: "15",
    effect: "Strong Fire attack."
  },
  Thunderbolt: {
    type: "Electric",
    category: "Special",
    power: "90",
    accuracy: "100",
    pp: "15",
    effect: "Strong Electric attack."
  },
  "Nasty Plot": {
    type: "Dark",
    category: "Status",
    power: "-",
    accuracy: "-",
    pp: "20",
    effect: "Raises Sp. Atk sharply."
  },
  "Air Slash": {
    type: "Flying",
    category: "Special",
    power: "75",
    accuracy: "95",
    pp: "15",
    effect: "May make the target flinch."
  },
  "Will-O-Wisp": {
    type: "Fire",
    category: "Status",
    power: "-",
    accuracy: "85",
    pp: "15",
    effect: "Burns the target."
  },
  "Hidden Power": {
    type: "Normal",
    category: "Special",
    power: "60",
    accuracy: "100",
    pp: "15",
    effect: "Fallback move that should not be generated."
  }
};

const learnsets = {
  Steelix: ["Stealth Rock", "Earthquake", "Gyro Ball", "Protect", "Dragon Tail", "Heavy Slam"],
  "Steelix-Mega": ["Stealth Rock", "Earthquake", "Gyro Ball", "Protect", "Dragon Tail", "Heavy Slam"],
  Toxapex: ["Toxic", "Protect"],
  PyroTest: ["Flamethrower", "Thunderbolt", "Nasty Plot", "Air Slash", "Will-O-Wisp", "Protect", "Hidden Power"]
};

assert.equal(isMoveBlockedForPokemon("Steelix", "Toxic", learnsets), true);
assert.equal(isMoveBlockedForPokemon("Steelix-Mega", "Toxic", learnsets), true);
assert.equal(isMoveBlockedForPokemon("Steelix", "Roar", learnsets), true);
assert.equal(isMoveBlockedForPokemon("Steelix", "Protect", learnsets), false);
assert.equal(isMoveBlockedForPokemon("Toxapex", "Toxic", learnsets), false);

assert.deepEqual(pokemonCanLearnMoves("Steelix-Mega", ["Protect"], learnsets, moveDetails), {
  ok: true,
  known: ["Protect"],
  unknown: [],
  blocked: []
});
assert.deepEqual(pokemonCanLearnMoves("Steelix", ["Protect", "Toxic"], learnsets, moveDetails), {
  ok: false,
  known: ["Protect"],
  unknown: [],
  blocked: ["Toxic"]
});
assert.deepEqual(pokemonCanLearnMoves("Steelix", ["Made Up Move"], learnsets, moveDetails), {
  ok: false,
  known: [],
  unknown: ["Made Up Move"],
  blocked: []
});

const steelixMoves = ["Stealth Rock", "Earthquake", "Gyro Ball", "Toxic"];
const steelixCompatibility = validateMoveSlots("Steelix", steelixMoves, moveDetails, { learnsets });
assert.deepEqual(steelixMoves, ["Stealth Rock", "Earthquake", "Gyro Ball", "Toxic"]);
assert.equal(steelixCompatibility.ok, false);
assert.deepEqual(
  steelixCompatibility.suggestedMoves,
  ["Stealth Rock", "Earthquake", "Gyro Ball", "Protect"]
);
assert.deepEqual(steelixCompatibility.replacementMoves, ["Protect", "Dragon Tail"]);
assert.deepEqual(steelixCompatibility.issues.map((issue) => issue.move), ["Toxic"]);

const megaCompatibility = validateMoveSlots("Steelix-Mega", ["Stealth Rock", "Earthquake", "Gyro Ball", "Toxic"], moveDetails, { learnsets });
assert.equal(megaCompatibility.ok, false);
assert.deepEqual(megaCompatibility.suggestedMoves, ["Stealth Rock", "Earthquake", "Gyro Ball", "Protect"]);
assert.deepEqual(megaCompatibility.replacementMoves, ["Protect", "Dragon Tail"]);

const toxapexCompatibility = validateMoveSlots("Toxapex", ["Toxic"], moveDetails, { learnsets });
assert.equal(toxapexCompatibility.ok, true);
assert.deepEqual(toxapexCompatibility.suggestedMoves, ["Toxic"]);
assert.deepEqual(toxapexCompatibility.replacementMoves, []);

const generatedPlan = generatedMovePlan(
  { name: "PyroTest", types: ["Fire"], atk: 70, spa: 125, hp: 70, def: 70, spd: 70, spe: 100 },
  "special",
  moveDetails,
  learnsets
);
assert.equal(generatedPlan.moves.length, 4);
assert.ok(generatedPlan.moves.includes("Flamethrower"), "generated plan should include legal STAB");
assert.ok(generatedPlan.moves.includes("Thunderbolt") || generatedPlan.moves.includes("Air Slash"), "generated plan should include coverage");
assert.ok(generatedPlan.moves.includes("Nasty Plot") || generatedPlan.moves.includes("Will-O-Wisp") || generatedPlan.moves.includes("Protect"), "generated plan should include setup or utility");
assert.equal(generatedPlan.moves.includes("Hidden Power"), false, "generated plan should exclude banned fallback moves");
assert.equal(generatedPlan.moves.some((move) => /STAB|coverage|utility|setup/i.test(move)), false);
const damageTypes = generatedPlan.moves
  .map((move) => moveDetails[move])
  .filter((details) => details.category !== "Status")
  .map((details) => details.type);
assert.equal(new Set(damageTypes).size, damageTypes.length, "generated plan should avoid duplicate damage types when enough legal coverage exists");
assert.equal(generatedPlan.issues.includes("duplicate damage type"), false);
assert.deepEqual(legalMovePlan(
  { name: "PyroTest", types: ["Fire"], atk: 70, spa: 125, hp: 70, def: 70, spd: 70, spe: 100 },
  "special",
  moveDetails,
  learnsets
), generatedPlan.moves);

const movesetData = JSON.parse(fs.readFileSync(new URL("../data/champions-movesets.json", import.meta.url), "utf8"));
const steelixTank = movesetData.sets.Steelix.find((set) => set.id === "sv-steelix-nationaldexru-tank");
assert.deepEqual(steelixTank.moves, ["Stealth Rock", "Earthquake", "Gyro Ball", "Iron Defense"]);
assert.equal(steelixTank.championsAdjusted, true);

const pokemonData = JSON.parse(fs.readFileSync(new URL("../data/champions-pokemon.json", import.meta.url), "utf8"));
const pokemonByName = new Map((pokemonData.pokemon ?? []).map((pokemon) => [pokemon.name, pokemon]));
const badMegaItems = Object.entries(movesetData.sets)
  .filter(([pokemonName]) => /-Mega(?:-|$)/.test(pokemonName))
  .flatMap(([pokemonName, sets]) => {
    const stones = pokemonByName.get(pokemonName)?.megaStones ?? ["Mega Stone"];
    return sets
      .filter((set) => !String(set.item).split("/").map((part) => part.trim()).some((item) => stones.includes(item)))
      .map((set) => `${pokemonName}:${set.id}:${set.item}`);
  });
assert.deepEqual(badMegaItems, []);

const learnsetData = JSON.parse(fs.readFileSync(new URL("../data/champions-learnsets.json", import.meta.url), "utf8"));
assert.equal(learnsetData.learnsets.Steelix.includes("Toxic"), false);
assert.equal(learnsetData.learnsets.Steelix.includes("Roar"), false);
assert.equal(learnsetData.learnsets.Steelix.includes("Protect"), true);

console.log("movesets tests passed");
