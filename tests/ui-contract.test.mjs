import assert from "node:assert/strict";
import fs from "node:fs/promises";

const [html, app] = await Promise.all([
  fs.readFile(new URL("../index.html", import.meta.url), "utf8"),
  fs.readFile(new URL("../app.js", import.meta.url), "utf8")
]);

assert.match(html, /Content-Security-Policy/);
assert.match(html, /role="tablist"/);
assert.match(html, /role="tab" aria-controls="builderView"/);
assert.match(html, /Bouw het best scorende team/);
assert.doesNotMatch(`${html}\n${app}`, /geschatte winstkans/i);
assert.match(app, /battleSim\.append\(createBattleHeader\(\), createBattleQuickActions\(\)\)/);
assert.doesNotMatch(app, /if \(!filtered\.length[\s\S]{0,240}return \[\.\.\.state\.pokemon\]/);

console.log("ui contract tests passed");
