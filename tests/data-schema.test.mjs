import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  validateLearnsetDataset,
  validateMoveDataset,
  validateMovesetDataset,
  validatePokemonDataset
} from "../modules/data-schema.js";

const readJson = async (path) => JSON.parse(await fs.readFile(new URL(`../${path}`, import.meta.url), "utf8"));
const [pokemon, learnsets, movesets, moves] = await Promise.all([
  readJson("data/champions-pokemon.json"),
  readJson("data/champions-learnsets.json"),
  readJson("data/champions-movesets.json"),
  readJson("data/champions-moves.json")
]);
const names = pokemon.pokemon.map((entry) => entry.name);

assert.deepEqual(validatePokemonDataset(pokemon), []);
assert.deepEqual(validateLearnsetDataset(learnsets, names), []);
assert.deepEqual(validateMovesetDataset(movesets, names), []);
assert.deepEqual(validateMoveDataset(moves), []);

const poisonedPokemon = structuredClone(pokemon);
poisonedPokemon.pokemon[0].bst = '<img src=x onerror=alert(1)>';
assert.ok(validatePokemonDataset(poisonedPokemon).some((error) => error.includes("bst")));

const failedLearnsets = structuredClone(learnsets);
failedLearnsets.stats.errors.push({ name: names[0], error: "upstream timeout" });
failedLearnsets.learnsets[names[0]] = [];
assert.ok(validateLearnsetDataset(failedLearnsets, names).length >= 2);

const failedMovesets = structuredClone(movesets);
failedMovesets.stats.errors.push({ name: names[0], error: "upstream timeout" });
assert.ok(validateMovesetDataset(failedMovesets, names).some((error) => error.includes("sync bevat fouten")));

console.log("data-schema tests passed");
