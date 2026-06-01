import assert from "node:assert/strict";
import {
  baseSpecies,
  normalizeSpSpread,
  suggestedPokemon,
  teamLegality,
  teamTypeSummary
} from "../modules/team-analysis.js";

const battleFormats = {
  single3: { label: "Single 3v3", maxTeamSize: 3 },
  double4: { label: "Double 4v4", maxTeamSize: 4 }
};

const teamStyles = {
  balanced: { targets: { physical: 1, special: 1, fast: 1, bulky: 1 } }
};

const garchomp = { name: "Garchomp", hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102, bst: 600, types: ["Dragon", "Ground"], abilities: [], evos: [] };
const megaChomp = { ...garchomp, name: "Garchomp-Mega" };
const dragonite = { name: "Dragonite", hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80, bst: 600, types: ["Dragon", "Flying"], abilities: [], evos: [] };
const corviknight = { name: "Corviknight", hp: 98, atk: 87, def: 105, spa: 53, spd: 85, spe: 67, bst: 495, types: ["Flying", "Steel"], abilities: [], evos: [] };
const starmie = { name: "Starmie", hp: 60, atk: 75, def: 85, spa: 100, spd: 85, spe: 115, bst: 520, types: ["Water", "Psychic"], abilities: [], evos: [] };

assert.equal(baseSpecies("Charizard-Mega-Y"), "Charizard");
assert.equal(baseSpecies("Garchomp-Mega"), "Garchomp");

assert.equal(normalizeSpSpread("252 Atk / 252 Spe / 4 HP"), "1 HP / 32 Atk / 32 Spe");
assert.equal(normalizeSpSpread("40 HP / 40 Atk / 40 Def"), "5 HP / 5 Atk / 5 Def");

assert.deepEqual(teamLegality({ pokemon: garchomp, team: [], battleFormat: "single3", battleFormats }), { ok: true, reason: "" });
assert.equal(teamLegality({ pokemon: garchomp, team: [garchomp], battleFormat: "single3", battleFormats }).ok, false);
assert.equal(teamLegality({ pokemon: megaChomp, team: [garchomp], battleFormat: "single3", battleFormats }).ok, false);
assert.equal(teamLegality({ pokemon: dragonite, team: [garchomp, starmie, corviknight], battleFormat: "single3", battleFormats }).ok, false);

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
