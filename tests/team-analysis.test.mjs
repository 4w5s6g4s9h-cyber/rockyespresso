import assert from "node:assert/strict";
import {
  baseSpecies,
  megaBaseFromItem,
  normalizeSpSpread,
  pokemonUsesMegaSlot,
  suggestedPokemon,
  teamLegality,
  teamTypeSummary,
  trainedStatValue
} from "../modules/team-analysis.js";

const battleFormats = {
  single3: { label: "Single 3v3", maxTeamSize: 6, selectionSize: 3 },
  double4: { label: "Double 4v4", maxTeamSize: 6, selectionSize: 4 }
};

const teamStyles = {
  balanced: { targets: { physical: 1, special: 1, fast: 1, bulky: 1 } }
};

const garchomp = { name: "Garchomp", hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102, bst: 600, types: ["Dragon", "Ground"], abilities: [], evos: [] };
const megaChomp = { ...garchomp, name: "Garchomp-Mega" };
const dragonite = { name: "Dragonite", hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80, bst: 600, types: ["Dragon", "Flying"], abilities: [], evos: [] };
const corviknight = { name: "Corviknight", hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67, bst: 495, types: ["Flying", "Steel"], abilities: [], evos: [] };
const starmie = { name: "Starmie", hp: 60, atk: 75, def: 85, spa: 100, spd: 85, spe: 115, bst: 520, types: ["Water", "Psychic"], abilities: [], evos: [] };
const charizard = { name: "Charizard", hp: 78, atk: 104, def: 78, spa: 159, spd: 115, spe: 100, bst: 634, types: ["Fire", "Flying"], abilities: [], evos: [] };

assert.equal(baseSpecies("Charizard-Mega-Y"), "Charizard");
assert.equal(baseSpecies("Garchomp-Mega"), "Garchomp");
assert.equal(megaBaseFromItem("Charizardite Y"), "Charizard");
assert.equal(pokemonUsesMegaSlot(charizard, { item: "Charizardite Y" }), true);
assert.equal(pokemonUsesMegaSlot(garchomp, { item: "Venusaurite" }), false);

assert.equal(normalizeSpSpread("252 Atk / 252 Spe / 4 HP"), "2 HP / 32 Atk / 32 Spe");
assert.equal(normalizeSpSpread("40 HP / 40 Atk / 40 Def"), "22 HP / 22 Atk / 22 Def");
assert.equal(normalizeSpSpread("32 Atk / 32 Spe"), "2 HP / 32 Atk / 32 Spe");
assert.equal(normalizeSpSpread("16 HP / 16 Def / 16 SpD"), "22 HP / 22 Def / 22 SpD");

assert.equal(trainedStatValue(75, 32, "HP", "Sassy"), 182);
assert.equal(trainedStatValue(85, 5, "Atk", "Sassy"), 110);
assert.equal(trainedStatValue(200, 1, "Def", "Sassy"), 221);
assert.equal(trainedStatValue(55, 0, "SpA", "Sassy"), 75);
assert.equal(trainedStatValue(65, 28, "SpD", "Sassy"), 124);
assert.equal(trainedStatValue(30, 0, "Spe", "Sassy"), 45);

assert.deepEqual(teamLegality({ pokemon: garchomp, team: [], battleFormat: "single3", battleFormats }), { ok: true, reason: "" });
assert.equal(teamLegality({ pokemon: garchomp, team: [garchomp], battleFormat: "single3", battleFormats }).ok, false);
assert.equal(teamLegality({ pokemon: megaChomp, team: [garchomp], battleFormat: "single3", battleFormats }).ok, false);
assert.equal(teamLegality({
  pokemon: megaChomp,
  team: [charizard],
  battleFormat: "single3",
  battleFormats,
  selectedBuild: (pokemon) => pokemon.name === "Charizard" ? { item: "Charizardite Y" } : {}
}).ok, false);
assert.equal(teamLegality({ pokemon: dragonite, team: [garchomp, starmie, corviknight], battleFormat: "single3", battleFormats }).ok, true);
assert.equal(teamLegality({ pokemon: dragonite, team: [garchomp, starmie, corviknight, starmie, corviknight, starmie], battleFormat: "single3", battleFormats }).ok, false);

const summary = teamTypeSummary([garchomp, dragonite]);
assert.equal(summary.find((item) => item.type === "Ice").weak, 2);
assert.equal(summary.find((item) => item.type === "Ground").immune, 1);

const picks = suggestedPokemon({
  pokemon: [garchomp, dragonite, corviknight, starmie],
  team: [garchomp, dragonite],
  battleFormat: "single3",
  battleFormats,
  teamStyle: "balanced",
  teamStyles,
  roleFor: (pokemon) => ({ label: pokemon.spe >= 100 ? "Speed control" : "Bulky pivot", description: `${pokemon.name} role` }),
  selectedBuild: () => ({ status: "curated" }),
  limit: 2
});
assert.equal(picks[0].pokemon.name, "Corviknight");
assert.ok(picks[0].score > 0);

console.log("team-analysis tests passed");
