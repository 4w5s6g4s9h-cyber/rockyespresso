const STAT_FIELDS = ["hp", "atk", "def", "spa", "spd", "spe", "bst"];
const SET_STATUSES = new Set(["smogon-champions", "smogon-sv", "generated", "custom"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeText(value, maxLength = 200) {
  return typeof value === "string"
    && value.length > 0
    && value.length <= maxLength
    && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}

function safeStringArray(value, { min = 0, max = 20, maxLength = 200 } = {}) {
  return Array.isArray(value)
    && value.length >= min
    && value.length <= max
    && value.every((entry) => safeText(entry, maxLength));
}

function safeStructuredValue(value, depth = 0) {
  if (depth > 6) return false;
  if (value == null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= 1000 && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
  if (Array.isArray(value)) return value.length <= 100 && value.every((entry) => safeStructuredValue(entry, depth + 1));
  if (!isRecord(value) || Object.keys(value).length > 100) return false;
  return Object.entries(value).every(([key, entry]) => safeText(key, 160) && safeStructuredValue(entry, depth + 1));
}

function push(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function validatePokemonDataset(data) {
  const errors = [];
  push(errors, isRecord(data), "pokemon: root moet een object zijn");
  const pokemon = Array.isArray(data?.pokemon) ? data.pokemon : [];
  push(errors, pokemon.length > 0 && pokemon.length <= 1000, "pokemon: roster moet 1-1000 records bevatten");
  const names = new Set();
  pokemon.forEach((entry, index) => {
    const at = `pokemon[${index}]`;
    push(errors, isRecord(entry), `${at}: record ontbreekt`);
    if (!isRecord(entry)) return;
    push(errors, safeText(entry.name, 120), `${at}.name: ongeldige naam`);
    if (safeText(entry.name, 120)) {
      push(errors, !names.has(entry.name), `${at}.name: dubbele naam ${entry.name}`);
      names.add(entry.name);
    }
    STAT_FIELDS.forEach((field) => push(
      errors,
      Number.isFinite(entry[field]) && entry[field] >= 1 && entry[field] <= (field === "bst" ? 1530 : 255),
      `${at}.${field}: ongeldige stat`
    ));
    push(errors, safeStringArray(entry.types, { min: 1, max: 2, maxLength: 30 }), `${at}.types: ongeldige types`);
    push(errors, safeStringArray(entry.abilities, { min: 1, max: 8, maxLength: 100 }), `${at}.abilities: ongeldige abilities`);
    push(errors, Number.isFinite(entry.weight) && entry.weight >= 0 && entry.weight <= 10000, `${at}.weight: ongeldig`);
    push(errors, Number.isFinite(entry.height) && entry.height >= 0 && entry.height <= 100, `${at}.height: ongeldig`);
    ["formats", "evos", "alts", "megaStones"].forEach((field) => {
      if (entry[field] != null) push(errors, safeStringArray(entry[field], { max: 100, maxLength: 160 }), `${at}.${field}: ongeldig`);
    });
  });
  return errors;
}

export function validateLearnsetDataset(data, pokemonNames = []) {
  const errors = [];
  const learnsets = isRecord(data?.learnsets) ? data.learnsets : {};
  push(errors, isRecord(data), "learnsets: root moet een object zijn");
  push(errors, isRecord(data?.learnsets), "learnsets: learnsets-object ontbreekt");
  const pipelineErrors = data?.stats?.errors;
  push(errors, Array.isArray(pipelineErrors), "learnsets.stats.errors: array ontbreekt");
  push(errors, Array.isArray(pipelineErrors) && pipelineErrors.length === 0, "learnsets: sync bevat fouten");
  Object.entries(learnsets).forEach(([name, moves]) => {
    push(errors, safeText(name, 120), `learnsets: ongeldige sleutel ${name}`);
    push(errors, safeStringArray(moves, { min: 1, max: 1000, maxLength: 160 }), `learnsets.${name}: lege of ongeldige learnset`);
  });
  pokemonNames.forEach((name) => push(
    errors,
    Array.isArray(learnsets[name]) && learnsets[name].length > 0,
    `learnsets.${name}: roster-entry ontbreekt`
  ));
  return errors;
}

export function validateMovesetDataset(data, pokemonNames = []) {
  const errors = [];
  const sets = isRecord(data?.sets) ? data.sets : {};
  push(errors, isRecord(data), "movesets: root moet een object zijn");
  push(errors, isRecord(data?.sets), "movesets: sets-object ontbreekt");
  const pipelineErrors = data?.stats?.errors;
  push(errors, Array.isArray(pipelineErrors), "movesets.stats.errors: array ontbreekt");
  push(errors, Array.isArray(pipelineErrors) && pipelineErrors.length === 0, "movesets: sync bevat fouten");
  Object.entries(sets).forEach(([name, builds]) => {
    push(errors, safeText(name, 120), `movesets: ongeldige sleutel ${name}`);
    push(errors, Array.isArray(builds) && builds.length > 0 && builds.length <= 60, `movesets.${name}: sets ontbreken of zijn te groot`);
    if (!Array.isArray(builds)) return;
    builds.forEach((build, index) => {
      const at = `movesets.${name}[${index}]`;
      push(errors, isRecord(build), `${at}: ongeldig setrecord`);
      if (!isRecord(build)) return;
      push(errors, safeStructuredValue(build), `${at}: bevat onveilige of onbegrensde waarden`);
      push(errors, safeText(build.id, 200), `${at}.id: ongeldig`);
      push(errors, safeText(build.status, 40) && SET_STATUSES.has(build.status), `${at}.status: onbekend`);
      push(errors, safeStringArray(build.moves, { min: 1, max: 4, maxLength: 240 }), `${at}.moves: ongeldig`);
      ["label", "item", "ability", "nature", "evs"].forEach((field) => {
        if (build[field] != null && build[field] !== "") push(errors, safeText(build[field], 300), `${at}.${field}: ongeldig`);
      });
    });
  });
  pokemonNames.forEach((name) => push(
    errors,
    Array.isArray(sets[name]) && sets[name].length > 0,
    `movesets.${name}: roster-entry ontbreekt`
  ));
  return errors;
}

export function validateMoveDataset(data) {
  const errors = [];
  const moves = isRecord(data?.moves) ? data.moves : {};
  push(errors, isRecord(data), "moves: root moet een object zijn");
  push(errors, isRecord(data?.moves) && Object.keys(moves).length > 0, "moves: move-details ontbreken");
  Object.entries(moves).forEach(([name, details]) => {
    const at = `moves.${name}`;
    push(errors, safeText(name, 160), `${at}: ongeldige naam`);
    push(errors, isRecord(details), `${at}: details ontbreken`);
    if (!isRecord(details)) return;
    push(errors, safeText(details.type, 30), `${at}.type: ongeldig`);
    push(errors, ["Physical", "Special", "Status"].includes(details.category), `${at}.category: ongeldig`);
    ["power", "accuracy", "pp"].forEach((field) => push(errors, safeText(String(details[field]), 20), `${at}.${field}: ongeldig`));
    if (details.effect != null && details.effect !== "") push(errors, safeText(details.effect, 1000), `${at}.effect: ongeldig`);
  });
  return errors;
}

export function assertDataset(label, errors) {
  if (!errors.length) return;
  const sample = errors.slice(0, 12).join("\n- ");
  throw new Error(`${label} voldoet niet aan het schema (${errors.length} fouten):\n- ${sample}`);
}
