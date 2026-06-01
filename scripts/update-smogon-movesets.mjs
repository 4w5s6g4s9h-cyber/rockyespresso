import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const POKEMON_PATH = path.join(ROOT, 'data/champions-pokemon.json');
const MOVESETS_PATH = path.join(ROOT, 'data/champions-movesets.json');
const MOVES_PATH = path.join(ROOT, 'data/champions-moves.json');

const SOURCE_IDS = {
  champions: 'smogon-champions',
  sv: 'smogon-sv',
  generated: 'generated-local',
};

const SOURCE_LIST = [
  {
    id: SOURCE_IDS.champions,
    label: 'Smogon Strategy Pokedex - Champions',
    url: 'https://www.smogon.com/dex/champions/pokemon/',
  },
  {
    id: SOURCE_IDS.sv,
    label: 'Smogon Strategy Pokedex - Scarlet/Violet',
    url: 'https://www.smogon.com/dex/sv/pokemon/',
  },
  {
    id: SOURCE_IDS.generated,
    label: 'Generated local heuristic',
    url: 'local://generated-from-stats-types-abilities',
  },
];

const STATUS_LABELS = {
  champions: 'Smogon Champions',
  sv: 'Smogon SV fallback',
};

const SP_TOTAL_LIMIT = 66;
const SP_STAT_LIMIT = 32;
const SP_STATS = [
  ['hp', 'HP'],
  ['atk', 'Atk'],
  ['def', 'Def'],
  ['spa', 'SpA'],
  ['spd', 'SpD'],
  ['spe', 'Spe'],
];
const EXCLUDED_FORMAT_PATTERN = /\bBH\b|\bCAP\b|Hackmons|STABmons|Almost Any Ability|Godly Gift|Partners in Crime/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function alias(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
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

function flattenStrategies(payload) {
  const sets = [];
  const append = (pokemonName, strategy) => {
    for (const moveset of strategy.movesets || []) {
      sets.push({
        pokemon: moveset.pokemon || pokemonName,
        format: strategy.format,
        name: moveset.name,
        abilities: moveset.abilities || [],
        items: moveset.items || [],
        natures: moveset.natures || [],
        evconfigs: moveset.evconfigs || [],
        moveslots: moveset.moveslots || [],
      });
    }
  };

  for (const strategy of payload?.strategies || []) {
    for (const moveset of strategy.movesets || []) {
      append(moveset.pokemon, { ...strategy, movesets: [moveset] });
    }
  }
  for (const forme of payload?.formeStrategies || []) {
    for (const strategy of forme.strategies || []) append(forme.forme, strategy);
  }
  return sets;
}

function matchingSets(sets, pokemonName, megaItems = []) {
  const itemMatches = new Set(megaItems);
  return sets.filter((set) => {
    if (EXCLUDED_FORMAT_PATTERN.test(String(set.format || ''))) return false;
    if (set.pokemon === pokemonName) return true;
    return itemMatches.size > 0 && set.items?.some((item) => itemMatches.has(item));
  });
}

function baseNameForMega(pokemonName) {
  if (pokemonName.endsWith('-Mega-X')) return pokemonName.replace('-Mega-X', '');
  if (pokemonName.endsWith('-Mega-Y')) return pokemonName.replace('-Mega-Y', '');
  if (pokemonName.endsWith('-Mega')) return pokemonName.replace('-Mega', '');
  return pokemonName;
}

function megaItemCandidates(pokemonName, basicsByGen) {
  if (!pokemonName.includes('-Mega')) return [];
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

function moveSlotLabel(slot) {
  return slot
    .map(({ move }) => move)
    .filter(Boolean)
    .join(' / ');
}

function spLabel(evconfigs = [], set = {}) {
  if (!evconfigs.length) return '';
  return evconfigs.map((config) => {
    const normalized = normalizeSpConfig(config, set);
    const parts = SP_STATS
      .filter(([key]) => normalized[key] > 0)
      .map(([key, label]) => `${normalized[key]} ${label}`);
    return parts.join(' / ');
  }).filter(Boolean).join(' | ');
}

function normalizeSpConfig(config = {}, set = {}) {
  const rawTotal = SP_STATS.reduce((sum, [key]) => sum + (Number(config[key]) || 0), 0);
  if (rawTotal > 510) return fallbackSpConfig(set);

  const capped = Object.fromEntries(SP_STATS.map(([key]) => [
    key,
    Math.max(0, Math.min(SP_STAT_LIMIT, Math.round((Number(config[key]) || 0) * SP_STAT_LIMIT / 252))),
  ]));
  const total = SP_STATS.reduce((sum, [key]) => sum + capped[key], 0);
  if (total <= SP_TOTAL_LIMIT) return capped;

  const scaled = SP_STATS.map(([key]) => {
    const exact = capped[key] * SP_TOTAL_LIMIT / total;
    const value = Math.min(SP_STAT_LIMIT, Math.floor(exact));
    return { key, exact, value, remainder: exact - value };
  });
  let used = scaled.reduce((sum, item) => sum + item.value, 0);
  scaled
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((item) => {
      if (used + 1 <= SP_TOTAL_LIMIT && item.value + 1 <= SP_STAT_LIMIT) {
        item.value += 1;
        used += 1;
      }
    });

  return Object.fromEntries(scaled.map(({ key, value }) => [key, value]));
}

function fallbackSpConfig(set = {}) {
  const natureText = String(set.natures?.join(' / ') || '').toLowerCase();
  if (/(timid|modest|quiet|calm mind|nasty)/.test(natureText)) return { hp: 2, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 };
  if (/(jolly|adamant|impish)/.test(natureText)) return { hp: 2, atk: 32, def: 0, spa: 0, spd: 0, spe: 32 };
  if (/(bold)/.test(natureText)) return { hp: 32, atk: 0, def: 32, spa: 0, spd: 2, spe: 0 };
  if (/(careful|calm)/.test(natureText)) return { hp: 32, atk: 0, def: 2, spa: 0, spd: 32, spe: 0 };
  return { hp: 2, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 };
}

function formatLabel(format) {
  if (!format) return 'Smogon set';
  return format
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toLocalSet(set, source) {
  const labelBase = set.name || formatLabel(set.format);
  const sourceSuffix = source === 'sv' ? 'SV' : 'Champions';
  return {
    id: `${source}-${alias(set.pokemon)}-${alias(set.format || 'format')}-${alias(labelBase)}`.slice(0, 96),
    label: `${labelBase} (${sourceSuffix})`,
    format: set.format || 'single3',
    status: source === 'sv' ? 'smogon-sv' : 'smogon-champions',
    role: set.name || formatLabel(set.format),
    item: set.items.join(' / ') || 'No Item',
    ability: set.abilities.join(' / ') || '[ability]',
    nature: set.natures.join(' / ') || '[nature]',
    evs: spLabel(set.evconfigs, set) || 'Geen SP-spread vermeld',
    moves: set.moveslots.map(moveSlotLabel).filter(Boolean).slice(0, 4),
    sourceIds: [source === 'sv' ? SOURCE_IDS.sv : SOURCE_IDS.champions],
  };
}

function generatedSet(pokemon, oldSets) {
  const special = pokemon.spa >= pokemon.atk + 15;
  const physical = pokemon.atk >= pokemon.spa + 15;
  const bulky = pokemon.hp + pokemon.def + pokemon.spd >= 280;
  const mode = bulky && !special && !physical ? 'bulky' : special ? 'special' : physical ? 'physical' : 'mixed';
  return {
    id: `generated-${mode}`,
    label: mode[0].toUpperCase() + mode.slice(1),
    format: 'single3',
    status: 'generated',
    role: mode === 'bulky' ? 'Bulky pivot' : 'Allrounder',
    item: mode === 'bulky' ? 'Leftovers / Heavy-Duty Boots' : 'Expert Belt / Heavy-Duty Boots',
    ability: pokemon.abilities?.[0] || '[ability]',
    nature: mode === 'special' ? 'Modest / Timid' : mode === 'physical' ? 'Adamant / Jolly' : 'Rash / Mild',
    evs: generatedSpSpread(mode),
    moves: ['Primary STAB', 'Second STAB or coverage', 'Coverage for team gaps', 'Utility or setup'],
    sourceIds: [SOURCE_IDS.generated],
  };
}

function generatedSpSpread(mode) {
  if (mode === 'bulky') return '32 HP / 32 Def / 2 SpD';
  if (mode === 'special') return '2 HP / 32 SpA / 32 Spe';
  if (mode === 'physical') return '2 HP / 32 Atk / 32 Spe';
  return '2 HP / 32 Atk / 32 SpA';
}

function ensureUniqueSetIds(sets) {
  const seen = new Map();
  return sets.map((set) => {
    const count = seen.get(set.id) || 0;
    seen.set(set.id, count + 1);
    if (count === 0) return set;
    return { ...set, id: `${set.id}-${count + 1}` };
  });
}

function collectMoveNames(sets) {
  const names = new Set();
  for (const pokemonSets of Object.values(sets)) {
    for (const set of pokemonSets) {
      for (const move of set.moves || []) {
        for (const part of String(move).split('/')) {
          const trimmed = part.trim();
          if (trimmed && !/STAB|coverage|utility|setup|priority|recovery|team gaps|walls|checks/i.test(trimmed)) {
            names.add(trimmed);
          }
        }
      }
    }
  }
  return names;
}

function toMoveDetails(move) {
  return {
    type: move.type,
    category: move.category === 'Non-Damaging' ? 'Status' : move.category,
    power: move.power ? String(move.power) : move.category === 'Non-Damaging' ? '-' : '?',
    accuracy: move.accuracy ? String(move.accuracy) : '-',
    pp: move.pp ? String(move.pp) : '?',
    effect: move.description || 'Smogon move-data.',
  };
}

async function main() {
  const [pokemonData, oldMovesetsData, oldMovesData] = await Promise.all([
    fs.readFile(POKEMON_PATH, 'utf8').then(JSON.parse),
    fs.readFile(MOVESETS_PATH, 'utf8').then(JSON.parse),
    fs.readFile(MOVES_PATH, 'utf8').then(JSON.parse),
  ]);

  const basicsByGen = {
    champions: await rpc('dump-basics', { gen: 'champions' }),
    sv: await rpc('dump-basics', { gen: 'sv' }),
  };

  const nextSets = {};
  const stats = { champions: 0, sv: 0, generated: 0, errors: [] };

  for (let index = 0; index < pokemonData.pokemon.length; index++) {
    const pokemon = pokemonData.pokemon[index];
    const megaItems = megaItemCandidates(pokemon.name, basicsByGen);
    const baseName = baseNameForMega(pokemon.name);
    try {
      const championsPayload = await rpc('dump-pokemon', { gen: 'champions', alias: alias(pokemon.name), language: 'en' });
      const championsBasePayload = baseName === pokemon.name
        ? championsPayload
        : await rpc('dump-pokemon', { gen: 'champions', alias: alias(baseName), language: 'en' });
      const championsSets = matchingSets(flattenStrategies(championsPayload), pokemon.name, megaItems);
      const championsBaseSets = baseName === pokemon.name ? [] : matchingSets(flattenStrategies(championsBasePayload), pokemon.name, megaItems);
      const allChampionsSets = [...championsSets, ...championsBaseSets];
      if (allChampionsSets.length) {
        nextSets[pokemon.name] = ensureUniqueSetIds(allChampionsSets.map((set) => toLocalSet(set, 'champions')));
        stats.champions += nextSets[pokemon.name].length;
      } else {
        const svPayload = await rpc('dump-pokemon', { gen: 'sv', alias: alias(pokemon.name), language: 'en' });
        const svBasePayload = baseName === pokemon.name
          ? svPayload
          : await rpc('dump-pokemon', { gen: 'sv', alias: alias(baseName), language: 'en' });
        const svSets = matchingSets(flattenStrategies(svPayload), pokemon.name, megaItems);
        const svBaseSets = baseName === pokemon.name ? [] : matchingSets(flattenStrategies(svBasePayload), pokemon.name, megaItems);
        const allSvSets = [...svSets, ...svBaseSets];
        if (allSvSets.length) {
          nextSets[pokemon.name] = ensureUniqueSetIds(allSvSets.map((set) => toLocalSet(set, 'sv')));
          stats.sv += nextSets[pokemon.name].length;
        } else {
          nextSets[pokemon.name] = [generatedSet(pokemon, oldMovesetsData.sets?.[pokemon.name])];
          stats.generated += 1;
        }
      }
    } catch (error) {
      stats.errors.push({ name: pokemon.name, error: error.message });
      nextSets[pokemon.name] = [generatedSet(pokemon, oldMovesetsData.sets?.[pokemon.name])];
      stats.generated += 1;
    }

    if ((index + 1) % 30 === 0) {
      console.error(`Processed ${index + 1}/${pokemonData.pokemon.length}`);
      await sleep(120);
    }
  }

  const moveNames = collectMoveNames(nextSets);
  const moveDetails = { ...(oldMovesData.moves || {}) };
  for (const gen of ['champions', 'sv']) {
    for (const move of basicsByGen[gen].moves || []) {
      if (moveNames.has(move.name) && !moveDetails[move.name]) {
        moveDetails[move.name] = toMoveDetails(move);
      }
    }
  }

  const generatedAt = new Date().toISOString().slice(0, 10);
  const movesetsOut = {
    generatedAt,
    sources: SOURCE_LIST,
    note: 'Moveset database met bronprioriteit: Smogon Champions, daarna Smogon Scarlet/Violet, daarna lokale heuristiek.',
    stats,
    sets: Object.fromEntries(Object.entries(nextSets).sort(([a], [b]) => a.localeCompare(b))),
  };
  const movesOut = {
    generatedAt,
    sources: SOURCE_LIST.filter((source) => source.id !== SOURCE_IDS.generated),
    note: 'Offline move reference for displayed sets. Champions move data is preferred; SV fills fallback-only moves.',
    moves: Object.fromEntries(Object.entries(moveDetails).sort(([a], [b]) => a.localeCompare(b))),
  };

  await fs.writeFile(MOVESETS_PATH, `${JSON.stringify(movesetsOut, null, 2)}\n`);
  await fs.writeFile(MOVES_PATH, `${JSON.stringify(movesOut, null, 2)}\n`);
  console.error(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
