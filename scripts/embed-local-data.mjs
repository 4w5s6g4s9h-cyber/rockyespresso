import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const LOCAL_DATA_PATH = path.join(ROOT, 'data/local-data.js');

async function main() {
  const [pokemon, movesets, moves, learnsets, meta] = await Promise.all([
    fs.readFile(path.join(ROOT, 'data/champions-pokemon.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-movesets.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-moves.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-learnsets.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-meta.json'), 'utf8').then(JSON.parse),
  ]);

  const embedded = JSON.stringify({ pokemon, movesets, moves, learnsets, meta });
  await fs.writeFile(LOCAL_DATA_PATH, `window.CHAMPIONS_LOCAL_DATA = ${embedded};\n`);
  console.error(`Wrote optional local fallback data (${pokemon.pokemon.length} pokemon, ${Object.keys(movesets.sets).length} moveset entries)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
