const ASSET_OVERRIDES = {
  "Tauros-Paldea-Aqua": "tauros.png",
  "Tauros-Paldea-Blaze": "tauros.png",
  "Tauros-Paldea-Combat": "tauros.png",
  "Meowstic-M": "meowstic-f.png",
  "Meowstic-M-Mega": "meowstic-f.png",
  "Meowstic-F-Mega": "meowstic-f.png",
  "Castform-Rainy": "castform.png",
  "Castform-Sunny": "castform.png",
  "Castform-Snowy": "castform.png",
  "Aegislash-Blade": "aegislash.png",
  "Kommo-o": "fallback.svg",
  "Mr. Rime": "fallback.svg"
};

export function spriteId(name) {
  return String(name).toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace("-mega-x", "-megax")
    .replace("-mega-y", "-megay")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function spritePath(name) {
  return `assets/sprites/${ASSET_OVERRIDES[name] ?? `${spriteId(name)}.png`}`;
}
