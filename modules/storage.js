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

const BATTLE_MODES = new Set(["manual", "counter", "bulky", "offense", "random", "mirror"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBoundedString(value, maxLength = 120) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isStringArray(value, { maxItems = 12, maxLength = 120 } = {}) {
  return Array.isArray(value)
    && value.length <= maxItems
    && value.every((item) => isBoundedString(item, maxLength));
}

function isSafeJsonValue(value, depth = 0) {
  if (depth > 5) return false;
  if (value == null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") {
    return value.length <= 500 && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
  }
  if (Array.isArray(value)) return value.length <= 40 && value.every((item) => isSafeJsonValue(item, depth + 1));
  if (!isPlainObject(value) || Object.keys(value).length > 80) return false;
  return Object.entries(value).every(([key, item]) => key.length <= 120 && isSafeJsonValue(item, depth + 1));
}

function isStringRecord(value, maxEntries = 400) {
  return isPlainObject(value)
    && Object.keys(value).length <= maxEntries
    && Object.entries(value).every(([key, item]) => isBoundedString(key) && isBoundedString(item, 200));
}

export function validateFavorites(value) {
  return isStringArray(value, { maxItems: 400, maxLength: 120 });
}

export function validateCustomSets(value) {
  return isPlainObject(value)
    && Object.keys(value).length <= 400
    && Object.entries(value).every(([name, build]) => isBoundedString(name) && isPlainObject(build) && isSafeJsonValue(build));
}

export function validateSavedTeams(value) {
  if (!Array.isArray(value) || value.length > 12) return false;
  return value.every((team) => {
    if (!isPlainObject(team)) return false;
    if (!isBoundedString(team.id, 80) || !isBoundedString(team.name, 120)) return false;
    if (!isBoundedString(team.format, 40) || !isBoundedString(team.teamStyle, 40)) return false;
    if (!isStringArray(team.members, { maxItems: 6 })) return false;
    if (team.lockedCore != null && !isStringArray(team.lockedCore, { maxItems: 6 })) return false;
    if (team.battleSelection != null && !isStringArray(team.battleSelection, { maxItems: 4 })) return false;
    if (team.selectedSets != null && !isStringRecord(team.selectedSets)) return false;
    if (team.customSets != null && !validateCustomSets(team.customSets)) return false;
    return team.savedAt == null || isBoundedString(team.savedAt, 80);
  });
}

export function validateBattleSimState(value) {
  if (!isPlainObject(value)) return false;
  if (value.opponentMode != null && !BATTLE_MODES.has(value.opponentMode)) return false;
  if (value.opponentTeam != null && !isStringArray(value.opponentTeam, { maxItems: 6 })) return false;
  if (value.opponentSelection != null && !isStringArray(value.opponentSelection, { maxItems: 4 })) return false;
  return true;
}

function isEnvelope(parsed) {
  return Boolean(parsed) && typeof parsed === "object" && !Array.isArray(parsed)
    && "__v" in parsed && "data" in parsed;
}

export function readJsonStorage(key, fallback, storage = globalThis.localStorage, options = {}) {
  const { version = STORAGE_VERSION, validate, onInvalid } = options;
  try {
    const raw = storage?.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    const envelope = isEnvelope(parsed);
    if (envelope && parsed.__v > version) {
      onInvalid?.("newer-version");
      return fallback;
    }
    const value = envelope ? parsed.data : parsed;
    if (validate && !validate(value)) {
      onInvalid?.("schema");
      return fallback;
    }
    return value;
  } catch (error) {
    onInvalid?.("parse", error);
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
