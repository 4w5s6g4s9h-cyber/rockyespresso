import assert from "node:assert/strict";
import {
  readJsonStorage,
  STORAGE_KEYS,
  validateBattleSimState,
  validateCustomSets,
  validateFavorites,
  validateSavedTeams,
  writeJsonStorage
} from "../modules/storage.js";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value)
  };
}

const storage = memoryStorage({
  [STORAGE_KEYS.favorites]: JSON.stringify(["Garchomp", "Starmie"])
});

assert.deepEqual(readJsonStorage(STORAGE_KEYS.favorites, [], storage), ["Garchomp", "Starmie"]);
assert.deepEqual(readJsonStorage(STORAGE_KEYS.savedTeams, [], storage), []);
assert.deepEqual(readJsonStorage("broken", { ok: true }, memoryStorage({ broken: "not json" })), { ok: true });

assert.equal(writeJsonStorage(STORAGE_KEYS.customSets, { Garchomp: { item: "Yache Berry" } }, storage), true);
assert.deepEqual(readJsonStorage(STORAGE_KEYS.customSets, {}, storage), { Garchomp: { item: "Yache Berry" } });

const failingStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  }
};

assert.deepEqual(readJsonStorage(STORAGE_KEYS.favorites, ["fallback"], failingStorage), ["fallback"]);
assert.equal(writeJsonStorage(STORAGE_KEYS.favorites, [], failingStorage), false);

// Envelope: writes worden opgeslagen als { __v, data } en zo teruggelezen.
const envelopeStorage = memoryStorage();
writeJsonStorage("key", { a: 1 }, envelopeStorage);
assert.deepEqual(JSON.parse(envelopeStorage.getItem("key")), { __v: 1, data: { a: 1 } });
assert.deepEqual(readJsonStorage("key", null, envelopeStorage), { a: 1 });

// Legacy kale waarden (van vóór de envelope) blijven leesbaar.
const legacyStorage = memoryStorage({ legacy: JSON.stringify(["Garchomp"]) });
assert.deepEqual(readJsonStorage("legacy", [], legacyStorage), ["Garchomp"]);

// Data van een nieuwere schemaversie wordt genegeerd.
const futureStorage = memoryStorage({ future: JSON.stringify({ __v: 99, data: { nieuw: true } }) });
assert.deepEqual(readJsonStorage("future", "fallback", futureStorage), "fallback");

// Validatie: afgekeurde data valt terug op de fallback.
const typeStorage = memoryStorage({ favs: JSON.stringify({ __v: 1, data: "geen array" }) });
assert.deepEqual(readJsonStorage("favs", [], typeStorage, { validate: Array.isArray }), []);
const okStorage = memoryStorage({ favs: JSON.stringify({ __v: 1, data: ["Starmie"] }) });
assert.deepEqual(readJsonStorage("favs", [], okStorage, { validate: Array.isArray }), ["Starmie"]);

assert.equal(validateFavorites(["Garchomp", "Starmie"]), true);
assert.equal(validateFavorites([42]), false);
assert.equal(validateCustomSets({ Garchomp: { item: "Yache Berry", moves: ["Earthquake"] } }), true);
assert.equal(validateCustomSets({ Garchomp: { item: "<img onerror=alert(1)>" } }), false);
assert.equal(validateBattleSimState({ opponentMode: "counter", opponentTeam: ["Garchomp"], opponentSelection: ["Garchomp"] }), true);
assert.equal(validateBattleSimState({ opponentMode: "malicious" }), false);
assert.equal(validateSavedTeams([{
  id: "1",
  name: "Team",
  format: "single3",
  teamStyle: "balanced",
  members: ["Garchomp"]
}]), true);
assert.equal(validateSavedTeams([{}]), false);

console.log("storage tests passed");
