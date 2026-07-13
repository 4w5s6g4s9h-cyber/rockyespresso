import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spritePath } from "../modules/sprites.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(await fs.readFile(path.join(root, "data/champions-pokemon.json"), "utf8"));
const missing = [];
for (const pokemon of data.pokemon) {
  try {
    await fs.access(path.join(root, spritePath(pokemon.name)));
  } catch {
    missing.push({ name: pokemon.name, path: spritePath(pokemon.name) });
  }
}

assert.deepEqual(missing, [], `Ontbrekende sprite-assets: ${JSON.stringify(missing)}`);
console.log("sprite asset tests passed");
