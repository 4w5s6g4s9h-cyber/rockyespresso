import fs from 'node:fs/promises';
import path from 'node:path';
import esbuild from 'esbuild';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.pages');

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(path.join(OUT, 'data'), { recursive: true });
await fs.mkdir(path.join(OUT, 'dist'), { recursive: true });

await Promise.all([
  fs.copyFile(path.join(ROOT, 'index.html'), path.join(OUT, 'index.html')),
  fs.copyFile(path.join(ROOT, 'styles.css'), path.join(OUT, 'styles.css')),
  fs.copyFile(path.join(ROOT, 'data', 'local-data.js'), path.join(OUT, 'data', 'local-data.js')),
  fs.cp(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true }),
]);

await esbuild.build({
  entryPoints: [path.join(ROOT, 'app.js')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  sourcemap: false,
  minify: true,
  outfile: path.join(OUT, 'dist', 'app.bundle.js'),
  logLevel: 'info',
});

console.error(`Prepared production Pages artifact in ${OUT}`);
