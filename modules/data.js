export function localData() {
  return window.CHAMPIONS_LOCAL_DATA ?? null;
}

export async function fetchJson(path, errorLabel) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${errorLabel} (${response.status})`);
  return response.json();
}

export async function loadPokemonData() {
  if (localData()?.pokemon) return localData().pokemon;
  return fetchJson("data/champions-pokemon.json", "Dataset kon niet worden geladen");
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
  return pokemon.filter((item) => item.isNonstandard !== "CAP");
}
