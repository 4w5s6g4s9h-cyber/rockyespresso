import fs from 'node:fs/promises';
import path from 'node:path';

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

async function rpc(method, body) {
  const response = await fetch(`https://www.smogon.com/dex/_rpc/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${response.status}: ${text.slice(0, 180)}`);
  }
  return response.json();
}

async function main() {
  const pokemonData = JSON.parse(await fs.readFile(POKEMON_PATH, 'utf8'));
  const pokemon = pokemonData.pokemon ?? [];
  const learnsets = {};
  const errors = [];

  for (let index = 0; index < pokemon.length; index += 1) {
    const name = pokemon[index].name;
    const baseName = baseNameForMega(name);
    try {
      if (baseName !== name && learnsets[baseName]) {
        learnsets[name] = learnsets[baseName];
      } else {
        const payload = await rpc('dump-pokemon', { gen: 'champions', alias: alias(baseName), language: 'en' });
        const moves = [...new Set(payload.learnset ?? [])].sort((a, b) => a.localeCompare(b));
        learnsets[baseName] = moves;
        learnsets[name] = moves;
      }
    } catch (error) {
      errors.push({ name, error: error.message });
      learnsets[name] = [];
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
    },
    note: 'Per-Pokemon Champions learnsets from Smogon dump-pokemon. Mega formes reuse their base species learnset.',
    stats: {
      pokemon: pokemon.length,
      withLearnsets: Object.values(learnsets).filter((moves) => moves.length > 0).length,
      errors,
    },
    learnsets: Object.fromEntries(Object.entries(learnsets).sort(([a], [b]) => a.localeCompare(b))),
  };

  await fs.writeFile(LEARNSETS_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.error(`Wrote ${Object.keys(output.learnsets).length} Champions learnsets`);
  if (errors.length) console.error(`Learnset errors: ${errors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
