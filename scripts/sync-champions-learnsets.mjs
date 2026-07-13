import fs from 'node:fs/promises';
import path from 'node:path';
import { assertDataset, validateLearnsetDataset, validatePokemonDataset } from '../modules/data-schema.js';
import { fetchJsonResource, fetchTextResource } from './fetch-safe.mjs';

const ROOT = process.cwd();
const POKEMON_PATH = path.join(ROOT, 'data/champions-pokemon.json');
const LEARNSETS_PATH = path.join(ROOT, 'data/champions-learnsets.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function alias(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function baseNameForMega(pokemonName) {
  if (pokemonName.endsWith('-Mega-X')) return pokemonName.replace('-Mega-X', '');
  if (pokemonName.endsWith('-Mega-Y')) return pokemonName.replace('-Mega-Y', '');
  if (pokemonName.endsWith('-Mega')) return pokemonName.replace('-Mega', '');
  return pokemonName;
}

function sourcePageName(pokemonName) {
  return baseNameForMega(pokemonName)
    .replace(/-Alola$/, '')
    .replace(/-Galar$/, '')
    .replace(/-Hisui$/, '')
    .replace(/-Paldea-(Aqua|Blaze|Combat)$/, '')
    .replace(/-(Wash|Heat|Frost|Fan|Mow)$/, '')
    .replace(/-(Blade|Sunny|Rainy|Snowy|Antique|Masterpiece|Four|Busted|Hangry|Hero|Large|Small|Super|Dusk|Midnight|Fancy|Pokeball|Eternal|M|F)$/, '');
}

function serebiiSlug(pokemonName) {
  return sourcePageName(pokemonName).toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9.-]/g, '');
}

async function rpc(method, body) {
  return fetchJsonResource(`https://www.smogon.com/dex/_rpc/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }, { label: method });
}

async function smogonLearnset(pokemonName) {
  const payload = await rpc('dump-pokemon', { gen: 'champions', alias: alias(pokemonName), language: 'en' });
  return payload?.learnset?.length ? [...new Set(payload.learnset)].sort((a, b) => a.localeCompare(b)) : null;
}

function decodeHtml(value) {
  return value
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&[^;]+;/g, '');
}

async function serebiiLearnset(pokemonName) {
  const url = `https://www.serebii.net/pokedex-champions/${serebiiSlug(pokemonName)}/`;
  const html = await fetchTextResource(url, {}, { label: `Serebii ${pokemonName}` });
  const attacksStart = html.indexOf('<a name="attacks">');
  const statsStart = html.indexOf('<a name="stats">');
  const attackHtml = attacksStart >= 0
    ? html.slice(attacksStart, statsStart > attacksStart ? statsStart : undefined)
    : html;

  const moves = [...attackHtml.matchAll(/\/attackdex-champions\/[^"]+\.shtml">([^<]+)<\/a>/g)]
    .map((match) => decodeHtml(match[1].trim()))
    .filter(Boolean);
  return moves.length ? [...new Set(moves)].sort((a, b) => a.localeCompare(b)) : null;
}

async function main() {
  const pokemonData = JSON.parse(await fs.readFile(POKEMON_PATH, 'utf8'));
  assertDataset('Pokémon-data', validatePokemonDataset(pokemonData));
  const pokemon = pokemonData.pokemon ?? [];
  const learnsets = {};
  const errors = [];
  const sources = {};

  for (let index = 0; index < pokemon.length; index += 1) {
    const name = pokemon[index].name;
    const baseName = baseNameForMega(name);
    const pageName = sourcePageName(name);
    try {
      if (baseName !== name && learnsets[baseName]) {
        learnsets[name] = learnsets[baseName];
        sources[name] = sources[baseName];
      } else {
        const smogonMoves = await smogonLearnset(baseName);
        const moves = smogonMoves ?? await serebiiLearnset(name);
        if (!moves?.length) throw new Error(`Geen learnset gevonden via Smogon of Serebii (${pageName})`);
        learnsets[baseName] = moves;
        learnsets[name] = moves;
        sources[baseName] = smogonMoves ? 'smogon-champions' : 'serebii-champions';
        sources[name] = sources[baseName];
      }
    } catch (error) {
      try {
        const fallbackMoves = await serebiiLearnset(name);
        if (!fallbackMoves?.length) throw error;
        learnsets[name] = fallbackMoves;
        if (pageName !== name && !learnsets[pageName]) learnsets[pageName] = fallbackMoves;
        sources[name] = 'serebii-champions';
      } catch (fallbackError) {
        errors.push({ name, error: fallbackError.message });
        learnsets[name] = [];
      }
    }

    if ((index + 1) % 30 === 0) {
      console.error(`Fetched learnsets ${index + 1}/${pokemon.length}`);
      await sleep(120);
    }
  }

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: {
      id: 'smogon-champions-learnsets',
      label: 'Smogon Strategy Pokedex - Champions learnsets',
      url: 'https://www.smogon.com/dex/champions/pokemon/',
      rpc: 'https://www.smogon.com/dex/_rpc/dump-pokemon',
      fallback: {
        id: 'serebii-champions',
        label: 'Serebii Champions Pokédex',
        url: 'https://www.serebii.net/pokedex-champions/'
      }
    },
    note: 'Per-Pokemon Champions learnsets. Smogon Champions is preferred; Serebii Champions fills formes where Smogon returns no payload. Mega formes reuse their base species learnset.',
    stats: {
      pokemon: pokemon.length,
      withLearnsets: Object.values(learnsets).filter((moves) => moves.length > 0).length,
      sources: Object.values(sources).reduce((counts, source) => {
        counts[source] = (counts[source] || 0) + 1;
        return counts;
      }, {}),
      errors,
    },
    learnsets: Object.fromEntries(Object.entries(learnsets).sort(([a], [b]) => a.localeCompare(b))),
  };

  if (errors.length) {
    throw new Error(`Learnset-sync afgebroken: ${errors.length} Pokémon zonder valide Champions-learnset`);
  }
  assertDataset('Learnset-data', validateLearnsetDataset(output, pokemon.map((entry) => entry.name)));
  await fs.writeFile(LEARNSETS_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.error(`Wrote ${Object.keys(output.learnsets).length} Champions learnsets`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
