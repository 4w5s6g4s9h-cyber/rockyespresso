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

export async function fetchJson(path, errorLabel) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${errorLabel} (${response.status})`);
    return response.json();
  } catch (error) {
    const fallback = await ensureLocalData().catch(() => null);
    if (fallback) return fallbackDataForPath(fallback, path);
    throw error;
  }
}

export async function loadPokemonData() {
  if (localData()?.pokemon) return normalizePokemonDataset(localData().pokemon);
  try {
    return normalizePokemonDataset(await fetchJson("data/champions-pokemon.json", "Dataset kon niet worden geladen"));
  } catch (error) {
    return normalizePokemonDataset((await ensureLocalData()).pokemon);
  }
}

export async function loadChampionsMeta() {
  const data = localData()?.meta
    ?? await fetchJson("data/champions-meta.json", "Champions-meta kon niet worden geladen");
  return {
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
  if (path.includes("champions-moves")) return fallback.moves;
  if (path.includes("champions-meta")) return fallback.meta;
  throw new Error(`Geen fallback-data voor ${path}.`);
}

function normalizePokemonDataset(data) {
  if (Array.isArray(data)) return { pokemon: data };
  if (Array.isArray(data?.pokemon)) return data;
  return { pokemon: [] };
}

function normalizePokemonList(pokemon) {
  if (Array.isArray(pokemon)) return pokemon;
  if (Array.isArray(pokemon?.pokemon)) return pokemon.pokemon;
  return [];
}
