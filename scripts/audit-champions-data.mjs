import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PLACEHOLDER_PATTERN = /STAB|coverage|utility|setup|priority|recovery|team gaps|walls|checks|betrouwbare/i;
const BANNED_FALLBACK_MOVES = new Set(['Hidden Power', 'Pursuit', 'Return', 'Tera Blast']);

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

function splitMoveOptions(value) {
  return String(value).split('/').map((part) => part.trim()).filter(Boolean);
}

function isMega(name) {
  return /-Mega(?:-|$)/.test(name ?? '');
}

function megaItemAllowed(pokemon, item) {
  const options = pokemon?.megaStones?.filter(Boolean) ?? [];
  if (!options.length) return splitMoveOptions(item).includes('Mega Stone');
  return splitMoveOptions(item).some((option) => options.includes(option));
}

function learnsetForPokemon(pokemonName, learnsets = {}) {
  return learnsets[pokemonName]
    ?? learnsets[baseNameForMega(pokemonName)]
    ?? learnsets[sourcePageName(pokemonName)]
    ?? [];
}

function moveAllowed(pokemonName, move, learnsets) {
  if (BANNED_FALLBACK_MOVES.has(move)) return false;
  const learnset = learnsetForPokemon(pokemonName, learnsets);
  return !learnset.length || learnset.includes(move);
}

function countBy(items, valueFor) {
  return items.reduce((counts, item) => {
    const value = valueFor(item);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'));
}

async function main() {
  const [pokemonData, movesetData, moveData, learnsetData] = await Promise.all([
    readJson('data/champions-pokemon.json'),
    readJson('data/champions-movesets.json'),
    readJson('data/champions-moves.json'),
    readJson('data/champions-learnsets.json'),
  ]);

  const moveDetails = moveData.moves ?? {};
  const learnsets = learnsetData.learnsets ?? {};
  const rows = Object.entries(movesetData.sets ?? {}).flatMap(([pokemonName, sets]) => {
    return sets.map((set) => ({ pokemonName, set }));
  });

  const unknownMoveDetails = [];
  const illegalSetMoves = [];
  const placeholderMoves = [];
  const illegalMegaItems = [];
  const pokemonByName = new Map((pokemonData.pokemon ?? []).map((pokemon) => [pokemon.name, pokemon]));

  for (const { pokemonName, set } of rows) {
    if (isMega(pokemonName) && !megaItemAllowed(pokemonByName.get(pokemonName), set.item)) {
      illegalMegaItems.push({ pokemon: pokemonName, set: set.id, item: set.item });
    }
    for (const slot of set.moves ?? []) {
      const options = splitMoveOptions(slot);
      if (options.some((move) => PLACEHOLDER_PATTERN.test(move))) {
        placeholderMoves.push({ pokemon: pokemonName, set: set.id, slot });
        continue;
      }
      if (!options.length) continue;
      if (!options.some((move) => moveDetails[move])) {
        unknownMoveDetails.push({ pokemon: pokemonName, set: set.id, slot });
      }
      if (!options.some((move) => moveAllowed(pokemonName, move, learnsets))) {
        illegalSetMoves.push({ pokemon: pokemonName, set: set.id, slot });
      }
    }
  }

  const statuses = rows.map(({ set }) => set.status ?? 'unknown');
  const report = {
    pokemon: pokemonData.pokemon?.length ?? 0,
    setEntries: rows.length,
    sourceCoverage: countBy(statuses, (status) => status),
    generatedSets: statuses.filter((status) => status === 'generated').length,
    adjustedSets: rows.filter(({ set }) => set.championsAdjusted).length,
    learnsetSources: learnsetData.stats?.sources ?? learnsetData.stats ?? {},
    unknownMoveDetails: unknownMoveDetails.length,
    illegalSetMoves: illegalSetMoves.length,
    illegalMegaItems: illegalMegaItems.length,
    placeholderMoves: placeholderMoves.length,
    samples: {
      unknownMoveDetails: unknownMoveDetails.slice(0, 5),
      illegalSetMoves: illegalSetMoves.slice(0, 5),
      illegalMegaItems: illegalMegaItems.slice(0, 5),
      placeholderMoves: placeholderMoves.slice(0, 5),
    },
  };

  console.log(JSON.stringify(report, null, 2));

  if (unknownMoveDetails.length || illegalSetMoves.length || illegalMegaItems.length || placeholderMoves.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
