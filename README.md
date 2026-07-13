# Champions Builder

Static, offline-first web app for exploring Pokemon Champions, building a roster of six and scanning team/matchup trade-offs.

## Product contract

Champions Builder is a decision-support tool for personal team exploration. It is not a full battle engine and does not calculate statistical win probabilities. Matchup indices and planner scores are deterministic heuristics based on types, stats, selected sets, local threat data and fixed weights.

The local data distinguishes three provenance levels:

- Smogon Champions sets;
- Scarlet/Violet sets adjusted to Champions-legal moves;
- locally generated fallback sets.

The bundled regulation metadata is explicitly an unverified local seed. Always check the active official Pokemon Champions regulation before competitive use. No telemetry, account or runtime backend is used; teams and custom sets remain in browser `localStorage` unless the user exports a JSON backup.

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

This includes planner, battle, persistence, storage, data-schema, sprite-integrity and UI-contract regression tests.

Serve the app over HTTP (optional; direct file open works too):

```sh
npm run serve
```

## Data pipeline

Regenerate the Champions data from Smogon/Serebii, audit it and rebuild all derived assets:

```sh
npm run data:sync
```

Audit the generated data:

```sh
npm run audit:data
```

Sync is fail-closed: upstream errors, missing learnsets, schema violations, illegal moves or unexpected empty records stop the command before generated data is published.

## Deployment

CI uses least-privilege permissions, pinned GitHub Actions and runs build, generated-output drift, data audit and tests. A push to `main` packages only the required production assets (without a sourcemap) and the deploy job publishes that verified artifact to GitHub Pages. Configure Pages to use **GitHub Actions** and protect `main` with the `verify` check before relying on this gate.

The `.command` and `.bat` launchers are optional helpers that open the app through a loopback-only local HTTP server.

See [SECURITY.md](SECURITY.md) for trust boundaries and [NOTICE.md](NOTICE.md) for third-party source and trademark notes.
