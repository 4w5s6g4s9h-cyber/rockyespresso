import esbuild from 'esbuild';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'dist', 'app.bundle.js');
const production = process.argv.includes('--production');

const result = await esbuild.build({
  entryPoints: [path.join(ROOT, 'app.js')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  sourcemap: production ? false : 'linked',
  minify: production,
  outfile: OUT_FILE,
  logLevel: 'info'
});

if (result.errors.length) {
  process.exit(1);
}
