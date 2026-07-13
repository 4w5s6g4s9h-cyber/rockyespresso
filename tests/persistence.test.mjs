import assert from "node:assert/strict";
import { restoreBattleOpponentState } from "../modules/persistence.js";

const pokemon = [
  { name: "Garchomp" },
  { name: "Starmie" },
  { name: "Dragonite" }
];

const restored = restoreBattleOpponentState({
  opponentTeam: ["Garchomp", "Starmie", "Missing", "Garchomp"],
  opponentSelection: ["Starmie", "Missing"],
  opponentMode: "counter"
}, pokemon);

assert.deepEqual(restored.opponentTeam.map((entry) => entry.name), ["Garchomp", "Starmie"]);
assert.deepEqual(restored.opponentSelection, ["Starmie"]);
assert.equal(restored.opponentMode, "counter");
assert.equal(restoreBattleOpponentState({ opponentMode: "invalid" }, pokemon).opponentMode, "manual");

console.log("persistence tests passed");
