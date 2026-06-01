import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const APP_PATH = path.join(ROOT, 'app.js');

async function main() {
  const [appSource, pokemon, movesets, moves, meta] = await Promise.all([
    fs.readFile(APP_PATH, 'utf8'),
    fs.readFile(path.join(ROOT, 'data/champions-pokemon.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-movesets.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-moves.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/champions-meta.json'), 'utf8').then(JSON.parse),
  ]);

  const embedded = JSON.stringify({ pokemon, movesets, moves, meta });
  const marker = 'const EMBEDDED_CHAMPIONS_LOCAL_DATA = ';
  const start = appSource.indexOf(marker);
  if (start === -1) throw new Error('EMBEDDED_CHAMPIONS_LOCAL_DATA marker not found in app.js');

  const rest = appSource.slice(start + marker.length);
  let depth = 0;
  let end = 0;
  for (let index = 0; index < rest.length; index++) {
    const char = rest[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  if (!end) throw new Error('Could not find end of embedded data in app.js');

  const nextSource = `${appSource.slice(0, start + marker.length)}${embedded};${appSource.slice(start + marker.length + end + 1)}`;
  await fs.writeFile(APP_PATH, nextSource);
  console.error(`Embedded local data into app.js (${pokemon.pokemon.length} pokemon, ${Object.keys(movesets.sets).length} moveset entries)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
