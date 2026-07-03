# Champions Builder

Static web app for building Pokemon Champions teams.

Open `index.html` locally to use the app directly. The app includes a bundled browser script (`dist/app.bundle.js`) and embedded local data (`data/local-data.js`), so double-clicking `index.html` loads the Pokemon without starting a local server first.

## Development

Requires Node.js 22+. Install dev dependencies once:

```sh
npm install
```

The source lives in `app.js` (stateful UI orchestration) plus `modules/` (pure, DOM-free logic that `app.js` imports and wraps with caching/state). Tests import directly from `modules/`.

Rebuild the browser bundle and embedded data after changing `app.js` or `modules/`:

```sh
npm run build
```

The build uses esbuild and writes `dist/app.bundle.js` (+ sourcemap). CI fails when `dist/` or `data/local-data.js` is out of sync with the sources, so always commit the rebuilt output together with source changes.

Run the tests:

```sh
npm test
```

Serve the app over HTTP (optional; direct file open works too):

```sh
npm run serve
```

## Data pipeline

Regenerate the Champions data from Smogon and re-embed it:

```sh
npm run data:sync
```

Audit the generated data:

```sh
npm run audit:data
```

The `.command` and `.bat` launchers are optional helpers that open the app through a local HTTP server.
