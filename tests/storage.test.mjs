import assert from "node:assert/strict";
import { readJsonStorage, STORAGE_KEYS, writeJsonStorage } from "../modules/storage.js";

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

console.log("storage tests passed");
