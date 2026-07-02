import assert from "node:assert/strict";
import fs from "node:fs";
import { performance } from "node:perf_hooks";
import { evaluateTeam, planTeam, suggestTeamAdditions } from "../modules/team-planner.js";

const pokemonData = JSON.parse(fs.readFileSync("data/champions-pokemon.json", "utf8"));
const movesetData = JSON.parse(fs.readFileSync("data/champions-movesets.json", "utf8"));
const moveData = JSON.parse(fs.readFileSync("data/champions-moves.json", "utf8"));
const meta = JSON.parse(fs.readFileSync("data/champions-meta.json", "utf8"));

const pokemon = pokemonData.pokemon;
const byName = new Map(pokemon.map((item) => [item.name, item]));
const team = ["Garchomp", "Rotom-Wash", "Corviknight"]
  .map((name) => byName.get(name))
  .filter(Boolean);

const teamStyles = {
  balanced: { label: "Balanced", targets: { physical: 2, special: 2, fast: 1, bulky: 2 } }
};

const context = {
  pokemon,
  team,
  core: team,
  battleFormat: "single3",
  battleFormats: meta.formats,
  teamStyle: "balanced",
  teamStyles,
  championsMeta: meta,
  moveDetails: moveData.moves,
  selectedBuild,
  roleFor,
  maxTeamSize: meta.formats.single3.maxTeamSize,
  selectionSize: meta.formats.single3.selectionSize
};

const evaluation = timed("evaluateTeam", () => evaluateTeam(team, context));
const lightPlan = timed("planTeam suggestion-only", () => planTeam(context, {
  includeVariants: false,
  includeReplacements: false,
  suggestionLimit: 9
}));
const helperSuggestions = timed("suggestTeamAdditions", () => suggestTeamAdditions(context, { limit: 9 }));

assert.ok(evaluation.duration < 250, `evaluateTeam should stay interactive, got ${evaluation.duration.toFixed(1)}ms`);
assert.ok(lightPlan.duration < 2000, `suggestion-only plan should avoid old multi-second completion, got ${lightPlan.duration.toFixed(1)}ms`);
assert.ok(helperSuggestions.duration < 2000, `suggestion helper should avoid old multi-second completion, got ${helperSuggestions.duration.toFixed(1)}ms`);
assert.equal(lightPlan.value.variants.length, 0);
assert.equal(lightPlan.value.suggestions.length > 0, true);
assert.deepEqual(
  helperSuggestions.value.map((item) => item.pokemon.name),
  lightPlan.value.suggestions.map((item) => item.pokemon.name)
);

console.log(`team-planner performance smoke passed: evaluate=${evaluation.duration.toFixed(1)}ms, suggestion-only=${lightPlan.duration.toFixed(1)}ms`);

function timed(label, work) {
  const start = performance.now();
  const value = work();
  const duration = performance.now() - start;
  return { label, value, duration };
}

function selectedBuild(pokemon) {
  return movesetData.sets[pokemon.name]?.[0]
    ?? movesetData.sets[baseSpecies(pokemon.name)]?.[0]
    ?? { status: "generated", moves: [] };
}

function roleFor(pokemon) {
  const build = selectedBuild(pokemon);
  if (build.role) return { label: build.role, description: build.role };
  const offense = Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0);
  const bulk = (pokemon.hp ?? 0) + (pokemon.def ?? 0) + (pokemon.spd ?? 0);
  if ((pokemon.spe ?? 0) >= 105) return { label: "Speed control", description: "Fast roster slot" };
  if (offense >= 120) return { label: "Wallbreaker", description: "High damage slot" };
  if (bulk >= 290) return { label: "Wall", description: "Defensive slot" };
  return { label: "Allrounder", description: "Flexible slot" };
}

function baseSpecies(name) {
  return String(name).replace(/-Mega(?:-[XY])?$/, "");
}
