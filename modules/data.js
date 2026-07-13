import { assertDataset, validatePokemonDataset } from "./data-schema.js";

export function localData() {
  return window.CHAMPIONS_LOCAL_DATA ?? null;
}

let localDataScriptPromise = null;

export async function ensureLocalData() {
  if (localData()) return localData();
  localDataScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "data/local-data.js";
    script.onload = () => localData() ? resolve(localData()) : reject(new Error("Lokale fallback-data is leeg."));
    script.onerror = () => reject(new Error("Lokale fallback-data kon niet worden geladen."));
    document.head.append(script);
  });
  return localDataScriptPromise;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_JSON_BYTES = 8 * 1024 * 1024;

async function fetchWithTimeout(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(path, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(path, errorLabel) {
  try {
    let response;
    try {
      response = await fetchWithTimeout(path);
    } catch {
      response = await fetchWithTimeout(path);
    }
    if (!response.ok) throw new Error(`${errorLabel} (${response.status})`);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("json") && !contentType.includes("javascript")) {
      throw new Error(`${errorLabel}: onverwacht content-type ${contentType}`);
    }
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
      throw new Error(`${errorLabel}: response is te groot`);
    }
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
      throw new Error(`${errorLabel}: response overschrijdt ${MAX_JSON_BYTES} bytes`);
    }
    return JSON.parse(text);
  } catch (error) {
    const fallback = await ensureLocalData().catch(() => null);
    if (fallback) return fallbackDataForPath(fallback, path);
    throw error;
  }
}

export async function loadPokemonData() {
  if (localData()?.pokemon) return checkedPokemonDataset(localData().pokemon);
  try {
    return checkedPokemonDataset(await fetchJson("data/champions-pokemon.json", "Dataset kon niet worden geladen"));
  } catch (error) {
    return checkedPokemonDataset((await ensureLocalData()).pokemon);
  }
}

export async function loadChampionsMeta() {
  const data = localData()?.meta
    ?? await fetchJson("data/champions-meta.json", "Champions-meta kon niet worden geladen");
  return {
    version: data.version ?? "unknown",
    status: data.status ?? "unknown",
    note: data.note ?? "",
    regulation: data.regulation ?? { id: "unknown", status: "unverified" },
    formats: data.formats ?? {},
    archetypes: data.archetypes ?? [],
    threats: data.threats ?? []
  };
}

export function officialPokemon(pokemon = []) {
  return normalizePokemonList(pokemon).filter((item) => item.isNonstandard !== "CAP");
}

function fallbackDataForPath(fallback, path) {
  if (path.includes("champions-pokemon")) return fallback.pokemon;
  if (path.includes("champions-movesets")) return fallback.movesets;
  if (path.includes("champions-learnsets")) return fallback.learnsets;
  if (path.includes("champions-moves")) return fallback.moves;
  if (path.includes("champions-meta")) return fallback.meta;
  throw new Error(`Geen fallback-data voor ${path}.`);
}

function normalizePokemonDataset(data) {
  if (Array.isArray(data)) return { pokemon: data };
  if (Array.isArray(data?.pokemon)) return data;
  return { pokemon: [] };
}

function checkedPokemonDataset(data) {
  const normalized = normalizePokemonDataset(data);
  assertDataset("Pokémon-data", validatePokemonDataset(normalized));
  return normalized;
}

function normalizePokemonList(pokemon) {
  if (Array.isArray(pokemon)) return pokemon;
  if (Array.isArray(pokemon?.pokemon)) return pokemon.pokemon;
  return [];
}
