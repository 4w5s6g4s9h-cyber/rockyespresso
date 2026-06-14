# Champions Builder

Static web app for building Pokemon Champions teams.

Open `index.html` locally to use the app directly. The app includes a bundled browser script and embedded local data, so double-clicking `index.html` loads the Pokemon without starting a local server first.

The `.command` and `.bat` launchers are optional helpers if you prefer to open the app through a local HTTP server. For local development, you can also run a static server from this folder:

```sh
python3 -m http.server 8000
```

Rebuild the direct-open browser bundle after changing app modules with:

```sh
node scripts/build-browser-bundle.mjs
```

Run the lightweight logic tests with:

```sh
node tests/team-analysis.test.mjs
```
