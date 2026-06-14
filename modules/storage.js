export const STORAGE_KEYS = {
  customSets: "championsCustomSets",
  savedTeams: "championsSavedTeams",
  favorites: "championsFavorites",
  battleSim: "championsBattleSim"
};

export function readJsonStorage(key, fallback, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value, storage = globalThis.localStorage) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
