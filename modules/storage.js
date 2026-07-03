export const STORAGE_KEYS = {
  customSets: "championsCustomSets",
  savedTeams: "championsSavedTeams",
  favorites: "championsFavorites",
  battleSim: "championsBattleSim"
};

// Waarden worden opgeslagen in een envelope { __v, data } zodat een later
// schema oude data kan herkennen. Kale waarden van vóór de envelope worden
// als versie 0 gelezen en bij de eerstvolgende save geüpgraded.
export const STORAGE_VERSION = 1;

function isEnvelope(parsed) {
  return Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed)
    && "__v" in parsed && "data" in parsed;
}

export function readJsonStorage(key, fallback, storage = globalThis.localStorage, options = {}) {
  const { version = STORAGE_VERSION, validate } = options;
  try {
    const raw = storage?.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const envelope = isEnvelope(parsed);
    if (envelope && parsed.__v > version) return fallback;
    const value = envelope ? parsed.data : parsed;
    if (validate && !validate(value)) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value, storage = globalThis.localStorage, options = {}) {
  const { version = STORAGE_VERSION } = options;
  try {
    storage?.setItem(key, JSON.stringify({ __v: version, data: value }));
    return true;
  } catch {
    return false;
  }
}
