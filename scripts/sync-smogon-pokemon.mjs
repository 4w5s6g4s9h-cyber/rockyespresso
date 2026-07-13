import fs from 'node:fs/promises';
import path from 'node:path';
import { assertDataset, validatePokemonDataset } from '../modules/data-schema.js';
import { fetchJsonResource, fetchTextResource } from './fetch-safe.mjs';

const ROOT = process.cwd();
const POKEMON_PATH = path.join(ROOT, 'data/champions-pokemon.json');
const SEREBII_CHAMPIONS_INDEX = 'https://www.serebii.net/pokedex-champions/';
const SEREBII_TO_SMOGON_NAMES = {
  Meowstic: ['Meowstic-M'],
};

async function rpc(method, body) {
  return fetchJsonResource(`https://www.smogon.com/dex/_rpc/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }, { label: method });
}

function decodeHtml(value) {
  return String(value)
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&[^;]+;/g, '');
}

function toLocalPokemon(sm) {
  return {
    name: sm.name,
    hp: sm.hp,
    atk: sm.atk,
    def: sm.def,
    spa: sm.spa,
    spd: sm.spd,
    spe: sm.spe,
    bst: sm.hp + sm.atk + sm.def + sm.spa + sm.spd + sm.spe,
    weight: sm.weight,
    height: sm.height,
    types: sm.types,
    abilities: sm.abilities,
    formats: sm.formats || [],
    isNonstandard: sm.isNonstandard,
    dexNumber: sm.oob?.dex_number ?? -1,
    evos: sm.oob?.evos || [],
    alts: sm.oob?.alts || [],
  };
}

function isMega(name) {
  return /-Mega(?:-|$)/.test(name ?? '');
}

function baseNameForMega(pokemonName) {
  if (pokemonName.endsWith('-Mega-X')) return pokemonName.replace('-Mega-X', '');
  if (pokemonName.endsWith('-Mega-Y')) return pokemonName.replace('-Mega-Y', '');
  if (pokemonName.endsWith('-Mega')) return pokemonName.replace('-Mega', '');
  return pokemonName;
}

function megaItemCandidates(pokemonName, basicsByGen) {
  if (!isMega(pokemonName)) return [];
  const baseName = baseNameForMega(pokemonName).toLowerCase();
  const suffix = pokemonName.endsWith('-Mega-X') ? ' x' : pokemonName.endsWith('-Mega-Y') ? ' y' : '';
  const items = [...(basicsByGen.champions.items || []), ...(basicsByGen.sv.items || [])];
  return [...new Set(items
    .filter((item) => {
      const description = String(item.description || '').toLowerCase();
      if (!description.includes('mega evolve')) return false;
      if (!description.includes(`held by a ${baseName}`) && !description.includes(`held by an ${baseName}`)) return false;
      if (suffix && !description.includes(`mega ${baseName}${suffix}`) && !item.name.toLowerCase().endsWith(suffix.trim())) return false;
      return true;
    })
    .map((item) => item.name))];
}

function withMegaStoneData(pokemon, basicsByGen) {
  const megaStones = megaItemCandidates(isMega(pokemon.name) ? pokemon.name : `${pokemon.name}-Mega`, basicsByGen);
  if (!megaStones.length && !isMega(pokemon.name)) return pokemon;
  return {
    ...pokemon,
    megaStones: megaStones.length ? megaStones : ['Mega Stone'],
  };
}

async function serebiiRosterEntries() {
  const html = await fetchTextResource(SEREBII_CHAMPIONS_INDEX, {}, { label: 'Serebii Champions index' });
  return [...html.matchAll(/<option value="\/pokedex-champions\/([^/]+)\/">\s*(\d+)\s+([^<]+)<\/option>/g)]
    .map((match) => ({
      slug: match[1],
      dexNumber: Number(match[2]),
      name: decodeHtml(match[3].trim()),
    }));
}

async function hasSerebiiMegaEvolution(slug) {
  try {
    const html = await fetchTextResource(`${SEREBII_CHAMPIONS_INDEX}${slug}/`, {}, { label: `Serebii ${slug}` });
    return /<b>\s*Mega Evolution\s*<\/b>/i.test(html);
  } catch (error) {
    if (error.status === 404) return false;
    throw error;
  }
}

async function serebiiSupplementalPokemon(existingNames, svPokemon) {
  const svByName = new Map(svPokemon.map((pokemon) => [pokemon.name, pokemon]));
  const additions = [];
  for (const entry of await serebiiRosterEntries()) {
    const canonicalNames = SEREBII_TO_SMOGON_NAMES[entry.name] ?? [entry.name];
    for (const name of canonicalNames) {
      if (!existingNames.has(name) && svByName.has(name)) {
        additions.push({ ...toLocalPokemon(svByName.get(name)), dexNumber: entry.dexNumber });
        existingNames.add(name);
      }
      const megaName = `${name}-Mega`;
      if (!existingNames.has(megaName) && svByName.has(megaName) && await hasSerebiiMegaEvolution(entry.slug)) {
        additions.push({ ...toLocalPokemon(svByName.get(megaName)), dexNumber: entry.dexNumber });
        existingNames.add(megaName);
      }
    }
  }
  return additions;
}

async function main() {
  const basics = await rpc('dump-basics', { gen: 'champions' });
  const svBasics = await rpc('dump-basics', { gen: 'sv' });
  const basicsByGen = { champions: basics, sv: svBasics };
  const officialPokemon = basics.pokemon.filter((pokemon) => pokemon.isNonstandard !== 'CAP');
  const pokemon = officialPokemon.map(toLocalPokemon).map((entry) => withMegaStoneData(entry, basicsByGen));
  const serebiiAdditions = await serebiiSupplementalPokemon(
    new Set(pokemon.map((entry) => entry.name)),
    svBasics.pokemon.filter((pokemon) => pokemon.isNonstandard !== 'CAP'),
  ).then((entries) => entries.map((entry) => withMegaStoneData(entry, basicsByGen)));
  const generatedAt = new Date().toISOString();
  const output = {
    source: {
      primary: 'https://www.smogon.com/dex/champions/pokemon/',
      fallback: SEREBII_CHAMPIONS_INDEX,
    },
    generatedAt,
    counts: {
      pokemon: pokemon.length + serebiiAdditions.length,
      smogonChampions: pokemon.length,
      serebiiChampionsFallback: serebiiAdditions.length,
      moves: basics.moves.length,
      abilities: basics.abilities.length,
      items: basics.items.length,
    },
    pokemon: [...pokemon, ...serebiiAdditions],
  };

  assertDataset('Pokémon-data', validatePokemonDataset(output));
  await fs.writeFile(POKEMON_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.error(`Synced ${output.pokemon.length} pokemon (${pokemon.length} Smogon Champions, ${serebiiAdditions.length} Serebii fallback) (${generatedAt})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
