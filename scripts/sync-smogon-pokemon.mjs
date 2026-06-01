import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const POKEMON_PATH = path.join(ROOT, 'data/champions-pokemon.json');

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

async function main() {
  const basics = await rpc('dump-basics', { gen: 'champions' });
  const officialPokemon = basics.pokemon.filter((pokemon) => pokemon.isNonstandard !== 'CAP');
  const generatedAt = new Date().toISOString();
  const output = {
    source: 'https://www.smogon.com/dex/champions/pokemon/',
    generatedAt,
    counts: {
      pokemon: officialPokemon.length,
      moves: basics.moves.length,
      abilities: basics.abilities.length,
      items: basics.items.length,
    },
    pokemon: officialPokemon.map(toLocalPokemon),
  };

  await fs.writeFile(POKEMON_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.error(`Synced ${output.pokemon.length} pokemon from Smogon Champions (${generatedAt})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
