import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, 'app.bundle.js');

const MODULES = [
  { file: 'modules/team-analysis.js', namespace: '__teamAnalysis' },
  { file: 'modules/constants.js', namespace: '__constants', imports: [
    ['SP_STAT_LIMIT', '__teamAnalysis.SP_STAT_LIMIT'],
    ['SP_TOTAL_LIMIT', '__teamAnalysis.SP_TOTAL_LIMIT'],
    ['STAT_LABELS', '__teamAnalysis.STAT_LABELS'],
    ['TYPES', '__teamAnalysis.TYPES']
  ] },
  { file: 'modules/data.js', namespace: '__data' },
  { file: 'modules/movesets.js', namespace: '__movesets', imports: [
    ['fetchJson', '__data.fetchJson'],
    ['localData', '__data.localData'],
    ['MOVE_LEARNSET_BLOCKLIST', '__constants.MOVE_LEARNSET_BLOCKLIST'],
    ['MOVE_REPLACEMENTS', '__constants.MOVE_REPLACEMENTS'],
    ['baseSpeciesLabel', '__teamAnalysis.baseSpeciesLabel']
  ] },
  { file: 'modules/storage.js', namespace: '__storage' },
  { file: 'modules/rendering.js', namespace: '__rendering' },
  { file: 'modules/ui-events.js', namespace: '__uiEvents' },
  { file: 'modules/battle-simulation.js', namespace: '__battleSimulation', imports: [
    ['baseSpecies', '__teamAnalysis.baseSpecies'],
    ['defensiveMultiplier', '__teamAnalysis.defensiveMultiplier'],
    ['pokemonUsesMegaSlot', '__teamAnalysis.pokemonUsesMegaSlot']
  ] }
];

const APP_ALIASES = `
const { loadPokemonData, officialPokemon } = __data;
const fetchChampionsMeta = __data.loadChampionsMeta;
const fetchMovesets = __movesets.loadMovesets;
const pureIsMoveBlockedForPokemon = __movesets.isMoveBlockedForPokemon;
const pureValidateMoveSlots = __movesets.validateMoveSlots;
const {
  BATTLE_FORMATS,
  ITEM_OPTIONS,
  NATURE_OPTIONS,
  RESTRICTED_MOVE_LEARNERS,
  SP_PRESETS,
  SP_STAT_LIMIT,
  SP_TOTAL_LIMIT,
  STAT_LABELS,
  TEAM_STYLES,
  TYPE_COLORS,
  TYPES
} = __constants;
const { renderApp, renderWithoutScrollJump } = __rendering;
const { readJsonStorage, STORAGE_KEYS, writeJsonStorage } = __storage;
const bindUiEvents = __uiEvents.bindEvents;
const pureGenerateOpponentTeam = __battleSimulation.generateOpponentTeam;
const { simulateBattle, selectedBattleMembers } = __battleSimulation;
const pureBaseSpecies = __teamAnalysis.baseSpecies;
const pureBaseSpeciesLabel = __teamAnalysis.baseSpeciesLabel;
const pureDefensiveMultiplier = __teamAnalysis.defensiveMultiplier;
const pureIsMega = __teamAnalysis.isMega;
const pureMegaBaseFromItem = __teamAnalysis.megaBaseFromItem;
const pureNormalizeSpSpread = __teamAnalysis.normalizeSpSpread;
const pureNormalizeSpValues = __teamAnalysis.normalizeSpValues;
const pureParseSp = __teamAnalysis.parseSp;
const purePokemonUsesMegaSlot = __teamAnalysis.pokemonUsesMegaSlot;
const pureSpPartsFromValues = __teamAnalysis.spPartsFromValues;
const pureTeamLegality = __teamAnalysis.teamLegality;
const pureTeamTypeSummary = __teamAnalysis.teamTypeSummary;
const pureTrainedStatValue = __teamAnalysis.trainedStatValue;
`;

function stripImports(source) {
  const lines = source.split('\n');
  const output = [];
  let skippingImport = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!skippingImport && trimmed.startsWith('import ')) {
      skippingImport = !trimmed.endsWith(';');
      continue;
    }
    if (skippingImport) {
      skippingImport = !trimmed.endsWith(';');
      continue;
    }
    output.push(line);
  }

  return output.join('\n');
}

function stripExports(source) {
  return source
    .replace(/^export\s+\{[^}]*\};\n?/gm, '')
    .replace(/^export\s+/gm, '');
}

function exportedNames(source) {
  const names = new Set();
  for (const match of source.matchAll(/^export\s+(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(/^export\s+\{([^}]*)\};/gm)) {
    match[1].split(',').forEach((part) => {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    });
  }
  return [...names];
}

function importPrelude(imports = []) {
  if (!imports.length) return '';
  return `${imports.map(([name, expression]) => `const ${name} = ${expression};`).join('\n')}\n`;
}

function transformModule({ source, file, namespace, imports }) {
  const body = stripExports(stripImports(source)).trim();
  const exports = exportedNames(source);
  return `// ${file}\nconst ${namespace} = (() => {\n${importPrelude(imports)}${body}\nreturn { ${exports.join(', ')} };\n})();\n`;
}

function transformApp(source) {
  return `// app.js\n${APP_ALIASES}\n${stripExports(stripImports(source)).trim()}\n`;
}

async function main() {
  const chunks = [];
  for (const moduleConfig of MODULES) {
    const source = await fs.readFile(path.join(ROOT, moduleConfig.file), 'utf8');
    chunks.push(transformModule({ source, ...moduleConfig }));
  }

  const appSource = await fs.readFile(path.join(ROOT, 'app.js'), 'utf8');
  chunks.push(transformApp(appSource));

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, `${chunks.join('\n')}\n`);
  console.error(`Wrote ${path.relative(ROOT, OUT_FILE)} from ${MODULES.length + 1} source files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
