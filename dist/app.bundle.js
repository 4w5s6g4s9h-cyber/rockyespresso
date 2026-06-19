// modules/team-analysis.js
const __teamAnalysis = (() => {
const TYPE_CHART = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 }
};

const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
];

const STAT_LABELS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
const SP_TOTAL_LIMIT = 66;
const SP_STAT_LIMIT = 32;
const BATTLE_STAT_LEVEL = 50;
const PERFECT_IV = 31;

const NATURE_MODIFIERS = {
  Lonely: { up: "Atk", down: "Def" },
  Brave: { up: "Atk", down: "Spe" },
  Adamant: { up: "Atk", down: "SpA" },
  Naughty: { up: "Atk", down: "SpD" },
  Bold: { up: "Def", down: "Atk" },
  Relaxed: { up: "Def", down: "Spe" },
  Impish: { up: "Def", down: "SpA" },
  Lax: { up: "Def", down: "SpD" },
  Timid: { up: "Spe", down: "Atk" },
  Hasty: { up: "Spe", down: "Def" },
  Jolly: { up: "Spe", down: "SpA" },
  Naive: { up: "Spe", down: "SpD" },
  Modest: { up: "SpA", down: "Atk" },
  Mild: { up: "SpA", down: "Def" },
  Quiet: { up: "SpA", down: "Spe" },
  Rash: { up: "SpA", down: "SpD" },
  Calm: { up: "SpD", down: "Atk" },
  Gentle: { up: "SpD", down: "Def" },
  Sassy: { up: "SpD", down: "Spe" },
  Careful: { up: "SpD", down: "SpA" }
};

const MEGA_STONE_BASES = {
  Absolite: "Absol",
  Aerodactylite: "Aerodactyl",
  Aggronite: "Aggron",
  Altarianite: "Altaria",
  Audinite: "Audino",
  Beedrillite: "Beedrill",
  Cameruptite: "Camerupt",
  "Charizardite X": "Charizard",
  "Charizardite Y": "Charizard",
  Delphoxite: "Delphox",
  Galladite: "Gallade",
  Garchompite: "Garchomp",
  Gardevoirite: "Gardevoir",
  Gyaradosite: "Gyarados",
  Heracronite: "Heracross",
  Houndoominite: "Houndoom",
  Kangaskhanite: "Kangaskhan",
  Latiasite: "Latias",
  Lopunnite: "Lopunny",
  Manectite: "Manectric",
  Meganiumite: "Meganium",
  Pidgeotite: "Pidgeot",
  Pinsirite: "Pinsir",
  Sablenite: "Sableye",
  Salamencite: "Salamence",
  Scizorite: "Scizor",
  Sharpedonite: "Sharpedo",
  Slowbronite: "Slowbro",
  Steelixite: "Steelix",
  Tyranitarite: "Tyranitar",
  Venusaurite: "Venusaur"
};

function defensiveMultiplier(defenderTypes, attackType, typeChart = TYPE_CHART) {
  return defenderTypes.reduce((multiplier, defenderType) => {
    return multiplier * (typeChart[attackType]?.[defenderType] ?? 1);
  }, 1);
}

function teamTypeSummary(team = [], types = TYPES, typeChart = TYPE_CHART) {
  return types.map((type) => {
    const matchups = team.map((pokemon) => defensiveMultiplier(pokemon.types, type, typeChart));
    return {
      type,
      weak: matchups.filter((value) => value > 1).length,
      resist: matchups.filter((value) => value > 0 && value < 1).length,
      immune: matchups.filter((value) => value === 0).length
    };
  }).sort((a, b) => {
    const riskA = a.weak - a.resist - a.immune;
    const riskB = b.weak - b.resist - b.immune;
    return riskB - riskA || b.weak - a.weak || a.type.localeCompare(b.type);
  });
}

function isMega(pokemonOrName) {
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName?.name;
  return /-Mega(?:-|$)/.test(name ?? "");
}

function megaBaseFromItem(item = "") {
  return MEGA_STONE_BASES[String(item).trim()] ?? "";
}

function pokemonUsesMegaSlot(pokemonOrName, build = {}) {
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName?.name;
  if (isMega(name)) return true;
  const itemBase = megaBaseFromItem(build.item);
  return Boolean(itemBase && itemBase === baseSpecies(name));
}

function baseSpecies(name) {
  return String(name).replace(/-Mega(?:-[XY])?$/, "");
}

function baseSpeciesLabel(name) {
  return baseSpecies(name).replace(/-/g, " ");
}

function maxTeamSize(battleFormat, battleFormats) {
  return battleFormats[battleFormat].maxTeamSize;
}

function teamLegality({ pokemon, team = [], battleFormat, battleFormats, selectedBuild = () => ({}) }) {
  const limit = maxTeamSize(battleFormat, battleFormats);
  if (team.some((member) => member.name === pokemon.name)) {
    return { ok: false, reason: `${pokemon.name} zit al in je team.` };
  }
  if (team.length >= limit) {
    return { ok: false, reason: `Je team is vol. ${battleFormats[battleFormat].label} gebruikt ${limit} Pokémon.` };
  }
  const candidateBuild = selectedBuild(pokemon);
  const candidateUsesMega = pokemonUsesMegaSlot(pokemon, candidateBuild);
  const teamMega = team.find((member) => pokemonUsesMegaSlot(member, selectedBuild(member)));
  if (candidateUsesMega && teamMega) {
    return { ok: false, reason: "Je mag maximaal 1 Mega Pokémon in je team hebben." };
  }
  if (team.some((member) => baseSpecies(member.name) === baseSpecies(pokemon.name))) {
    return { ok: false, reason: `Je hebt al een vorm van ${baseSpeciesLabel(pokemon.name)} in je team.` };
  }
  return { ok: true, reason: "" };
}

function reorderTeam(team = [], fromIndex, toIndex, { lockedNames = [], keepLockedSlotOne = true } = {}) {
  const lastIndex = team.length - 1;
  const from = Math.max(0, Math.min(lastIndex, Number(fromIndex)));
  const to = Math.max(0, Math.min(lastIndex, Number(toIndex)));
  if (!team.length || from === to || !Number.isFinite(from) || !Number.isFinite(to)) {
    return { ok: false, team: [...team], reason: "" };
  }

  const locked = new Set(lockedNames);
  if (keepLockedSlotOne && locked.has(team[0]?.name) && (from === 0 || to === 0)) {
    return { ok: false, team: [...team], reason: `${baseSpeciesLabel(team[0].name)} staat vast in slot 1.` };
  }

  const next = [...team];
  const [member] = next.splice(from, 1);
  next.splice(to, 0, member);
  return { ok: true, team: next, reason: "" };
}

function suggestedPokemon({ pokemon = [], team = [], battleFormat, battleFormats, teamStyle, teamStyles, roleFor, selectedBuild = () => ({}), limit = 3 }) {
  const names = new Set(team.map((member) => member.name));
  const targets = teamStyles[teamStyle].targets;
  const balance = team.reduce((totals, member) => {
    if (member.atk >= member.spa + 15) totals.physical += 1;
    else if (member.spa >= member.atk + 15) totals.special += 1;
    if (member.spe >= 100) totals.fast += 1;
    if (member.hp + member.def + member.spd >= 280) totals.bulky += 1;
    return totals;
  }, { physical: 0, special: 0, fast: 0, bulky: 0 });
  const topWeaknesses = teamTypeSummary(team)
    .filter((item) => item.weak >= 2)
    .map((item) => item.type);

  return pokemon
    .filter((candidate) => !names.has(candidate.name))
    .filter((candidate) => teamLegality({ pokemon: candidate, team, battleFormat, battleFormats }).ok)
    .map((candidate) => {
      let score = 0;
      const reasons = [];
      topWeaknesses.forEach((type) => {
        const multiplier = defensiveMultiplier(candidate.types, type);
        if (multiplier === 0) {
          score += 4;
          reasons.push(`immuun voor ${type}`);
        } else if (multiplier < 1) {
          score += 3;
          reasons.push(`resist ${type}`);
        }
      });
      if (balance.special < targets.special && candidate.spa > candidate.atk) score += 2;
      if (balance.physical < targets.physical && candidate.atk > candidate.spa) score += 2;
      if (balance.fast < targets.fast && candidate.spe >= 100) score += 2;
      if (balance.bulky < targets.bulky && candidate.hp + candidate.def + candidate.spd >= 280) score += 2;
      if (selectedBuild(candidate).status === "generated") score -= 3;
      return { pokemon: candidate, score, reason: reasons.join(" en ") || roleFor(candidate).description };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst)
    .slice(0, limit);
}

function parseSp(spread) {
  const values = Object.fromEntries(STAT_LABELS.map((stat) => [stat, 0]));
  String(spread).split("/").forEach((part) => {
    const match = part.trim().match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/);
    if (match) values[match[2]] = Math.max(0, Math.min(SP_STAT_LIMIT, Number(match[1])));
  });
  return values;
}

function spPartsFromValues(values) {
  return STAT_LABELS
    .map((stat) => [stat, values[stat] ?? 0])
    .filter(([, value]) => value > 0)
    .map(([stat, value]) => `${value} ${stat}`);
}

function normalizeSpValues(values) {
  const capped = Object.fromEntries(STAT_LABELS.map((stat) => [stat, Math.max(0, Math.min(SP_STAT_LIMIT, values[stat] ?? 0))]));
  const total = STAT_LABELS.reduce((sum, stat) => sum + capped[stat], 0);
  if (total === 0 || total === SP_TOTAL_LIMIT) return capped;

  const scaled = STAT_LABELS.map((stat) => {
    const exact = capped[stat] * SP_TOTAL_LIMIT / total;
    const value = Math.min(SP_STAT_LIMIT, Math.floor(exact));
    return { stat, exact, value, remainder: exact - value };
  });
  let used = scaled.reduce((sum, item) => sum + item.value, 0);
  scaled
    .sort((a, b) => b.remainder - a.remainder || STAT_LABELS.indexOf(a.stat) - STAT_LABELS.indexOf(b.stat))
    .forEach((item) => {
      if (item.exact > 0 && used + 1 <= SP_TOTAL_LIMIT && item.value + 1 <= SP_STAT_LIMIT) {
        item.value += 1;
        used += 1;
      }
    });

  if (used < SP_TOTAL_LIMIT) {
    scaled
      .sort((a, b) => STAT_LABELS.indexOf(a.stat) - STAT_LABELS.indexOf(b.stat))
      .forEach((item) => {
        const available = SP_STAT_LIMIT - item.value;
        const add = Math.min(available, SP_TOTAL_LIMIT - used);
        item.value += add;
        used += add;
      });
  }

  return Object.fromEntries(scaled.map(({ stat, value }) => [stat, value]));
}

function convertEvSpreadToSpSpread(spread) {
  const parts = String(spread).split("/").map((part) => part.trim()).filter(Boolean);
  const parsed = parts.map((part) => {
    const match = part.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/);
    return match ? { value: Number(match[1]), stat: match[2] } : null;
  }).filter(Boolean);
  if (!parsed.some(({ value }) => value > SP_STAT_LIMIT) && parsed.reduce((sum, { value }) => sum + value, 0) <= SP_TOTAL_LIMIT) {
    return spread;
  }
  return parsed
    .map(({ value, stat }) => `${Math.max(0, Math.min(SP_STAT_LIMIT, Math.round(value * SP_STAT_LIMIT / 252)))} ${stat}`)
    .join(" / ");
}

function normalizeSpSpread(spread) {
  const values = normalizeSpValues(parseSp(convertEvSpreadToSpSpread(spread)));
  return spPartsFromValues(values).join(" / ");
}

function trainedStatValue(base, sp, stat = "HP", nature = "", level = BATTLE_STAT_LEVEL) {
  const clampedBase = Math.max(1, Number(base) || 1);
  const clampedSp = Math.max(0, Math.min(SP_STAT_LIMIT, Number(sp) || 0));
  const ev = Math.round(clampedSp * 252 / SP_STAT_LIMIT);
  const evContribution = Math.floor(ev / 4);
  const baseValue = Math.floor(((2 * clampedBase + PERFECT_IV + evContribution) * level) / 100);
  if (stat === "HP") return baseValue + level + 10;
  return Math.floor((baseValue + 5) * natureMultiplier(stat, nature));
}

function natureMultiplier(stat, nature = "") {
  const selectedNature = String(nature)
    .split("/")
    .map((part) => part.trim())
    .find((part) => NATURE_MODIFIERS[part]);
  const modifier = NATURE_MODIFIERS[selectedNature];
  if (!modifier || modifier.up === modifier.down || stat === "HP") return 1;
  if (modifier.up === stat) return 1.1;
  if (modifier.down === stat) return 0.9;
  return 1;
}
return { TYPE_CHART, TYPES, STAT_LABELS, SP_TOTAL_LIMIT, SP_STAT_LIMIT, BATTLE_STAT_LEVEL, PERFECT_IV, MEGA_STONE_BASES, defensiveMultiplier, teamTypeSummary, isMega, megaBaseFromItem, pokemonUsesMegaSlot, baseSpecies, baseSpeciesLabel, maxTeamSize, teamLegality, reorderTeam, suggestedPokemon, parseSp, spPartsFromValues, normalizeSpValues, convertEvSpreadToSpSpread, normalizeSpSpread, trainedStatValue, natureMultiplier };
})();

// modules/constants.js
const __constants = (() => {
const SP_STAT_LIMIT = __teamAnalysis.SP_STAT_LIMIT;
const SP_TOTAL_LIMIT = __teamAnalysis.SP_TOTAL_LIMIT;
const STAT_LABELS = __teamAnalysis.STAT_LABELS;
const TYPES = __teamAnalysis.TYPES;
const TYPE_COLORS = {
  Normal: "#7d8390",
  Fire: "#e45b36",
  Water: "#2677c9",
  Electric: "#d49a19",
  Grass: "#3b9a54",
  Ice: "#2f9bb0",
  Fighting: "#b8483b",
  Poison: "#8e55b4",
  Ground: "#b67835",
  Flying: "#6c85c6",
  Psychic: "#d94f83",
  Bug: "#7b9b2d",
  Rock: "#9a8143",
  Ghost: "#5f5aa3",
  Dragon: "#5863cc",
  Dark: "#55505e",
  Steel: "#638392",
  Fairy: "#d466a7"
};

const TEAM_STYLES = {
  balanced: {
    label: "Balanced",
    description: "Mix van aanval, snelheid en verdedigende wissels. Dit is de beste start voor beginners.",
    targets: { physical: 2, special: 2, fast: 1, bulky: 2 }
  },
  offense: {
    label: "Offense",
    description: "Veel druk en snelheid. Je accepteert minder defensieve veiligheid voor meer tempo.",
    targets: { physical: 2, special: 2, fast: 3, bulky: 1 }
  },
  bulky: {
    label: "Bulky",
    description: "Steviger team dat vaker veilig kan wisselen. Minder explosief, maar vergevingsgezinder.",
    targets: { physical: 1, special: 1, fast: 1, bulky: 4 }
  },
  rain: {
    label: "Rain",
    description: "Waterdruk met Drizzle en snelle rain-abusers. Sterk tempo, maar let op Electric en Grass.",
    targets: { physical: 2, special: 2, fast: 2, bulky: 1 }
  },
  sun: {
    label: "Sun",
    description: "Drought, Fire-druk en Chlorophyll-opties. Goed voor offensieve teams met duidelijke weather-kern.",
    targets: { physical: 2, special: 2, fast: 2, bulky: 1 }
  },
  trickroom: {
    label: "Trick Room",
    description: "Langzame, sterke Pokémon die onder Trick Room eerst bewegen. Vooral interessant voor Double 4v4.",
    targets: { physical: 2, special: 2, fast: 0, bulky: 3 }
  },
  doublesupport: {
    label: "Double support",
    description: "Support, Intimidate en speed-control voor Double 4v4. Minder solo, meer team-synergie.",
    targets: { physical: 1, special: 1, fast: 2, bulky: 3 }
  },
  hyperoffense: {
    label: "Hyper Offense",
    description: "Zes slots met tempo, setup en directe druk. Minder veilig, maar ideaal om momentum te houden.",
    targets: { physical: 3, special: 2, fast: 4, bulky: 0 }
  },
  voltturn: {
    label: "VoltTurn",
    description: "Pivot-team dat met U-turn/Volt Switch en snelle druk steeds goede matchups zoekt.",
    targets: { physical: 2, special: 2, fast: 2, bulky: 2 }
  },
  sand: {
    label: "Sand",
    description: "Sand Stream, Rock/Ground/Steel-druk en solide switch-ins rond chip damage.",
    targets: { physical: 3, special: 1, fast: 1, bulky: 3 }
  },
  snow: {
    label: "Snow",
    description: "Ice-druk met defensieve rugdekking. Let extra op Fire, Steel en Rock.",
    targets: { physical: 2, special: 2, fast: 2, bulky: 2 }
  },
  stall: {
    label: "Stall",
    description: "Zoveel mogelijk veilige antwoorden, status en recovery. Winnen via controle en chip.",
    targets: { physical: 1, special: 1, fast: 0, bulky: 5 }
  },
  antiMeta: {
    label: "Anti-meta",
    description: "Team dat vooral populaire threats checkt en minder op een vast archetype leunt.",
    targets: { physical: 2, special: 2, fast: 2, bulky: 3 }
  }
};

const BATTLE_FORMATS = {
  single3: {
    label: "Single 3v3",
    maxTeamSize: 6,
    selectionSize: 3,
    description: "Bouw zes Pokémon en kies bij Team Preview drie Pokémon voor het 3v3-gevecht."
  },
  double4: {
    label: "Double 4v4",
    maxTeamSize: 6,
    selectionSize: 4,
    description: "Bouw zes Pokémon en kies bij Team Preview vier Pokémon voor het 4v4-gevecht."
  }
};

const ITEM_OPTIONS = [
  "Aerodactylite", "Black Glasses", "Charizardite Y", "Choice Band", "Choice Scarf", "Choice Specs",
  "Covert Cloak", "Damp Rock", "Expert Belt", "Focus Sash", "Heavy-Duty Boots", "Leftovers",
  "Life Orb", "Lum Berry", "Mega Stone", "Mystic Water", "Rocky Helmet", "Safety Goggles",
  "Sitrus Berry", "Spell Tag", "Tyranitarite", "Venusaurite", "White Herb", "Yache Berry"
];

const NATURE_OPTIONS = [
  "Adamant", "Jolly", "Modest", "Timid", "Bold", "Impish", "Calm", "Careful",
  "Quiet", "Naive", "Hasty", "Rash", "Mild"
];

const SP_PRESETS = [
  "2 HP / 32 Atk / 32 Spe",
  "2 HP / 32 SpA / 32 Spe",
  "32 HP / 32 Atk / 2 SpD",
  "32 HP / 32 Def / 2 SpD",
  "32 HP / 2 Def / 32 SpD",
  "32 Atk / 2 SpD / 32 Spe",
  "32 HP / 20 Def / 14 Spe",
  "32 HP / 18 Def / 16 SpD",
  "2 HP / 32 Atk / 32 SpA",
  "32 HP / 32 SpA / 2 SpD",
  "32 HP / 32 Spe / 2 Def"
];

const RESTRICTED_MOVE_LEARNERS = {
  "Armor Cannon": ["Armarouge"],
  "Bolt Strike": ["Victini", "Zekrom"],
  "Electro Drift": ["Miraidon"],
  "Fleur Cannon": ["Magearna"],
  "Glaive Rush": ["Baxcalibur"],
  "Moongeist Beam": ["Lunala", "Necrozma-Dawn-Wings"],
  "Precipice Blades": ["Groudon"],
  "Psycho Boost": ["Deoxys", "Deoxys-Attack", "Deoxys-Defense", "Deoxys-Speed"],
  "Sunsteel Strike": ["Solgaleo", "Necrozma-Dusk-Mane"],
  "V-create": ["Victini"]
};

const MOVE_LEARNSET_BLOCKLIST = {
  Toxic: ["Steelix"]
};

const MOVE_REPLACEMENTS = {
  Toxic: {
    Steelix: ["Protect", "Dragon Tail", "Heavy Slam"]
  }
};
return { TYPE_COLORS, TEAM_STYLES, BATTLE_FORMATS, ITEM_OPTIONS, NATURE_OPTIONS, SP_PRESETS, RESTRICTED_MOVE_LEARNERS, MOVE_LEARNSET_BLOCKLIST, MOVE_REPLACEMENTS, SP_STAT_LIMIT, SP_TOTAL_LIMIT, STAT_LABELS, TYPES };
})();

// modules/data.js
const __data = (() => {
function localData() {
  return window.CHAMPIONS_LOCAL_DATA ?? null;
}

let localDataScriptPromise = null;

async function ensureLocalData() {
  if (localData()) return localData();
  localDataScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "data/local-data.js";
    script.onload = () => localData() ? resolve(localData()) : reject(new Error("Lokale fallback-data is leeg."));
    script.onerror = () => reject(new Error("Lokale fallback-data kon niet worden geladen."));
    document.head.append(script);
  });
  return localDataScriptPromise;
}

async function fetchJson(path, errorLabel) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${errorLabel} (${response.status})`);
    return response.json();
  } catch (error) {
    const fallback = await ensureLocalData().catch(() => null);
    if (fallback) return fallbackDataForPath(fallback, path);
    throw error;
  }
}

async function loadPokemonData() {
  if (localData()?.pokemon) return normalizePokemonDataset(localData().pokemon);
  try {
    return normalizePokemonDataset(await fetchJson("data/champions-pokemon.json", "Dataset kon niet worden geladen"));
  } catch (error) {
    return normalizePokemonDataset((await ensureLocalData()).pokemon);
  }
}

async function loadChampionsMeta() {
  const data = localData()?.meta
    ?? await fetchJson("data/champions-meta.json", "Champions-meta kon niet worden geladen");
  return {
    formats: data.formats ?? {},
    archetypes: data.archetypes ?? [],
    threats: data.threats ?? []
  };
}

function officialPokemon(pokemon = []) {
  return normalizePokemonList(pokemon).filter((item) => item.isNonstandard !== "CAP");
}

function fallbackDataForPath(fallback, path) {
  if (path.includes("champions-pokemon")) return fallback.pokemon;
  if (path.includes("champions-movesets")) return fallback.movesets;
  if (path.includes("champions-learnsets")) return fallback.learnsets;
  if (path.includes("champions-moves")) return fallback.moves;
  if (path.includes("champions-meta")) return fallback.meta;
  throw new Error(`Geen fallback-data voor ${path}.`);
}

function normalizePokemonDataset(data) {
  if (Array.isArray(data)) return { pokemon: data };
  if (Array.isArray(data?.pokemon)) return data;
  return { pokemon: [] };
}

function normalizePokemonList(pokemon) {
  if (Array.isArray(pokemon)) return pokemon;
  if (Array.isArray(pokemon?.pokemon)) return pokemon.pokemon;
  return [];
}
return { localData, ensureLocalData, fetchJson, loadPokemonData, loadChampionsMeta, officialPokemon };
})();

// modules/movesets.js
const __movesets = (() => {
const fetchJson = __data.fetchJson;
const localData = __data.localData;
const MOVE_LEARNSET_BLOCKLIST = __constants.MOVE_LEARNSET_BLOCKLIST;
const MOVE_REPLACEMENTS = __constants.MOVE_REPLACEMENTS;
const baseSpeciesLabel = __teamAnalysis.baseSpeciesLabel;
async function loadMovesets({ pokemon, generatedMovePlan }) {
  try {
    const [movesetData, moveData, learnsetData] = localData()
      ? [localData().movesets, localData().moves, localData().learnsets]
      : await Promise.all([
        fetchJson("data/champions-movesets.json", "Movesets konden niet worden geladen"),
        fetchJson("data/champions-moves.json", "Move-details konden niet worden geladen"),
        fetchJson("data/champions-learnsets.json", "Learnsets konden niet worden geladen")
      ]);

    const movesets = movesetData.sets ?? {};
    const movesetSources = Object.fromEntries((movesetData.sources ?? []).map((source) => [source.id, source]));
    const moveDetails = moveData.moves ?? {};
    const learnsets = learnsetData?.learnsets ?? {};

    enrichGeneratedMovesets({ movesets, pokemon, generatedMovePlan });
    enrichChampionsCompatibility({ movesets, pokemon, moveDetails, learnsets, generatedMovePlan });
    return { movesets, movesetSources, moveDetails, learnsets };
  } catch (error) {
    console.warn("Moveset database niet geladen; de app gebruikt fallback-richtlijnen.", error);
    return { movesets: {}, movesetSources: {}, moveDetails: {}, learnsets: {} };
  }
}

function enrichChampionsCompatibility({ movesets, pokemon, moveDetails, learnsets, generatedMovePlan }) {
  for (const [name, sets] of Object.entries(movesets)) {
    const matchingPokemon = pokemon.find((item) => item.name === name);
    sets.forEach((set) => {
      const fallbackMoves = matchingPokemon ? generatedMovePlan(matchingPokemon, generatedModeFromSet(set, matchingPokemon)) : [];
      set.championsCompatibility = validateMoveSlots(name, set.moves, moveDetails, { fallbackMoves, learnsets });
    });
  }
}

function validateMoveSlots(pokemonName, moves = [], moveDetails = {}, { fallbackMoves = [], learnsets = {} } = {}) {
  const issues = [];
  const suggestedMoves = [];
  const replacementMoves = [];
  moves.forEach((slot) => {
    const options = splitMoveOptions(slot);
    const allowedOptions = options.filter((move) => !isMoveBlockedForPokemon(pokemonName, move, learnsets));
    const blockedOptions = options.filter((move) => isMoveBlockedForPokemon(pokemonName, move, learnsets));

    blockedOptions.forEach((move) => {
      issues.push({
        move,
        reason: `${displayPokemonName(pokemonName)} kan ${move} niet leren in Champions.`
      });
    });

    if (allowedOptions.length) {
      suggestedMoves.push(allowedOptions.join(" / "));
      return;
    }

    const replacements = replacementMovesForSlot(pokemonName, slot, moveDetails, suggestedMoves, fallbackMoves, moves, learnsets);
    const replacement = replacements[0] ?? "";
    if (replacement) replacementMoves.push(replacement);
    replacements.slice(1).forEach((move) => {
      if (!replacementMoves.includes(move)) replacementMoves.push(move);
    });
    suggestedMoves.push(replacement);
  });
  return {
    ok: issues.length === 0,
    issues,
    suggestedMoves: suggestedMoves.filter(Boolean).slice(0, 4),
    replacementMoves
  };
}

function isMoveBlockedForPokemon(pokemonName, move, learnsets = {}) {
  const learnset = learnsetForPokemon(pokemonName, learnsets);
  if (learnset && !learnset.has(move)) return true;

  const blocked = MOVE_LEARNSET_BLOCKLIST[move];
  if (!blocked) return false;
  const baseName = baseSpeciesLabel(pokemonName);
  return blocked.includes(pokemonName) || blocked.includes(baseName);
}

function pokemonCanLearnMoves(pokemonName, moves = [], learnsets = {}, moveDetails = {}) {
  const wantedMoves = [...new Set(moves.map((move) => String(move).trim()).filter(Boolean))];
  if (!wantedMoves.length) {
    return { ok: true, known: [], unknown: [], blocked: [] };
  }

  const unknown = wantedMoves.filter((move) => moveDetails && Object.keys(moveDetails).length && !moveDetails[move]);
  const blocked = wantedMoves
    .filter((move) => !unknown.includes(move))
    .filter((move) => isMoveBlockedForPokemon(pokemonName, move, learnsets));

  return {
    ok: unknown.length === 0 && blocked.length === 0,
    known: wantedMoves.filter((move) => !unknown.includes(move) && !blocked.includes(move)),
    unknown,
    blocked
  };
}

function learnsetForPokemon(pokemonName, learnsets = {}) {
  const exact = learnsets[pokemonName];
  const baseName = baseSpeciesLabel(pokemonName);
  const base = learnsets[baseName];
  const moves = exact?.length ? exact : base;
  return moves?.length ? new Set(moves) : null;
}

function replacementMovesForSlot(pokemonName, slot, moveDetails, currentMoves, fallbackMoves = [], originalMoves = [], learnsets = {}) {
  const curated = splitMoveOptions(slot)
    .flatMap((move) => {
      const baseName = baseSpeciesLabel(pokemonName);
      return [
        ...(MOVE_REPLACEMENTS[move]?.[pokemonName] ?? []),
        ...(MOVE_REPLACEMENTS[move]?.[baseName] ?? [])
      ];
    });
  const blockedMoves = splitMoveOptions(slot);
  const scored = [...curated, ...fallbackMoves]
    .filter((move) => moveDetails[move])
    .filter((move) => !isMoveBlockedForPokemon(pokemonName, move, learnsets))
    .filter((move) => !currentMoves.some((slot) => splitMoveOptions(slot).includes(move)))
    .map((move) => ({
      move,
      score: replacementMoveScore(move, blockedMoves, moveDetails, currentMoves, originalMoves)
    }))
    .sort((a, b) => b.score - a.score);
  const good = scored.filter(({ score }) => score >= -10).slice(0, 3).map(({ move }) => move);
  return good.length ? good : scored.slice(0, 1).map(({ move }) => move);
}

function splitMoveOptions(value) {
  return String(value).split("/").map((part) => part.trim()).filter(Boolean);
}

function replacementMoveScore(candidate, blockedMoves, moveDetails, currentMoves, originalMoves) {
  const details = moveDetails[candidate] ?? {};
  const candidateTags = moveFunctionTags(candidate, details);
  const blockedTags = new Set(blockedMoves.flatMap((move) => moveFunctionTags(move, moveDetails[move] ?? {})));
  const existingMoves = [...new Set([...currentMoves, ...originalMoves]
    .flatMap(splitMoveOptions)
    .filter((move) => !blockedMoves.includes(move)))];
  const existingTagSets = existingMoves.map((move) => new Set(moveFunctionTags(move, moveDetails[move] ?? {})));
  let score = 0;

  candidateTags.forEach((tag) => {
    if (blockedTags.has(tag)) score += 12;
  });
  if (details.category === "Status" && blockedMoves.some((move) => moveDetails[move]?.category === "Status")) score += 8;
  if (details.category !== "Status" && blockedMoves.every((move) => moveDetails[move]?.category !== "Status")) score += 4;
  if (details.accuracy === "-") score += 2;
  score += (Number(details.pp) || 0) / 20;

  existingTagSets.forEach((tags) => {
    candidateTags.forEach((tag) => {
      if (tags.has(tag)) score -= duplicatePenalty(tag);
    });
  });

  return score;
}

function moveFunctionTags(move, details = {}) {
  const text = `${move} ${details.effect ?? ""}`.toLowerCase();
  const tags = [];
  if (details.category === "Status") tags.push("status");
  if (/toxic|poison|burn|paraly/.test(text)) tags.push("status-condition");
  if (/protects|protect/.test(text)) tags.push("protect");
  if (/forces? .* out|switch to a random ally|whirlwind|roar|dragon tail/.test(text)) tags.push("phazing");
  if (/stealth rock|spikes|sticky web|entry hazard|sets .*hazard/.test(text)) tags.push("hazard");
  if (/recover|restores|heals|roost|slack off|synthesis|wish/.test(text)) tags.push("recovery");
  if (/raises|boost|swords dance|calm mind|curse|nasty plot|dragon dance/.test(text)) tags.push("setup");
  if (details.category && details.category !== "Status") tags.push("damage");
  if (details.category && details.type) tags.push(`${details.category}:${details.type}`);
  if (details.type) tags.push(`type:${details.type}`);
  return tags;
}

function duplicatePenalty(tag) {
  if (tag.startsWith("type:")) return 8;
  if (tag.includes(":")) return 10;
  if (tag === "damage") return 3;
  return 5;
}

function displayPokemonName(name) {
  return String(name).replace(/-Mega(?:-[XY])?$/, "").replace(/-/g, " ");
}

function enrichGeneratedMovesets({ movesets, pokemon, generatedMovePlan }) {
  for (const [name, sets] of Object.entries(movesets)) {
    const matchingPokemon = pokemon.find((item) => item.name === name);
    if (!matchingPokemon) continue;

    sets.forEach((set) => {
      if (set.status !== "generated") return;
      if (!hasPlaceholderMoves(set.moves)) return;

      const mode = generatedModeFromSet(set, matchingPokemon);
      set.label = generatedLabelForMode(mode);
      set.moves = generatedMovePlan(matchingPokemon, mode);
      set.generatedNote = "Moves automatisch voorgesteld uit de lokale move-database; nog valideren voor Champions.";
    });
  }
}

function hasPlaceholderMoves(moves = []) {
  return moves.some((move) => /STAB|coverage|utility|setup|priority|recovery|pivot|team gaps|walls|checks|betrouwbare/i.test(move));
}

function generatedModeFromSet(set, pokemon) {
  const haystack = `${set.id ?? ""} ${set.label ?? ""} ${set.role ?? ""}`.toLowerCase();
  if (haystack.includes("bulky") || haystack.includes("wall")) return "bulky";
  if (haystack.includes("special")) return "special";
  if (haystack.includes("physical")) return "physical";
  if (pokemon.spa >= pokemon.atk + 15) return "special";
  if (pokemon.atk >= pokemon.spa + 15) return "physical";
  return "mixed";
}

function generatedLabelForMode(mode) {
  if (mode === "physical") return "Physical";
  if (mode === "special") return "Special";
  if (mode === "bulky") return "Bulky";
  return "Mixed";
}
return { loadMovesets, validateMoveSlots, isMoveBlockedForPokemon, pokemonCanLearnMoves };
})();

// modules/storage.js
const __storage = (() => {
const STORAGE_KEYS = {
  customSets: "championsCustomSets",
  savedTeams: "championsSavedTeams",
  favorites: "championsFavorites",
  battleSim: "championsBattleSim"
};

function readJsonStorage(key, fallback, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value, storage = globalThis.localStorage) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
return { STORAGE_KEYS, readJsonStorage, writeJsonStorage };
})();

// modules/rendering.js
const __rendering = (() => {
function renderApp(ctx) {
  ctx.renderViewTabs();
  ctx.renderGuideModeToggle();
  const list = ctx.getFilteredPokemon();
  const isStart = ctx.state.guideMode && !ctx.state.hasExplored && !ctx.normalize(ctx.searchInput.value);
  ctx.metaRow?.classList.toggle("hidden", true);
  if (ctx.resultCount) ctx.resultCount.textContent = isStart ? "Start" : list.length.toLocaleString("nl-NL");
  if (ctx.resultLabel) ctx.resultLabel.textContent = isStart ? "team-builder" : "resultaten";
  if (ctx.resultInline) ctx.resultInline.textContent = isStart ? "(start)" : `(${list.length.toLocaleString("nl-NL")})`;
  ctx.grid.replaceChildren();

  if (isStart) {
    ctx.grid.append(ctx.createStartPanel());
  } else if (!list.length) {
    ctx.grid.append(ctx.createNoResultsPanel());
  } else {
    const fragment = document.createDocumentFragment();
    list.forEach((pokemon) => fragment.append(ctx.createCard(pokemon)));
    ctx.grid.append(fragment);
  }

  ctx.renderDetail(ctx.state.selected);
  ctx.renderTeam();
  if (ctx.state.activeView === "battle") ctx.renderBattleSim?.();
  ctx.renderFloatingCompare();
}

function renderWithoutScrollJump(update) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  update();

  const restore = () => window.scrollTo(scrollX, scrollY);
  restore();
  window.requestAnimationFrame(restore);
  window.requestAnimationFrame(() => window.requestAnimationFrame(restore));
  window.setTimeout(restore, 0);
}
return { renderApp, renderWithoutScrollJump };
})();

// modules/ui-events.js
const __uiEvents = (() => {
function bindEvents(ctx) {
  let searchFrame = 0;
  ctx.searchInput.addEventListener("input", () => {
    if (ctx.searchInput.value.trim()) {
      ctx.state.hasExplored = true;
      ctx.state.guideMode = false;
    }
    if (searchFrame) window.cancelAnimationFrame(searchFrame);
    searchFrame = window.requestAnimationFrame(() => {
      searchFrame = 0;
      ctx.renderBuilderSearch?.();
    });
  });
  const addSelectedMove = () => ctx.addMoveFilterValue?.(ctx.moveSearchSelect?.value);
  ctx.moveSearchSelect?.addEventListener("change", addSelectedMove);
  ctx.addMoveFilter?.addEventListener("click", addSelectedMove);
  ctx.sortSelect.addEventListener("change", () => {
    ctx.state.hasExplored = !ctx.state.guideMode;
    ctx.renderBuilderSearch?.();
  });
  ctx.sourceSelect.addEventListener("change", () => {
    ctx.state.hasExplored = !ctx.state.guideMode;
    ctx.state.startSuggestionPage = 0;
    ctx.renderBuilderSearch?.();
  });
  ctx.teamStyleSelect.addEventListener("change", () => {
    ctx.state.teamStyle = ctx.teamStyleSelect.value;
    ctx.state.startSuggestionPage = 0;
    ctx.optimizeTeamSets?.();
    ctx.invalidateCache();
    ctx.render();
  });
  ctx.roleFilterSelect.addEventListener("change", () => {
    ctx.state.roleFilter = ctx.roleFilterSelect.value;
    ctx.state.hasExplored = true;
    ctx.renderBuilderSearch?.();
  });
  ctx.battleFormatSelect.addEventListener("change", () => {
    ctx.state.battleFormat = ctx.battleFormatSelect.value;
    ctx.state.startSuggestionPage = 0;
    ctx.syncBattleSelection();
    ctx.state.opponentSelection = [];
    ctx.state.simulationResult = null;
    ctx.state.teamNotice = "";
    ctx.optimizeTeamSets?.();
    ctx.invalidateCache();
    ctx.render();
  });
  ctx.builderTab.addEventListener("click", () => ctx.switchView("builder"));
  ctx.teamTab.addEventListener("click", () => ctx.switchView("team"));
  ctx.battleTab.addEventListener("click", () => ctx.switchView("battle"));
  ctx.backToBuilder.addEventListener("click", () => ctx.switchView("builder"));
  ctx.floatingTeamLab.addEventListener("click", () => {
    ctx.switchView("team");
    ctx.teamView.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  ctx.typeToggle.addEventListener("click", () => {
    ctx.state.typeFiltersOpen = !ctx.state.typeFiltersOpen;
    ctx.renderTypeFilters();
  });
  ctx.resetApp.addEventListener("click", ctx.resetToStart);
  ctx.guideModeToggle.addEventListener("click", ctx.toggleGuideMode);
  ctx.favoritesToggle.addEventListener("click", ctx.toggleFavoritesFilter);
  ctx.showAllPokemon.addEventListener("click", ctx.showAllPokemonList);
  ctx.randomUltraTeam.addEventListener("click", ctx.generateRandomUltraTeam);
  ctx.goTopButton.addEventListener("click", () => {
    ctx.builderView.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  let scrollFrame = 0;
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      const show = ctx.state.activeView === "builder" && window.scrollY > 720;
      const compact = window.scrollY > 260;
      ctx.goTopButton.hidden = !show;
      if (document.body.classList.contains("compact-toolbar") !== compact) {
        document.body.classList.toggle("compact-toolbar", compact);
      }
    });
  }, { passive: true });
  ctx.clearTeam.addEventListener("click", () => {
    ctx.state.team = [];
    ctx.state.teamNotice = "";
    ctx.state.battleSelection = [];
    ctx.state.counterTargetName = "";
    ctx.state.simulationResult = null;
    ctx.invalidateCache();
    ctx.render();
  });
}
return { bindEvents };
})();

// modules/battle-simulation.js
const __battleSimulation = (() => {
const baseSpecies = __teamAnalysis.baseSpecies;
const defensiveMultiplier = __teamAnalysis.defensiveMultiplier;
const pokemonUsesMegaSlot = __teamAnalysis.pokemonUsesMegaSlot;
const DEFAULT_FORMAT = { maxTeamSize: 6, selectionSize: 3, label: "Single 3v3" };

function selectedBattleMembers(team = [], selection = [], format = DEFAULT_FORMAT) {
  const limit = format.selectionSize ?? DEFAULT_FORMAT.selectionSize;
  const byName = new Map(team.map((pokemon) => [pokemon.name, pokemon]));
  const picked = selection.map((name) => byName.get(name)).filter(Boolean);
  const seen = new Set(picked.map((pokemon) => pokemon.name));
  team.forEach((pokemon) => {
    if (picked.length < limit && !seen.has(pokemon.name)) {
      picked.push(pokemon);
      seen.add(pokemon.name);
    }
  });
  return picked.slice(0, limit);
}

function generateOpponentTeam({
  pokemon = [],
  playerTeam = [],
  playerRoster = [],
  format = DEFAULT_FORMAT,
  mode = "counter",
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" })
} = {}) {
  const maxTeamSize = format.maxTeamSize ?? DEFAULT_FORMAT.maxTeamSize;
  const playerBases = new Set(playerTeam.map((member) => baseSpecies(member.name)));
  const team = [];

  const referenceTeam = playerTeam.length ? playerTeam : playerRoster;
  const referenceProfile = teamProfile(referenceTeam, selectedBuild, roleFor);
  const candidates = [...pokemon]
    .filter((candidate) => !playerBases.has(baseSpecies(candidate.name)))
    .map((candidate) => ({
      pokemon: candidate,
      score: opponentCandidateScore(candidate, {
        mode,
        playerTeam,
        referenceProfile,
        selectedBuild,
        moveDetails,
        roleFor
      })
    }))
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst || a.pokemon.name.localeCompare(b.pokemon.name));

  for (const { pokemon: candidate } of candidates) {
    if (team.length >= maxTeamSize) break;
    if (!isLegalOpponentMember(candidate, team, selectedBuild)) continue;
    team.push(candidate);
  }

  return team;
}

function simulateBattle({
  playerTeam = [],
  opponentTeam = [],
  playerSelection = [],
  opponentSelection = [],
  format = DEFAULT_FORMAT,
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" })
} = {}) {
  const playerMembers = selectedBattleMembers(playerTeam, playerSelection, format);
  const opponentMembers = selectedBattleMembers(opponentTeam, opponentSelection, format);
  const pairings = playerMembers.flatMap((player) => opponentMembers.map((opponent) => {
    const result = matchupScore(player, opponent, { selectedBuild, moveDetails, roleFor });
    return { player, opponent, ...result };
  }));
  const matchupMatrix = createMatchupMatrix(playerMembers, opponentMembers, pairings);

  const playerScore = aggregateTeamScore(playerMembers, opponentMembers, { selectedBuild, moveDetails, roleFor });
  const opponentScore = aggregateTeamScore(opponentMembers, playerMembers, { selectedBuild, moveDetails, roleFor });
  const winChance = clamp(Math.round(50 + (playerScore - opponentScore) / 6), 5, 95);
  const advantage = winChance >= 62 ? "Voordeel" : winChance <= 38 ? "Lastig" : "Evenwichtig";
  const teamMetrics = scoreTeamPreview(playerMembers, opponentMembers, { selectedBuild, moveDetails, roleFor, winChance, playerScore, opponentScore });
  const selectionAdvice = recommendBattleSelection(playerTeam, opponentMembers, format, { selectedBuild, moveDetails, roleFor });
  const confidence = confidenceScore([...playerMembers, ...opponentMembers], { selectedBuild, moveDetails });

  return {
    formatLabel: format.label ?? DEFAULT_FORMAT.label,
    playerMembers,
    opponentMembers,
    winChance,
    advantage,
    playerScore: Math.round(playerScore),
    opponentScore: Math.round(opponentScore),
    bestMatchups: pairings
      .filter((pairing) => pairing.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
    threats: pairings
      .filter((pairing) => pairing.score < 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
    leads: selectionAdvice.leads,
    notes: battleNotes(playerMembers, opponentMembers, winChance),
    matchupMatrix,
    selectionAdvice,
    teamMetrics,
    confidence,
    pairings
  };
}

function matchupScore(attacker, defender, {
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" })
} = {}) {
  const attackBuild = selectedBuild(attacker) ?? {};
  const defendBuild = selectedBuild(defender) ?? {};
  const attackingTypes = offensiveTypes(attacker, attackBuild, moveDetails);
  const defendingTypes = offensiveTypes(defender, defendBuild, moveDetails);
  const bestAttack = bestTypePressure(attackingTypes, defender.types);
  const bestDefense = bestTypePressure(defendingTypes, attacker.types);
  const offense = Math.max(attacker.atk, attacker.spa);
  const opposingOffense = Math.max(defender.atk, defender.spa);
  const bulk = attacker.hp + attacker.def + attacker.spd;
  const opposingBulk = defender.hp + defender.def + defender.spd;
  const role = roleFor(attacker).label ?? "";
  const opposingRole = roleFor(defender).label ?? "";

  let score = 0;
  score += (bestAttack.multiplier - bestDefense.multiplier) * 36;
  score += (offense - opposingBulk / 2) * 0.18;
  score += (bulk / 2 - opposingOffense) * 0.12;
  score += (attacker.spe - defender.spe) * speedWeight(attacker, defender, role, opposingRole);
  score += setQualityBonus(attackBuild) - setQualityBonus(defendBuild);

  if (bestAttack.multiplier === 0) score -= 28;
  if (bestDefense.multiplier === 0) score += 22;
  if (/wall|pivot|support/i.test(role) && bestDefense.multiplier <= 0.5) score += 12;
  if (/sweeper|wallbreaker|speed/i.test(role) && bestAttack.multiplier >= 2) score += 14;

  const roundedScore = Math.round(score);
  const metrics = {
    offensePressure: clamp(Math.round(50 + (bestAttack.multiplier - 1) * 28 + (offense - opposingBulk / 2) * 0.22), 0, 100),
    defensiveAnswer: clamp(Math.round(50 + (1 - bestDefense.multiplier) * 30 + (bulk / 2 - opposingOffense) * 0.16), 0, 100),
    speedAdvantage: clamp(Math.round(50 + (attacker.spe - defender.spe) * 0.45), 0, 100),
    moveCoverage: clamp(Math.round(bestAttack.multiplier * 42), 0, 100),
    setReliability: clamp(Math.round(50 + setQualityBonus(attackBuild) * 5), 0, 100)
  };

  return {
    score: roundedScore,
    label: matchupLabel({ score: roundedScore, attackMultiplier: bestAttack.multiplier, defenseMultiplier: bestDefense.multiplier, speedDelta: attacker.spe - defender.spe, role }),
    attackMultiplier: bestAttack.multiplier,
    defenseMultiplier: bestDefense.multiplier,
    attackType: bestAttack.type,
    defenseType: bestDefense.type,
    speedDelta: attacker.spe - defender.spe,
    metrics,
    reasons: matchupReasons({
      attacker,
      defender,
      bestAttack,
      bestDefense,
      speedDelta: attacker.spe - defender.spe,
      role,
      build: attackBuild
    })
  };
}

function scoreTeamPreview(team = [], opponents = [], {
  selectedBuild = () => ({}),
  moveDetails = () => ({}),
  roleFor = () => ({ label: "Allrounder" }),
  winChance = 50,
  playerScore = null,
  opponentScore = null
} = {}) {
  const helpers = { selectedBuild, moveDetails, roleFor };
  const matrix = team.flatMap((pokemon) => opponents.map((opponent) => matchupScore(pokemon, opponent, helpers)));
  const positive = matrix.filter((item) => item.score > 0);
  const negative = matrix.filter((item) => item.score < 0);
  const speedWins = matrix.filter((item) => item.speedDelta > 0).length;
  const defensiveAnswers = matrix.filter((item) => item.metrics.defensiveAnswer >= 62).length;
  const coverageHits = matrix.filter((item) => item.attackMultiplier >= 2).length;
  const total = Math.max(1, matrix.length);
  return {
    winChance,
    previewScore: clamp(Math.round(50 + ((playerScore ?? aggregateTeamScore(team, opponents, helpers)) - (opponentScore ?? aggregateTeamScore(opponents, team, helpers))) / 8), 0, 100),
    speedControl: clamp(Math.round(speedWins / total * 100), 0, 100),
    defensiveSafety: clamp(Math.round(defensiveAnswers / total * 100), 0, 100),
    coverage: clamp(Math.round(coverageHits / total * 100), 0, 100),
    positiveCount: positive.length,
    negativeCount: negative.length
  };
}

function recommendBattleSelection(team = [], opponents = [], format = DEFAULT_FORMAT, helpers = {}) {
  const limit = format.selectionSize ?? DEFAULT_FORMAT.selectionSize;
  const ranked = team
    .map((pokemon) => {
      const pairScores = opponents.map((opponent) => matchupScore(pokemon, opponent, helpers));
      const best = Math.max(...pairScores.map((item) => item.score), 0);
      const average = pairScores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, pairScores.length);
      const defensive = pairScores.reduce((sum, item) => sum + item.metrics.defensiveAnswer, 0) / Math.max(1, pairScores.length);
      const score = Math.round(best * 0.52 + average * 0.38 + defensive * 0.18 + pokemon.spe * 0.12);
      return {
        pokemon,
        score,
        reason: selectionReason(pokemon, pairScores)
      };
    })
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst)
    .slice(0, limit);

  return {
    picks: ranked,
    leads: ranked.slice(0, Math.min(2, ranked.length)),
    actions: battleActions(ranked, opponents, helpers)
  };
}

function counterRecommendations(target, candidates = [], helpers = {}, {
  limit = 6,
  existingTeam = [],
  selectedBuild = helpers.selectedBuild ?? (() => ({}))
} = {}) {
  if (!target) return [];
  const existingBases = new Set(existingTeam.map((pokemon) => baseSpecies(pokemon.name)));
  const existingMega = existingTeam.some((pokemon) => pokemonUsesMegaSlot(pokemon, selectedBuild(pokemon)));

  return candidates
    .filter((candidate) => candidate?.name && candidate.name !== target.name)
    .filter((candidate) => !existingBases.has(baseSpecies(candidate.name)))
    .filter((candidate) => !existingMega || !pokemonUsesMegaSlot(candidate, selectedBuild(candidate)))
    .map((candidate) => {
      const matchup = matchupScore(candidate, target, helpers);
      const reverse = matchupScore(target, candidate, helpers);
      const score = Math.round(matchup.score - reverse.score * 0.35 + setQualityBonus(selectedBuild(candidate)) * 5);
      return {
        pokemon: candidate,
        score,
        matchup,
        reason: counterReason(candidate, target, matchup, reverse)
      };
    })
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst || a.pokemon.name.localeCompare(b.pokemon.name))
    .slice(0, limit);
}

function matchupLabel({ score = 0, attackMultiplier = 1, defenseMultiplier = 1, speedDelta = 0, role = "" } = {}) {
  if (attackMultiplier === 0) return "Coverage nodig";
  if (defenseMultiplier === 0 && score >= 8) return "Wallt";
  if (attackMultiplier >= 2 && speedDelta >= 0) return "Sterk";
  if (speedDelta >= 25 && score > -5) return "Outspeeds";
  if (/wall|pivot|support/i.test(role) && defenseMultiplier <= 0.5) return "Wallt";
  if (score <= -18) return "Risky";
  if (score >= 18) return "Sterk";
  return "Neutraal";
}

function counterReason(candidate, target, matchup, reverse) {
  const parts = [];
  if (matchup.attackMultiplier >= 2) parts.push(`${matchup.attackType} raakt ${target.name} super effectief`);
  if (reverse.attackMultiplier === 0) parts.push(`immuun voor ${reverse.attackType}`);
  else if (reverse.attackMultiplier <= 0.5) parts.push(`vangt ${reverse.attackType} goed op`);
  if (matchup.speedDelta > 0) parts.push(`sneller met +${matchup.speedDelta} Spe`);
  if (matchup.metrics.defensiveAnswer >= 68) parts.push("sterke defensieve marge");
  return parts.slice(0, 2).join(" · ") || `${matchup.label} matchup met score ${matchup.score > 0 ? "+" : ""}${matchup.score}`;
}

function confidenceScore(members = [], { selectedBuild = () => ({}), moveDetails = () => ({}) } = {}) {
  if (!members.length) return { value: 0, label: "Geen data", issues: ["Geen preview gekozen"] };
  const issues = [];
  const raw = members.reduce((sum, pokemon) => {
    const build = selectedBuild(pokemon) ?? {};
    let value = 58 + setQualityBonus(build) * 4;
    if (build.status === "generated") {
      value -= 18;
      issues.push(`${pokemon.name}: generated set`);
    }
    const moves = build.moves ?? [];
    if (moves.length < 4) {
      value -= 8;
      issues.push(`${pokemon.name}: incomplete moveset`);
    }
    const unknownMoves = moves
      .flatMap((move) => String(move).split("/").map((part) => part.trim()))
      .filter((move) => {
        const details = moveDetails(move);
        return !details?.type || details.type === "Unknown";
      });
    if (unknownMoves.length) {
      value -= 10;
      issues.push(`${pokemon.name}: onbekende move-data`);
    }
    return sum + clamp(value, 15, 96);
  }, 0);
  const value = Math.round(raw / members.length);
  return {
    value,
    label: value >= 76 ? "Hoog" : value >= 52 ? "Middel" : "Laag",
    issues: [...new Set(issues)].slice(0, 4)
  };
}

function aggregateTeamScore(team, opponents, helpers) {
  if (!team.length || !opponents.length) return 0;
  return team.reduce((sum, member) => {
    const scores = opponents
      .map((opponent) => matchupScore(member, opponent, helpers).score)
      .sort((a, b) => b - a);
    const best = scores[0] ?? 0;
    const average = scores.reduce((total, score) => total + score, 0) / Math.max(1, scores.length);
    return sum + best * 0.58 + average * 0.42 + member.bst / 18;
  }, 0);
}

function opponentCandidateScore(candidate, { mode, playerTeam, referenceProfile, selectedBuild, moveDetails, roleFor }) {
  const build = selectedBuild(candidate);
  const role = roleFor(candidate).label ?? "";
  const bulk = candidate.hp + candidate.def + candidate.spd;
  const offense = Math.max(candidate.atk, candidate.spa);
  if (mode === "random") return randomTeamScore(candidate, build);
  if (mode === "bulky") return bulk * 1.35 + candidate.bst * 0.45 + /wall|pivot|support/i.test(role) * 90 + setQualityBonus(build) * 8;
  if (mode === "offense") return offense * 1.45 + candidate.spe * 1.15 + candidate.bst * 0.35 + /sweeper|wallbreaker|speed/i.test(role) * 90 + setQualityBonus(build) * 8;
  if (mode === "mirror") {
    const physicalFit = referenceProfile.physical >= referenceProfile.special ? candidate.atk : candidate.spa;
    const speedFit = Math.max(0, 120 - Math.abs(candidate.spe - referenceProfile.averageSpeed));
    const bulkFit = Math.max(0, 330 - Math.abs(bulk - referenceProfile.averageBulk));
    return candidate.bst * 0.45 + physicalFit + speedFit + bulkFit * 0.5 + setQualityBonus(build) * 8;
  }
  return counterCandidateScore(candidate, playerTeam, { selectedBuild, moveDetails, roleFor });
}

function counterCandidateScore(candidate, playerTeam, helpers) {
  if (!playerTeam.length) return randomTeamScore(candidate, helpers.selectedBuild(candidate));
  const scores = playerTeam.map((player) => matchupScore(candidate, player, helpers).score);
  const best = Math.max(...scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return best * 1.5 + average + candidate.bst / 7 + candidate.spe * 0.2;
}

function randomTeamScore(pokemon, build = {}) {
  return Math.random() * 320 + pokemon.bst * 0.35 + Math.max(pokemon.atk, pokemon.spa) * 0.35 + pokemon.spe * 0.2 + setQualityBonus(build) * 5;
}

function isLegalOpponentMember(candidate, team, selectedBuild) {
  if (team.some((member) => member.name === candidate.name)) return false;
  if (team.some((member) => baseSpecies(member.name) === baseSpecies(candidate.name))) return false;
  const candidateUsesMega = pokemonUsesMegaSlot(candidate, selectedBuild(candidate));
  if (candidateUsesMega && team.some((member) => pokemonUsesMegaSlot(member, selectedBuild(member)))) return false;
  return true;
}

function recommendLeads(team, opponents, helpers) {
  return team
    .map((pokemon) => {
      const scores = opponents.map((opponent) => matchupScore(pokemon, opponent, helpers).score);
      const pressure = scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length);
      return { pokemon, score: Math.round(pressure + pokemon.spe * 0.22 + Math.max(pokemon.atk, pokemon.spa) * 0.08) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function createMatchupMatrix(playerMembers, opponentMembers, pairings) {
  return playerMembers.map((player) => ({
    player,
    cells: opponentMembers.map((opponent) => {
      const pairing = pairings.find((item) => item.player.name === player.name && item.opponent.name === opponent.name);
      return {
        opponent,
        score: pairing?.score ?? 0,
        label: pairing?.label ?? "Neutraal",
        tone: matrixTone(pairing?.score ?? 0),
        attackMultiplier: pairing?.attackMultiplier ?? 1,
        defenseMultiplier: pairing?.defenseMultiplier ?? 1,
        speedDelta: pairing?.speedDelta ?? 0,
        reasons: pairing?.reasons ?? []
      };
    })
  }));
}

function matrixTone(score) {
  if (score >= 18) return "good";
  if (score <= -18) return "bad";
  return "neutral";
}

function selectionReason(pokemon, pairScores) {
  const best = [...pairScores].sort((a, b) => b.score - a.score)[0];
  if (!best) return `${pokemon.name} is een flex pick.`;
  if (best.attackMultiplier >= 2) return `Beste druk via ${best.attackType}-coverage.`;
  if (best.speedDelta >= 20) return "Geeft je preview speed control.";
  if (best.metrics.defensiveAnswer >= 70) return "Veilige defensieve pivot in deze preview.";
  return best.reasons[0] ?? "Solide algemene matchup.";
}

function battleActions(ranked, opponents, helpers) {
  const actions = [];
  if (ranked[0]) actions.push({ label: "Beste lead", text: `Open met ${ranked[0].pokemon.name}: ${ranked[0].reason}` });
  const allPairings = ranked.flatMap(({ pokemon }) => opponents.map((opponent) => ({ pokemon, opponent, ...matchupScore(pokemon, opponent, helpers) })));
  const worst = [...allPairings].sort((a, b) => a.score - b.score)[0];
  if (worst) actions.push({ label: "Vermijd", text: `Laat ${worst.pokemon.name} niet gratis tegenover ${worst.opponent.name} staan (${worst.label}).` });
  const wincon = [...allPairings].sort((a, b) => b.score - a.score)[0];
  if (wincon) actions.push({ label: "Wincon", text: `Speel rond ${wincon.pokemon.name}; beste druk is tegen ${wincon.opponent.name}.` });
  return actions.slice(0, 3);
}

function teamProfile(team, selectedBuild, roleFor) {
  if (!team.length) return { physical: 0, special: 0, averageSpeed: 80, averageBulk: 280 };
  const totals = team.reduce((profile, pokemon) => {
    if (pokemon.atk >= pokemon.spa) profile.physical += 1;
    else profile.special += 1;
    profile.speed += pokemon.spe;
    profile.bulk += pokemon.hp + pokemon.def + pokemon.spd;
    const build = selectedBuild(pokemon);
    const role = roleFor(pokemon).label ?? build.role ?? "";
    if (/wall|pivot|support/i.test(role)) profile.support += 1;
    return profile;
  }, { physical: 0, special: 0, speed: 0, bulk: 0, support: 0 });
  return {
    ...totals,
    averageSpeed: totals.speed / team.length,
    averageBulk: totals.bulk / team.length
  };
}

function battleNotes(playerMembers, opponentMembers, winChance) {
  const notes = [];
  if (winChance >= 62) notes.push("Je selectie heeft duidelijk momentum; speel rond je positieve pairings.");
  else if (winChance <= 38) notes.push("Deze matchup vraagt strakke preview-keuzes; vermijd je slechtste pairing als lead.");
  else notes.push("De matchup is close; lead-keuze en setkeuze maken hier veel verschil.");
  if (playerMembers.some((pokemon) => pokemon.spe >= 110) && !opponentMembers.some((pokemon) => pokemon.spe >= 110)) {
    notes.push("Je hebt de hoogste speed-tier in deze preview.");
  }
  if (opponentMembers.some((pokemon) => pokemon.hp + pokemon.def + pokemon.spd >= 320)) {
    notes.push("De tegenstander heeft stevige switch-ins; let op welke breaker daar het beste doorheen komt.");
  }
  return notes;
}

function offensiveTypes(pokemon, build = {}, moveDetails) {
  const moveTypes = (build.moves ?? [])
    .flatMap((move) => String(move).split("/").map((part) => part.trim()))
    .map((move) => moveDetails(move).type)
    .filter((type) => type && type !== "Unknown");
  return [...new Set([...pokemon.types, ...moveTypes])];
}

function bestTypePressure(types, defenderTypes = []) {
  return types
    .map((type) => ({ type, multiplier: defensiveMultiplier(defenderTypes, type) }))
    .sort((a, b) => b.multiplier - a.multiplier)[0] ?? { type: "Unknown", multiplier: 1 };
}

function speedWeight(attacker, defender, role, opposingRole) {
  const frailTarget = defender.hp + defender.def + defender.spd < 250;
  if (/sweeper|wallbreaker|speed/i.test(role) || frailTarget) return 0.18;
  if (/wall|pivot|support/i.test(opposingRole)) return 0.08;
  return 0.12;
}

function setQualityBonus(build = {}) {
  if (build.status === "smogon-champions") return 10;
  if (build.status === "smogon-sv") return 7;
  if (build.status === "custom") return 5;
  if (build.status === "generated") return -4;
  return 2;
}

function matchupReasons({ attacker, defender, bestAttack, bestDefense, speedDelta, role, build }) {
  const reasons = [];
  if (bestAttack.multiplier >= 2) reasons.push(`${bestAttack.type}-druk raakt ${defender.name} super effective`);
  else if (bestAttack.multiplier === 0) reasons.push(`${defender.name} is immuun voor je beste ${bestAttack.type}-druk`);
  else if (bestAttack.multiplier < 1) reasons.push(`${defender.name} resist je beste ${bestAttack.type}-druk`);
  else reasons.push(`${attacker.name} heeft neutrale druk`);

  if (bestDefense.multiplier === 0) reasons.push(`${attacker.name} heeft een immunity terug`);
  else if (bestDefense.multiplier <= 0.5) reasons.push(`${attacker.name} kan belangrijke coverage opvangen`);
  if (speedDelta >= 20) reasons.push(`${attacker.name} is sneller`);
  if (speedDelta <= -20) reasons.push(`${defender.name} is sneller`);
  if (/wall|pivot|support/i.test(role)) reasons.push("defensieve rol geeft extra marge");
  if (build.status && build.status !== "generated") reasons.push("betrouwbare setdata");
  return reasons.slice(0, 4);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
return { selectedBattleMembers, generateOpponentTeam, simulateBattle, matchupScore, scoreTeamPreview, recommendBattleSelection, counterRecommendations, matchupLabel, confidenceScore };
})();

// app.js

const { loadPokemonData, officialPokemon } = __data;
const fetchChampionsMeta = __data.loadChampionsMeta;
const fetchMovesets = __movesets.loadMovesets;
const pureIsMoveBlockedForPokemon = __movesets.isMoveBlockedForPokemon;
const purePokemonCanLearnMoves = __movesets.pokemonCanLearnMoves;
const pureValidateMoveSlots = __movesets.validateMoveSlots;
const {
  BATTLE_FORMATS,
  ITEM_OPTIONS,
  NATURE_OPTIONS,
  RESTRICTED_MOVE_LEARNERS,
  SP_PRESETS,
  SP_STAT_LIMIT,
  SP_TOTAL_LIMIT,
  STAT_LABELS,
  TEAM_STYLES,
  TYPE_COLORS,
  TYPES
} = __constants;
const { renderApp, renderWithoutScrollJump } = __rendering;
const { readJsonStorage, STORAGE_KEYS, writeJsonStorage } = __storage;
const bindUiEvents = __uiEvents.bindEvents;
const pureCounterRecommendations = __battleSimulation.counterRecommendations;
const pureGenerateOpponentTeam = __battleSimulation.generateOpponentTeam;
const { simulateBattle, selectedBattleMembers } = __battleSimulation;
const pureBaseSpecies = __teamAnalysis.baseSpecies;
const pureBaseSpeciesLabel = __teamAnalysis.baseSpeciesLabel;
const pureDefensiveMultiplier = __teamAnalysis.defensiveMultiplier;
const pureIsMega = __teamAnalysis.isMega;
const pureMegaBaseFromItem = __teamAnalysis.megaBaseFromItem;
const pureNormalizeSpSpread = __teamAnalysis.normalizeSpSpread;
const pureNormalizeSpValues = __teamAnalysis.normalizeSpValues;
const pureParseSp = __teamAnalysis.parseSp;
const purePokemonUsesMegaSlot = __teamAnalysis.pokemonUsesMegaSlot;
const pureReorderTeam = __teamAnalysis.reorderTeam;
const pureSpPartsFromValues = __teamAnalysis.spPartsFromValues;
const pureTeamLegality = __teamAnalysis.teamLegality;
const pureTeamTypeSummary = __teamAnalysis.teamTypeSummary;
const pureTrainedStatValue = __teamAnalysis.trainedStatValue;

const state = {
  pokemon: [],
  movesets: {},
  movesetSources: {},
  moveDetails: {},
  championsLearnsets: {},
  championsMeta: { formats: {}, archetypes: [], threats: [] },
  selected: null,
  selectedTypes: [],
  moveFilters: [],
  typeFiltersOpen: false,
  team: [],
  battleSelection: [],
  opponentTeam: [],
  opponentSelection: [],
  opponentMode: "counter",
  opponentSearch: "",
  opponentReplaceIndex: 0,
  livePlayerName: "",
  liveOpponentName: "",
  counterTargetName: "",
  simulationResult: null,
  teamNotice: "",
  lockedCore: [],
  selectedSets: {},
  manualSets: {},
  customSets: {},
  savedTeams: [],
  favorites: [],
  favoritesOnly: false,
  roleFilter: "all",
  compare: [],
  compareMinimized: false,
  explanationOpen: "",
  expandedCards: [],
  cache: {},
  hasExplored: false,
  guideMode: false,
  teamStyle: "balanced",
  battleFormat: "single3",
  startSuggestionPage: 0,
  activeView: "builder"
};

const grid = document.querySelector("#pokemonGrid");
const cardTemplate = document.querySelector("#cardTemplate");
const searchInput = document.querySelector("#searchInput");
const moveSearchSelect = document.querySelector("#moveSearchSelect");
const addMoveFilter = document.querySelector("#addMoveFilter");
const moveFilterChips = document.querySelector("#moveFilterChips");
const sortSelect = document.querySelector("#sortSelect");
const sourceSelect = document.querySelector("#sourceSelect");
const teamStyleSelect = document.querySelector("#teamStyleSelect");
const roleFilterSelect = document.querySelector("#roleFilterSelect");
const battleFormatSelect = document.querySelector("#battleFormatSelect");
const typeFilters = document.querySelector("#typeFilters");
const typeToggle = document.querySelector("#typeToggle");
const activeTypeLabel = document.querySelector("#activeTypeLabel");
const metaRow = document.querySelector(".meta-row");
const resultCount = document.querySelector("#resultCount");
const resultLabel = document.querySelector("#resultLabel");
const resultInline = document.querySelector("#resultInline");
const builderTab = document.querySelector("#builderTab");
const teamTab = document.querySelector("#teamTab");
const battleTab = document.querySelector("#battleTab");
const builderView = document.querySelector("#builderView");
const teamView = document.querySelector("#teamView");
const battleView = document.querySelector("#battleView");
const battleSim = document.querySelector("#battleSim");
const appStatus = document.querySelector("#appStatus");
const globalBusy = document.querySelector("#globalBusy");
const detailPanel = document.querySelector("#detailPanel");
const teamSlots = document.querySelector("#teamSlots");
const teamOverview = document.querySelector("#teamOverview");
const teamWorkbench = document.querySelector("#teamWorkbench");
const teamManager = document.querySelector("#teamManager");
const teamAnalysis = document.querySelector("#teamAnalysis");
const sidePanel = document.querySelector(".side-panel");
const clearTeam = document.querySelector("#clearTeam");
const resetApp = document.querySelector("#resetApp");
const guideModeToggle = document.querySelector("#guideModeToggle");
const showAllPokemon = document.querySelector("#showAllPokemon");
const favoritesToggle = document.querySelector("#favoritesToggle");
const randomUltraTeam = document.querySelector("#randomUltraTeam");
const backToBuilder = document.querySelector("#backToBuilder");
const floatingTeamLab = document.querySelector("#floatingTeamLab");
const floatingTeamCount = document.querySelector("#floatingTeamCount");
const teamQuickNav = document.querySelector("#teamQuickNav");
const builderTeamQuickNav = document.querySelector("#builderTeamQuickNav");
const floatingCompare = document.querySelector("#floatingCompare");
const goTopButton = document.querySelector("#goTopButton");

init();

async function init() {
  setAppStatus("Data laden", "Pokémon worden klaargezet.", true);
  let data;
  try {
    data = await loadPokemonData();
  } catch (error) {
    showLoadError(error);
    return;
  }

  state.pokemon = officialPokemon(data.pokemon);
  setAppStatus("Movesets laden", "Setdata en move-details worden verwerkt.", true);
  const movesetBundle = await fetchMovesets({ pokemon: state.pokemon, generatedMovePlan });
  state.movesets = movesetBundle.movesets;
  state.movesetSources = movesetBundle.movesetSources;
  state.moveDetails = movesetBundle.moveDetails;
  state.championsLearnsets = movesetBundle.learnsets ?? {};
  renderMoveSearchOptions();
  try {
    state.championsMeta = await fetchChampionsMeta();
  } catch (error) {
    console.warn("Champions-meta niet geladen; threat-checklist wordt overgeslagen.", error);
    state.championsMeta = { formats: {}, archetypes: [], threats: [] };
  }
  loadCustomSets();
  loadSavedTeams();
  loadFavorites();
  loadBattleSimState();
  state.selected = state.pokemon.find((pokemon) => pokemon.name === "Garchomp") ?? state.pokemon[0];

  renderTypeFilters();
  bindUiEvents(appContext());
  render();
  setAppStatus("", "", false);
}

function appContext() {
  return {
    state,
    grid,
    searchInput,
    moveSearchSelect,
    addMoveFilter,
    moveFilterChips,
    sortSelect,
    sourceSelect,
    teamStyleSelect,
    roleFilterSelect,
    battleFormatSelect,
    metaRow,
    resultCount,
    resultLabel,
    resultInline,
    builderTab,
    teamTab,
    battleTab,
    builderView,
    teamView,
    battleView,
    battleSim,
    clearTeam,
    resetApp,
    guideModeToggle,
    showAllPokemon,
    favoritesToggle,
    randomUltraTeam,
    backToBuilder,
    floatingTeamLab,
    goTopButton,
    typeToggle,
    render,
    renderTypeFilters,
    resetToStart,
    toggleGuideMode,
    toggleFavoritesFilter,
    generateRandomUltraTeam,
    showAllPokemonList,
    switchView,
    optimizeTeamSets,
    maxTeamSize,
    invalidateCache,
    normalize,
    getFilteredPokemon,
    createStartPanel,
    createNoResultsPanel,
    createCard,
    renderDetail,
    renderTeam,
    renderViewTabs,
    renderGuideModeToggle,
    renderTeamManager,
    renderBuilderSearch,
    addMoveFilterValue,
    removeMoveFilterValue,
    renderMoveFilterChips,
    syncBattleSelection,
    renderBattleSim,
    renderFloatingCompare
  };
}

function invalidateCache(scope = "all") {
  if (scope === "battle") {
    state.cache.battleSignature = "";
    state.cache.battleResult = null;
    state.cache.battleDirty = true;
    return;
  }
  if (scope === "analysis") {
    const selectedBuilds = state.cache.selectedBuilds;
    state.cache = { selectedBuilds };
    return;
  }
  state.cache = {};
  state.cache.battleDirty = true;
}

function perfMeasure(label, work) {
  if (!window.CHAMPIONS_DEBUG_PERF || !window.performance?.mark || !window.performance?.measure) {
    return work();
  }
  const start = `champions:${label}:start`;
  const end = `champions:${label}:end`;
  performance.mark(start);
  try {
    return work();
  } finally {
    performance.mark(end);
    performance.measure(`champions:${label}`, start, end);
    const measure = performance.getEntriesByName(`champions:${label}`).at(-1);
    if (measure) console.debug(`[Champions perf] ${label}: ${measure.duration.toFixed(1)}ms`);
  }
}

function setAppStatus(title, note = "", visible = true) {
  if (!appStatus) return;
  appStatus.hidden = !visible;
  appStatus.classList.toggle("active", visible);
  appStatus.setAttribute("aria-busy", String(visible));
  const titleEl = appStatus.querySelector("strong");
  const noteEl = appStatus.querySelector("small");
  if (titleEl && title) titleEl.textContent = title;
  if (noteEl) noteEl.textContent = note;
}

function showGlobalBusy(label = "Even rekenen") {
  if (!globalBusy) return;
  state.cache.globalBusyCount = (state.cache.globalBusyCount ?? 0) + 1;
  globalBusy.hidden = false;
  globalBusy.classList.add("active");
  globalBusy.setAttribute("aria-busy", "true");
  const labelEl = globalBusy.querySelector("strong");
  if (labelEl) labelEl.textContent = label;
}

function hideGlobalBusy() {
  if (!globalBusy) return;
  state.cache.globalBusyCount = Math.max(0, (state.cache.globalBusyCount ?? 0) - 1);
  if (state.cache.globalBusyCount > 0) return;
  globalBusy.classList.remove("active");
  globalBusy.setAttribute("aria-busy", "false");
  window.setTimeout(() => {
    if ((state.cache.globalBusyCount ?? 0) === 0) globalBusy.hidden = true;
  }, 140);
}

function setBusy(element, busy = true, label = "") {
  if (!element) return;
  const wasBusy = element.getAttribute("aria-busy") === "true";
  element.classList.toggle("is-busy", busy);
  element.setAttribute("aria-busy", String(busy));
  if (label) element.dataset.busyLabel = label;
  if (!busy) delete element.dataset.busyLabel;
  if (busy && !wasBusy) showGlobalBusy(label || "Even rekenen");
  if (!busy && wasBusy) hideGlobalBusy();
}

function clearBusySoon(element) {
  window.requestAnimationFrame(() => setBusy(element, false));
}

function scheduleAfterPaint(work) {
  window.requestAnimationFrame(() => {
    window.setTimeout(work, 0);
  });
}

function loadCustomSets() {
  state.customSets = readJsonStorage(STORAGE_KEYS.customSets, {});
}

function saveCustomSets() {
  if (!writeJsonStorage(STORAGE_KEYS.customSets, state.customSets)) console.warn("Custom sets konden niet worden opgeslagen.");
}

function loadSavedTeams() {
  state.savedTeams = readJsonStorage(STORAGE_KEYS.savedTeams, []);
}

function saveSavedTeams() {
  if (!writeJsonStorage(STORAGE_KEYS.savedTeams, state.savedTeams)) console.warn("Teams konden niet worden opgeslagen.");
}

function loadFavorites() {
  state.favorites = readJsonStorage(STORAGE_KEYS.favorites, []);
}

function saveFavorites() {
  if (!writeJsonStorage(STORAGE_KEYS.favorites, state.favorites)) console.warn("Favorieten konden niet worden opgeslagen.");
}

function loadBattleSimState() {
  const saved = readJsonStorage(STORAGE_KEYS.battleSim, {});
  state.opponentTeam = [];
  state.opponentSelection = [];
  state.opponentMode = saved.opponentMode ?? "manual";
  state.opponentSearch = "";
  state.opponentReplaceIndex = 0;
}

function saveBattleSimState() {
  const saved = {
    opponentTeam: state.opponentTeam.map((pokemon) => pokemon.name),
    opponentSelection: [...state.opponentSelection],
    opponentMode: state.opponentMode
  };
  if (!writeJsonStorage(STORAGE_KEYS.battleSim, saved)) console.warn("Battle sim kon niet worden opgeslagen.");
}

function showLoadError(error) {
  console.error(error);
  setAppStatus("Data kon niet worden geladen", "Controleer de data-map naast index.html.", true);
  if (resultCount) resultCount.textContent = "0";
  if (resultLabel) resultLabel.textContent = "resultaten";
  if (resultInline) resultInline.textContent = "(0)";
  grid.replaceChildren();
  detailPanel.replaceChildren();
  teamSlots.replaceChildren();
  teamOverview.replaceChildren();
  teamAnalysis.replaceChildren();
  teamWorkbench.replaceChildren();

  const message = document.createElement("article");
  message.className = "load-error";
  message.innerHTML = `
    <h2>Data kon niet worden geladen</h2>
    <p>Controleer of de map <strong>data</strong> naast <strong>index.html</strong> staat. Via <strong>file://</strong> gebruikt de app automatisch <strong>data/local-data.js</strong> als fallback.</p>
  `;
  grid.append(message);
}

function showAllPokemonList() {
  searchInput.value = "";
  if (moveSearchSelect) moveSearchSelect.value = "";
  state.moveFilters = [];
  renderMoveFilterChips();
  state.selectedTypes = [];
  state.hasExplored = true;
  state.guideMode = false;
  state.activeView = "builder";
  renderTypeFilters();
  render();
  document.querySelector(".workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetToStart() {
  searchInput.value = "";
  if (moveSearchSelect) moveSearchSelect.value = "";
  sortSelect.value = "name";
  sourceSelect.value = "all";
  teamStyleSelect.value = "balanced";
  roleFilterSelect.value = "all";
  battleFormatSelect.value = "single3";
  state.favoritesOnly = false;
  state.selectedTypes = [];
  state.moveFilters = [];
  renderMoveFilterChips();
  state.typeFiltersOpen = false;
  state.team = [];
  state.battleSelection = [];
  state.opponentTeam = [];
  state.opponentSelection = [];
  state.opponentMode = "counter";
  state.opponentSearch = "";
  state.opponentReplaceIndex = 0;
  state.counterTargetName = "";
  state.simulationResult = null;
  saveBattleSimState();
  state.teamNotice = "";
  state.lockedCore = [];
  state.manualSets = {};
  state.selectedSets = {};
  state.selected = state.pokemon.find((pokemon) => pokemon.name === "Garchomp") ?? state.pokemon[0];
  state.hasExplored = false;
  state.guideMode = false;
  state.teamStyle = "balanced";
  state.roleFilter = "all";
  state.battleFormat = "single3";
  state.activeView = "builder";
  renderTypeFilters();
  render();
  resetApp.textContent = "Gereset";
  window.setTimeout(() => {
    resetApp.textContent = "Reset";
  }, 900);
  document.querySelector(".hero").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleGuideMode() {
  state.guideMode = !state.guideMode;
  state.hasExplored = !state.guideMode;
  state.startSuggestionPage = 0;
  if (state.guideMode) {
    searchInput.value = "";
    state.selectedTypes = [];
    renderTypeFilters();
  }
  state.activeView = "builder";
  render();
}

function refreshSuggestionsList() {
  state.startSuggestionPage += 1;
  state.hasExplored = false;
  state.guideMode = true;
  state.activeView = "builder";
  searchInput.value = "";
  renderTypeFilters();
  render();
}

function toggleFavoritesFilter() {
  state.favoritesOnly = !state.favoritesOnly;
  state.hasExplored = true;
  state.guideMode = false;
  state.activeView = "builder";
  render();
}

function generateRandomUltraTeam() {
  runTeamBuildWork("Random team bouwen", "De app zoekt nu naar rollen, checks en setkwaliteit.", () => {
    performRandomUltraTeam();
  });
}

function performRandomUltraTeam() {
  const previousTeam = [...state.team];
  const previousSelectedSets = { ...state.selectedSets };
  const previousManualSets = { ...state.manualSets };
  state.team = [];
  state.battleSelection = [];
  state.simulationResult = null;
  state.teamNotice = "";
  state.lockedCore = [];
  state.selectedSets = {};
  state.manualSets = {};

  const anchors = shuffled(recommendedStartPicks()).map((item) => item.pokemon);
  const pool = [...anchors, ...shuffled(state.pokemon)]
    .filter((pokemon) => !needsValidationAsCore(pokemon))
    .filter((pokemon) => selectedBuild(pokemon).status !== "generated");

  while (state.team.length < maxTeamSize()) {
    const suggestions = suggestedPokemon(12).map((item) => item.pokemon);
    const candidates = [...suggestions, ...pool]
      .filter((pokemon) => teamLegality(pokemon).ok)
      .sort((a, b) => ultraTeamCandidateScore(b) - ultraTeamCandidateScore(a));
    const choice = weightedRandom(candidates.slice(0, 10));
    if (!choice) break;
    state.team.push(choice);
    invalidateCache();
  }

  if (state.team.length < maxTeamSize()) {
    state.team = previousTeam;
    state.selectedSets = previousSelectedSets;
    state.manualSets = previousManualSets;
    state.teamNotice = "Kon geen volledig Ultra Team samenstellen met de huidige data.";
  } else {
    state.selected = state.team[0];
    optimizeTeamSets();
    state.battleSelection = state.team.slice(0, battleSelectionSize()).map((pokemon) => pokemon.name);
    state.hasExplored = true;
    state.guideMode = false;
    state.activeView = "team";
    state.teamNotice = "Random Team samengesteld op basis van rollen, checks en setkwaliteit.";
  }
  invalidateCache();
  render();
}

function buildTeamAround(anchor, style = state.teamStyle) {
  const nextStyle = TEAM_STYLES[style] ? style : state.teamStyle;
  state.selected = anchor;
  runTeamBuildWork(
    `Team rond ${displayPokemonName(anchor)} bouwen`,
    `${TEAM_STYLES[nextStyle].label}-plan wordt gescand: rollen, typechecks en setkwaliteit.`,
    () => performBuildTeamAround(anchor, nextStyle)
  );
}

function performBuildTeamAround(anchor, style = state.teamStyle) {
  const previousTeam = [...state.team];
  const previousSelection = [...state.battleSelection];
  const previousStyle = state.teamStyle;
  const previousSelectedSets = { ...state.selectedSets };
  const previousManualSets = { ...state.manualSets };
  const nextStyle = TEAM_STYLES[style] ? style : state.teamStyle;

  state.teamStyle = nextStyle;
  teamStyleSelect.value = nextStyle;
  searchInput.value = "";
  state.selectedTypes = [];
  state.hasExplored = true;
  state.guideMode = false;
  state.favoritesOnly = false;
  state.activeView = "team";
  state.team = [anchor];
  state.lockedCore = [anchor.name];
  state.selected = anchor;
  state.battleSelection = [];
  state.selectedSets = {};
  state.manualSets = {};
  state.teamNotice = "";
  state.startSuggestionPage = 0;
  invalidateCache();

  const pool = autoTeamCandidatePool(anchor);
  while (state.team.length < maxTeamSize()) {
    const forced = requiredPlanCandidate(anchor);
    const candidates = forced
      ? [forced, ...pool.filter((pokemon) => pokemon.name !== forced.name)]
      : pool;
    const choice = candidates.find((pokemon) => teamLegality(pokemon).ok);
    if (!choice) break;
    state.team.push(choice);
  }

  if (state.team.length < maxTeamSize()) {
    if (state.team.length <= 1) {
      state.team = previousTeam;
      state.battleSelection = previousSelection;
      state.teamStyle = previousStyle;
      state.selectedSets = previousSelectedSets;
      state.manualSets = previousManualSets;
      teamStyleSelect.value = previousStyle;
      state.selected = anchor;
      state.activeView = "builder";
      state.teamNotice = `Kon geen team rond ${displayPokemonName(anchor)} samenstellen met de huidige regels.`;
    } else {
      optimizeTeamSets();
      state.battleSelection = state.team.slice(0, battleSelectionSize()).map((pokemon) => pokemon.name);
      state.teamNotice = `Gedeeltelijk team rond ${displayPokemonName(anchor)} gebouwd (${state.team.length}/6).`;
    }
  } else {
    optimizeTeamSets();
    state.battleSelection = state.team.slice(0, battleSelectionSize()).map((pokemon) => pokemon.name);
    state.teamNotice = `Team rond ${displayPokemonName(anchor)} gebouwd met ${TEAM_STYLES[nextStyle].label}-plan.`;
  }

  renderTypeFilters();
  invalidateCache();
  renderViewTabs();
  renderTeamSlots();
  scheduleFullTeamRender();
  renderFloatingCompare();
}

function runTeamBuildWork(title, note, work) {
  state.activeView = "team";
  state.teamNotice = title;
  renderViewTabs();
  renderTeamBuildPending(title, note);
  setBusy(teamWorkbench, true, title);
  setBusy(teamAnalysis, true, title);
  setAppStatus(title, note, true);
  scheduleAfterPaint(() => {
    try {
      work();
    } finally {
      setAppStatus("", "", false);
      clearBusySoon(teamWorkbench);
      clearBusySoon(teamAnalysis);
    }
  });
}

function renderTeamBuildPending(title, note) {
  if (teamWorkbench) {
    teamWorkbench.replaceChildren(createTeamBuildPendingPanel(title, note));
  }
  if (teamAnalysis) {
    teamAnalysis.replaceChildren(createTeamBuildPendingPanel("Team analyse wordt voorbereid", "Zodra de kern staat, verschijnen zwaktes, rollen en suggesties hier."));
  }
}

function createTeamBuildPendingPanel(title, note) {
  const panel = document.createElement("article");
  panel.className = "team-build-pending";
  panel.innerHTML = `
    <span class="status-spinner" aria-hidden="true"></span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(note)}</p>
  `;
  return panel;
}

function autoTeamCandidatePool(anchor) {
  return state.pokemon
    .filter((pokemon) => pokemon.name !== anchor.name)
    .map((pokemon) => ({ pokemon, score: autoTeamCandidateScore(pokemon, anchor) }))
    .filter((item) => item.score > -200)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst)
    .map((item) => item.pokemon);
}

function teamAroundCandidates(anchor) {
  const suggested = suggestedPokemon(18).map((item) => item.pokemon);
  const suggestedNames = new Set(suggested.map((pokemon) => pokemon.name));
  const fallback = state.pokemon.filter((pokemon) => !suggestedNames.has(pokemon.name));
  return [...suggested, ...fallback]
    .filter((pokemon) => pokemon.name !== anchor.name)
    .filter((pokemon) => !state.team.some((member) => member.name === pokemon.name))
    .filter((pokemon) => teamLegality(pokemon).ok)
    .sort((a, b) => teamAroundCandidateScore(b, anchor) - teamAroundCandidateScore(a, anchor));
}

function requiredPlanCandidate(anchor) {
  const missing = stylePlanChecks().filter((check) => !check.ok);
  if (!missing.length) return null;
  const priority = missing.find((check) => /drought|setter|weather/i.test(check.label))
    ?? missing.find((check) => /drizzle|sand stream|snow warning|trick room|chlorophyll|swift swim|slush rush|sand abuser|speed|pivot|status|recovery/i.test(check.label))
    ?? missing[0];
  const candidate = bestPlanCheckCandidate(priority);
  return candidate && candidate.name !== anchor.name ? candidate : null;
}

function teamAroundCandidateScore(pokemon, anchor) {
  const build = selectedBuild(pokemon);
  const reasons = suggestionReasons(pokemon);
  const role = roleFor(pokemon).label;
  let score = ultraTeamBaseScore(pokemon) + reasons.score * 45;

  if (teamStyleMatch(pokemon)) score += 90;
  else if (stylePlanChecks().length) score -= 150;
  if (weatherConflictsWithStyle(pokemon)) score -= 180;
  if (sunAntiSynergy(pokemon)) score -= 140;
  if (weatherPlanAntiSynergy(pokemon)) score -= 160;
  if (build.status === "generated") score -= 70;
  if (needsValidationAsCore(pokemon, build) && !usesMegaSlot(pokemon, build)) score -= 120;
  if (["Support", "Bulky pivot", "Wall"].includes(role)) score += state.team.length < 3 ? 35 : 10;
  if (["Sweeper", "Wallbreaker", "Speed control"].includes(role)) score += state.team.length >= 3 ? 30 : 10;

  anchor.types.forEach((type) => {
    const multiplier = defensiveMultiplier(pokemon.types, type);
    if (multiplier === 0) score += 36;
    else if (multiplier < 1) score += 26;
  });

  pokemon.types.forEach((type) => {
    const multiplier = defensiveMultiplier(anchor.types, type);
    if (multiplier < 1) score += 8;
  });

  return score;
}

function autoTeamCandidateScore(pokemon, anchor) {
  const role = roleFor(pokemon).label;
  let score = pokemon.bst + pokemon.spe * 0.6 + Math.max(pokemon.atk, pokemon.spa);

  if (["Sweeper", "Wallbreaker", "Speed control"].includes(role)) score += 80;
  if (["Wall", "Bulky pivot"].includes(role)) score += 50;
  if (hasCuratedBuildData(pokemon)) score += 80;
  if (autoTeamStyleMatch(pokemon)) score += 90;
  else if (stylePlanChecks().length) score -= 150;
  if (weatherConflictsWithStyle(pokemon)) score -= 180;
  if (sunAntiSynergy(pokemon)) score -= 140;
  if (weatherPlanAntiSynergy(pokemon)) score -= 160;
  if (needsValidationAsCore(pokemon) && !isMega(pokemon)) score -= 120;
  if (isMega(pokemon)) score += 35;
  if (["Support", "Bulky pivot", "Wall"].includes(role)) score += 28;
  if (["Sweeper", "Wallbreaker", "Speed control"].includes(role)) score += 28;

  anchor.types.forEach((type) => {
    const multiplier = defensiveMultiplier(pokemon.types, type);
    if (multiplier === 0) score += 36;
    else if (multiplier < 1) score += 26;
  });

  pokemon.types.forEach((type) => {
    if (defensiveMultiplier(anchor.types, type) < 1) score += 8;
  });

  return score;
}

function hasCuratedBuildData(pokemon) {
  const baseName = baseSpeciesLabel(pokemon.name);
  return Boolean(state.movesets[pokemon.name]?.length || state.movesets[baseName]?.length);
}

function autoTeamStyleMatch(pokemon, style = state.teamStyle) {
  if (style === "balanced") return true;
  if (weatherConflictsWithStyle(pokemon, style)) return false;
  if (needsValidationAsCore(pokemon) && !isMega(pokemon)) return false;

  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;
  const role = roleFor(pokemon).label;

  if (style === "offense") return bestAttack >= 120 || pokemon.spe >= 100 || ["Sweeper", "Wallbreaker", "Speed control"].includes(role);
  if (style === "bulky") return bulk >= 290 || ["Wall", "Bulky pivot"].includes(role);
  if (style === "rain") return hasAbility(pokemon, "Drizzle") || isRainAbuser(pokemon) || isRainWaterPressure(pokemon) || coversRainPressureType(pokemon);
  if (style === "sun") return hasAbility(pokemon, "Drought") || isChlorophyllAbuser(pokemon) || isSunFirePressure(pokemon) || pokemon.name === "Venusaur-Mega" || coversSunPressureType(pokemon);
  if (style === "trickroom") return pokemon.spe <= 65 && (bestAttack >= 105 || bulk >= 280);
  if (style === "doublesupport") return hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster") || hasAbility(pokemon, "Friend Guard") || ["Bulky pivot", "Wall"].includes(role);
  if (style === "hyperoffense") return bestAttack >= 125 || pokemon.spe >= 105;
  if (style === "voltturn") return hasPivotMove(pokemon) || hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Intimidate");
  if (style === "sand") return hasAbility(pokemon, "Sand Stream") || isSandAbuser(pokemon) || isSandBreaker(pokemon) || coversSandPressureType(pokemon);
  if (style === "snow") return hasAbility(pokemon, "Snow Warning") || isSnowAbuser(pokemon) || isSnowIcePressure(pokemon) || coversSnowPressureType(pokemon);
  if (style === "stall") return bulk >= 305 || hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Unaware") || hasAbility(pokemon, "Poison Heal") || hasAbility(pokemon, "Magic Guard");
  if (style === "antiMeta") return pokemon.spe >= 100 || bulk >= 285 || pokemon.types.some((type) => ["Steel", "Fairy", "Ground", "Dark", "Ghost"].includes(type));
  return true;
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function weightedRandom(candidates) {
  if (!candidates.length) return null;
  const index = Math.floor(Math.pow(Math.random(), 1.8) * candidates.length);
  return candidates[index];
}

function ultraTeamCandidateScore(pokemon) {
  return ultraTeamBaseScore(pokemon) + Math.random() * 80;
}

function ultraTeamBaseScore(pokemon) {
  const role = roleFor(pokemon).label;
  const build = selectedBuild(pokemon);
  let score = pokemon.bst + pokemon.spe * 0.6 + Math.max(pokemon.atk, pokemon.spa);
  if (["Sweeper", "Wallbreaker", "Speed control"].includes(role)) score += 80;
  if (["Wall", "Bulky pivot"].includes(role)) score += 50;
  if (build.status === "smogon-champions") score += 90;
  else if (build.status === "smogon-sv") score += 55;
  else if (build.status === "custom") score += 30;
  if (weatherConflictsWithStyle(pokemon)) score -= 110;
  if (usesMegaSlot(pokemon, build)) score += 35;
  return score;
}

function renderTypeFilters() {
  typeFilters.replaceChildren();
  typeFilters.classList.toggle("collapsed", !state.typeFiltersOpen);
  typeToggle.setAttribute("aria-expanded", String(state.typeFiltersOpen));
  typeToggle.textContent = state.typeFiltersOpen ? "Types verbergen" : "Types tonen";
  activeTypeLabel.textContent = state.selectedTypes.length ? selectedTypeLabel() : "";

  ["All", ...TYPES].forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "type-filter";
    button.textContent = type === "All" ? "Alle types" : type;
    button.style.setProperty("--type-color", TYPE_COLORS[type] || "#167a90");
    button.addEventListener("click", () => {
      updateTypeSelection(type);
      state.hasExplored = state.selectedTypes.length > 0;
      renderTypeFilters();
      renderBuilderSearch();
    });
    const isActive = type === "All" ? !state.selectedTypes.length : state.selectedTypes.includes(type);
    if (isActive) button.classList.add("active");
    typeFilters.append(button);
  });
}

function renderMoveSearchOptions() {
  if (!moveSearchSelect) return;
  const fragment = document.createDocumentFragment();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Kies move";
  fragment.append(empty);
  Object.keys(state.moveDetails)
    .sort((a, b) => a.localeCompare(b))
    .forEach((move) => {
      const option = document.createElement("option");
      option.value = move;
      option.textContent = move;
      fragment.append(option);
    });
  moveSearchSelect.replaceChildren(fragment);
  renderMoveFilterChips();
}

function addMoveFilterValue(move) {
  const value = String(move || moveSearchSelect?.value || "").trim();
  if (!value || state.moveFilters.includes(value)) return;
  state.moveFilters = [...state.moveFilters, value];
  if (moveSearchSelect) moveSearchSelect.value = "";
  state.hasExplored = true;
  state.guideMode = false;
  renderMoveFilterChips();
  renderBuilderSearch();
}

function removeMoveFilterValue(move) {
  state.moveFilters = state.moveFilters.filter((item) => item !== move);
  renderMoveFilterChips();
  renderBuilderSearch();
}

function renderMoveFilterChips() {
  if (!moveFilterChips) return;
  moveFilterChips.replaceChildren();
  if (!state.moveFilters.length) {
    const empty = document.createElement("small");
    empty.textContent = "Geen movefilter actief";
    moveFilterChips.append(empty);
    return;
  }
  state.moveFilters.forEach((move) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "move-filter-chip";
    chip.title = `Verwijder ${move}`;
    chip.innerHTML = `<span>${escapeHtml(move)}</span><b aria-hidden="true">×</b>`;
    chip.addEventListener("click", () => removeMoveFilterValue(move));
    moveFilterChips.append(chip);
  });
}

function moveFilterResult(pokemon) {
  return purePokemonCanLearnMoves(pokemon.name, state.moveFilters, state.championsLearnsets, state.moveDetails);
}

function matchesMoveFilters(pokemon) {
  if (!state.moveFilters.length) return true;
  return moveFilterResult(pokemon).ok;
}

function selectedTypeLabel() {
  if (!state.selectedTypes.length) return "Alle types";
  if (state.selectedTypes.length === 1) return state.selectedTypes[0];
  return state.selectedTypes.join(" + ");
}

function updateTypeSelection(type) {
  if (type === "All") {
    state.selectedTypes = [];
    return;
  }

  if (state.selectedTypes.includes(type)) {
    state.selectedTypes = state.selectedTypes.filter((selectedType) => selectedType !== type);
    return;
  }

  state.selectedTypes = [...state.selectedTypes, type].slice(-2);
}

function render() {
  perfMeasure("render", () => renderApp(appContext()));
}

function renderBuilderSearch() {
  perfMeasure("renderBuilderSearch", () => {
    renderGuideModeToggle();
    const list = getFilteredPokemon();
    const isStart = state.guideMode && !state.hasExplored && !normalize(searchInput.value) && !state.moveFilters.length;
    metaRow?.classList.toggle("hidden", true);
    if (resultCount) resultCount.textContent = isStart ? "Start" : list.length.toLocaleString("nl-NL");
    if (resultLabel) resultLabel.textContent = isStart ? "team-builder" : "resultaten";
    if (resultInline) resultInline.textContent = isStart ? "(start)" : `(${list.length.toLocaleString("nl-NL")})`;
    grid.replaceChildren();

    if (isStart) {
      grid.append(createStartPanel());
    } else if (!list.length) {
      grid.append(createNoResultsPanel());
    } else {
      const fragment = document.createDocumentFragment();
      list.forEach((pokemon) => fragment.append(createCard(pokemon)));
      grid.append(fragment);
    }
  });
}

function renderGuideModeToggle() {
  guideModeToggle.classList.toggle("active", state.guideMode);
  guideModeToggle.setAttribute("aria-pressed", String(state.guideMode));
  favoritesToggle.classList.toggle("active", state.favoritesOnly);
  favoritesToggle.setAttribute("aria-pressed", String(state.favoritesOnly));
  favoritesToggle.textContent = state.favoritesOnly ? `♥ ${state.favorites.length}` : "♡";
  favoritesToggle.title = state.favoritesOnly ? `Toon alle Pokémon (${state.favorites.length} favorieten)` : "Toon favorieten";
  randomUltraTeam.textContent = "↻";
  randomUltraTeam.title = "Random team";
}

function switchView(view) {
  state.activeView = view;
  renderViewTabs();
  if (view === "team") {
    renderTeamManager();
    renderTeamWorkbench();
  }
  if (view === "battle") {
    renderBattleSim();
  }
}

function renderViewTabs() {
  const isBuilderView = state.activeView === "builder";
  const isTeamView = state.activeView === "team";
  const isBattleView = state.activeView === "battle";
  builderTab.classList.toggle("active", isBuilderView);
  teamTab.classList.toggle("active", isTeamView);
  battleTab.classList.toggle("active", isBattleView);
  builderTab.setAttribute("aria-selected", String(isBuilderView));
  teamTab.setAttribute("aria-selected", String(isTeamView));
  battleTab.setAttribute("aria-selected", String(isBattleView));
  builderView.classList.toggle("active", isBuilderView);
  teamView.classList.toggle("active", isTeamView);
  battleView.classList.toggle("active", isBattleView);
  renderFloatingTeamAction();
}

function renderFloatingTeamAction() {
  floatingTeamLab.hidden = !state.team.length || state.activeView === "team";
  goTopButton.hidden = state.activeView !== "builder" || window.scrollY <= 720;
  floatingTeamCount.textContent = `${state.team.length}/6`;
  floatingTeamLab.setAttribute(
    "aria-label",
    `Ga naar Team lab. Team heeft ${state.team.length} van 6 plekken gevuld.`
  );
}

function createNoResultsPanel() {
  const panel = document.createElement("article");
  panel.className = "empty-results";

  const title = document.createElement("h2");
  title.textContent = "Geen Pokémon gevonden";

  const text = document.createElement("p");
  const query = searchInput.value.trim();
  const unknownMoves = state.moveFilters.filter((move) => !state.moveDetails[move]);
  text.textContent = unknownMoves.length
    ? `Onbekende move: ${unknownMoves.join(", ")}. Kies een move uit de suggesties of controleer spelling.`
    : state.moveFilters.length
      ? `Geen Pokémon gevonden die ${state.moveFilters.join(" + ")} legaal kunnen leren met deze filters.`
      : query
        ? `Er zijn geen Champions Pokémon gevonden voor "${query}". Probeer een andere naam, type of ability.`
        : "Er zijn geen Pokémon met deze filtercombinatie.";

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Terug naar beginscherm";
  button.addEventListener("click", resetToStart);

  panel.append(title, text, button);
  return panel;
}

function getFilteredPokemon() {
  const query = normalize(searchInput.value);
  if (query || state.moveFilters.length) state.hasExplored = true;
  const sort = sortSelect.value;

  const filtered = state.pokemon
    .filter((pokemon) => {
      const haystack = normalize([
        pokemon.name,
        pokemon.types.join(" "),
        pokemon.abilities.join(" ")
      ].join(" "));
      const matchesQuery = !query || haystack.includes(query);
      const matchesType = !state.selectedTypes.length || state.selectedTypes.every((type) => pokemon.types.includes(type));
      const role = displayRoleForBuild(pokemon);
      const matchesRole = state.roleFilter === "all"
        || role === state.roleFilter
        || (state.roleFilter === "Support" && ["Wall", "Allrounder"].includes(role));
      const matchesFocus = matchesFocusFilter(pokemon, sourceSelect.value);
      const matchesPlan = state.teamStyle === "balanced" || teamStyleMatch(pokemon, state.teamStyle);
      const matchesFavorite = !state.favoritesOnly || state.favorites.includes(pokemon.name);
      const matchesMoves = matchesMoveFilters(pokemon);
      return matchesQuery && matchesType && matchesRole && matchesFocus && matchesPlan && matchesFavorite && matchesMoves;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return sortValue(b, sort) - sortValue(a, sort) || a.name.localeCompare(b.name);
    });

  if (!filtered.length && state.pokemon.length && !query && !state.moveFilters.length && !state.selectedTypes.length) {
    return [...state.pokemon].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return sortValue(b, sort) - sortValue(a, sort) || a.name.localeCompare(b.name);
    });
  }

  return filtered;
}

function sortValue(pokemon, sort) {
  if (sort === "offense") return Math.max(pokemon.atk, pokemon.spa);
  if (sort === "bulk") return pokemon.hp + pokemon.def + pokemon.spd;
  return pokemon[sort] ?? 0;
}

function matchesFocusFilter(pokemon, focus) {
  const build = selectedBuild(pokemon);
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;

  if (focus === "mega") return isMega(pokemon);
  if (focus === "noMega") return !isMega(pokemon);
  if (focus === "strongSets") return !needsValidationAsCore(pokemon) && build.status !== "generated";
  if (focus === "fast") return pokemon.spe >= 100 || displayRoleForBuild(pokemon, build) === "Speed control";
  if (focus === "bulky") return bulk >= 285 || ["Wall", "Bulky pivot"].includes(displayRoleForBuild(pokemon, build));
  if (focus === "physical") return pokemon.atk >= pokemon.spa + 15 && pokemon.atk >= 105;
  if (focus === "special") return pokemon.spa >= pokemon.atk + 15 && pokemon.spa >= 105;
  return bestAttack >= 0;
}

function createStartPanel() {
  const panel = document.createElement("section");
  panel.className = "start-panel";

  const copy = document.createElement("div");
  copy.className = "start-copy";
  const title = document.createElement("h2");
  title.textContent = state.team.length ? "Bouw verder rond je kern" : "Begin met een kern";
  const text = document.createElement("p");
  text.textContent = state.team.length
    ? "Gebruik de suggesties in de teamanalyse om gaten in je team op te vullen, of zoek gericht naar een Pokémon, type of ability."
    : `Kies een sterke eerste Pokémon voor ${TEAM_STYLES[state.teamStyle].label}, zoek op naam/type, of gebruik een typefilter. Daarna helpt de teamanalyse met rollen, zwaktes en suggesties.`;
  copy.append(title, text);
  const helper = document.createElement("div");
  helper.className = "start-helper";
  helper.append(createStartControls());
  copy.append(helper);
  if (state.team.length) copy.append(createStartDashboard());
  copy.append(createPlanGuidePanel());

  const groups = document.createElement("div");
  groups.className = state.team.length ? "starter-groups wide-picks" : "starter-groups";
  const suggestions = startSuggestionGroups();
  if (!suggestions.length) {
    const empty = document.createElement("p");
    empty.className = "starter-empty";
    empty.textContent = state.team.length >= maxTeamSize()
      ? "Je team is vol. Gebruik de analyse rechts om te controleren waar je nog kunt verbeteren."
      : "Geen nieuwe aanbevelingen gevonden. Zoek gericht op naam, type of ability.";
    groups.append(empty);
  }
  if (suggestions.some((group) => group.refreshable)) {
    groups.append(createSuggestionRefreshBar());
  }
  suggestions.forEach((group) => groups.append(createStarterGroup(group)));

  panel.append(copy, groups);
  return panel;
}

function createPlanGuidePanel() {
  const style = TEAM_STYLES[state.teamStyle];
  const panel = document.createElement("div");
  panel.className = "plan-guide";
  const title = document.createElement("strong");
  title.textContent = `${style.label}-plan`;
  const text = document.createElement("p");
  text.textContent = style.description;
  const list = document.createElement("ul");
  planGuideItems(state.teamStyle).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  panel.append(title, text, list);
  return panel;
}

function planGuideItems(style) {
  const generic = [
    "Kies eerst 1 duidelijke wincon of stabiele kern.",
    "Vul daarna snelheid, fysieke/speciale druk en veilige switch-ins aan."
  ];
  const items = {
    balanced: ["Houd minimaal één snelle aanvaller en twee veilige wissels.", "Voorkom dat drie teamleden dezelfde zwakte delen."],
    offense: ["Prioriteer tempo, setup en revenge-kill opties.", "Neem genoeg directe damage mee om walls te breken."],
    bulky: ["Begin met switch-ins en recovery/status.", "Voeg daarna genoeg druk toe om niet passief te worden."],
    rain: ["Zoek Drizzle, Swift Swim en Water-druk.", "Dek Electric en Grass vroeg af."],
    sun: ["Zoek Drought, Fire-druk en Chlorophyll-abusers.", "Dek Rock, Water en Dragon checks af."],
    trickroom: ["Kies langzame, sterke attackers en setters.", "In Doubles is protect/support extra belangrijk."],
    doublesupport: ["Combineer Intimidate, speed-control en spread damage.", "Let op welke 4 Pokémon samen starten."],
    hyperoffense: ["Stapelt wincons en snelle druk.", "Accepteer minder defensieve marge, maar dek priority en scarfers af."],
    voltturn: ["Zoek pivot-moves en Regenerator/Intimidate.", "Gebruik chip damage om late-game schoon te maken."],
    sand: ["Combineer Sand Stream met Rock/Ground/Steel druk.", "Dek Water, Grass en Fighting consequent af."],
    snow: ["Gebruik Ice-druk met stevige Water/Steel rugdekking.", "Dek Fire, Rock en Steel extra vroeg af."],
    stall: ["Stapelt recovery, status en harde antwoorden.", "Zorg dat je niet verliest van setup of Taunt."],
    antiMeta: ["Kies eerst antwoorden op populaire threats.", "Laat vaste archetypes los als matchup-dekking beter wordt."]
  };
  return items[style] ?? generic;
}

function createSuggestionRefreshBar() {
  const bar = document.createElement("div");
  bar.className = "suggestion-refresh-row";
  const text = document.createElement("span");
  text.textContent = "Suggesties";
  bar.append(text, createSuggestionRefreshButton());
  return bar;
}

function createSuggestionRefreshButton() {
  const refresh = document.createElement("button");
  refresh.type = "button";
  refresh.className = "start-refresh";
  refresh.textContent = "Nieuwe suggesties";
  refresh.addEventListener("click", (event) => {
    event.stopPropagation();
    state.startSuggestionPage += 1;
    render();
  });
  return refresh;
}

function createStartControls() {
  const controls = document.createElement("div");
  controls.className = "start-controls";

  controls.append(
    createStartChoiceGroup(
      "Format",
      Object.entries(BATTLE_FORMATS).map(([value, config]) => ({
        value,
        label: config.label,
        note: `Team van 6, kies ${config.selectionSize} voor battle`
      })),
      state.battleFormat,
      (value) => {
        state.battleFormat = value;
        battleFormatSelect.value = value;
        state.startSuggestionPage = 0;
        syncBattleSelection();
        optimizeTeamSets();
        render();
      }
    )
  );

  controls.append(
    createStartChoiceGroup(
      "Teamplan",
      Object.entries(TEAM_STYLES).map(([value, config]) => ({
        value,
        label: config.label,
        note: config.description
      })),
      state.teamStyle,
      (value) => {
        state.teamStyle = value;
        teamStyleSelect.value = value;
        state.startSuggestionPage = 0;
        optimizeTeamSets();
        render();
      }
    )
  );

  return controls;
}

function createStartChoiceGroup(label, options, current, onSelect) {
  const group = document.createElement("div");
  group.className = "start-control";

  const caption = document.createElement("span");
  caption.className = "start-control-label";
  caption.textContent = label;

  const choices = document.createElement("div");
  choices.className = "start-choice-buttons";
  options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `start-choice${option.value === current ? " active" : ""}`;
    button.title = option.note;
    button.textContent = option.label;
    button.addEventListener("click", () => onSelect(option.value));
    choices.append(button);
  });

  group.append(caption, choices);
  return group;
}

function createStartDashboard() {
  const dashboard = document.createElement("div");
  dashboard.className = "start-dashboard";

  startGuidanceItems().forEach(([label, value]) => {
    const item = document.createElement("div");
    const caption = document.createElement("span");
    caption.textContent = label;
    const text = document.createElement("strong");
    text.textContent = value;
    item.append(caption, text);
    dashboard.append(item);
  });

  return dashboard;
}

function startGuidanceItems() {
  const concern = mainTypeConcern();
  const missingRole = roleCoverage().find((role) => !role.done);
  const mega = state.team.find(usesMegaSlot);

  return [
    ["Type aandacht", concern ? `${concern.type}: ${concern.weak} zwak, geen antwoord` : "Geen grote gedeelde zwakte"],
    ["Rol mist", missingRole ? missingRole.label : "Basisrollen op orde"],
    ["Mega-slot", mega ? displayPokemonName(mega) : "Nog vrij"]
  ];
}

function mainTypeConcern() {
  return teamTypeSummary().find((item) => item.weak >= 2 && item.resist + item.immune === 0);
}

function createStarterPick(pokemon, reason = starterReason(pokemon)) {
  const card = document.createElement("article");
  card.className = "starter-pick";

  const spriteWrap = document.createElement("button");
  spriteWrap.type = "button";
  spriteWrap.className = "starter-sprite-wrap";
  spriteWrap.title = `Bekijk details van ${displayPokemonName(pokemon)}`;
  spriteWrap.addEventListener("click", () => showPokemonDetails(pokemon));

  const sprite = document.createElement("img");
  sprite.src = spriteUrl(pokemon.name);
  sprite.alt = "";
  sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, pokemon.name), { once: true });
  spriteWrap.append(sprite);

  const body = document.createElement("span");
  body.className = "starter-pick-body";
  const name = document.createElement("strong");
  name.textContent = displayPokemonName(pokemon);
  const meta = document.createElement("span");
  meta.className = "starter-pick-meta";
  meta.textContent = `BST ${pokemon.bst} · ${pokemon.types.join(" / ")}`;
  const note = document.createElement("span");
  note.className = "starter-pick-note";
  note.textContent = reason;
  const risk = document.createElement("span");
  risk.className = "starter-pick-risk";
  risk.textContent = starterRisk(pokemon);
  const extra = document.createElement("span");
  extra.className = "starter-pick-extra";
  extra.textContent = starterExtraInfo(pokemon);
  body.append(name, meta, note, extra, risk);

  const actions = document.createElement("span");
  actions.className = "starter-pick-actions";

  const details = document.createElement("button");
  details.type = "button";
  details.className = "starter-action secondary";
  details.textContent = "Details";
  details.addEventListener("click", () => {
    renderWithoutScrollJump(() => {
      state.selected = pokemon;
      render();
    });
  });

  const add = document.createElement("button");
  add.type = "button";
  add.className = "starter-action primary";
  add.textContent = "Voeg toe";
  const legality = teamLegality(pokemon);
  add.disabled = !legality.ok;
  add.title = legality.ok ? "Voeg toe aan team" : legality.reason;
  add.addEventListener("click", () => {
    renderWithoutScrollJump(() => {
      state.selected = pokemon;
      addToTeam(pokemon, { deferRender: true });
    });
  });
  actions.append(details, add);

  card.append(spriteWrap, body, actions);
  return card;
}

function starterExtraInfo(pokemon) {
  const build = selectedBuild(pokemon);
  const role = displayRoleForBuild(pokemon, build);
  const offense = pokemon.atk >= pokemon.spa ? `Atk ${pokemon.atk}` : `SpA ${pokemon.spa}`;
  return `${role} · ${offense} · Spe ${pokemon.spe} · ${preferredAbility(pokemon)} · ${setQualityLabel(build)}`;
}

function createStarterGroup(group) {
  const section = document.createElement("section");
  section.className = "starter-section";

  const head = document.createElement("div");
  head.className = "starter-section-head";
  const title = document.createElement("h3");
  title.textContent = group.title;
  const description = document.createElement("p");
  description.textContent = group.description;
  head.append(title, description);

  if (group.needs?.length) {
    head.append(createChoiceNeeds(group.needs));
  }

  const picks = document.createElement("div");
  picks.className = "starter-picks";
  if (group.items.length) {
    group.items.forEach(({ pokemon, reason }) => {
      picks.append(createStarterPick(pokemon, reason));
    });
  } else {
    const empty = document.createElement("p");
    empty.className = "starter-empty";
    empty.textContent = "Maak een plek vrij om nieuwe aanbevelingen te zien.";
    picks.append(empty);
  }

  section.append(head, picks);
  return section;
}

function createChoiceNeeds(needs) {
  const list = document.createElement("div");
  list.className = "choice-need-list";
  needs.forEach((need) => {
    const item = document.createElement("div");
    item.className = `choice-need ${need.done ? "done" : "open"}`;
    const mark = document.createElement("span");
    mark.textContent = need.done ? "OK" : "Nodig";
    const text = document.createElement("strong");
    text.textContent = need.label;
    const note = document.createElement("small");
    note.textContent = need.note;
    item.append(mark, text, note);
    list.append(item);
  });
  return list;
}

function createTeamNeedsPanel() {
  const panel = document.createElement("section");
  panel.className = "starter-section team-needs-panel";

  const head = document.createElement("div");
  head.className = "starter-section-head";
  const title = document.createElement("h3");
  title.textContent = "Waarom deze richting?";
  const description = document.createElement("p");
  description.textContent = state.team.length >= maxTeamSize()
    ? "De app checkt nu je rollen en resterende aandachtspunten."
    : "De app kijkt nu vooral naar open teamgaten.";
  head.append(title, description);

  const list = document.createElement("div");
  list.className = "team-need-list";
  currentTeamNeeds().forEach((need) => {
    const item = document.createElement("div");
    item.className = `team-need ${need.done ? "done" : "open"}`;
    const mark = document.createElement("span");
    mark.textContent = need.done ? "OK" : "Let op";
    const text = document.createElement("strong");
    text.textContent = need.label;
    const note = document.createElement("small");
    note.textContent = need.note;
    item.append(mark, text, note);
    list.append(item);
  });

  panel.append(head, list);
  return panel;
}

function startSuggestionGroups() {
  if (state.team.length) {
    return [{
      title: state.team.length >= maxTeamSize() ? "Controleer je team" : "Beste volgende keuzes",
      description: state.team.length >= maxTeamSize()
        ? "Je team is vol. Dit overzicht laat zien welke rollen nog aandacht vragen."
        : "Dynamisch gekozen op basis van wat je team nu nog nodig heeft.",
      items: recommendedStartPicks(),
      needs: currentTeamNeeds()
    }];
  }

  const used = new Set();
  const baseStarters = starterPokemon();
  const rotate = baseStarters.length ? state.startSuggestionPage % baseStarters.length : 0;
  const safeStarters = [...baseStarters.slice(rotate), ...baseStarters.slice(0, rotate)].slice(0, 3).map((pokemon) => {
    used.add(pokemon.name);
    return { pokemon, reason: starterReason(pokemon) };
  });

  const planPicks = planStartCandidates(used);

  const groups = [
    {
      title: "Veilige starters",
      description: "Sterke eerste keuzes die weinig voorkennis vragen.",
      items: safeStarters,
      refreshable: true
    },
    {
      title: "Alternatieven voor je plan",
      description: "Aanvallende druk, defensieve veiligheid en tempo in een compacte favorietenwaardige selectie.",
      items: planPicks,
      refreshable: true
    }
  ];

  return groups.filter((group) => group.items.length);
}

function planStartCandidates(used) {
  const page = state.startSuggestionPage;
  if (state.teamStyle === "rain") {
    return [
      ...namedStartCandidates(
        ["Gyarados", "Rotom-Wash", "Tauros-Paldea-Aqua", "Beartic", "Floatoy"],
        "Profiteert van rain of helpt tegen Electric/Grass-checks.",
        used,
        page + 1
      ),
      ...topStartCandidates(
        (pokemon) => pokemon.types.includes("Electric") || pokemon.types.includes("Grass") || pokemon.types.includes("Steel"),
        2,
        "Dekt checks af die rain-teams vaak lastig vinden.",
        used,
        page + 2
      )
    ].slice(0, 3);
  }

  if (state.teamStyle === "sun") {
    return [
      ...namedStartCandidates(
        ["Jumbao", "Astrolotl", "Scovillain", "Malaconda", "Victreebel"],
        "Profiteert van sun of helpt Fire-resists onder druk zetten.",
        used,
        page + 1
      ),
      ...topStartCandidates(
        (pokemon) => pokemon.types.includes("Ground") || pokemon.types.includes("Dragon"),
        2,
        "Helpt tegen Fire-resists en typische sun-checks.",
        used,
        page + 2
      )
    ].slice(0, 3);
  }

  if (state.teamStyle === "trickroom") {
    return [
      ...namedStartCandidates(
        ["Torkoal", "Slowking", "Hydrapple", "Slowking-Galar", "Toxapex"],
        "Langzaam, stevig of sterk genoeg om onder Trick Room waarde te halen.",
        used,
        page + 1
      ),
      ...topStartCandidates(
        (pokemon) => pokemon.spe <= 65 && Math.max(pokemon.atk, pokemon.spa) >= 110,
        2,
        "Sterke langzame aanvaller die onder Trick Room druk zet.",
        used,
        page + 2
      )
    ].slice(0, 3);
  }

  if (state.teamStyle === "doublesupport") {
    return [
      ...namedStartCandidates(
        ["Gyarados", "Maushold", "Kerfluffle", "Cawmodore", "Klefki"],
        "Ondersteunt partners met utility, Intimidate, speed-control of veilige dekking.",
        used,
        page + 1
      ),
      ...topStartCandidates(
        (pokemon) => hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster") || hasAbility(pokemon, "Friend Guard"),
        2,
        "Biedt nuttige support in Double 4v4.",
        used,
        page + 2
      )
    ].slice(0, 3);
  }

  if (state.teamStyle === "offense") {
    return [
      ...topStartCandidates(
        (pokemon) => pokemon.spe >= 105 || roleFor(pokemon).label === "Sweeper",
        1,
        "Snel tempo om druk te houden.",
        used,
        page
      ),
      ...topStartCandidates(
        (pokemon) => Math.max(pokemon.atk, pokemon.spa) >= 130 || roleFor(pokemon).label === "Wallbreaker",
        2,
        (pokemon) => `${pokemon.atk >= pokemon.spa ? "Fysieke" : "Speciale"} breaker voor directe KOs.`,
        used,
        page + 1
      )
    ];
  }

  if (state.teamStyle === "bulky") {
    return [
      ...topStartCandidates(
        (pokemon) => pokemon.hp + pokemon.def + pokemon.spd >= 310 || roleFor(pokemon).label === "Wall",
        1,
        "Stevige switch-in die beginners meer foutmarge geeft.",
        used,
        page
      ),
      ...topStartCandidates(
        (pokemon) => defensiveMultiplier(pokemon.types, "Ground") === 0 || pokemon.types.includes("Steel") || pokemon.types.includes("Poison"),
        1,
        "Helpt tegen veel voorkomende aanvallende types.",
        used,
        page + 1
      ),
      ...topStartCandidates(
        (pokemon) => Math.max(pokemon.atk, pokemon.spa) >= 120,
        1,
        "Voorkomt dat een bulky team te passief wordt.",
        used,
        page + 2
      )
    ];
  }

  return [
    ...topStartCandidates(
      (pokemon) => Math.max(pokemon.atk, pokemon.spa) >= 125 || roleFor(pokemon).label === "Wallbreaker",
      1,
      (pokemon) => `${pokemon.atk >= pokemon.spa ? "Fysieke" : "Speciale"} druk met hoge basisstats.`,
      used,
      page
    ),
    ...topStartCandidates(
      (pokemon) => pokemon.hp + pokemon.def + pokemon.spd >= 300 || roleFor(pokemon).label === "Wall",
      1,
      "Geeft je team een steviger defensief anker.",
      used,
      page + 1
    ),
    ...topStartCandidates(
      (pokemon) => pokemon.spe >= 110 || usesMegaSlot(pokemon),
      1,
      (pokemon) => usesMegaSlot(pokemon) ? "Sterke Mega-optie; let op de 1-Mega-regel." : "Helpt om sneller druk te zetten.",
      used,
      page + 2
    )
  ];
}

function topStartCandidates(predicate, limit, reason, used = new Set(), page = 0) {
  const candidates = state.pokemon
    .filter((pokemon) => !used.has(pokemon.name))
    .filter(predicate)
    .sort((a, b) => b.bst - a.bst || Math.max(b.atk, b.spa, b.spe) - Math.max(a.atk, a.spa, a.spe));

  const start = candidates.length ? (page * limit) % candidates.length : 0;
  return [...candidates.slice(start), ...candidates.slice(0, start)]
    .slice(0, limit)
    .map((pokemon) => {
      used.add(pokemon.name);
      return {
        pokemon,
        reason: typeof reason === "function" ? reason(pokemon) : reason
      };
    });
}

function namedStartCandidates(names, reason, used = new Set(), page = 0) {
  const candidates = names
    .map((name) => state.pokemon.find((pokemon) => pokemon.name === name))
    .filter(Boolean)
    .filter((pokemon) => !used.has(pokemon.name));

  const start = candidates.length ? page % candidates.length : 0;
  return [...candidates.slice(start), ...candidates.slice(0, start)]
    .slice(0, 3)
    .map((pokemon) => {
      used.add(pokemon.name);
      return {
        pokemon,
        reason: typeof reason === "function" ? reason(pokemon) : reason
      };
    });
}

function hasAbility(pokemon, ability) {
  return pokemon.abilities.some((item) => item === ability);
}

function recommendedStartPicks() {
  if (state.team.length) return suggestedPokemon(5);

  return starterPokemon().map((pokemon) => ({
    pokemon,
    reason: starterReason(pokemon)
  }));
}

function starterReason(pokemon) {
  const role = roleFor(pokemon).label;
  if (role === "Wallbreaker") return "Sterke aanvaller om mee te beginnen.";
  if (role === "Sweeper") return "Snel en gevaarlijk als winconditie.";
  if (role === "Wall") return "Stevige keuze voor veilige wissels.";
  if (role === "Speed control") return "Geeft je team direct meer snelheid.";
  return "Flexibele keuze voor balans.";
}

function starterRisk(pokemon) {
  const weaknesses = TYPES
    .filter((type) => defensiveMultiplier(pokemon.types, type) > 1)
    .slice(0, 3);
  if (!weaknesses.length) return "Typeprofiel: weinig duidelijke zwaktes.";
  return `Let op: zwak voor ${weaknesses.join(", ")}.`;
}

function starterPokemon() {
  const namesByStyle = {
    balanced: ["Garchomp", "Volcarona", "Dragonite", "Heatran", "Rotom-Wash", "Clefable"],
    offense: ["Dragapult", "Garchomp", "Volcarona", "Dragonite", "Aurumoth", "Palafin-Hero"],
    bulky: ["Rotom-Wash", "Clefable", "Heatran", "Tyranitar", "Corviknight", "Ferrothorn"],
    rain: ["Pelipper", "Politoed", "Basculegion", "Gyarados", "Rotom-Wash", "Tauros-Paldea-Aqua"],
    sun: ["Torkoal", "Charizard-Mega-Y", "Venusaur-Mega", "Ninetales", "Jumbao", "Astrolotl"],
    trickroom: ["Hatterene", "Reuniclus", "Slowbro", "Slowking", "Torkoal", "Hydrapple"],
    doublesupport: ["Incineroar", "Whimsicott", "Tomohawk", "Gyarados", "Maushold", "Kerfluffle"]
  };
  const names = namesByStyle[state.teamStyle] ?? namesByStyle.balanced;
  return names
    .map((name) => state.pokemon.find((pokemon) => pokemon.name === name))
    .filter(Boolean);
}

function createCard(pokemon) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);
  const mainButton = node.querySelector(".card-button");
  const addButton = node.querySelector(".add-button");
  const sprite = node.querySelector(".sprite");
  const spriteWrap = node.querySelector(".sprite-wrap");

  node.classList.toggle("selected", state.selected?.name === pokemon.name);
  node.classList.toggle("expanded", state.expandedCards.includes(pokemon.name));
  node.querySelector(".name").textContent = displayPokemonName(pokemon);
  node.querySelector(".bst").textContent = `BST ${pokemon.bst}`;
  node.querySelector(".types").replaceChildren(...pokemon.types.map(createTypeChip), createRolePill(pokemon));
  node.querySelector(".abilities").textContent = pokemon.abilities.join(" / ");
  if (state.moveFilters.length) {
    node.querySelector(".card-main").append(createMoveMatchBadges(pokemon));
  }
  const legality = teamLegality(pokemon);
  addButton.disabled = !legality.ok;
  addButton.title = legality.ok ? "Toevoegen aan team" : legality.reason;
  const actions = document.createElement("div");
  actions.className = "card-extra-actions";
  const favorite = document.createElement("button");
  favorite.type = "button";
  const isFavorite = state.favorites.includes(pokemon.name);
  favorite.className = `mini-action icon-action favorite-card-action${isFavorite ? " active" : ""}`;
  favorite.textContent = isFavorite ? "♥" : "♡";
  favorite.setAttribute("aria-label", isFavorite ? "Verwijder uit favorieten" : "Zet bij favorieten");
  favorite.title = state.favorites.includes(pokemon.name) ? "Verwijder uit favorieten" : "Zet bij favorieten";
  favorite.addEventListener("mousedown", (event) => event.preventDefault());
  favorite.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(pokemon);
  });
  const compare = document.createElement("button");
  compare.type = "button";
  compare.className = `mini-action${state.compare.includes(pokemon.name) ? " active" : ""}`;
  compare.textContent = state.compare.includes(pokemon.name) ? "In vergelijk" : "Vergelijk";
  compare.title = state.compare.includes(pokemon.name) ? "Verwijder uit vergelijking" : "Voeg toe aan vergelijking (max 6)";
  compare.addEventListener("mousedown", (event) => event.preventDefault());
  compare.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCompare(pokemon);
  });
  const autoTeam = document.createElement("button");
  autoTeam.type = "button";
  autoTeam.className = "mini-action auto-team-action";
  autoTeam.textContent = "Auto";
  autoTeam.title = `Bouw automatisch een team rond ${displayPokemonName(pokemon)}`;
  autoTeam.addEventListener("mousedown", (event) => event.preventDefault());
  autoTeam.addEventListener("click", (event) => {
    event.stopPropagation();
    buildTeamAround(pokemon, state.teamStyle);
  });
  actions.append(favorite, compare, autoTeam);
  node.append(actions);

  const expand = document.createElement("button");
  expand.type = "button";
  const isExpanded = state.expandedCards.includes(pokemon.name);
  expand.className = `card-expand-button${isExpanded ? " expanded" : ""}`;
  expand.title = isExpanded ? "Minder info" : "Meer info";
  expand.setAttribute("aria-label", isExpanded ? "Minder info" : "Meer info");
  expand.setAttribute("aria-expanded", String(isExpanded));
  expand.innerHTML = `<span aria-hidden="true"></span>`;
  expand.addEventListener("mousedown", (event) => event.preventDefault());
  expand.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCardExpanded(pokemon);
  });
  node.append(expand);

  if (state.expandedCards.includes(pokemon.name)) {
    const extra = document.createElement("div");
    extra.className = "card-expanded-info";
    extra.innerHTML = cardExpandedInfoHtml(pokemon);
    node.append(extra);
  }

  sprite.src = spriteUrl(pokemon.name);
  sprite.alt = pokemon.name;
  spriteWrap.title = `Bekijk details van ${displayPokemonName(pokemon)}`;
  sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, pokemon.name), { once: true });

  mainButton.addEventListener("mousedown", (event) => event.preventDefault());
  mainButton.addEventListener("click", () => {
    showPokemonDetails(pokemon);
  });

  addButton.addEventListener("mousedown", (event) => event.preventDefault());
  addButton.addEventListener("click", () => {
    addButton.disabled = true;
    showGlobalBusy(`Voeg ${displayPokemonName(pokemon)} toe`);
    renderWithoutScrollJump(() => {
      state.selected = pokemon;
      const added = addToTeam(pokemon, { deferRender: true });
      if (!added) {
        hideGlobalBusy();
        addButton.disabled = false;
        return;
      }
      window.setTimeout(() => {
        const currentLegality = teamLegality(pokemon);
        hideGlobalBusy();
        addButton.disabled = !currentLegality.ok;
        addButton.title = currentLegality.ok ? "Toevoegen aan team" : currentLegality.reason;
      }, 700);
    });
  });
  return node;
}

function createMoveMatchBadges(pokemon) {
  const result = moveFilterResult(pokemon);
  const wrap = document.createElement("span");
  wrap.className = "move-match-badges";
  result.known.forEach((move) => {
    const details = moveDetails(move);
    const badge = document.createElement("span");
    badge.style.setProperty("--type-color", TYPE_COLORS[details.type] || "#6657dc");
    badge.textContent = move;
    wrap.append(badge);
  });
  return wrap;
}

function toggleCardExpanded(pokemon) {
  state.expandedCards = state.expandedCards.includes(pokemon.name)
    ? state.expandedCards.filter((name) => name !== pokemon.name)
    : [pokemon.name, ...state.expandedCards].slice(0, 8);
  render();
}

function cardExpandedInfoHtml(pokemon) {
  const build = selectedBuild(pokemon);
  const weaknesses = TYPES
    .filter((type) => defensiveMultiplier(pokemon.types, type) > 1)
    .slice(0, 4);
  const stats = [
    ["Aanval", Math.max(pokemon.atk, pokemon.spa)],
    ["Bulk", pokemon.hp + pokemon.def + pokemon.spd],
    ["Speed", pokemon.spe],
    ["Set", setQualityLabel(build)]
  ];
  return `
    <div class="card-info-grid">
      ${stats.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span>`).join("")}
    </div>
    <p>${escapeHtml(suggestionExplanation(pokemon, formatFitLabel(pokemon)))}</p>
    <div class="card-info-tags">
      <span>${escapeHtml(build.item || "Geen item")}</span>
      <span>${escapeHtml(build.ability || preferredAbility(pokemon))}</span>
      ${weaknesses.map((type) => `<span>zwak: ${escapeHtml(type)}</span>`).join("")}
    </div>
  `;
}

function toggleFavorite(pokemon) {
  state.favorites = state.favorites.includes(pokemon.name)
    ? state.favorites.filter((name) => name !== pokemon.name)
    : [pokemon.name, ...state.favorites].slice(0, 24);
  saveFavorites();
  render();
}

function toggleCompare(pokemon) {
  if (state.compare.includes(pokemon.name)) {
    state.compare = state.compare.filter((name) => name !== pokemon.name);
  } else {
    state.compare = [...state.compare, pokemon.name].slice(-6);
  }
  state.compareMinimized = false;
  renderTeamAnalysis();
  render();
}

function showPokemonDetails(pokemon) {
  state.selected = pokemon;
  renderDetail(pokemon);
  renderTeamSlots();
  window.requestAnimationFrame(() => {
    scrollDetailPanelToTop();
  });
}

function scrollDetailPanelToTop() {
  const teamCard = document.querySelector(".side-panel > .team");
  if (!sidePanel || !detailPanel || !teamCard) {
    detailPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const stickySpace = teamCard.offsetHeight + 14;
  sidePanel.scrollTo({
    top: Math.max(0, detailPanel.offsetTop - stickySpace),
    behavior: "smooth"
  });
  sidePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderDetail(pokemon) {
  if (!pokemon) {
    detailPanel.innerHTML = `<p class="empty-detail">Kies een Pokémon om stats en details te bekijken.</p>`;
    return;
  }

  detailPanel.replaceChildren();
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="detail-head">
      <span class="sprite-wrap"><img class="sprite" src="${spriteUrl(pokemon.name)}" alt="${escapeHtml(pokemon.name)}"></span>
      <div>
      <h2>${escapeHtml(displayPokemonName(pokemon))}</h2>
        <div class="types">${pokemon.types.map(typeChipHtml).join("")}</div>
      </div>
    </div>
    ${detailTypeMatchupsHtml(pokemon)}
    ${teamAroundBuilderHtml(pokemon)}
    <div class="quick-facts detail-facts">
      <div class="fact compact"><span>BST</span><strong>${pokemon.bst}</strong></div>
      <div class="fact compact"><span>Hoogte</span><strong>${formatNumber(pokemon.height)} m</strong></div>
      <div class="fact compact"><span>Gewicht</span><strong>${formatNumber(pokemon.weight)} kg</strong></div>
      <div class="fact wide"><span>Abilities</span><strong>${escapeHtml(pokemon.abilities.join(" / "))}</strong></div>
      <div class="fact compact"><span>Rol</span><strong>${escapeHtml(roleFor(pokemon).label)}</strong></div>
    </div>
    <p class="role-note">${escapeHtml(roleFor(pokemon).description)}</p>
    ${buildAdviceHtml(pokemon)}
    ${trainingOverviewHtml(pokemon)}
  `;
  wrapper.querySelector(".detail-head .sprite").addEventListener("error", (event) => {
    showSpriteFallback(event.target.closest(".sprite-wrap"), pokemon.name);
  }, { once: true });
  wrapper.querySelectorAll(".set-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSets[pokemon.name] = button.dataset.setId;
      state.manualSets[pokemon.name] = true;
      invalidateCache("battle");
      renderDetail(pokemon);
      if (state.team.some((member) => member.name === pokemon.name)) {
        renderTeamAnalysis();
        renderTeamWorkbench();
        renderBattleSim();
      }
    });
  });
  const aroundStyle = wrapper.querySelector(".team-around-style");
  const aroundText = wrapper.querySelector(".team-around-description");
  aroundStyle?.addEventListener("change", () => {
    const plan = TEAM_STYLES[aroundStyle.value] ?? TEAM_STYLES[state.teamStyle];
    if (aroundText) aroundText.textContent = plan.description;
  });
  wrapper.querySelector(".team-around-action")?.addEventListener("click", () => {
    buildTeamAround(pokemon, aroundStyle?.value ?? state.teamStyle);
  });
  detailPanel.append(wrapper);
}

function detailTypeMatchupsHtml(pokemon) {
  const strong = TYPES
    .filter((type) => pokemon.types.some((attackType) => defensiveMultiplier([type], attackType) > 1))
    .slice(0, 6);
  const weak = TYPES
    .filter((type) => defensiveMultiplier(pokemon.types, type) > 1)
    .slice(0, 6);
  return `
    <div class="detail-type-matchups">
      <div><span>Sterk tegen</span><strong>${strong.length ? strong.map(typeChipHtml).join("") : "geen duidelijke"}</strong></div>
      <div><span>Zwak tegen</span><strong>${weak.length ? weak.map(typeChipHtml).join("") : "geen duidelijke"}</strong></div>
    </div>
  `;
}

function teamAroundBuilderHtml(pokemon) {
  const options = Object.entries(TEAM_STYLES)
    .map(([value, config]) => `
      <option value="${value}"${value === state.teamStyle ? " selected" : ""}>${escapeHtml(config.label)}</option>
    `)
    .join("");
  const plan = TEAM_STYLES[state.teamStyle];
  return `
    <div class="team-around-builder">
      <div class="set-head">
        <h3>Bouw verder rond je core</h3>
        <span>Team van 6</span>
      </div>
      <p class="team-around-description">${escapeHtml(plan.description)}</p>
      <div class="team-around-controls">
        <label>
          <span>Teamplan</span>
          <select class="team-around-style">${options}</select>
        </label>
        <button class="team-around-action" type="button">Bouw rond ${escapeHtml(displayPokemonName(pokemon))}</button>
      </div>
    </div>
  `;
}

function trainingOverviewHtml(pokemon) {
  const build = selectedBuild(pokemon);
  const trainingPokemon = trainingStatsPokemon(pokemon);
  const safeSp = safeSelectedSp(build.evs);
  const sp = parseSp(safeSp);
  const stats = statEntries(trainingPokemon);
  const basePoints = radarPoints(stats.map(([, value]) => value));
  const trainedStats = stats.map(([label, value]) => [label, trainedStatValue(value, sp[label] ?? 0, label, build.nature)]);
  const trainedPoints = radarPoints(trainedStats.map(([, value]) => value));
  const radarAxes = stats.map(([, value], index) => radarAxis(value, index)).join("");
  const radarDots = trainedStats.map(([, value], index) => radarDot(value, index)).join("");

  return `
    <div class="training-overview">
      <div class="set-head">
        <h3>Stats & training</h3>
        <span>BST ${trainingPokemon.bst} · 66 SP</span>
      </div>
      <div class="training-body">
        <svg class="stat-radar" viewBox="0 0 120 120" role="img" aria-label="Stat radar">
          <polygon class="radar-grid" points="${radarPoints([160, 160, 160, 160, 160, 160])}"></polygon>
          <polygon class="radar-mid" points="${radarPoints([100, 100, 100, 100, 100, 100])}"></polygon>
          ${radarAxes}
          <polygon class="radar-base" points="${basePoints}"></polygon>
          <polygon class="radar-trained" points="${trainedPoints}"></polygon>
          ${radarDots}
          ${stats.map(([label], index) => radarLabel(label, index)).join("")}
        </svg>
        <div class="stat-training-list">
          <div class="stat-training-header">
            <span>Stat</span><span>Base</span><span>SP</span><span>Final</span>
          </div>
          ${stats.map(([label, value]) => statTrainingRow(label, value, sp[label] ?? 0, build.nature)).join("")}
        </div>
      </div>
      <div class="sp-summary">${escapeHtml(safeSp)}</div>
    </div>
  `;
}

function trainingStatsPokemon(pokemon) {
  if (!isMega(pokemon)) return pokemon;
  return state.pokemon.find((candidate) => candidate.name === baseSpecies(pokemon.name)) ?? pokemon;
}

function statEntries(pokemon) {
  return [
    ["HP", pokemon.hp],
    ["Atk", pokemon.atk],
    ["Def", pokemon.def],
    ["SpA", pokemon.spa],
    ["SpD", pokemon.spd],
    ["Spe", pokemon.spe]
  ];
}

function statTrainingRow(label, value, sp, nature) {
  const trained = trainedStatValue(value, sp, label, nature);
  const spLevel = Math.min(1, sp / SP_STAT_LIMIT);
  const statLevel = Math.min(1, trained / 220);
  const spColor = valueScaleColor(spLevel);
  const statColor = valueScaleColor(statLevel);
  return `
    <div class="stat-training-row" style="--sp-level:${spLevel};--stat-level:${statLevel};--sp-color:${spColor};--stat-color:${statColor}">
      <strong>${label}</strong>
      <span>${value}</span>
      <strong class="sp-value">${sp}</strong>
      <span class="trained-stat"><span class="meter"><span style="width:${Math.min(100, trained / 220 * 100)}%"></span></span><strong>${trained}</strong></span>
    </div>
  `;
}

function valueScaleColor(level) {
  const stops = [
    [0, "#39bdda"],
    [0.35, "#64cf6f"],
    [0.6, "#ffd166"],
    [0.78, "#f0a018"],
    [1, "#e34b77"]
  ];
  const clamped = Math.max(0, Math.min(1, level));
  for (let index = 1; index < stops.length; index += 1) {
    const [stop, color] = stops[index];
    const [prevStop, prevColor] = stops[index - 1];
    if (clamped <= stop) {
      const local = (clamped - prevStop) / (stop - prevStop || 1);
      return mixHex(prevColor, color, local);
    }
  }
  return stops.at(-1)[1];
}

function mixHex(a, b, amount) {
  const parse = (hex) => hex.match(/\w\w/g).map((part) => Number.parseInt(part, 16));
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const channel = (start, end) => Math.round(start + (end - start) * amount).toString(16).padStart(2, "0");
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
}

function trainedStatValue(base, sp, stat, nature) {
  return pureTrainedStatValue(base, sp, stat, nature);
}

function parseSp(spread) {
  return pureParseSp(spread);
}

function radarPoints(values) {
  const center = 60;
  const maxRadius = 43;
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / values.length);
    const radius = Math.min(1, value / 220) * maxRadius;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  }).join(" ");
}

function radarPoint(value, index, maxRadius = 43) {
  const center = 60;
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 6);
  const radius = Math.min(1, value / 220) * maxRadius;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius
  };
}

function radarAxis(value, index) {
  const outer = radarPoint(160, index);
  const level = Math.min(1, value / 220);
  return `<line class="radar-axis" x1="60" y1="60" x2="${outer.x}" y2="${outer.y}" style="--axis-color:${valueScaleColor(level)}"></line>`;
}

function radarDot(value, index) {
  const point = radarPoint(value, index);
  const level = Math.min(1, value / 220);
  const radius = value >= 180 ? 3.7 : value >= 140 ? 3.2 : 2.8;
  return `<circle class="radar-dot" cx="${point.x}" cy="${point.y}" r="${radius}" style="--dot-color:${valueScaleColor(level)}"></circle>`;
}

function radarLabel(label, index) {
  const center = 60;
  const radius = 54;
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 6);
  const x = center + Math.cos(angle) * radius;
  const y = center + Math.sin(angle) * radius + 3;
  return `<text x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
}

function addToTeam(pokemon, { deferRender = false } = {}) {
  if (searchInput.value.trim()) {
    state.hasExplored = true;
    state.guideMode = false;
  }
  const legality = teamLegality(pokemon);
  if (!legality.ok) {
    state.teamNotice = legality.reason;
    renderTeamAnalysis();
    return false;
  }
  state.team.push(pokemon);
  syncBattleSelection();
  optimizeTeamSets();
  state.teamNotice = "";
  if (deferRender) {
    renderTeamSlots();
    renderDetail(pokemon);
    scheduleFullTeamRender();
  } else {
    renderTeam();
  }
  return true;
}

function renderTeam() {
  renderTeamSlots();
  renderTeamManager();
  renderTeamAnalysis();
  renderTeamOverview();
  renderTeamWorkbench();
}

function renderTeamSlots() {
  teamSlots.replaceChildren();
  renderFloatingTeamAction();
  renderBuilderQuickNav();
  document.querySelector(".team .panel-head h2").textContent = `Team`;
  document.querySelector(".team .team-inline-summary")?.remove();
  for (let index = 0; index < maxTeamSize(); index += 1) {
    const member = state.team[index];
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `team-slot${member ? " filled" : ""}${member && member.name === state.selected?.name ? " selected" : ""}`;
    if (member) {
      slot.innerHTML = `
        <img src="${spriteUrl(member.name)}" alt="">
      `;
      slot.title = displayPokemonName(member);
      slot.addEventListener("click", () => {
        state.selected = member;
        renderDetail(member);
        renderTeamSlots();
      });
      slot.querySelector("img").addEventListener("error", (event) => event.target.remove(), { once: true });
    } else {
      slot.classList.add("empty");
      slot.textContent = "";
      slot.title = `Slot ${index + 1} leeg`;
    }
    teamSlots.append(slot);
  }
  teamSlots.append(createTeamLabSlot());
}

function scheduleFullTeamRender() {
  if (state.cache.fullTeamRenderTimer) window.clearTimeout(state.cache.fullTeamRenderTimer);
  state.cache.fullTeamRenderTimer = window.setTimeout(() => {
    perfMeasure("renderDeferredTeam", () => {
      renderDetail(state.selected);
      renderTeam();
    });
  }, 600);
}

function createTeamLabSlot() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "team-lab-slot";
  button.setAttribute("aria-label", `Ga naar Team lab. Team heeft ${state.team.length} van 6 plekken gevuld.`);
  button.innerHTML = `<span>Team lab</span><strong>${state.team.length}/6</strong>`;
  button.addEventListener("click", () => {
    switchView("team");
    teamView.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return button;
}

function createTeamInlineSummary() {
  const wrap = document.createElement("div");
  wrap.className = "team-inline-summary";

  const facts = document.createElement("div");
  facts.className = "overview-grid";
  const missingRole = roleCoverage().find((role) => !role.done);
  const concern = teamTypeSummary().find((item) => item.weak >= 2 && item.resist + item.immune === 0);
  [
    ["Plan", TEAM_STYLES[state.teamStyle].label],
    ["Mega", state.team.find(usesMegaSlot) ? displayPokemonName(state.team.find(usesMegaSlot)) : "Nog vrij"],
    ["Rol mist", missingRole ? missingRole.label : "Basis op orde"],
    ["Type aandacht", concern ? concern.type : "Geen grote gedeelde zwakte"]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    facts.append(item);
  });

  const roster = document.createElement("div");
  roster.className = "overview-roster compact";
  const sourceCounts = state.team.reduce((counts, pokemon) => {
    const source = setSourceShort(selectedBuild(pokemon));
    counts[source] = (counts[source] ?? 0) + 1;
    return counts;
  }, {});
  Object.entries(sourceCounts).forEach(([source, count]) => {
    const row = document.createElement("div");
    row.className = "team-source-chip";
    row.innerHTML = `<span>${escapeHtml(source)}</span><strong>${count}</strong>`;
    roster.append(row);
  });

  wrap.append(facts, roster);
  return wrap;
}

function removeFromTeam(index) {
  const removed = state.team[index];
  if (removed && isCoreLocked(removed)) {
    state.teamNotice = `${displayPokemonName(removed)} is vastgezet als kern. Ontgrendel eerst om te verwijderen.`;
    renderTeamAnalysis();
    return;
  }
  state.team.splice(index, 1);
  if (removed) state.battleSelection = state.battleSelection.filter((name) => name !== removed.name);
  if (removed) state.lockedCore = state.lockedCore.filter((name) => name !== removed.name);
  state.teamNotice = "";
  if (!state.team.includes(state.selected)) {
    state.selected = state.team[0] ?? state.pokemon.find((pokemon) => pokemon.name === "Garchomp") ?? state.pokemon[0];
  }
  invalidateCache();
  syncBattleSelection();
  render();
}

function moveTeamMember(fromIndex, toIndex) {
  const result = pureReorderTeam(state.team, fromIndex, toIndex, {
    lockedNames: state.lockedCore,
    keepLockedSlotOne: true
  });
  if (!result.ok) {
    if (result.reason) state.teamNotice = result.reason;
    renderTeamAnalysis();
    return false;
  }
  state.team = result.team;
  state.teamNotice = "Teamslots bijgewerkt.";
  invalidateCache("battle");
  renderTeamSlots();
  renderTeamWorkbench();
  renderTeamPreviewAnalysis();
  renderBattleSim();
  return true;
}

function isCoreLocked(pokemonOrName) {
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName?.name;
  return Boolean(name && state.lockedCore.includes(name));
}

function lockedCoreMembers() {
  const byName = new Map(state.team.map((pokemon) => [pokemon.name, pokemon]));
  return state.lockedCore.map((name) => byName.get(name)).filter(Boolean);
}

function toggleCoreLock(pokemon) {
  state.lockedCore = isCoreLocked(pokemon)
    ? state.lockedCore.filter((name) => name !== pokemon.name)
    : [...state.lockedCore, pokemon.name];
  state.teamNotice = isCoreLocked(pokemon)
    ? `${displayPokemonName(pokemon)} vastgezet als kern.`
    : `${displayPokemonName(pokemon)} ontgrendeld.`;
  render();
}

function renderTeamManager() {
  if (!teamManager) return;
  teamManager.replaceChildren();
  teamManager.classList.toggle("is-empty", !state.savedTeams.length);

  const details = document.createElement("details");
  details.className = "team-manager-details";
  details.open = false;
  const head = document.createElement("summary");
  head.className = "team-manager-head";
  const title = document.createElement("strong");
  title.textContent = "Teams opslaan";
  const help = document.createElement("small");
  help.textContent = state.savedTeams.length
    ? `${state.savedTeams.length} opgeslagen team${state.savedTeams.length === 1 ? "" : "s"}`
    : "Bewaar je huidige team inclusief plan en preview.";
  head.append(title, help);

  const saveRow = document.createElement("div");
  saveRow.className = "team-manager-save";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Teamnaam";
  input.value = defaultTeamName();
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Team opslaan";
  save.disabled = !state.team.length;
  save.addEventListener("click", () => saveCurrentTeam(input.value));
  saveRow.append(input, save);

  const list = document.createElement("div");
  list.className = "saved-team-list";
  if (!state.savedTeams.length) {
    const empty = document.createElement("p");
    empty.textContent = "Nog geen opgeslagen teams.";
    list.append(empty);
  } else {
    state.savedTeams.forEach((team) => list.append(createSavedTeamRow(team)));
  }

  details.append(head, saveRow, list);
  teamManager.append(details);
}

function defaultTeamName() {
  const names = state.team.map(displayPokemonName).join(" + ");
  return names || `${BATTLE_FORMATS[state.battleFormat].label} team`;
}

function saveCurrentTeam(name) {
  const trimmed = String(name || defaultTeamName()).trim();
  const saved = {
    id: `${Date.now()}`,
    name: trimmed,
    format: state.battleFormat,
    teamStyle: state.teamStyle,
    members: state.team.map((pokemon) => pokemon.name),
    lockedCore: [...state.lockedCore],
    battleSelection: [...state.battleSelection],
    selectedSets: { ...state.selectedSets },
    customSets: { ...state.customSets },
    savedAt: new Date().toISOString()
  };
  state.savedTeams = [saved, ...state.savedTeams.filter((team) => team.name !== trimmed)].slice(0, 12);
  saveSavedTeams();
  renderTeamManager();
}

function createSavedTeamRow(savedTeam) {
  const row = document.createElement("div");
  row.className = "saved-team-row";
  const meta = document.createElement("span");
  meta.innerHTML = `
    <strong>${escapeHtml(savedTeam.name)}</strong>
    <small>${escapeHtml(BATTLE_FORMATS[savedTeam.format]?.label ?? savedTeam.format)} · ${escapeHtml(savedTeam.members.map(displayPokemonName).join(", "))}</small>
  `;
  const load = document.createElement("button");
  load.type = "button";
  load.textContent = "Laad";
  load.addEventListener("click", () => loadSavedTeam(savedTeam.id));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Verwijder";
  remove.addEventListener("click", () => {
    state.savedTeams = state.savedTeams.filter((team) => team.id !== savedTeam.id);
    saveSavedTeams();
    renderTeamManager();
  });
  row.append(meta, load, remove);
  return row;
}

function loadSavedTeam(id) {
  const saved = state.savedTeams.find((team) => team.id === id);
  if (!saved) return;
  const byName = new Map(state.pokemon.map((pokemon) => [pokemon.name, pokemon]));
  state.team = saved.members.map((name) => byName.get(name)).filter(Boolean).slice(0, maxTeamSize());
  state.battleFormat = saved.format in BATTLE_FORMATS ? saved.format : "single3";
  state.teamStyle = saved.teamStyle in TEAM_STYLES ? saved.teamStyle : "balanced";
  state.battleSelection = [...(saved.battleSelection ?? [])];
  state.lockedCore = [...(saved.lockedCore ?? [])].filter((name) => state.team.some((pokemon) => pokemon.name === name));
  syncBattleSelection();
  state.selectedSets = { ...(saved.selectedSets ?? {}) };
  state.manualSets = Object.fromEntries(Object.keys(state.selectedSets).map((name) => [name, true]));
  state.customSets = { ...state.customSets, ...(saved.customSets ?? {}) };
  battleFormatSelect.value = state.battleFormat;
  teamStyleSelect.value = state.teamStyle;
  state.selected = state.team[0] ?? state.selected;
  state.activeView = "team";
  invalidateCache();
  saveCustomSets();
  render();
}

function renderTeamWorkbench() {
  teamWorkbench.replaceChildren();
  renderTeamQuickNav();

  if (!state.team.length) {
    const empty = document.createElement("div");
    empty.className = "team-workbench-empty";
    empty.innerHTML = `
      <h3>Nog geen team</h3>
      <p>Ga naar de Builder-tab en voeg eerst een kern toe. Daarna kun je hier per slot sets, abilities, training en moves vergelijken.</p>
    `;
    teamWorkbench.append(empty);
    return;
  }

  teamWorkbench.append(createBattleCoreWorkbenchPanel());
  state.team.forEach((pokemon, index) => {
    teamWorkbench.append(createWorkbenchCard(pokemon, index));
  });
}

function createBattleCoreWorkbenchPanel() {
  const panel = document.createElement("section");
  panel.className = "battle-core-panel";
  const selectedNames = new Set(state.battleSelection);
  const core = selectedBattleMembers(state.team, state.battleSelection, BATTLE_FORMATS[state.battleFormat]);
  const bench = state.team.filter((pokemon) => !selectedNames.has(pokemon.name));

  const head = document.createElement("div");
  head.className = "battle-core-head";
  head.innerHTML = `
    <span>Battle core</span>
    <strong>${core.length}/${battleSelectionSize()} voor ${escapeHtml(BATTLE_FORMATS[state.battleFormat].label)}</strong>
    <small>Party blijft ${state.team.length}/6; deze ${battleSelectionSize()} sturen je analyse en battleplan.</small>
  `;

  const coreList = document.createElement("div");
  coreList.className = "battle-core-list";
  core.forEach((pokemon, index) => coreList.append(createBattleCoreChip(pokemon, index + 1, true)));

  const benchList = document.createElement("div");
  benchList.className = "battle-bench-list";
  bench.forEach((pokemon, index) => benchList.append(createBattleCoreChip(pokemon, index + 1, false)));

  const autoPick = document.createElement("button");
  autoPick.type = "button";
  autoPick.className = "analysis-action-button";
  autoPick.textContent = `Beste ${battleSelectionSize()}`;
  autoPick.disabled = state.team.length < battleSelectionSize();
  autoPick.addEventListener("click", () => {
    selectBestBattleTeam();
    state.teamNotice = `Battle core bijgewerkt voor ${BATTLE_FORMATS[state.battleFormat].label}.`;
    invalidateCache("battle");
    renderTeamPreviewAnalysis();
    renderTeamWorkbench();
    renderBattleSim();
  });

  panel.append(head, coreList);
  if (bench.length) {
    const benchTitle = document.createElement("span");
    benchTitle.className = "battle-bench-title";
    benchTitle.textContent = "Bench / roster-reserve";
    panel.append(benchTitle, benchList);
  }
  panel.append(autoPick);
  return panel;
}

function createBattleCoreChip(pokemon, index, selected) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `battle-core-chip${selected ? " selected" : ""}`;
  button.title = selected ? "Haal uit battle core" : "Zet in battle core";
  button.innerHTML = `
    <span>${selected ? index : "+"}</span>
    <img src="${spriteUrl(pokemon.name)}" alt="">
    <strong>${escapeHtml(displayPokemonName(pokemon))}</strong>
  `;
  button.addEventListener("click", () => {
    toggleBattleSelection(pokemon);
    renderTeamWorkbench();
  });
  button.querySelector("img").addEventListener("error", (event) => event.currentTarget.remove(), { once: true });
  return button;
}

function renderTeamQuickNav() {
  renderQuickNav(teamQuickNav, (pokemon) => {
    const card = teamWorkbench.querySelector(`[data-pokemon="${cssEscape(pokemon.name)}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderBuilderQuickNav() {
  renderQuickNav(builderTeamQuickNav, (pokemon) => {
    state.selected = pokemon;
    render();
    scrollDetailPanelToTop();
  });
}

function renderQuickNav(nav, onSelect) {
  if (!nav) return;
  nav.replaceChildren();
  nav.hidden = !state.team.length;
  if (!state.team.length) return;

  state.team.forEach((pokemon, index) => {
    const item = document.createElement("div");
    item.className = "team-quick-item";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-quick-button";
    button.setAttribute("aria-label", `Ga naar ${displayPokemonName(pokemon)}`);
    button.title = displayPokemonName(pokemon);
    button.innerHTML = `
      <span>${index + 1}</span>
      <img src="${spriteUrl(pokemon.name)}" alt="">
    `;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "team-quick-remove";
    remove.title = `Verwijder ${displayPokemonName(pokemon)}`;
    remove.textContent = "×";
    remove.disabled = isCoreLocked(pokemon);
    remove.title = isCoreLocked(pokemon)
      ? `${displayPokemonName(pokemon)} is vastgezet als kern`
      : `Verwijder ${displayPokemonName(pokemon)}`;
    button.querySelector("img").addEventListener("error", (event) => {
      event.currentTarget.remove();
      button.dataset.fallback = pokemon.name.slice(0, 2).toUpperCase();
    });
    button.addEventListener("click", () => onSelect(pokemon, index));
    remove.addEventListener("click", () => removeFromTeam(index));
    item.append(button, remove);
    nav.append(item);
  });
}

function battleSelectionSize() {
  return BATTLE_FORMATS[state.battleFormat].selectionSize;
}

function syncBattleSelection() {
  const teamNames = new Set(state.team.map((pokemon) => pokemon.name));
  state.battleSelection = state.battleSelection
    .filter((name) => teamNames.has(name))
    .slice(0, battleSelectionSize());
  if (state.team.length <= battleSelectionSize()) {
    state.battleSelection = state.team.map((pokemon) => pokemon.name);
  } else if (state.battleSelection.length < battleSelectionSize()) {
    const selected = new Set(state.battleSelection);
    state.team.forEach((pokemon) => {
      if (state.battleSelection.length < battleSelectionSize() && !selected.has(pokemon.name)) {
        state.battleSelection.push(pokemon.name);
        selected.add(pokemon.name);
      }
    });
  }
}

function syncOpponentSelection() {
  const opponentNames = new Set(state.opponentTeam.map((pokemon) => pokemon.name));
  state.opponentSelection = state.opponentSelection
    .filter((name) => opponentNames.has(name))
    .slice(0, battleSelectionSize());
  if (state.opponentTeam.length <= battleSelectionSize()) {
    state.opponentSelection = state.opponentTeam.map((pokemon) => pokemon.name);
  } else if (state.opponentSelection.length < battleSelectionSize()) {
    const selected = new Set(state.opponentSelection);
    state.opponentTeam.forEach((pokemon) => {
      if (state.opponentSelection.length < battleSelectionSize() && !selected.has(pokemon.name)) {
        state.opponentSelection.push(pokemon.name);
        selected.add(pokemon.name);
      }
    });
  }
}

function toggleBattleSelection(pokemon) {
  if (state.battleSelection.includes(pokemon.name)) {
    state.battleSelection = state.battleSelection.filter((name) => name !== pokemon.name);
  } else if (state.battleSelection.length < battleSelectionSize()) {
    state.battleSelection = [...state.battleSelection, pokemon.name];
  } else {
    state.teamNotice = `Je kiest maximaal ${battleSelectionSize()} Pokémon voor ${BATTLE_FORMATS[state.battleFormat].label}.`;
  }
  invalidateCache("battle");
  renderTeamPreviewAnalysis();
  if (state.activeView === "battle") renderBattleSim();
}

function renderBattleSim() {
  if (state.activeView !== "battle") {
    state.cache.battleDirty = true;
    return;
  }
  return perfMeasure("renderBattleSim", () => renderBattleSimContent());
}

function renderBattleSimContent() {
  if (!battleSim) return;
  setBusy(battleSim, true, state.cache.battleWorkLabel || "Battle sim bijwerken");
  try {
    syncBattleSelection();
    syncOpponentSelection();
    updateSimulationResult();
    battleSim.replaceChildren();

    if (!state.team.length) {
      battleSim.append(createBattleEmptyState("Nog geen team", "Bouw eerst een team in de Builder. Daarna kan de simulator je preview en matchups scannen.", "Naar Builder", "builder"));
      return;
    }

    if (state.team.length < battleSelectionSize()) {
      battleSim.append(createBattleEmptyState(
        "Team nog te klein",
        `${BATTLE_FORMATS[state.battleFormat].label} gebruikt ${battleSelectionSize()} Pokémon in preview. Voeg nog ${battleSelectionSize() - state.team.length} toe.`,
        "Naar Builder",
        "builder"
      ));
      return;
    }

    const layout = document.createElement("div");
    layout.className = "battle-sim-layout";
    layout.append(createBattleTeamPanel("Jouw team", state.team, state.battleSelection, toggleBattleSelection, "player"));
    layout.append(createOpponentPanel());
    battleSim.append(layout);

    if (!state.opponentTeam.length) {
      battleSim.append(createBattleEmptyState("Kies een tegenstander", "Laat de app een counter-team maken, kies random, of voeg handmatig Pokémon toe.", "Counter-team", "counter"));
      return;
    }

    battleSim.append(createSimulationResultPanel());
    state.cache.battleDirty = false;
  } finally {
    clearBusySoon(battleSim);
  }
}

function createBattleHeader() {
  const header = document.createElement("section");
  header.className = "battle-sim-header";
  header.innerHTML = `
    <div>
      <h2>Battle sim</h2>
      <p>Bouw een party van 6, kies je battle core van ${battleSelectionSize()}, en scan daarna matchups. Geen volledige battle-engine, wel direct zicht op voordeel, threats en beste picks.</p>
    </div>
    <div class="battle-sim-format">
      <span>Format</span>
      <strong>${escapeHtml(BATTLE_FORMATS[state.battleFormat].label)}</strong>
      <small>${state.battleSelection.length}/${battleSelectionSize()} jouw battle core</small>
    </div>
  `;
  return header;
}

function createBattleQuickActions() {
  const actions = document.createElement("section");
  actions.className = "battle-quick-actions";
  [
    [state.cache.battleWorkLabel || "Maak counter-team", () => buildOpponentTeam("counter"), state.team.length >= battleSelectionSize()],
    ["Optimaliseer preview", () => applySimulationAdvice(), state.team.length >= battleSelectionSize()],
    ["Ga naar Team lab", () => switchView("team"), state.team.length > 0]
  ].forEach(([label, onClick, enabled]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = !enabled;
    button.addEventListener("click", onClick);
    actions.append(button);
  });
  return actions;
}

function applySimulationAdvice() {
  if (state.simulationResult?.selectionAdvice?.picks?.length) {
    state.battleSelection = state.simulationResult.selectionAdvice.picks.map(({ pokemon }) => pokemon.name).slice(0, battleSelectionSize());
  } else {
    selectBestBattleTeam();
  }
  updateSimulationResult();
  renderTeamPreviewAnalysis();
  if (state.activeView === "battle") renderBattleSim();
}

function createBattleEmptyState(title, text, actionLabel, action) {
  const empty = document.createElement("section");
  empty.className = "battle-empty";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = actionLabel;
  button.addEventListener("click", () => {
    if (action === "counter") {
      buildOpponentTeam("counter");
      return;
    }
    switchView(action);
  });
  empty.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(text)}</p>
  `;
  empty.append(button);
  return empty;
}

function createBattleTeamPanel(title, team, selection, onToggle, side) {
  const panel = document.createElement("section");
  panel.className = `battle-team-panel ${side}`;
  const selected = selectedBattleMembers(team, selection, BATTLE_FORMATS[state.battleFormat]);
  const selectedNames = new Set(selected.map((pokemon) => pokemon.name));
  panel.innerHTML = `
    <div class="battle-panel-head">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${selected.length}/${battleSelectionSize()} gekozen als battle core · roster ${team.length}/6</p>
      </div>
    </div>
  `;

  const roster = document.createElement("div");
  roster.className = "battle-roster";
  team.forEach((pokemon) => {
    const item = document.createElement("button");
    item.type = "button";
    const isSelected = selectedNames.has(pokemon.name);
    const isLiveActive = side === "player" ? state.livePlayerName === pokemon.name : state.liveOpponentName === pokemon.name;
    item.className = `battle-roster-card${isSelected ? " selected" : ""}${isLiveActive ? " active-live" : ""}`;
    item.disabled = !selectedNames.has(pokemon.name) && selection.length >= battleSelectionSize();
    item.title = state.activeView === "battle"
      ? `Selecteer ${displayPokemonName(pokemon)} als actieve Pokémon`
      : selectedNames.has(pokemon.name) ? "Verwijder uit preview" : "Kies voor preview";
    item.innerHTML = `
      <img src="${spriteUrl(pokemon.name)}" alt="">
      <span>
        <strong>${escapeHtml(displayPokemonName(pokemon))}</strong>
        <small>${escapeHtml(displayRoleForBuild(pokemon))} · BST ${pokemon.bst} · Spe ${pokemon.spe}</small>
        <span class="battle-type-row">${pokemon.types.map(typeChipHtml).join("")}</span>
        ${battleRosterMovesHtml(pokemon)}
      </span>
    `;
    item.addEventListener("click", () => {
      if (state.activeView === "battle") {
        if (side === "player") state.livePlayerName = pokemon.name;
        else state.liveOpponentName = pokemon.name;
        renderBattleSim();
        return;
      }
      onToggle(pokemon);
    });
    item.querySelector("img").addEventListener("error", (event) => event.currentTarget.remove(), { once: true });
    roster.append(item);
  });
  panel.append(roster);
  return panel;
}

function battleRosterMovesHtml(pokemon) {
  const moves = orderedMovesForDisplay(selectedBuild(pokemon).moves ?? [])
    .flatMap(moveOptionsForDisplay)
    .slice(0, 4);
  if (!moves.length) return "";
  return `<span class="battle-move-row">${moves.map((move) => {
    const details = moveDetails(move);
    const typeColor = TYPE_COLORS[details.type] || "#6657dc";
    return `<b style="--type-color:${typeColor}" title="${escapeHtml(details.effect)}">${escapeHtml(move)}</b>`;
  }).join("")}</span>`;
}

function createOpponentPanel() {
  const panel = createBattleTeamPanel("Tegenstander", state.opponentTeam, state.opponentSelection, toggleOpponentSelection, "opponent");
  const head = panel.querySelector(".battle-panel-head");
  const actions = document.createElement("div");
  actions.className = "battle-opponent-actions";
  [
    ["Counter-team", "counter"],
    ["Bulky team", "bulky"],
    ["Fast offense", "offense"],
    ["Random sterk", "random"],
    ["Mirror style", "mirror"],
    ["Leeg", "clear"]
  ].forEach(([label, mode]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = state.opponentMode === mode ? "active" : "";
    button.addEventListener("click", () => {
      if (mode === "clear") {
        state.opponentTeam = [];
        state.opponentSelection = [];
        state.simulationResult = null;
        invalidateCache("battle");
        saveBattleSimState();
        renderBattleSim();
        return;
      }
      buildOpponentTeam(mode);
    });
    actions.append(button);
  });
  head.append(actions);
  panel.append(createOpponentSlotControls());
  panel.append(createManualOpponentPicker());
  return panel;
}

function createOpponentSlotControls() {
  const controls = document.createElement("div");
  controls.className = "opponent-slot-controls";
  const label = document.createElement("span");
  label.textContent = "Vervang slot";
  controls.append(label);
  for (let index = 0; index < maxTeamSize(); index += 1) {
    const member = state.opponentTeam[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === state.opponentReplaceIndex ? "active" : "";
    button.textContent = member ? displayPokemonName(member) : `Slot ${index + 1}`;
    button.title = member ? `Vervang ${displayPokemonName(member)}` : `Vul slot ${index + 1}`;
    button.addEventListener("click", () => {
      state.opponentReplaceIndex = index;
      renderBattleSim();
    });
    controls.append(button);
  }
  return controls;
}

function createManualOpponentPicker() {
  const wrap = document.createElement("div");
  wrap.className = "manual-opponent-picker";
  const search = document.createElement("label");
  search.innerHTML = `
    <span>Opponent zoeken</span>
    <input type="search" placeholder="Naam, type of rol" value="${escapeHtml(state.opponentSearch)}">
  `;
  const input = search.querySelector("input");
  const list = document.createElement("div");
  list.className = "opponent-candidate-grid";
  renderManualOpponentCandidateList(list);
  input.addEventListener("input", () => {
    state.opponentSearch = input.value;
    renderManualOpponentCandidateList(list);
  });
  wrap.append(search, list);
  return wrap;
}

function renderManualOpponentCandidateList(list) {
  list.replaceChildren();
  const candidates = manualOpponentCandidates().slice(0, 8);
  if (!candidates.length) {
    const empty = document.createElement("p");
    empty.textContent = "Geen passende tegenstanders gevonden.";
    list.append(empty);
    return;
  }
  candidates.forEach((pokemon) => list.append(createOpponentCandidateCard(pokemon)));
}

function manualOpponentCandidates() {
  const query = normalize(state.opponentSearch);
  return state.pokemon
    .filter((pokemon) => !state.opponentTeam.some((member) => member.name === pokemon.name))
    .filter((pokemon) => isLegalManualOpponent(pokemon))
    .filter((pokemon) => {
      if (!query) return true;
      const haystack = normalize(`${pokemon.name} ${pokemon.types.join(" ")} ${displayRoleForBuild(pokemon)} ${pokemon.abilities.join(" ")}`);
      return haystack.includes(query);
    })
    .sort((a, b) => b.bst - a.bst || a.name.localeCompare(b.name));
}

function createOpponentCandidateCard(pokemon) {
  const card = document.createElement("article");
  card.className = "opponent-candidate-card";
  const build = selectedBuild(pokemon);
  card.innerHTML = `
    <img src="${spriteUrl(pokemon.name)}" alt="">
    <span>
      <strong>${escapeHtml(displayPokemonName(pokemon))}</strong>
      <small>${escapeHtml(displayRoleForBuild(pokemon, build))} · BST ${pokemon.bst} · ${escapeHtml(setQualityLabel(build))}</small>
      <span class="battle-type-row">${pokemon.types.map(typeChipHtml).join("")}</span>
    </span>
  `;
  card.querySelector("img").addEventListener("error", (event) => event.currentTarget.remove(), { once: true });
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = state.opponentTeam.length >= maxTeamSize() ? "Vervang" : "Voeg toe";
  action.addEventListener("click", () => addManualOpponent(pokemon));
  card.append(action);
  return card;
}

function isLegalManualOpponent(pokemon) {
  if (state.opponentTeam.some((member) => baseSpecies(member.name) === baseSpecies(pokemon.name))) return false;
  if (!usesMegaSlot(pokemon)) return true;
  return !state.opponentTeam.some((member) => usesMegaSlot(member));
}

function addManualOpponent(pokemon) {
  state.opponentMode = "manual";
  if (state.opponentTeam.length >= maxTeamSize()) {
    const index = Math.max(0, Math.min(maxTeamSize() - 1, state.opponentReplaceIndex));
    state.opponentTeam = state.opponentTeam.map((member, memberIndex) => memberIndex === index ? pokemon : member);
  } else {
    state.opponentTeam = [...state.opponentTeam, pokemon];
    state.opponentReplaceIndex = Math.min(maxTeamSize() - 1, state.opponentTeam.length);
  }
  syncOpponentSelection();
  updateSimulationResult();
  saveBattleSimState();
  renderBattleSim();
}

function buildOpponentTeam(mode) {
  runBattleWork(`${opponentModeLabel(mode)} scannen`, () => {
    state.opponentMode = mode;
    const playerPreview = selectedBattleMembers(state.team, state.battleSelection, BATTLE_FORMATS[state.battleFormat]);
    state.opponentTeam = pureGenerateOpponentTeam({
      pokemon: state.pokemon,
      playerTeam: playerPreview.length ? playerPreview : state.team,
      playerRoster: state.team,
      format: BATTLE_FORMATS[state.battleFormat],
      mode,
      selectedBuild,
      moveDetails,
      roleFor
    });
    state.opponentSelection = state.opponentTeam.slice(0, battleSelectionSize()).map((pokemon) => pokemon.name);
    updateSimulationResult();
    saveBattleSimState();
  });
}

function runBattleWork(label, work) {
  state.cache.battleWorkLabel = label;
  if (state.activeView === "battle") {
    setBusy(battleSim, true, label);
  }
  scheduleAfterPaint(() => {
    try {
      work();
    } finally {
      state.cache.battleWorkLabel = "";
      if (state.activeView === "battle") renderBattleSim();
    }
  });
}

function opponentModeLabel(mode) {
  if (mode === "bulky") return "Bulky team";
  if (mode === "offense") return "Fast offense";
  if (mode === "random") return "Random sterk";
  if (mode === "mirror") return "Mirror style";
  return "Counter-team";
}

function toggleOpponentSelection(pokemon) {
  if (state.opponentSelection.includes(pokemon.name)) {
    state.opponentSelection = state.opponentSelection.filter((name) => name !== pokemon.name);
  } else if (state.opponentSelection.length < battleSelectionSize()) {
    state.opponentSelection = [...state.opponentSelection, pokemon.name];
  }
  updateSimulationResult();
  saveBattleSimState();
  renderBattleSim();
}

function updateSimulationResult() {
  if (!state.team.length || !state.opponentTeam.length) {
    state.simulationResult = null;
    state.cache.battleSignature = "";
    state.cache.battleResult = null;
    return;
  }
  const signature = battleSimulationSignature();
  if (state.cache.battleSignature === signature && state.cache.battleResult) {
    state.simulationResult = state.cache.battleResult;
    return;
  }
  state.simulationResult = perfMeasure("simulateBattle", () => simulateBattle({
    playerTeam: state.team,
    opponentTeam: state.opponentTeam,
    playerSelection: state.battleSelection,
    opponentSelection: state.opponentSelection,
    format: BATTLE_FORMATS[state.battleFormat],
    selectedBuild,
    moveDetails,
    roleFor
  }));
  state.cache.battleSignature = signature;
  state.cache.battleResult = state.simulationResult;
}

function battleSimulationSignature() {
  return [
    state.battleFormat,
    teamSignature(state.team),
    teamSignature(state.opponentTeam),
    state.battleSelection.join("|"),
    state.opponentSelection.join("|"),
    selectedSetsSignature(),
    customSetsSignature(),
    state.teamStyle
  ].join("::");
}

function createSimulationResultPanel() {
  const result = state.simulationResult;
  const panel = document.createElement("section");
  panel.className = "battle-result-panel";
  if (!result) {
    panel.append(createBattleEmptyState("Nog geen scan", "Kies beide previews om de matchup-scan te tonen.", "Counter-team", "counter"));
    return panel;
  }

  panel.append(createLiveBattlePanel(result));
  panel.append(createBattleOverviewPanel(result));
  panel.append(createBattleAdvicePanel(result));
  panel.append(createBattleSelectionAdvicePanel(result));
  panel.append(createMatchupMatrixPanel(result));
  panel.append(createCounterPanel(result));
  panel.append(createBattlePairingList("Beste matchups", result.bestMatchups, "positive"));
  panel.append(createBattlePairingList("Gevaarlijkste threats", result.threats, "negative"));
  return panel;
}

function createBattleOverviewPanel(result) {
  const panel = document.createElement("article");
  panel.className = `battle-overview-panel battle-score-card ${result.advantage.toLowerCase()}`;
  panel.append(createBattleScoreCard(result));
  panel.append(createBattleMetricsPanel(result));
  return panel;
}

function createBattleScoreCard(result) {
  const card = document.createElement("article");
  card.className = "battle-score-summary";
  card.innerHTML = `
    <div>
      <span>Matchup</span>
      <strong>${escapeHtml(result.advantage)}</strong>
      <p>${result.notes.map(escapeHtml).join(" ")} Confidence: ${escapeHtml(result.confidence.label)} (${result.confidence.value}%).</p>
    </div>
    <div class="win-meter" style="--win:${result.winChance}%">
      <strong>${result.winChance}%</strong>
      <span><i></i></span>
      <small>geschatte winstkans</small>
    </div>
  `;
  return card;
}

function createLiveBattlePanel(result) {
  const panel = document.createElement("article");
  panel.className = "battle-live-panel";
  const player = liveSelectedPokemon(result.playerMembers, "livePlayerName");
  const opponent = liveSelectedPokemon(result.opponentMembers, "liveOpponentName");
  const pairing = result.pairings.find((item) => item.player.name === player?.name && item.opponent.name === opponent?.name);
  const moveAdvice = player && opponent ? bestLiveMove(player, opponent) : null;
  const switchAdvice = opponent ? bestLiveSwitch(result, player, opponent) : null;

  const controls = document.createElement("div");
  controls.className = "live-controls";
  controls.append(
    createLiveSelect("Jouw actieve Pokémon", result.playerMembers, player, "livePlayerName"),
    createLiveSelect("Tegenstander actief", result.opponentMembers, opponent, "liveOpponentName")
  );

  const advice = document.createElement("div");
  advice.className = "live-advice-grid";
  const moveType = moveAdvice?.move ? moveDetails(moveAdvice.move).type : "";
  advice.innerHTML = `
    <div class="live-advice-item best-move">
      <span>Beste move</span>
      <strong>${moveAdvice?.move ? moveTypeMoveChipHtml(moveAdvice.move) : "Kies eerst beide Pokémon"}</strong>
      <small>${escapeHtml(moveAdvice?.reason ?? "Daarna zie je direct damage-, setup- of switchadvies.")}</small>
    </div>
    <div class="live-advice-item">
      <span>Switch-optie</span>
      <strong>${switchAdvice?.pokemon ? livePokemonLabelHtml(switchAdvice.pokemon) : "Blijf staan"}</strong>
      <small>${escapeHtml(switchAdvice?.reason ?? "Geen betere switch binnen je gekozen battle core gevonden.")}</small>
    </div>
    <div class="live-advice-item">
      <span>Matchup</span>
      <strong>${escapeHtml(pairing ? `${pairing.label} ${pairing.score > 0 ? "+" : ""}${pairing.score}` : "Geen pairing")}</strong>
      <small>${escapeHtml(pairing?.reasons?.slice(0, 2).join(" · ") ?? "Kies beide actieve Pokémon.")}</small>
    </div>
  `;

  panel.append(createSmallTitle("Live battle advies"), controls, advice);
  return panel;
}

function liveSelectedPokemon(members, key) {
  const saved = members.find((pokemon) => pokemon.name === state[key]);
  if (saved) return saved;
  const fallback = members[0] ?? null;
  state[key] = fallback?.name ?? "";
  return fallback;
}

function createLiveSelect(label, members, selected, key) {
  const wrap = document.createElement("label");
  wrap.innerHTML = `<span>${escapeHtml(label)}</span><i class="live-select-preview">${selected ? livePokemonLabelHtml(selected) : ""}</i>`;
  const select = document.createElement("select");
  members.forEach((pokemon) => {
    const option = document.createElement("option");
    option.value = pokemon.name;
    option.textContent = displayPokemonName(pokemon);
    option.selected = pokemon.name === selected?.name;
    select.append(option);
  });
  select.addEventListener("change", () => {
    state[key] = select.value;
    renderBattleSim();
  });
  wrap.append(select);
  return wrap;
}

function livePokemonLabelHtml(pokemon) {
  return `<img src="${spriteUrl(pokemon.name)}" alt="">${escapeHtml(displayPokemonName(pokemon))}`;
}

function moveTypeMoveChipHtml(move) {
  const details = moveDetails(move);
  const typeColor = TYPE_COLORS[details.type] || "#6657dc";
  return `<span class="live-move-chip" style="--type-color:${typeColor}">${escapeHtml(move)}<small>${escapeHtml(details.type || "?")}</small></span>`;
}

function bestLiveMove(player, opponent) {
  const moves = orderedMovesForDisplay(selectedBuild(player).moves ?? [])
    .flatMap(moveOptionsForDisplay)
    .filter((move) => moveDetails(move).type && moveDetails(move).type !== "Unknown");
  const scored = moves.map((move) => {
    const details = moveDetails(move);
    const multiplier = defensiveMultiplier(opponent.types, details.type);
    const stab = player.types.includes(details.type) ? 1.25 : 1;
    const power = Number(details.power) || (details.category === "Status" ? 0 : 70);
    const setupBonus = details.category === "Status" && /stealth rock|spikes|tailwind|trick room|reflect|light screen|boost|raises/i.test(`${move} ${details.effect}`) ? 80 : 0;
    const score = multiplier * power * stab + setupBonus;
    return {
      move,
      score,
      reason: details.category === "Status"
        ? `${details.category} · ${details.effect || "utility"}`
        : `${details.type} ${multiplier}x${stab > 1 ? " · STAB" : ""} · Pow ${details.power || "?"}`
    };
  }).sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

function bestLiveSwitch(result, currentPlayer, opponent) {
  const candidates = result.playerMembers
    .filter((pokemon) => pokemon.name !== currentPlayer?.name)
    .map((pokemon) => result.pairings.find((pairing) => pairing.player.name === pokemon.name && pairing.opponent.name === opponent.name))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best || best.score <= 0) return null;
  return {
    pokemon: best.player,
    reason: `${best.label} ${best.score > 0 ? "+" : ""}${best.score} · ${best.reasons.slice(0, 2).join(" · ")}`
  };
}

function createBattleMetricsPanel(result) {
  const panel = document.createElement("section");
  panel.className = "battle-metrics";
  const metrics = [
    ["Winstkans", result.teamMetrics.winChance, `${result.advantage}`],
    ["Preview-score", result.teamMetrics.previewScore, `${result.playerScore} vs ${result.opponentScore}`],
    ["Speed control", result.teamMetrics.speedControl, "Aantal pairings waar jij sneller bent"],
    ["Defensive safety", result.teamMetrics.defensiveSafety, "Pairings met veilige defensieve marge"]
  ];
  const grid = document.createElement("div");
  grid.className = "battle-metric-grid";
  metrics.forEach(([label, value, note]) => {
    const item = document.createElement("div");
    item.className = metricTone(value);
    item.style.setProperty("--metric", `${value}%`);
    item.innerHTML = `
      <span>${escapeHtml(label)}</span>
      <strong>${value}%</strong>
      <i><b></b></i>
      <small>${escapeHtml(note)}</small>
    `;
    grid.append(item);
  });
  panel.append(grid);
  if (result.confidence.issues.length) {
    const issues = document.createElement("p");
    issues.className = "confidence-note";
    issues.textContent = `Datakwaliteit: ${result.confidence.issues.join(" · ")}`;
    panel.append(issues);
  }
  return panel;
}

function metricTone(value) {
  if (value >= 68) return "good";
  if (value <= 38) return "bad";
  return "warn";
}

function createBattleAdvicePanel(result) {
  const panel = document.createElement("article");
  panel.className = "battle-actions-panel";
  panel.innerHTML = `<h3>Wat moet ik doen?</h3>`;
  const list = document.createElement("div");
  list.className = "battle-action-list";
  result.selectionAdvice.actions.forEach((action) => {
    const item = document.createElement("div");
    item.innerHTML = `<span>${escapeHtml(action.label)}</span><strong>${escapeHtml(action.text)}</strong>`;
    list.append(item);
  });
  panel.append(list);
  return panel;
}

function createBattleSelectionAdvicePanel(result) {
  const panel = document.createElement("article");
  panel.className = "battle-leads battle-selection-advice";
  panel.innerHTML = `<h3>Aanbevolen preview</h3>`;
  const list = document.createElement("div");
  list.className = "battle-lead-list";
  result.selectionAdvice.picks.forEach(({ pokemon, score, reason }, index) => {
    const item = document.createElement("div");
    item.innerHTML = `
      <img src="${spriteUrl(pokemon.name)}" alt="">
      <span><strong>${index === 0 ? "Lead: " : ""}${escapeHtml(displayPokemonName(pokemon))}</strong><small>Pick-score ${score} · ${escapeHtml(reason)}</small><span class="battle-type-row">${pokemon.types.map(typeChipHtml).join("")}</span></span>
    `;
    item.querySelector("img").addEventListener("error", (event) => event.currentTarget.remove(), { once: true });
    list.append(item);
  });
  panel.append(list);
  return panel;
}

function createMatchupMatrixPanel(result) {
  const panel = document.createElement("article");
  panel.className = "battle-matrix-panel";
  panel.innerHTML = `<h3>Preview matrix</h3>`;
  const matrix = document.createElement("div");
  matrix.className = "battle-matrix";
  matrix.style.setProperty("--opponents", Math.max(1, result.opponentMembers.length));
  const head = document.createElement("div");
  head.className = "matrix-row matrix-head";
  head.innerHTML = `<span>Jij vs tegenstander</span>${result.opponentMembers.map((pokemon) => `<strong>${escapeHtml(displayPokemonName(pokemon))}</strong>`).join("")}`;
  matrix.append(head);
  result.matchupMatrix.forEach((row) => {
    const line = document.createElement("div");
    line.className = "matrix-row";
    line.innerHTML = `<strong>${escapeHtml(displayPokemonName(row.player))}</strong>`;
    row.cells.forEach((cell) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `matrix-cell ${cell.tone}`;
      button.title = cell.reasons.join(" · ");
      button.innerHTML = `<span>${escapeHtml(cell.label)}</span><strong>${cell.score > 0 ? "+" : ""}${cell.score}</strong><small>${cell.attackMultiplier}x · Spe ${cell.speedDelta > 0 ? "+" : ""}${cell.speedDelta}</small>`;
      line.append(button);
    });
    matrix.append(line);
  });
  panel.append(matrix);
  return panel;
}

function createCounterPanel(result) {
  const panel = document.createElement("article");
  panel.className = "battle-counter-panel";
  const targets = battleCounterTargets(result);
  const target = currentCounterTarget(targets);

  const head = document.createElement("div");
  head.className = "battle-panel-head counter-head";
  const titleWrap = document.createElement("div");
  titleWrap.innerHTML = `
    <h3>Beste counters</h3>
    <p>Volledige Champions-dex tegen één gekozen Pokémon.</p>
  `;
  const select = document.createElement("select");
  targets.forEach((pokemon) => {
    const option = document.createElement("option");
    option.value = pokemon.name;
    option.textContent = displayPokemonName(pokemon);
    option.selected = pokemon.name === target?.name;
    select.append(option);
  });
  select.addEventListener("change", () => {
    state.counterTargetName = select.value;
    renderBattleSim();
  });
  const controls = document.createElement("div");
  controls.className = "counter-target-controls";
  controls.append(select);
  head.append(titleWrap, controls);
  panel.append(head);

  if (!target) {
    const empty = document.createElement("p");
    empty.textContent = "Kies eerst een preview om counters te tonen.";
    panel.append(empty);
    return panel;
  }

  const counters = pureCounterRecommendations(target, state.pokemon, {
    selectedBuild,
    moveDetails,
    roleFor
  }, {
    existingTeam: state.opponentTeam,
    selectedBuild,
    limit: 6
  });

  const list = document.createElement("div");
  list.className = "counter-list";
  counters.forEach((item) => list.append(createCounterCard(item, target)));
  panel.append(list);
  return panel;
}

function battleCounterTargets(result) {
  const names = new Set();
  return [...result.opponentMembers, ...result.playerMembers, ...state.opponentTeam, ...state.team]
    .filter((pokemon) => {
      if (!pokemon || names.has(pokemon.name)) return false;
      names.add(pokemon.name);
      return true;
    });
}

function currentCounterTarget(targets) {
  const saved = state.pokemon.find((pokemon) => pokemon.name === state.counterTargetName)
    ?? targets.find((pokemon) => pokemon.name === state.counterTargetName);
  if (saved) return saved;
  const fallback = targets[0] ?? null;
  state.counterTargetName = fallback?.name ?? "";
  return fallback;
}

function createCounterCard({ pokemon, score, reason, matchup }, target) {
  const card = document.createElement("div");
  card.className = "counter-card";
  card.innerHTML = `
    <img src="${spriteUrl(pokemon.name)}" alt="">
    <span>
      <strong>${escapeHtml(displayPokemonName(pokemon))}</strong>
      <small>Counter-score ${score} · ${escapeHtml(reason)}</small>
      <span class="battle-type-row">${pokemon.types.map(typeChipHtml).join("")}</span>
    </span>
    <b>${escapeHtml(matchup.label)} ${matchup.score > 0 ? "+" : ""}${matchup.score}</b>
  `;
  card.querySelector("img").addEventListener("error", (event) => event.currentTarget.remove(), { once: true });
  const action = document.createElement("button");
  action.type = "button";
  action.textContent = state.opponentTeam.length >= maxTeamSize() ? "Vervang opponent" : "Als opponent";
  action.title = `Gebruik ${displayPokemonName(pokemon)} als counter voor ${displayPokemonName(target)}`;
  action.addEventListener("click", () => addManualOpponent(pokemon));
  card.append(action);
  return card;
}

function createBattlePairingList(title, pairings, tone) {
  const section = document.createElement("article");
  section.className = `battle-pairings ${tone}`;
  section.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
  const list = document.createElement("div");
  list.className = "battle-pairing-list";
  if (!pairings.length) {
    const empty = document.createElement("p");
    empty.textContent = tone === "positive" ? "Geen uitgesproken positieve pairings gevonden." : "Geen grote threats in deze scan.";
    list.append(empty);
  }
  pairings.forEach((pairing) => {
    const item = document.createElement("div");
    item.className = "battle-pairing";
    item.innerHTML = `
      <div class="pairing-mons">
        <span><img src="${spriteUrl(pairing.player.name)}" alt=""><strong>${escapeHtml(displayPokemonName(pairing.player))}</strong></span>
        <b>vs</b>
        <span><img src="${spriteUrl(pairing.opponent.name)}" alt=""><strong>${escapeHtml(displayPokemonName(pairing.opponent))}</strong></span>
      </div>
      <div class="pairing-score-stack">
        <strong class="pairing-score">${escapeHtml(pairing.label)} ${pairing.score > 0 ? "+" : ""}${pairing.score}</strong>
        <small>${escapeHtml(pairing.attackType)} ${pairing.attackMultiplier}x · Spe ${pairing.speedDelta > 0 ? "+" : ""}${pairing.speedDelta}</small>
      </div>
      <p>${pairing.reasons.map(escapeHtml).join(" · ")}</p>
    `;
    item.querySelectorAll("img").forEach((img) => img.addEventListener("error", (event) => event.currentTarget.remove(), { once: true }));
    list.append(item);
  });
  section.append(list);
  return section;
}

function createWorkbenchCard(pokemon, index) {
  const build = selectedBuild(pokemon);
  const card = document.createElement("article");
  card.className = `workbench-card${build.status === "generated" ? " generated" : ""}${index === 0 ? " core-slot" : ""}`;
  card.dataset.pokemon = pokemon.name;

  const header = document.createElement("div");
  header.className = "workbench-head";
  header.innerHTML = `
    <div class="workbench-slot-row">
      <span class="slot-badge">Slot ${index + 1}</span>
      <button class="workbench-move-slot move-up" type="button" title="Verplaats naar slot ${index}">↑</button>
      <button class="workbench-move-slot move-down" type="button" title="Verplaats naar slot ${index + 2}">↓</button>
      <button class="workbench-lock" type="button" aria-pressed="${isCoreLocked(pokemon)}" aria-label="${isCoreLocked(pokemon) ? "Ontgrendel kernslot" : "Zet vast als kernslot"}">${isCoreLocked(pokemon) ? "●" : "◇"}</button>
      <button class="workbench-remove" type="button" aria-label="Verwijder ${escapeHtml(displayPokemonName(pokemon))}" title="Verwijder ${escapeHtml(displayPokemonName(pokemon))}">×</button>
    </div>
    <span class="sprite-wrap"><img class="sprite" src="${spriteUrl(pokemon.name)}" alt=""></span>
    <div>
      <h3>${escapeHtml(displayPokemonName(pokemon))}</h3>
      <div class="types">${pokemon.types.map(typeChipHtml).join("")}</div>
    </div>
  `;
  header.querySelector("img").addEventListener("error", (event) => {
    showSpriteFallback(event.target.closest(".sprite-wrap"), pokemon.name);
  }, { once: true });
  header.querySelector(".sprite-wrap").title = `Bekijk ${displayPokemonName(pokemon)} in Builder`;
  header.querySelector(".sprite-wrap").addEventListener("click", () => {
    state.selected = pokemon;
    switchView("builder");
    renderDetail(pokemon);
  });
  header.querySelector(".workbench-lock").addEventListener("click", () => toggleCoreLock(pokemon));
  const moveUp = header.querySelector(".move-up");
  const moveDown = header.querySelector(".move-down");
  moveUp.disabled = index === 0 || (index === 1 && isCoreLocked(state.team[0]));
  moveDown.disabled = index >= state.team.length - 1 || (index === 0 && isCoreLocked(pokemon));
  moveUp.addEventListener("click", () => moveTeamMember(index, index - 1));
  moveDown.addEventListener("click", () => moveTeamMember(index, index + 1));
  const removeButton = header.querySelector(".workbench-remove");
  removeButton.disabled = isCoreLocked(pokemon);
  removeButton.title = isCoreLocked(pokemon)
    ? `${displayPokemonName(pokemon)} is vastgezet als kern`
    : `Verwijder ${displayPokemonName(pokemon)}`;
  removeButton.addEventListener("click", () => removeFromTeam(index));

  const tabs = createSetSourceCards(buildOptions(pokemon), build, (option) => {
    const scrollY = window.scrollY;
    state.selectedSets[pokemon.name] = option.id;
    state.manualSets[pokemon.name] = true;
    state.selected = pokemon;
    invalidateCache("battle");
    renderDetail(pokemon);
    renderTeamWorkbench();
    renderTeamAnalysis();
    renderBattleSim();
    window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  });

  const grid = document.createElement("div");
  grid.className = "workbench-build-grid";
  [
    ["Rol", displayRoleForBuild(pokemon, build)],
    ["Item", build.item],
    ["Ability", build.ability],
    ["Nature", build.nature]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    grid.append(item);
  });

  const snapshot = document.createElement("div");
  snapshot.className = "workbench-snapshot";
  snapshot.innerHTML = workbenchSnapshotHtml(pokemon, build);

  const training = document.createElement("div");
  training.className = "workbench-training";
  training.innerHTML = trainingOverviewHtml(pokemon);

  const movesTitle = document.createElement("h4");
  movesTitle.className = "workbench-section-title";
  movesTitle.textContent = "Moves";

  const compatibility = championsCompatibilityForBuild(pokemon, build);
  const compatibilityAlert = compatibility.ok ? null : createCompatibilityAlert(pokemon, build, compatibility);

  const moves = document.createElement("div");
  moves.className = "workbench-moves";
  orderedMovesForDisplay(build.moves).forEach((move, moveIndex) => {
    moves.append(createMoveCard(move, moveIndex));
  });

  const customEditor = build.status === "custom" ? createCustomSetEditor(pokemon, build) : null;

  const actions = document.createElement("div");
  actions.className = "workbench-actions";
  if (build.status === "custom") {
    const resetCustomButton = document.createElement("button");
    resetCustomButton.type = "button";
    resetCustomButton.textContent = "Reset custom";
    resetCustomButton.addEventListener("click", () => {
      delete state.customSets[pokemon.name];
      saveCustomSets();
      state.selectedSets[pokemon.name] = buildOptions(pokemon)[0].id;
      render();
    });
    actions.append(resetCustomButton);
  }

  card.append(header, snapshot, tabs, grid);
  if (customEditor) card.append(customEditor);
  if (compatibilityAlert) card.append(compatibilityAlert);
  card.append(training, movesTitle, moves);
  if (actions.children.length) card.append(actions);
  return card;
}

function createCompatibilityAlert(pokemon, build, compatibility) {
  const alert = document.createElement("section");
  alert.className = "compatibility-alert";
  alert.setAttribute("role", "alert");
  const issues = compatibility.issues.map((issue) => issue.reason).join(" ");
  const suggestion = compatibility.replacementMoves?.length
    ? compatibility.replacementMoves.join(" / ")
    : "geen veilig alternatief gevonden";
  const suggestionLabel = compatibility.replacementMoves?.length === 1 ? "Alternatieve move" : "Alternatieve moves";
  alert.innerHTML = `
    <strong>Deze ${escapeHtml(setSourceShort(build))}-set werkt niet volledig in Champions.</strong>
    <p>${escapeHtml(issues)}</p>
    <p><span>${escapeHtml(suggestionLabel)}:</span> ${escapeHtml(suggestion)}</p>
  `;
  const apply = document.createElement("button");
  apply.type = "button";
  apply.textContent = "Gebruik alternatief";
  apply.disabled = !compatibility.suggestedMoves.length;
  apply.addEventListener("click", () => applyCompatibilityAlternative(pokemon, build, compatibility));
  alert.append(apply);
  return alert;
}

function applyCompatibilityAlternative(pokemon, build, compatibility) {
  if (!compatibility.suggestedMoves.length) return;
  state.customSets[pokemon.name] = {
    ...build,
    id: "custom",
    label: "Custom",
    status: "custom",
    role: build.role || roleFor(pokemon).label,
    item: build.item || "",
    ability: build.ability || preferredAbility(pokemon),
    nature: build.nature || "",
    evs: safeSelectedSp(build.evs),
    moves: compatibility.suggestedMoves,
    sourceIds: ["custom-local"],
    sourceLabel: "Champions alternatief"
  };
  state.selectedSets[pokemon.name] = "custom";
  state.manualSets[pokemon.name] = true;
  state.selected = pokemon;
  saveCustomSets();
  invalidateCache();
  render();
}

function workbenchSnapshotHtml(pokemon, build) {
  const weaknesses = TYPES
    .filter((type) => defensiveMultiplier(pokemon.types, type) > 1)
    .slice(0, 4);
  const cover = TYPES
    .filter((type) => defensiveMultiplier(pokemon.types, type) < 1)
    .slice(0, 5);
  const speedTier = pokemon.spe >= 110 ? "Snel" : pokemon.spe >= 85 ? "Midden" : "Traag";
  const offense = pokemon.atk > pokemon.spa ? `Fysiek ${pokemon.atk}` : pokemon.spa > pokemon.atk ? `Speciaal ${pokemon.spa}` : `Mixed ${pokemon.atk}`;
  const fit = suggestionExplanation(pokemon, displayRoleForBuild(pokemon, build)).split(" · ").slice(0, 2).join(" · ");

  return `
    <div class="snapshot-pill strong">${escapeHtml(offense)}</div>
    <div class="snapshot-pill">${escapeHtml(speedTier)} · Spe ${pokemon.spe}</div>
    <div class="snapshot-line"><span>Zwak</span><strong>${weaknesses.length ? weaknesses.map(typeChipHtml).join("") : "geen duidelijke"}</strong></div>
    <div class="snapshot-line"><span>Dekt</span><strong>${cover.length ? cover.map(typeChipHtml).join("") : "neutraal"}</strong></div>
    <div class="snapshot-note">${escapeHtml(fit || roleFor(pokemon).description)}</div>
  `;
}

function createSetSourceCards(options, build, onSelect, context = "team") {
  const wrap = document.createElement("div");
  wrap.className = "set-source-cards workbench-set-tabs";
  const custom = options.find((option) => option.status === "custom");
  const grouped = options
    .filter((option) => option.status !== "custom")
    .reduce((groups, option) => {
      const key = setSourceShort(option);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(option);
      return groups;
    }, new Map());

  sortedSetSourceGroups(grouped).forEach(([source, sourceOptions]) => {
    const card = document.createElement("section");
    card.className = `set-source-card ${setQualityClass(sourceOptions[0])}`;
    const title = document.createElement("h4");
    title.textContent = `${source} (${sourceOptions.length})`;
    const list = document.createElement("div");
    list.className = "set-source-options";
    sourceOptions.forEach((option) => {
      list.append(createSetOptionButton(option, build, onSelect));
    });
    card.append(title, list);
    wrap.append(card);
  });

  if (custom) {
    const action = document.createElement("div");
    action.className = "set-custom-action";
    action.append(createSetOptionButton(custom, build, onSelect, context));
    wrap.append(action);
  }

  return wrap;
}

function createSetOptionButton(option, build, onSelect, context = "team") {
  const button = document.createElement("button");
  button.type = "button";
  const warning = option.championsCompatibility && !option.championsCompatibility.ok ? " has-warning" : "";
  button.className = `set-tab set-option-button ${setQualityClass(option)}${warning}${option.id === build.id ? " active" : ""}`;
  button.setAttribute("aria-pressed", String(option.id === build.id));
  button.textContent = option.status === "custom" && context === "team" ? "Zelf set bouwen" : cleanSetLabel(option);
  if (warning) button.title = "Deze set heeft een Champions-compatibiliteitswaarschuwing.";
  button.addEventListener("click", () => onSelect(option));
  return button;
}

function createCustomSetEditor(pokemon, build) {
  const moveOptions = customMoveOptions(pokemon, build);
  const sp = parseSp(safeSelectedSp(build.evs));
  const form = document.createElement("form");
  form.className = "custom-set-editor";
  form.innerHTML = `
    <label><span>Rol</span>${selectHtml("role", roleOptions(pokemon), build.role)}</label>
    <label><span>Item</span>${selectHtml("item", customItemOptions(pokemon, build), build.item)}</label>
    <label><span>Ability</span>${selectHtml("ability", pokemon.abilities, build.ability)}</label>
    <label><span>Nature</span>${selectHtml("nature", customNatureOptions(build), build.nature)}</label>
    <fieldset class="custom-sp-editor">
      <legend>Stat Points (66 totaal, max 32)</legend>
      ${statEntries(pokemon).map(([label]) => `
        <label><span>${label}</span><input name="sp${label}" type="number" min="0" max="32" step="1" value="${sp[label] ?? 0}"></label>
      `).join("")}
    </fieldset>
    <fieldset class="custom-move-editor">
      <legend>Moves</legend>
      ${[0, 1, 2, 3].map((index) => customMovePickerHtml(index, safeSelectedMove(build.moves[index], moveOptions, index), moveOptions)).join("")}
    </fieldset>
    <div class="custom-validation" aria-live="polite"></div>
  `;
  updateCustomValidation(form, pokemon);

  form.addEventListener("change", () => {
    const formData = new FormData(form);
    const evs = spSpreadFromForm(formData);
    const next = {
      ...build,
      role: String(formData.get("role") || "Custom"),
      item: String(formData.get("item") || ""),
      ability: String(formData.get("ability") || ""),
      nature: String(formData.get("nature") || ""),
      evs,
      moves: [0, 1, 2, 3].map((index) => String(formData.get(`move${index}`) || "").trim()).filter(Boolean)
    };
    const normalizedSp = parseSp(evs);
    STAT_LABELS.forEach((stat) => {
      const input = form.elements[`sp${stat}`];
      if (input) input.value = normalizedSp[stat] ?? 0;
    });
    state.customSets[pokemon.name] = next;
    saveCustomSets();
    invalidateCache("battle");
    updateCustomValidation(form, pokemon);
    updateCustomWorkbenchCard(pokemon, next);
    renderTeamAnalysis();
    renderBattleSim();
  });

  return form;
}

function updateCustomValidation(form, pokemon) {
  const panel = form.querySelector(".custom-validation");
  if (!panel) return;
  const formData = new FormData(form);
  const spValues = Object.fromEntries(STAT_LABELS.map((stat) => [stat, clampSp(Number(formData.get(`sp${stat}`) || 0))]));
  const spTotal = STAT_LABELS.reduce((sum, stat) => sum + spValues[stat], 0);
  const moves = [0, 1, 2, 3].map((index) => String(formData.get(`move${index}`) || "").trim()).filter(Boolean);
  const compatibility = validateMoveSlotsForPokemon(pokemon, moves);
  const duplicateMoves = moves.filter((move, index) => moves.indexOf(move) !== index);
  const issues = [];
  if (spTotal !== SP_TOTAL_LIMIT) issues.push(`SP totaal is ${spTotal}/${SP_TOTAL_LIMIT}.`);
  if (moves.length < 4) issues.push(`Je hebt ${moves.length}/4 moves gekozen.`);
  if (duplicateMoves.length) issues.push(`Dubbele move: ${[...new Set(duplicateMoves)].join(", ")}.`);
  if (!compatibility.ok) issues.push(...compatibility.issues.map((issue) => issue.reason));
  panel.classList.toggle("ok", !issues.length);
  panel.innerHTML = issues.length
    ? `<strong>Check custom set</strong><ul>${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
    : "<strong>Custom set valide</strong><p>SP en moves zijn compleet.</p>";
}

function customMovePickerHtml(index, selected, options) {
  const details = moveDetails(selected);
  const typeColor = TYPE_COLORS[details.type] || "#6657dc";
  return `
    <label class="custom-move-picker" style="--type-color:${typeColor}">
      <span>Move ${index + 1}</span>
      ${selectHtml(`move${index}`, options, selected)}
      <small>${escapeHtml(details.type)} · ${escapeHtml(details.category)} · Pow ${escapeHtml(details.power)} · Acc ${escapeHtml(details.accuracy)}<br>${escapeHtml(details.effect)}</small>
    </label>
  `;
}

function spSpreadFromForm(formData) {
  const raw = STAT_LABELS
    .map((stat) => [stat, clampSp(Number(formData.get(`sp${stat}`) || 0))])
    .map(([stat, value]) => `${value} ${stat}`)
    .join(" / ");
  return normalizeSpSpread(raw) || "0 HP";
}

function spPartsFromValues(values) {
  return pureSpPartsFromValues(values);
}

function clampSp(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(SP_STAT_LIMIT, Math.round(value)));
}

function updateCustomWorkbenchCard(pokemon, build) {
  const card = teamWorkbench.querySelector(`[data-pokemon="${cssEscape(pokemon.name)}"]`);
  if (!card) {
    render();
    return;
  }

  const grid = card.querySelector(".workbench-build-grid");
  if (grid) {
    grid.replaceChildren();
    [
      ["Rol", displayRoleForBuild(pokemon, build)],
      ["Item", build.item],
      ["Ability", build.ability],
      ["Nature", build.nature]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
      grid.append(item);
    });
  }

  const training = card.querySelector(".workbench-training");
  if (training) training.innerHTML = trainingOverviewHtml(pokemon);

  const moves = card.querySelector(".workbench-moves");
  if (moves) {
    moves.replaceChildren();
    orderedMovesForDisplay(build.moves).forEach((move, moveIndex) => moves.append(createMoveCard(move, moveIndex)));
  }

  const editor = card.querySelector(".custom-set-editor");
  if (editor) editor.replaceWith(createCustomSetEditor(pokemon, build));

  renderTeamOverview();
  renderTeamAnalysis();
}

function selectHtml(name, options, value) {
  const unique = [...new Set([...options, value].filter(Boolean))];
  return `<select name="${escapeHtml(name)}">${unique.map((option) => `
    <option value="${escapeHtml(option)}"${option === value ? " selected" : ""}>${escapeHtml(option)}</option>
  `).join("")}</select>`;
}

function splitOptions(values) {
  return values.flatMap((value) => String(value).split("/").map((part) => part.trim())).filter(Boolean);
}

function roleOptions(pokemon) {
  return [...new Set([roleFor(pokemon).label, "Setup", "Wallbreaker", "Sweeper", "Bulky pivot", "Support", "Speed control", "Wall", "Allrounder"])];
}

function customItemOptions(pokemon, build) {
  const setItems = splitOptions(buildOptions(pokemon).map((option) => option.item));
  return [...new Set([...setItems, ...ITEM_OPTIONS])].sort();
}

function customNatureOptions(build) {
  const split = splitOptions([build.nature]);
  return [...new Set([...split, ...NATURE_OPTIONS])];
}

function safeSelectedSp(spread) {
  if (SP_PRESETS.includes(spread)) return spread;
  const normalized = normalizeSpSpread(spread);
  if (Object.values(parseSp(normalized)).some(Boolean)) return normalized;
  if (String(spread).trim() === "0 HP") return "0 HP";
  return SP_PRESETS.includes(normalized) ? normalized : SP_PRESETS[0];
}

function normalizeSpSpread(spread) {
  return pureNormalizeSpSpread(spread);
}

function normalizeSpValues(values) {
  return pureNormalizeSpValues(values);
}

function convertEvSpreadToSpSpread(spread) {
  const parts = String(spread).split("/").map((part) => part.trim()).filter(Boolean);
  const parsed = parts.map((part) => {
    const match = part.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/);
    return match ? { value: Number(match[1]), stat: match[2] } : null;
  }).filter(Boolean);
  if (!parsed.some(({ value }) => value > SP_STAT_LIMIT) && parsed.reduce((sum, { value }) => sum + value, 0) <= SP_TOTAL_LIMIT) {
    return spread;
  }
  return parsed
    .map(({ value, stat }) => `${Math.max(0, Math.min(SP_STAT_LIMIT, Math.round(value * SP_STAT_LIMIT / 252)))} ${stat}`)
    .join(" / ");
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function customMoveOptions(pokemon, build) {
  const setMoves = splitOptions(buildOptions(pokemon).flatMap((option) => option.moves ?? []));
  return [...new Set([...setMoves, ...customMoveOptionsFromBase(pokemon)])]
    .filter((move) => moveAllowedForPokemon(pokemon, move))
    .sort();
}

function safeSelectedMove(move, options, index) {
  if (move && options.includes(move)) return move;
  return options[index] ?? options[0] ?? "";
}

function createMoveCard(move, moveIndex) {
  const options = moveOptionsForDisplay(move);
  const details = moveDetails(options[0] ?? move);
  const card = document.createElement("div");
  card.className = `workbench-move-card${options.length > 1 ? " choice-slot" : ""}`;
  card.style.setProperty("--type-color", TYPE_COLORS[details.type] || "#6657dc");
  const optionHtml = options.length > 1
    ? `<span class="move-choice-list">${options.map((option) => {
        const optionDetails = moveDetails(option);
        const typeColor = TYPE_COLORS[optionDetails.type] || "#6657dc";
        return `<b style="--type-color:${typeColor}">${escapeHtml(option)} <em>${escapeHtml(optionDetails.type)}</em></b>`;
      }).join("")}</span>`
    : "";
  card.innerHTML = `
    <span class="move-index">${moveIndex + 1}</span>
    <span class="move-main">
      <span class="move-top">
        <strong>${options.length > 1 ? "Keuzeslot" : escapeHtml(move)}</strong>
        <span class="move-type">${options.length > 1 ? "Kies 1" : escapeHtml(details.type)}</span>
      </span>
      ${optionHtml}
      <span class="move-meta">
        <span>${escapeHtml(details.category)}</span>
        <span>Pow ${escapeHtml(details.power)}</span>
        <span>Acc ${escapeHtml(details.accuracy)}</span>
        <span>PP ${escapeHtml(details.pp)}</span>
      </span>
      <span class="move-effect">${options.length > 1 ? "Dit is een enkel moveslot; kies een van deze opties voor je definitieve set." : escapeHtml(details.effect)}</span>
    </span>
  `;
  return card;
}

function moveDetails(move) {
  if (String(move).includes("/")) {
    const firstKnown = String(move)
      .split("/")
      .map((part) => part.trim())
      .find((part) => state.moveDetails[part]);
    if (firstKnown) {
      return {
        ...state.moveDetails[firstKnown],
        effect: `Keuze-slot met meerdere Smogon-opties. Details getoond voor ${firstKnown}.`
      };
    }
  }

  const generated = generatedMoveDetails(move);
  if (generated) return generated;
  return state.moveDetails[move] ?? {
    type: "Unknown",
    category: "Move",
    power: "?",
    accuracy: "?",
    pp: "?",
    effect: "Nog geen lokale specificatie voor deze move."
  };
}

function generatedMoveDetails(move) {
  const typeMatch = move.match(/^(Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy) STAB (physical|special|or coverage)$/i);
  if (typeMatch) {
    return {
      type: typeMatch[1],
      category: typeMatch[2].toLowerCase() === "special" ? "Special" : "Physical",
      power: "?",
      accuracy: "?",
      pp: "?",
      effect: "Generated slot: kies hier later een concrete legale STAB-move."
    };
  }

  if (/STAB/i.test(move)) {
    return { type: "Unknown", category: "STAB", power: "?", accuracy: "?", pp: "?", effect: "Generated slot voor een concrete STAB-move." };
  }
  if (/coverage/i.test(move)) {
    return { type: "Unknown", category: "Coverage", power: "?", accuracy: "?", pp: "?", effect: "Generated slot voor coverage tegen checks." };
  }
  if (/recovery|defensive/i.test(move)) {
    return { type: "Unknown", category: "Utility", power: "-", accuracy: "?", pp: "?", effect: "Generated slot voor recovery of defensieve utility." };
  }
  if (/status|pivot/i.test(move)) {
    return { type: "Unknown", category: "Utility", power: "-", accuracy: "?", pp: "?", effect: "Generated slot voor status of pivot utility." };
  }
  if (/setup|priority|utility/i.test(move)) {
    return { type: "Unknown", category: "Utility", power: "-", accuracy: "?", pp: "?", effect: "Generated slot voor setup, priority of utility." };
  }
  return null;
}

function createEmptyWorkbenchSlot(index) {
  const empty = document.createElement("article");
  empty.className = "workbench-card empty";
  empty.innerHTML = `
    <span class="slot-badge">Slot ${index + 1}</span>
    <h3>Open plek</h3>
    <p>Gebruik de Builder-tab om een passende aanvulling te kiezen.</p>
  `;
  return empty;
}

function renderTeamAnalysis() {
  setBusy(teamAnalysis, true);
  return perfMeasure("renderTeamAnalysis", () => {
    try {
      return renderTeamAnalysisContent();
    } finally {
      clearBusySoon(teamAnalysis);
    }
  });
}

function renderTeamAnalysisContent() {
  teamAnalysis.replaceChildren();
  teamAnalysis.append(createSectionHead("Team analyse"));

  if (!state.team.length) {
    const empty = document.createElement("p");
    empty.className = "empty-detail";
    empty.textContent = "Voeg Pokémon toe aan je team. Dan zie je hier zwaktes, balans en passende suggesties.";
    teamAnalysis.append(empty);
    if (teamManager) teamAnalysis.append(teamManager);
    return;
  }

  teamAnalysis.append(createBuilderExplanationPanel());
  teamAnalysis.append(createTeamSummaryPanel());
  teamAnalysis.append(createStylePlanPanel());
  teamAnalysis.append(createTeamAssistantPanel());
  teamAnalysis.append(createRulesPanel());
  teamAnalysis.append(createTeamSelectionPanel());
  teamAnalysis.append(createTeamUsagePanel());
  teamAnalysis.append(createTeamScorePanel());
  teamAnalysis.append(createTypePanel());
  teamAnalysis.append(createThreatChecklistPanel());
  teamAnalysis.append(createRoleChecklistPanel());
  teamAnalysis.append(createSuggestionPanel());
  if (teamManager) teamAnalysis.append(teamManager);
}

function renderTeamPreviewAnalysis() {
  return perfMeasure("renderTeamPreviewAnalysis", () => {
    if (!state.team.length || !teamAnalysis?.children.length) {
      renderTeamAnalysis();
      return;
    }

    replaceAnalysisPanel(".analysis-summary", createTeamSummaryPanel());
    replaceAnalysisPanel(".collapsible-rules", createRulesPanel());
    replaceAnalysisPanel(".team-selection-sim", createTeamSelectionPanel());
    scheduleDeferredTeamPreviewAnalysis();
  });
}

function replaceAnalysisPanel(selector, replacement) {
  const current = teamAnalysis.querySelector(selector);
  if (current) {
    current.replaceWith(replacement);
    return;
  }
  teamAnalysis.append(replacement);
}

function scheduleDeferredTeamPreviewAnalysis() {
  if (state.cache.previewAnalysisTimer) window.clearTimeout(state.cache.previewAnalysisTimer);
  const signature = analysisSignature();
  setBusy(teamAnalysis, true);
  state.cache.previewAnalysisTimer = window.setTimeout(() => {
    if (analysisSignature() !== signature) {
      clearBusySoon(teamAnalysis);
      return;
    }
    try {
      perfMeasure("renderDeferredPreviewAnalysis", () => {
        replaceAnalysisPanel(".team-usage", createTeamUsagePanel());
        replaceAnalysisPanel(".score-overview", createTeamScorePanel());
        replaceAnalysisPanel(".type-analysis", createTypePanel());
        replaceAnalysisPanel(".threat-checklist", createThreatChecklistPanel());
        replaceAnalysisPanel(".role-checklist", createRoleChecklistPanel());
      });
    } finally {
      clearBusySoon(teamAnalysis);
    }
  }, 120);
}

function renderTeamOverview() {
  teamOverview.replaceChildren();
  const hasContent = state.team.length;
  teamOverview.hidden = !hasContent;
  if (!hasContent) return;
}

function createFavoritesPanel() {
  const panel = document.createElement("div");
  panel.className = "favorite-list";
  state.favorites
    .map((name) => state.pokemon.find((pokemon) => pokemon.name === name))
    .filter(Boolean)
    .forEach((pokemon) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "favorite-item";
      item.innerHTML = `
        <img src="${spriteUrl(pokemon.name)}" alt="">
        <span><strong>${escapeHtml(displayPokemonName(pokemon))}</strong><small>${escapeHtml(displayRoleForBuild(pokemon))} · BST ${pokemon.bst}</small></span>
      `;
      item.addEventListener("click", () => showPokemonDetails(pokemon));
      item.querySelector("img").addEventListener("error", (event) => event.target.remove(), { once: true });
      const row = document.createElement("div");
      row.className = "favorite-row";
      const compare = document.createElement("button");
      compare.type = "button";
      compare.className = `mini-action${state.compare.includes(pokemon.name) ? " active" : ""}`;
      compare.textContent = state.compare.includes(pokemon.name) ? "Vergelijkt" : "Vergelijk";
      compare.addEventListener("click", () => toggleCompare(pokemon));
      row.append(item, compare);
      panel.append(row);
    });
  return panel;
}

function createComparePanel() {
  const selected = state.compare
    .map((name) => state.pokemon.find((pokemon) => pokemon.name === name))
    .filter(Boolean);
  const panel = document.createElement("div");
  panel.className = "compare-panel";

  if (selected.length < 1) {
    const hint = document.createElement("p");
    hint.textContent = "Kies Pokémon via Vergelijk.";
    panel.append(hint);
    return panel;
  }

  panel.style.setProperty("--compare-count", selected.length);
  const profiles = selected.map(compareProfile);
  const best = compareBestValues(profiles);
  const styleLabel = TEAM_STYLES[state.teamStyle]?.label ?? "Teamplan";

  const names = document.createElement("div");
  names.className = "compare-name-row";
  names.innerHTML = `
    <span>Pokemon</span>
    ${selected.map((pokemon) => `
      <strong>
        <button type="button" class="compare-remove" data-pokemon="${escapeHtml(pokemon.name)}" aria-label="Verwijder ${escapeHtml(displayPokemonName(pokemon))}">×</button>
        <img src="${spriteUrl(pokemon.name)}" alt="">
        <span>${escapeHtml(displayPokemonName(pokemon))}<small>${escapeHtml(displayRoleForBuild(pokemon))}</small></span>
      </strong>
    `).join("")}
  `;
  names.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", (event) => event.target.remove(), { once: true });
  });
  names.querySelectorAll(".compare-remove").forEach((button) => {
    button.addEventListener("click", () => {
      state.compare = state.compare.filter((name) => name !== button.dataset.pokemon);
      render();
    });
  });
  panel.append(names);

  const overview = document.createElement("div");
  overview.className = "compare-overview";
  overview.innerHTML = profiles.map((profile) => `
    <article class="compare-card${profile.fitScore === best.fitScore ? " best" : ""}">
      <span class="compare-card-score">${escapeHtml(profile.fitScore)}</span>
      <span>
        <strong>${escapeHtml(displayPokemonName(profile.pokemon))}</strong>
        <small>${escapeHtml(styleLabel)} fit</small>
      </span>
      <span class="compare-score-bar" style="--score:${Math.max(8, Math.min(100, profile.fitScore))}%"></span>
      <em>${escapeHtml(profile.decision)}</em>
    </article>
  `).join("");
  panel.append(overview);

  const rows = [
    compareRow("Rol", profiles, (profile) => displayRoleForBuild(profile.pokemon, profile.build)),
    compareRow("Typing", profiles, (profile) => profile.pokemon.types.map(typeChipHtml).join(" "), { html: true }),
    compareRow("Ability", profiles, (profile) => profile.build.ability || preferredAbility(profile.pokemon)),
    compareRow("Teamfit", profiles, (profile) => profile.fitSummary, { bestKey: "fitScore" }),
    compareRow("Matchup", profiles, (profile) => profile.matchupSummary, { className: "compare-cell-compact" }),
    compareRow("Moves", profiles, (profile) => profile.moveSummary, { html: true, className: "compare-cell-compact" }),
    compareRow("Set", profiles, (profile) => `${setQualityLabel(profile.build)} · ${profile.build.item || "n.v.t."}`),
    compareRow("Aanval", profiles, (profile) => profile.offense, { bestKey: "offense", metric: true }),
    compareRow("Bulk", profiles, (profile) => profile.bulk, { bestKey: "bulk", metric: true }),
    compareRow("Speed", profiles, (profile) => profile.speed, { bestKey: "speed", metric: true, reverseBest: state.teamStyle === "trickroom" }),
    compareRow("Stats", profiles, (profile) => `${profile.pokemon.hp}/${profile.pokemon.atk}/${profile.pokemon.def}/${profile.pokemon.spa}/${profile.pokemon.spd}/${profile.pokemon.spe}`),
    compareRow("Let op", profiles, (profile) => profile.watchout)
  ];
  rows.forEach((rowConfig) => {
    const row = document.createElement("div");
    row.className = `compare-row${rowConfig.metric ? " compare-metric-row" : ""}`;
    row.innerHTML = compareRowHtml(rowConfig, best);
    panel.append(row);
  });
  return panel;
}

function compareProfile(pokemon) {
  const build = selectedBuild(pokemon);
  const offense = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;
  const speed = pokemon.spe;
  const fit = suggestionReasons(pokemon);
  const fitScore = compareFitScore(pokemon, build, fit);
  const fitSummary = compareFitSummary(pokemon, fit);
  const matchupSummary = compareMatchupSummary(pokemon);
  const moveSummary = compareMoveSummary(pokemon, build);
  const watchout = compareWatchout(pokemon, build);
  const decision = compareDecision({ pokemon, build, offense, bulk, speed, fitScore, watchout });
  return { pokemon, build, offense, bulk, speed, fitScore, fitSummary, matchupSummary, moveSummary, watchout, decision };
}

function compareFitScore(pokemon, build, fit) {
  const offense = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;
  let score = 35 + fit.score * 8;
  if (teamStyleMatch(pokemon)) score += 18;
  if (build.status === "smogon-champions") score += 12;
  else if (build.status === "smogon-sv") score += 8;
  else if (build.status === "generated") score -= 12;
  if (state.teamStyle === "trickroom") score += Math.max(0, 90 - pokemon.spe) * 0.28;
  else score += Math.max(0, pokemon.spe - 70) * 0.12;
  score += Math.max(0, offense - 95) * 0.14;
  score += Math.max(0, bulk - 250) * 0.08;
  if (weatherConflictsWithStyle(pokemon)) score -= 22;
  if (needsValidationAsCore(pokemon, build)) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function compareFitSummary(pokemon, fit) {
  const reasons = fit.reasons.length ? fit.reasons : [formatFitLabel(pokemon)];
  return reasons.slice(0, 2).join(" · ");
}

function compareMatchupSummary(pokemon) {
  if (state.team.length) {
    const covered = teamTypeSummary()
      .filter((item) => item.weak >= 2 && defensiveMultiplier(pokemon.types, item.type) < 1)
      .map((item) => defensiveMultiplier(pokemon.types, item.type) === 0 ? `${item.type} immuun` : `${item.type} resist`);
    if (covered.length) return covered.slice(0, 3).join(" · ");
  }
  const profile = compareTypeProfile(pokemon);
  const positives = [...profile.immunities.map((type) => `${type} immuun`), ...profile.resists.map((type) => `${type} resist`)];
  if (positives.length) return positives.slice(0, 3).join(" · ");
  return "weinig defensieve dekking";
}

function compareTypeProfile(pokemon) {
  const matchups = TYPES.map((type) => ({ type, multiplier: defensiveMultiplier(pokemon.types, type) }));
  return {
    weaknesses: matchups.filter((item) => item.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier).map((item) => item.type),
    resists: matchups.filter((item) => item.multiplier > 0 && item.multiplier < 1).sort((a, b) => a.multiplier - b.multiplier).map((item) => item.type),
    immunities: matchups.filter((item) => item.multiplier === 0).map((item) => item.type)
  };
}

function compareMoveSummary(pokemon, build) {
  const moves = (build.moves ?? []).slice(0, 4);
  if (!moves.length) return "<span class=\"compare-chip muted\">geen set</span>";
  return moves.map((move) => {
    const label = compareMoveLabel(pokemon, move);
    const details = moveDetails(move);
    const type = details.type && details.type !== "Unknown" ? details.type : "";
    const typeStyle = type ? ` style="--type-color:${TYPE_COLORS[type] || "#7d8390"}"` : "";
    return `<span class="compare-chip move"${typeStyle}><span>${escapeHtml(label)}</span><small>${escapeHtml(compareMoveTag(pokemon, move, details))}</small></span>`;
  }).join("");
}

function compareMoveLabel(pokemon, move) {
  const options = moveOptionsForDisplay(move);
  if (options.length > 1) return options.slice(0, 2).join("/");
  return options[0] ?? String(move);
}

function compareMoveTag(pokemon, move, details) {
  const text = String(move).toLowerCase();
  if (pokemon.types.includes(details.type)) return "STAB";
  if (/swords dance|dragon dance|nasty plot|calm mind|quiver dance|shell smash|growth|bulk up|curse/i.test(move)) return "setup";
  if (/recover|roost|slack off|synthesis|wish|rest/i.test(move)) return "recovery";
  if (/u-turn|volt switch|flip turn|parting shot/i.test(move)) return "pivot";
  if (/thunder wave|will-o-wisp|toxic|spore|sleep powder|stun spore/i.test(move)) return "status";
  if (/protect|tailwind|icy wind|fake out|helping hand|stealth rock|spikes|taunt|defog|rapid spin/i.test(text)) return "utility";
  if (details.category === "Status") return "utility";
  return "coverage";
}

function compareWatchout(pokemon, build) {
  const issues = teamMemberIssues(pokemon, build);
  if (weatherConflictsWithStyle(pokemon)) return "weather-conflict";
  if (issues.length) return issues.slice(0, 2).join(" · ");
  const profile = compareTypeProfile(pokemon);
  if (profile.weaknesses.length) return `zwak voor ${profile.weaknesses.slice(0, 2).join(" / ")}`;
  return "geen grote rode vlag";
}

function compareDecision(profile) {
  if (weatherConflictsWithStyle(profile.pokemon)) return "Niet kiezen voor dit weerplan";
  if (profile.fitScore >= 78) return "Beste kandidaat voor dit plan";
  if (state.teamStyle === "trickroom" && profile.speed <= 65) return "Sterk onder Trick Room";
  if (profile.speed >= 105 && profile.offense >= 110) return "Snel drukmiddel";
  if (profile.bulk >= 305) return "Veilige switch-in";
  if (profile.offense >= 130) return "Breekt walls open";
  if (profile.build.status === "generated") return "Eerst set controleren";
  return "Flexibele keuze";
}

function compareBestValues(profiles) {
  return {
    offense: Math.max(...profiles.map((profile) => profile.offense)),
    bulk: Math.max(...profiles.map((profile) => profile.bulk)),
    speed: state.teamStyle === "trickroom"
      ? Math.min(...profiles.map((profile) => profile.speed))
      : Math.max(...profiles.map((profile) => profile.speed)),
    fitScore: Math.max(...profiles.map((profile) => profile.fitScore))
  };
}

function compareRow(label, profiles, valueForProfile, options = {}) {
  return {
    label,
    values: profiles.map((profile) => ({
      profile,
      value: valueForProfile(profile)
    })),
    ...options
  };
}

function compareRowHtml(rowConfig, best) {
  return `
    <span>${escapeHtml(rowConfig.label)}</span>
    ${rowConfig.values.map(({ profile, value }) => {
      const isBest = rowConfig.bestKey && profile[rowConfig.bestKey] === best[rowConfig.bestKey];
      const classes = [
        isBest ? "best" : "",
        rowConfig.className ?? ""
      ].filter(Boolean).join(" ");
      const content = rowConfig.html ? value : escapeHtml(value);
      const metric = rowConfig.metric ? `<small>${rowConfig.reverseBest ? "laag is beter" : "hoog is beter"}</small>` : "";
      return `<strong class="${classes}">${content}${metric}</strong>`;
    }).join("")}
  `;
}

function renderFloatingCompare() {
  floatingCompare.replaceChildren();
  floatingCompare.hidden = !state.compare.length;
  if (!state.compare.length) return;

  floatingCompare.classList.toggle("minimized", state.compareMinimized);
  const shell = document.createElement("div");
  shell.className = "floating-compare-shell";

  const bar = document.createElement("div");
  bar.className = "floating-compare-bar";
  const count = document.createElement("strong");
  count.textContent = `Vergelijker ${state.compare.length}/6`;
  const names = document.createElement("span");
  names.textContent = state.compare.map(displayPokemonName).join(" vs ");
  const minimize = document.createElement("button");
  minimize.type = "button";
  minimize.textContent = state.compareMinimized ? "Open" : "Minimaliseer";
  minimize.addEventListener("click", () => {
    state.compareMinimized = !state.compareMinimized;
    renderFloatingCompare();
  });
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "Leeg";
  clear.addEventListener("click", () => {
    state.compare = [];
    render();
  });
  bar.append(count, names, minimize, clear);
  shell.append(bar);

  if (!state.compareMinimized) {
    const panel = createComparePanel();
    panel.classList.add("floating-compare-panel");
    shell.append(panel);
  }

  floatingCompare.append(shell);
}

function createTeamSummaryPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block analysis-summary";

  const head = document.createElement("div");
  head.className = "analysis-summary-head";
  const title = document.createElement("h3");
  title.textContent = state.team.length >= maxTeamSize() ? "Roster van 6 klaar" : "Party in opbouw";
  const optimize = document.createElement("button");
  optimize.type = "button";
  optimize.className = "analysis-action-button optimize-sets-action";
  optimize.textContent = "Optimaliseer sets";
  optimize.disabled = !state.team.length;
  optimize.addEventListener("click", () => {
    optimizeTeamSets({ force: true });
    state.teamNotice = "Sets opnieuw gekozen op basis van teamplan en teamcontext.";
    render();
  });
  head.append(title, optimize);

  const chips = document.createElement("div");
  chips.className = "summary-chips";
  [
    ["Roster", `${state.team.length}/6`],
    ["Battle core", `${state.battleSelection.length}/${battleSelectionSize()} gekozen`],
    ["Format", BATTLE_FORMATS[state.battleFormat].label],
    ["Plan", TEAM_STYLES[state.teamStyle].label]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    chips.append(item);
  });

  panel.append(head, chips);
  return panel;
}

function createTeamAssistantPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block team-assistant-panel";
  panel.append(createSmallTitle("Team-assistent"));

  const core = lockedCoreMembers();
  const effectiveCore = core.length ? core : [...state.team];
  const intro = document.createElement("p");
  intro.textContent = core.length
    ? `Kern: ${core.map(displayPokemonName).join(", ")}. De assistent houdt deze slots vast en vult de rest aan volgens ${TEAM_STYLES[state.teamStyle].label}.`
    : "Zet een of meer teamleden vast als kern, of laat de assistent je huidige team als startpunt gebruiken.";
  panel.append(intro);

  const actions = document.createElement("div");
  actions.className = "assistant-actions";
  const lockAll = document.createElement("button");
  lockAll.type = "button";
  lockAll.textContent = "Zet huidig team vast";
  lockAll.disabled = !state.team.length;
  lockAll.addEventListener("click", () => {
    state.lockedCore = state.team.map((pokemon) => pokemon.name);
    state.teamNotice = `${state.lockedCore.length} kernslot${state.lockedCore.length === 1 ? "" : "s"} vastgezet.`;
    render();
  });
  const clearLocks = document.createElement("button");
  clearLocks.type = "button";
  clearLocks.textContent = "Ontgrendel kern";
  clearLocks.disabled = !state.lockedCore.length;
  clearLocks.addEventListener("click", () => {
    state.lockedCore = [];
    state.teamNotice = "Kernselectie ontgrendeld.";
    render();
  });
  const complete = document.createElement("button");
  complete.type = "button";
  complete.className = "assistant-primary";
  complete.textContent = state.team.length >= maxTeamSize() ? "Optimaliseer team" : "Vul team aan";
  complete.disabled = !effectiveCore.length;
  complete.addEventListener("click", () => {
    const variant = buildTeamVariant("balanced", effectiveCore);
    applyTeamVariant(variant);
  });
  actions.append(lockAll, clearLocks, complete);
  panel.append(actions);

  const slots = createSlotAdvicePanel(effectiveCore);
  if (slots) panel.append(slots);

  const variants = buildTeamVariants(effectiveCore);
  if (variants.length) {
    const list = document.createElement("div");
    list.className = "assistant-variants";
    variants.forEach((variant) => list.append(createTeamVariantCard(variant)));
    panel.append(list);
  }

  return panel;
}

function createSlotAdvicePanel(core) {
  if (!core.length || state.team.length >= maxTeamSize()) return null;
  const wrap = document.createElement("div");
  wrap.className = "slot-advice";
  const title = document.createElement("strong");
  title.textContent = "Open slots";
  wrap.append(title);
  slotAdvice(core).slice(0, maxTeamSize() - state.team.length).forEach((advice, index) => {
    const item = document.createElement("div");
    item.className = "slot-advice-item";
    item.innerHTML = `
      <span>Slot ${state.team.length + index + 1}</span>
      <strong>${escapeHtml(advice.label)}</strong>
      <small>${escapeHtml(advice.note)}</small>
    `;
    wrap.append(item);
  });
  return wrap;
}

function slotAdvice(core = state.team) {
  const balance = withTemporaryTeam(core, () => teamBalance());
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const weaknesses = withTemporaryTeam(core, () => teamTypeSummary())
    .filter((item) => item.weak >= 2 && item.resist + item.immune === 0)
    .slice(0, 3);
  const advice = [];
  if (balance.fast < targets.fast) advice.push({ label: "Speed control", note: "Voeg een snelle aanvaller, Scarf-user of speed-control support toe." });
  if (balance.special < targets.special) advice.push({ label: "Speciale druk", note: "Breekt fysieke walls en voorkomt dat je te voorspelbaar fysiek wordt." });
  if (balance.physical < targets.physical) advice.push({ label: "Fysieke druk", note: "Dwingt speciale walls en bulky Calm-gebruikers onder druk." });
  if (balance.bulky < targets.bulky) advice.push({ label: "Veilige switch-in", note: "Geeft ruimte om aanvallen op te vangen en tempo terug te pakken." });
  weaknesses.forEach((item) => advice.push({ label: `${item.type}-antwoord`, note: `Je kern heeft meerdere ${item.type}-zwaktes zonder betrouwbare resist of immunity.` }));
  if (state.teamStyle !== "balanced") advice.push({ label: `${TEAM_STYLES[state.teamStyle].label}-fit`, note: planGuideItems(state.teamStyle)[0] });
  return advice.length ? advice : [{ label: "Flex-slot", note: "Kies nu op matchup, setkwaliteit of favoriete speelstijl." }];
}

function buildTeamVariants(core = lockedCoreMembers()) {
  const seed = core.length ? core : state.team;
  if (!seed.length) return [];
  return [
    buildTeamVariant("balanced", seed),
    buildTeamVariant("safe", seed),
    buildTeamVariant("pressure", seed)
  ].filter(Boolean);
}

function buildTeamVariant(mode, core) {
  const originalTeam = [...state.team];
  const originalSelection = [...state.battleSelection];
  const originalSets = { ...state.selectedSets };
  const originalManual = { ...state.manualSets };
  const originalNotice = state.teamNotice;

  const lockedNames = new Set(core.map((pokemon) => pokemon.name));
  state.team = [...core].slice(0, maxTeamSize());
  state.battleSelection = [];
  state.selectedSets = Object.fromEntries(Object.entries(originalSets).filter(([name]) => lockedNames.has(name)));
  state.manualSets = Object.fromEntries(Object.entries(originalManual).filter(([name]) => lockedNames.has(name)));
  invalidateCache();

  while (state.team.length < maxTeamSize()) {
    const choice = bestCompletionCandidate(mode);
    if (!choice) break;
    state.team.push(choice);
    optimizeTeamSets();
    invalidateCache();
  }
  optimizeTeamSets();
  syncBattleSelection();
  const team = [...state.team];
  const selectedSets = { ...state.selectedSets };
  const score = teamScores().reduce((sum, item) => sum + item.value, 0);
  const reasons = variantReasons(team, mode);

  state.team = originalTeam;
  state.battleSelection = originalSelection;
  state.selectedSets = originalSets;
  state.manualSets = originalManual;
  state.teamNotice = originalNotice;
  invalidateCache();

  return {
    id: mode,
    label: variantLabel(mode),
    team,
    selectedSets,
    score,
    reasons
  };
}

function bestCompletionCandidate(mode) {
  return state.pokemon
    .filter((pokemon) => !state.team.some((member) => member.name === pokemon.name))
    .filter((pokemon) => teamLegality(pokemon).ok)
    .map((pokemon) => ({ pokemon, score: completionCandidateScore(pokemon, mode) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst)[0]?.pokemon ?? null;
}

function completionCandidateScore(pokemon, mode) {
  let score = teamAroundCandidateScore(pokemon, state.team[0] ?? state.selected ?? pokemon);
  score += suggestionReasons(pokemon).score * 45;
  score += pokemon.bst / 8;
  if (teamStyleMatch(pokemon)) score += 70;
  else if (stylePlanChecks().length) score -= 150;
  if (sunAntiSynergy(pokemon)) score -= 140;
  if (weatherPlanAntiSynergy(pokemon)) score -= 160;
  if (selectedBuild(pokemon).status === "generated") score -= 85;
  if (needsValidationAsCore(pokemon) && !usesMegaSlot(pokemon)) score -= 140;
  if (mode === "safe") {
    score += (pokemon.hp + pokemon.def + pokemon.spd) * 0.7;
    if (["Wall", "Bulky pivot", "Support", "Setup"].includes(displayRoleForBuild(pokemon))) score += 80;
  }
  if (mode === "pressure") {
    score += Math.max(pokemon.atk, pokemon.spa) * 0.9 + pokemon.spe * 0.7;
    if (["Sweeper", "Wallbreaker", "Speed control"].includes(displayRoleForBuild(pokemon))) score += 80;
  }
  if (mode === "balanced") {
    const balance = teamBalance();
    const targets = TEAM_STYLES[state.teamStyle].targets;
    if (balance.fast < targets.fast && pokemon.spe >= 100) score += 90;
    if (balance.bulky < targets.bulky && pokemon.hp + pokemon.def + pokemon.spd >= 280) score += 70;
  }
  return score;
}

function variantLabel(mode) {
  return {
    balanced: "Plan-fit",
    safe: "Veilig team",
    pressure: "Offensieve variant"
  }[mode] ?? "Variant";
}

function variantReasons(team, mode) {
  return withTemporaryTeam(team, () => {
    const scores = teamScores().sort((a, b) => a.value - b.value);
    const covered = relevantThreats().slice(0, 6).filter((threat) => threatAnswerStatus(threat).ok).length;
    const role = mode === "safe"
      ? "meer switch-ins en defensieve marge"
      : mode === "pressure"
        ? "meer tempo en directe druk"
        : `sterkere ${TEAM_STYLES[state.teamStyle].label}-fit`;
    return [
      role,
      `zwakste score: ${scores[0]?.label ?? "n.v.t."} ${scores[0]?.value ?? 100}/100`,
      `${covered}/${relevantThreats().slice(0, 6).length || 0} threat-checks`
    ];
  });
}

function createTeamVariantCard(variant) {
  const card = document.createElement("article");
  card.className = "assistant-variant";
  const averageScore = Math.round(variant.score / Math.max(1, teamScores().length));
  const roster = variant.team.map((pokemon) => `
    <span class="variant-mon${isCoreLocked(pokemon) ? " locked" : ""}" title="${escapeHtml(displayPokemonName(pokemon))}">
      <img src="${spriteUrl(pokemon.name)}" alt="">
    </span>
  `).join("");
  card.innerHTML = `
    <div class="variant-head">
      <strong>${escapeHtml(variant.label)}</strong>
      <span>${averageScore}/100</span>
    </div>
    <div class="variant-roster">${roster}</div>
    <p>${variant.reasons.map(escapeHtml).join(" · ")}</p>
  `;
  card.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", (event) => event.currentTarget.remove(), { once: true });
  });
  const apply = document.createElement("button");
  apply.type = "button";
  apply.textContent = "Pas toe";
  apply.addEventListener("click", () => applyTeamVariant(variant));
  card.append(apply);
  return card;
}

function applyTeamVariant(variant) {
  if (!variant?.team?.length) return;
  const lockedNames = new Set(state.lockedCore);
  const lockedStillPresent = state.team.filter((pokemon) => lockedNames.has(pokemon.name));
  state.team = variant.team;
  lockedStillPresent.forEach((pokemon) => {
    if (!state.team.some((member) => member.name === pokemon.name)) state.team.unshift(pokemon);
  });
  state.team = state.team.slice(0, maxTeamSize());
  state.selectedSets = { ...state.selectedSets, ...(variant.selectedSets ?? {}) };
  optimizeTeamSets();
  syncBattleSelection();
  selectBestBattleTeam();
  state.selected = state.team[0] ?? state.selected;
  state.activeView = "team";
  state.teamNotice = `${variant.label} toegepast en sets geoptimaliseerd.`;
  invalidateCache();
  render();
}

function withTemporaryTeam(team, callback) {
  const originalTeam = state.team;
  const originalSelection = state.battleSelection;
  const originalCache = state.cache;
  state.team = [...team];
  state.battleSelection = [];
  state.cache = {};
  try {
    return callback();
  } finally {
    state.team = originalTeam;
    state.battleSelection = originalSelection;
    state.cache = originalCache;
  }
}

function createBuilderExplanationPanel() {
  const panel = document.createElement("details");
  panel.className = "analysis-block builder-explainer";
  const summary = document.createElement("summary");
  summary.textContent = "Hoe werkt de builder?";
  const text = document.createElement("div");
  text.innerHTML = `
    <p>De app bouwt eerst een team van 6. Het gekozen format bepaalt daarna hoeveel Pokémon je bij Team Preview meeneemt: 3 in Singles of 4 in Doubles.</p>
    <p>Suggesties krijgen punten voor ontbrekende rollen, snelheid, fysieke/speciale druk, bulk, type-resists/immunities tegen gedeelde zwaktes en antwoorden op lokale threat-data. Sets met echte brondata tellen zwaarder dan generated sets.</p>
    <p>Een optimaal team is hier dus geen absolute waarheid, maar een score op balans, matchup-dekking, setkwaliteit en formatfit. Team Preview analyseert de gekozen 3 of 4 wanneer je selectie compleet is.</p>
  `;
  panel.append(summary, text);
  return panel;
}

function createTeamScorePanel() {
  const panel = document.createElement("details");
  panel.className = "analysis-block score-overview";
  const summary = document.createElement("summary");
  summary.textContent = "Team score";
  panel.append(summary);
  const scores = teamScores();
  const grid = document.createElement("div");
  grid.className = "score-grid";
  scores.forEach((score) => {
    const item = document.createElement("div");
    item.className = `score-item ${score.level}`;
    item.innerHTML = `
      <span>${escapeHtml(score.label)}</span>
      <strong>${score.value}/100</strong>
      <small>${escapeHtml(score.note)}</small>
    `;
    grid.append(item);
  });
  panel.append(grid);
  return panel;
}

function teamScores() {
  const team = analysisTeam();
  return cachedValue("teamScores", analysisSignature(team), () => computeTeamScores(team));
}

function computeTeamScores(team) {
  const balance = teamBalanceFor(team);
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const typeRisk = teamTypeSummary(team).filter((item) => item.weak >= 2 && item.resist + item.immune === 0).length;
  const threats = relevantThreats().slice(0, 6);
  const coveredThreats = threats.filter((threat) => threatAnswerStatusForTeam(threat, team).ok).length;
  const core = styleCoreScore(team);
  const score = (value, label, note) => ({
    label,
    value: Math.max(0, Math.min(100, Math.round(value))),
    note,
    level: value >= 75 ? "good" : value >= 45 ? "warn" : "bad"
  });
  return [
    score(targets.fast ? balance.fast / targets.fast * 100 : 100, "Snelheid", `${balance.fast}/${targets.fast} snelle slots`),
    score(targets.physical ? balance.physical / targets.physical * 100 : 100, "Fysieke druk", `${balance.physical}/${targets.physical} fysiek`),
    score(targets.special ? balance.special / targets.special * 100 : 100, "Speciale druk", `${balance.special}/${targets.special} speciaal`),
    score(targets.bulky ? balance.bulky / targets.bulky * 100 : 100, "Bulk", `${balance.bulky}/${targets.bulky} bulky`),
    score(100 - typeRisk * 25, "Type-risico", typeRisk ? `${typeRisk} onbeantwoorde gedeelde zwakte${typeRisk === 1 ? "" : "s"}` : "Geen grote gedeelde zwakte"),
    score(threats.length ? coveredThreats / threats.length * 100 : 100, "Threats", `${coveredThreats}/${threats.length || 0} checks afgedekt`)
  ].concat(core.active ? [score(core.value, `${TEAM_STYLES[state.teamStyle].label}-kern`, core.note)] : []);
}

function teamScoreTotalFor(team) {
  return computeTeamScores(team).reduce((sum, item) => sum + item.value, 0);
}

function createRulesPanel() {
  const panel = document.createElement("details");
  panel.className = "analysis-block collapsible-rules";
  const summary = document.createElement("summary");
  summary.textContent = "Teamregels";
  panel.append(summary);

  if (state.teamNotice) {
    const notice = document.createElement("p");
    notice.className = "rule-warning";
    notice.textContent = state.teamNotice;
    panel.append(notice);
  }

  const list = document.createElement("div");
  list.className = "rule-list";
  teamRules().forEach((rule) => {
    const item = document.createElement("div");
    item.className = `rule-item${rule.ok ? " ok" : " blocked"}`;
    const mark = document.createElement("span");
    mark.textContent = rule.ok ? "OK" : "Let op";
    const text = document.createElement("strong");
    text.textContent = rule.label;
    const note = document.createElement("small");
    note.textContent = rule.note;
    item.append(mark, text, note);
    list.append(item);
  });

  panel.append(list);
  return panel;
}

function createStylePlanPanel() {
  const style = TEAM_STYLES[state.teamStyle];
  const panel = document.createElement("div");
  panel.className = "analysis-block style-plan";

  const header = document.createElement("div");
  header.className = "style-plan-selector";
  const label = document.createElement("label");
  label.innerHTML = `
    <span>Teamplan</span>
    <select>${Object.entries(TEAM_STYLES).map(([value, config]) => `
      <option value="${value}"${value === state.teamStyle ? " selected" : ""}>${escapeHtml(config.label)}</option>
    `).join("")}</select>
  `;
  const select = label.querySelector("select");
  select.addEventListener("change", () => {
    state.teamStyle = select.value;
    teamStyleSelect.value = select.value;
    state.startSuggestionPage = 0;
    optimizeTeamSets();
    invalidateCache();
    render();
  });
  const badge = document.createElement("strong");
  badge.textContent = style.label;
  header.append(label, badge);
  panel.append(header);

  const note = document.createElement("p");
  note.textContent = style.description;
  panel.append(note);

  const planItems = document.createElement("div");
  planItems.className = "style-plan-items";
  planGuideItems(state.teamStyle).slice(0, 2).forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    planItems.append(chip);
  });
  panel.append(planItems);

  const checks = stylePlanChecks();
  if (checks.length) {
    const list = document.createElement("div");
    list.className = "plan-check-list";
    checks.forEach((check) => {
      const item = document.createElement("div");
      item.className = `plan-check-item ${check.ok ? "ok" : "missing"}`;
      item.innerHTML = `
        <span>${check.ok ? "OK" : "Nog nodig"}</span>
        <strong>${escapeHtml(check.label)}</strong>
        <small>${escapeHtml(check.note)}</small>
      `;
      if (!check.ok) {
        const candidate = bestPlanCheckCandidate(check);
        const action = candidate ? createNeedAction(candidate, `Beste optie voor ${check.label}`) : null;
        if (action) item.append(action);
      }
      list.append(item);
    });
    panel.append(list);
  }
  return panel;
}

function bestPlanCheckCandidate(check) {
  const available = state.pokemon.filter((pokemon) => !state.team.some((member) => member.name === pokemon.name));
  const byNames = (names) => names.map((name) => state.pokemon.find((pokemon) => pokemon.name === name)).filter(Boolean);
  const legalFirst = (candidates) => candidates
    .filter(candidateIsActionable)
    .sort((a, b) => planCandidateScore(b) - planCandidateScore(a))[0];

  if (/drought/i.test(check.label)) {
    return legalFirst(byNames(["Charizard-Mega-Y", "Torkoal", "Ninetales"]).concat(available.filter((pokemon) => hasAbility(pokemon, "Drought"))));
  }
  if (/drizzle/i.test(check.label)) {
    return legalFirst(byNames(["Pelipper", "Politoed"]).concat(available.filter((pokemon) => hasAbility(pokemon, "Drizzle"))));
  }
  if (/sand stream/i.test(check.label)) {
    return legalFirst(byNames(["Tyranitar", "Hippowdon"]).concat(available.filter((pokemon) => hasAbility(pokemon, "Sand Stream"))));
  }
  if (/snow warning/i.test(check.label)) {
    return legalFirst(byNames(["Abomasnow", "Abomasnow-Mega", "Aurorus"]).concat(available.filter((pokemon) => hasAbility(pokemon, "Snow Warning"))));
  }
  if (/chlorophyll/i.test(check.label)) {
    return legalFirst(byNames(["Venusaur", "Victreebel", "Scovillain", "Malaconda"]).concat(available.filter(isChlorophyllAbuser)));
  }
  if (/swift swim/i.test(check.label)) {
    return legalFirst(byNames(["Basculegion", "Basculegion-F", "Floatoy", "Gyarados"]).concat(available.filter(isRainAbuser)));
  }
  if (/rain water-druk|water-druk/i.test(check.label)) {
    return legalFirst(available.filter(isRainWaterPressure));
  }
  if (/sand abuser/i.test(check.label)) {
    return legalFirst(byNames(["Excadrill", "Excadrill-Mega", "Saharaja", "Lycanroc"]).concat(available.filter(isSandAbuser)));
  }
  if (/sand breaker/i.test(check.label)) {
    return legalFirst(available.filter(isSandBreaker));
  }
  if (/slush rush|snow abuser/i.test(check.label)) {
    return legalFirst(byNames(["Beartic", "Arctozolt", "Arctovish"]).concat(available.filter(isSnowAbuser)));
  }
  if (/ice-druk/i.test(check.label)) {
    return legalFirst(available.filter(isSnowIcePressure));
  }
  if (/trick room setter/i.test(check.label)) {
    return legalFirst(byNames(["Hatterene", "Reuniclus", "Slowking", "Slowbro", "Oranguru"]).concat(available.filter(isTrickRoomSetter)));
  }
  if (/trick room abuser/i.test(check.label)) {
    return legalFirst(available.filter(isTrickRoomAbuser));
  }
  if (/speed-control support/i.test(check.label)) {
    return legalFirst(available.filter(hasTeamSpeedControl));
  }
  if (/double utility/i.test(check.label)) {
    return legalFirst(available.filter(isDoubleUtility));
  }
  if (/pivot-kern/i.test(check.label)) {
    return legalFirst(available.filter(hasPivotMove));
  }
  if (/setupdruk/i.test(check.label)) {
    return legalFirst(available.filter(isSetupPressure));
  }
  if (/recovery-kern/i.test(check.label)) {
    return legalFirst(available.filter(hasReliableRecovery));
  }
  if (/status\/chip/i.test(check.label)) {
    return legalFirst(available.filter(hasStatusOrChip));
  }
  if (/fire/i.test(check.label)) {
    return legalFirst(available.filter(isSunFirePressure));
  }
  const typeMatch = check.label.match(/^(Rock|Water|Dragon|Electric|Grass|Fighting|Fire|Steel|Ground|Fairy)-antwoord$/);
  if (typeMatch) {
    const type = typeMatch[1];
    return legalFirst(available.filter((pokemon) => isPlanTypeAnswer(pokemon, type)));
  }
  return null;
}

function planCandidateScore(pokemon) {
  let score = teamAroundCandidateScore(pokemon, state.team[0] ?? state.selected ?? pokemon) + pokemon.bst / 10;
  if (state.teamStyle === "sun") {
    if (hasAbility(pokemon, "Drought")) score += 220;
    if (isChlorophyllAbuser(pokemon)) score += 210;
    if (isSunFirePressure(pokemon)) score += 150;
    if (coversSunPressureType(pokemon)) score += 90;
  }
  if (state.teamStyle === "rain") {
    if (hasAbility(pokemon, "Drizzle")) score += 220;
    if (isRainAbuser(pokemon)) score += 210;
    if (isRainWaterPressure(pokemon)) score += 150;
    if (coversRainPressureType(pokemon)) score += 90;
  }
  if (state.teamStyle === "sand") {
    if (hasAbility(pokemon, "Sand Stream")) score += 220;
    if (isSandAbuser(pokemon)) score += 200;
    if (isSandBreaker(pokemon)) score += 135;
    if (coversSandPressureType(pokemon)) score += 90;
  }
  if (state.teamStyle === "snow") {
    if (hasAbility(pokemon, "Snow Warning")) score += 220;
    if (isSnowAbuser(pokemon)) score += 200;
    if (isSnowIcePressure(pokemon)) score += 140;
    if (coversSnowPressureType(pokemon)) score += 90;
  }
  if (state.teamStyle === "trickroom") {
    if (isTrickRoomSetter(pokemon)) score += 220;
    if (isTrickRoomAbuser(pokemon)) score += 190;
    if (pokemon.spe >= 100) score -= 120;
  }
  if (state.teamStyle === "doublesupport") {
    if (isDoubleUtility(pokemon)) score += 160;
    if (hasTeamSpeedControl(pokemon)) score += 150;
    if (hasMoveInBuild(pokemon, "Protect")) score += 70;
  }
  if (state.teamStyle === "voltturn") {
    if (hasPivotMove(pokemon)) score += 180;
    if (hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Intimidate")) score += 80;
  }
  if (state.teamStyle === "hyperoffense") {
    if (isSetupPressure(pokemon)) score += 180;
    if (hasEntryPressure(pokemon)) score += 100;
  }
  if (state.teamStyle === "stall") {
    if (hasReliableRecovery(pokemon)) score += 170;
    if (hasStatusOrChip(pokemon)) score += 125;
  }
  return score;
}

function createNeedAction(pokemon, reason) {
  const action = document.createElement("div");
  action.className = "need-action";

  const spriteWrap = document.createElement("span");
  spriteWrap.className = "need-action-sprite";
  const sprite = document.createElement("img");
  sprite.src = spriteUrl(pokemon.name);
  sprite.alt = "";
  sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, pokemon.name), { once: true });
  spriteWrap.append(sprite);

  const text = document.createElement("span");
  text.innerHTML = `<strong>${escapeHtml(displayPokemonName(pokemon))}</strong><small>${escapeHtml(reason)}</small>`;

  const button = document.createElement("button");
  button.type = "button";
  if (state.team.length >= maxTeamSize()) {
    const replace = replacementTargetFor(pokemon);
    if (!replace) return null;
    button.textContent = "Vervang";
    button.title = `Vervang ${displayPokemonName(replace)} door ${displayPokemonName(pokemon)}`;
    button.addEventListener("click", () => {
      replaceTeamMember(replace.name, pokemon);
      render();
    });
  } else {
    const legality = teamLegality(pokemon);
    button.textContent = "+";
    button.disabled = !legality.ok;
    button.title = legality.ok ? `Voeg ${displayPokemonName(pokemon)} toe` : legality.reason;
    button.addEventListener("click", () => {
      state.selected = pokemon;
      addToTeam(pokemon, { deferRender: true });
    });
  }
  action.append(spriteWrap, text, button);
  return action;
}

function candidateIsActionable(pokemon) {
  if (!pokemon || state.team.some((member) => member.name === pokemon.name)) return false;
  if (state.team.length < maxTeamSize()) return teamLegality(pokemon).ok;
  return Boolean(replacementTargetFor(pokemon));
}

function replacementTargetFor(nextPokemon) {
  if (!state.team.length) return null;
  return state.team
    .filter((member, index) => {
      if (index === 0) return false;
      const hypothetical = state.team.map((pokemon) => pokemon.name === member.name ? nextPokemon : pokemon);
      const bases = hypothetical.map((pokemon) => baseSpecies(pokemon.name));
      if (new Set(bases).size !== bases.length) return false;
      return !usesMegaSlot(nextPokemon) || !hypothetical.some((pokemon) => pokemon.name !== nextPokemon.name && usesMegaSlot(pokemon));
    })
    .sort((a, b) => teamMemberKeepScore(a) - teamMemberKeepScore(b))[0] ?? null;
}

function teamMemberKeepScore(pokemon) {
  return teamAroundCandidateScore(pokemon, state.team[0] ?? state.selected ?? pokemon) + (state.battleSelection.includes(pokemon.name) ? 25 : 0);
}

function stylePlanChecks() {
  if (state.teamStyle === "rain") return rainPlanChecks();
  if (state.teamStyle === "sun") return sunPlanChecks();
  if (state.teamStyle === "sand") return sandPlanChecks();
  if (state.teamStyle === "snow") return snowPlanChecks();
  if (state.teamStyle === "trickroom") return trickRoomPlanChecks();
  if (state.teamStyle === "doublesupport") return doubleSupportPlanChecks();
  if (state.teamStyle === "hyperoffense") return hyperOffensePlanChecks();
  if (state.teamStyle === "voltturn") return voltTurnPlanChecks();
  if (state.teamStyle === "stall") return stallPlanChecks();
  return [];
}

function rainPlanChecks(team = state.team) {
  const members = team;
  const drizzle = members.filter((pokemon) => hasAbility(pokemon, "Drizzle"));
  const abusers = members.filter(isRainAbuser);
  const waterPressure = members.filter(isRainWaterPressure);
  const conflict = weatherConflictMembers(members, "rain");
  return [
    {
      ok: drizzle.length > 0,
      label: "Drizzle setter",
      note: drizzle.length ? `${drizzle.map(displayPokemonName).join(", ")} zet rain.` : "Voeg Pelipper of Politoed toe voor betrouwbare rain."
    },
    {
      ok: abusers.length > 0,
      label: "Swift Swim-abuser",
      note: abusers.length ? `${abusers.map(displayPokemonName).slice(0, 2).join(", ")} kan rain omzetten in tempo.` : "Rain wil minstens een echte Swift Swim- of rain-abuser."
    },
    {
      ok: waterPressure.length > 0,
      label: "Rain water-druk",
      note: waterPressure.length ? `${waterPressure.map(displayPokemonName).slice(0, 2).join(", ")} profiteert offensief van rain.` : "Voeg een Water-breaker of sterke Water-STAB toe."
    },
    ...["Electric", "Grass"].map((type) => planTypeCheck(members, type)),
    weatherConflictCheck(conflict, "Rain")
  ];
}

function sunPlanChecks(team = state.team) {
  const members = team;
  const drought = members.filter((pokemon) => hasAbility(pokemon, "Drought"));
  const chlorophyll = members.filter(isChlorophyllAbuser);
  const megaVenusaur = members.find((pokemon) => pokemon.name === "Venusaur-Mega");
  const firePressure = members.filter(isSunFirePressure);
  const conflict = weatherConflictMembers(members);
  const checkTypes = ["Rock", "Water", "Dragon"];

  return [
    {
      ok: drought.length > 0,
      label: "Drought setter",
      note: drought.length ? `${drought.map(displayPokemonName).join(", ")} zet sun.` : "Voeg Torkoal, Ninetales of Mega Charizard Y toe."
    },
    {
      ok: chlorophyll.length > 0 || Boolean(megaVenusaur),
      label: "Chlorophyll-abuser",
      note: chlorophyll.length
        ? `${chlorophyll.map(displayPokemonName).join(", ")} kan sun omzetten in aanvallend tempo.`
        : megaVenusaur
          ? "Mega Venusaur is vooral een bulky Sun-anchor; voeg een echte Chlorophyll-abuser toe als je wilt sweepen."
          : "Voeg een Chlorophyll-abuser toe als je echt via sun wilt sweepen."
    },
    {
      ok: firePressure.length >= 1,
      label: "Fire-druk",
      note: firePressure.length ? `${firePressure.map(displayPokemonName).slice(0, 2).join(", ")} profiteert offensief van sun.` : "Sun wil minimaal een Fire-breaker of Fire-coverage."
    },
    ...checkTypes.map((type) => {
      const answers = members.filter((pokemon) => isSunTypeAnswer(pokemon, type));
      return {
        ok: answers.length > 0,
        label: `${type}-antwoord`,
        note: answers.length ? `${answers.map(displayPokemonName).slice(0, 2).join(", ")} vangt ${type} op.` : `Sun-teams moeten ${type}-druk niet gratis laten binnenkomen.`
      };
    }),
    {
      ok: conflict.length === 0,
      label: "Geen weather-conflict",
      note: conflict.length ? `${conflict.map(displayPokemonName).join(", ")} zet ander weer en verstoort Sun.` : "Geen Rain/Sand/Snow setter in je Sun-plan."
    }
  ];
}

function sandPlanChecks(team = state.team) {
  const members = team;
  const stream = members.filter((pokemon) => hasAbility(pokemon, "Sand Stream"));
  const abusers = members.filter(isSandAbuser);
  const breakers = members.filter(isSandBreaker);
  const conflict = weatherConflictMembers(members, "sand");
  return [
    {
      ok: stream.length > 0,
      label: "Sand Stream setter",
      note: stream.length ? `${stream.map(displayPokemonName).join(", ")} zet sand.` : "Voeg Tyranitar of Hippowdon toe voor betrouwbare sand."
    },
    {
      ok: abusers.length > 0,
      label: "Sand abuser",
      note: abusers.length ? `${abusers.map(displayPokemonName).slice(0, 2).join(", ")} gebruikt Sand Rush/Force of sand-tempo.` : "Voeg een echte Sand Rush/Force-abuser toe."
    },
    {
      ok: breakers.length > 0,
      label: "Sand breaker",
      note: breakers.length ? `${breakers.map(displayPokemonName).slice(0, 2).join(", ")} geeft Rock/Ground/Steel-druk.` : "Sand heeft een breaker nodig die chip damage omzet in KOs."
    },
    ...["Water", "Grass", "Fighting"].map((type) => planTypeCheck(members, type)),
    weatherConflictCheck(conflict, "Sand")
  ];
}

function snowPlanChecks(team = state.team) {
  const members = team;
  const warning = members.filter((pokemon) => hasAbility(pokemon, "Snow Warning"));
  const abusers = members.filter(isSnowAbuser);
  const icePressure = members.filter(isSnowIcePressure);
  const conflict = weatherConflictMembers(members, "snow");
  return [
    {
      ok: warning.length > 0,
      label: "Snow Warning setter",
      note: warning.length ? `${warning.map(displayPokemonName).join(", ")} zet snow.` : "Voeg Abomasnow of Aurorus toe voor betrouwbare snow."
    },
    {
      ok: abusers.length > 0,
      label: "Snow abuser",
      note: abusers.length ? `${abusers.map(displayPokemonName).slice(0, 2).join(", ")} gebruikt snow voor tempo of bulk.` : "Voeg een Slush Rush-abuser of stevige Ice-core toe."
    },
    {
      ok: icePressure.length > 0,
      label: "Ice-druk",
      note: icePressure.length ? `${icePressure.map(displayPokemonName).slice(0, 2).join(", ")} zet Ice-druk.` : "Snow wil offensieve Ice-druk, niet alleen defensieve typing."
    },
    ...["Fire", "Steel", "Rock"].map((type) => planTypeCheck(members, type)),
    weatherConflictCheck(conflict, "Snow")
  ];
}

function trickRoomPlanChecks(team = state.team) {
  const members = team;
  const setters = members.filter(isTrickRoomSetter);
  const abusers = members.filter(isTrickRoomAbuser);
  const fast = members.filter((pokemon) => pokemon.spe >= 100);
  return [
    {
      ok: setters.length > 0,
      label: "Trick Room setter",
      note: setters.length ? `${setters.map(displayPokemonName).slice(0, 2).join(", ")} kan Trick Room zetten.` : "Voeg een betrouwbare Trick Room setter toe."
    },
    {
      ok: abusers.length >= 2,
      label: "Trick Room abuser",
      note: abusers.length ? `${abusers.map(displayPokemonName).slice(0, 3).join(", ")} is traag genoeg om Room te benutten.` : "Kies langzame sterke attackers; alleen setters zijn niet genoeg."
    },
    {
      ok: fast.length <= 2,
      label: "Speed-discipline",
      note: fast.length <= 2 ? "Niet te veel snelle Pokemon in je Room-plan." : `${fast.map(displayPokemonName).slice(0, 3).join(", ")} maakt het Room-plan te dubbelzinnig.`
    },
    planTypeCheck(members, "Dark"),
    planTypeCheck(members, "Ghost")
  ];
}

function doubleSupportPlanChecks(team = state.team) {
  const members = team;
  const speed = members.filter(hasTeamSpeedControl);
  const utility = members.filter(isDoubleUtility);
  const protect = members.filter((pokemon) => hasMoveInBuild(pokemon, "Protect"));
  return [
    {
      ok: speed.length > 0,
      label: "Speed-control support",
      note: speed.length ? `${speed.map(displayPokemonName).slice(0, 2).join(", ")} helpt tempo sturen.` : "Double support wil Tailwind, Icy Wind, Thunder Wave of vergelijkbare tempo-tools."
    },
    {
      ok: utility.length >= 2,
      label: "Double utility",
      note: utility.length ? `${utility.map(displayPokemonName).slice(0, 3).join(", ")} brengt utility zoals Intimidate, Fake Out, redirection of Prankster.` : "Voeg echte utility toe; bulk alleen maakt nog geen doubles-core."
    },
    {
      ok: protect.length >= 2,
      label: "Protect-plan",
      note: protect.length >= 2 ? `${protect.map(displayPokemonName).slice(0, 3).join(", ")} heeft Protect.` : "In doubles wil je meerdere Protect-gebruikers."
    }
  ];
}

function hyperOffensePlanChecks(team = state.team) {
  const members = team;
  const setup = members.filter(isSetupPressure);
  const entry = members.filter(hasEntryPressure);
  const passive = members.filter((pokemon) => ["Wall", "Bulky pivot"].includes(displayRoleForBuild(pokemon)) && !isSetupPressure(pokemon));
  return [
    {
      ok: setup.length >= 2,
      label: "Setupdruk",
      note: setup.length ? `${setup.map(displayPokemonName).slice(0, 3).join(", ")} kan directe setupdruk geven.` : "Hyper Offense wil meerdere setup- of cleanup-dreigingen."
    },
    {
      ok: entry.length > 0,
      label: "Lead pressure",
      note: entry.length ? `${entry.map(displayPokemonName).slice(0, 2).join(", ")} kan hazards/screens/tempo starten.` : "Voeg lead pressure toe: hazards, screens, Taunt of vergelijkbaar."
    },
    {
      ok: passive.length <= 1,
      label: "Weinig passiviteit",
      note: passive.length <= 1 ? "Niet te veel puur defensieve slots." : `${passive.map(displayPokemonName).slice(0, 3).join(", ")} maakt Hyper Offense snel passief.`
    }
  ];
}

function voltTurnPlanChecks(team = state.team) {
  const members = team;
  const pivots = members.filter(hasPivotMove);
  const speed = members.filter((pokemon) => pokemon.spe >= 100 || hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Intimidate"));
  return [
    {
      ok: pivots.length >= 2,
      label: "Pivot-kern",
      note: pivots.length ? `${pivots.map(displayPokemonName).slice(0, 3).join(", ")} houdt momentum met pivotmoves.` : "VoltTurn heeft meerdere U-turn/Volt Switch/Flip Turn/Parting Shot-gebruikers nodig."
    },
    {
      ok: speed.length >= 2,
      label: "Tempo na pivot",
      note: speed.length >= 2 ? `${speed.map(displayPokemonName).slice(0, 3).join(", ")} houdt tempo na de pivot.` : "Voeg snelheid, Regenerator of Intimidate toe om pivots veilig te houden."
    },
    planTypeCheck(members, "Ground")
  ];
}

function stallPlanChecks(team = state.team) {
  const members = team;
  const recovery = members.filter(hasReliableRecovery);
  const chip = members.filter(hasStatusOrChip);
  const answers = members.filter((pokemon) => pokemon.hp + pokemon.def + pokemon.spd >= 305 || hasAbility(pokemon, "Unaware") || hasAbility(pokemon, "Regenerator"));
  return [
    {
      ok: recovery.length >= 2,
      label: "Recovery-kern",
      note: recovery.length ? `${recovery.map(displayPokemonName).slice(0, 3).join(", ")} heeft recovery of Wish.` : "Stall valt om zonder betrouwbare recovery."
    },
    {
      ok: chip.length >= 2,
      label: "Status/chip",
      note: chip.length ? `${chip.map(displayPokemonName).slice(0, 3).join(", ")} kan status, hazards of chip forceren.` : "Stall heeft status, hazards of chip nodig om te winnen."
    },
    {
      ok: answers.length >= 3,
      label: "Defensieve antwoorden",
      note: answers.length >= 3 ? `${answers.map(displayPokemonName).slice(0, 3).join(", ")} geeft verdedigende marge.` : "Voeg meer echte walls, Unaware of Regenerator toe."
    }
  ];
}

function planTypeCheck(members, type) {
  const answers = members.filter((pokemon) => isPlanTypeAnswer(pokemon, type));
  return {
    ok: answers.length > 0,
    label: `${type}-antwoord`,
    note: answers.length ? `${answers.map(displayPokemonName).slice(0, 2).join(", ")} vangt ${type} op.` : `${TEAM_STYLES[state.teamStyle].label}-teams moeten ${type}-druk niet gratis laten binnenkomen.`
  };
}

function weatherConflictCheck(conflict, label) {
  return {
    ok: conflict.length === 0,
    label: "Geen weather-conflict",
    note: conflict.length ? `${conflict.map(displayPokemonName).join(", ")} zet ander weer en verstoort ${label}.` : `Geen andere weather-setter in je ${label}-plan.`
  };
}

function weatherConflictMembers(team = state.team, style = state.teamStyle) {
  const conflictAbilities = {
    rain: ["Drought", "Sand Stream", "Snow Warning"],
    sun: ["Drizzle", "Sand Stream", "Snow Warning"],
    sand: ["Drizzle", "Drought", "Snow Warning"],
    snow: ["Drizzle", "Drought", "Sand Stream"]
  }[style] ?? [];
  return team.filter((pokemon) => conflictAbilities.some((ability) => hasAbility(pokemon, ability)));
}

function styleCoreScore(team = state.team) {
  const checks = withTemporaryTeam(team, () => stylePlanChecks());
  const done = checks.filter((check) => check.ok).length;
  return {
    active: checks.length > 0,
    value: checks.length ? done / checks.length * 100 : 100,
    note: checks.length ? `${done}/${checks.length} planchecks afgedekt` : "Geen planchecks actief"
  };
}

function createBalancePanel() {
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const panel = document.createElement("div");
  panel.className = "analysis-block";
  panel.append(createSmallTitle("Balans"));

  const chips = document.createElement("div");
  chips.className = "analysis-chips";
  [
    [`${balance.physical}/${targets.physical} fysiek`, balance.physical >= targets.physical],
    [`${balance.special}/${targets.special} speciaal`, balance.special >= targets.special],
    [`${balance.fast}/${targets.fast} snel`, balance.fast >= targets.fast],
    [`${balance.bulky}/${targets.bulky} bulky`, balance.bulky >= targets.bulky]
  ].forEach(([label, active]) => {
    const chip = document.createElement("span");
    chip.className = `analysis-chip${active ? " good" : ""}`;
    chip.textContent = label;
    chips.append(chip);
  });

  const advice = document.createElement("p");
  advice.textContent = balanceAdvice(balance);
  panel.append(chips, advice);
  return panel;
}

function createRoleChecklistPanel() {
  const panel = document.createElement("details");
  panel.className = "analysis-block";
  const summary = document.createElement("summary");
  summary.textContent = "Rollen";
  panel.append(summary);

  const roles = roleCoverage();
  const list = document.createElement("div");
  list.className = "role-checklist";
  roles.forEach((role) => {
    const item = document.createElement("div");
    item.className = `role-check${role.done ? " done" : ""}`;

    const mark = document.createElement("span");
    mark.textContent = role.done ? "OK" : "Nog nodig";
    const text = document.createElement("strong");
    text.textContent = role.label;
    const note = document.createElement("small");
    note.textContent = role.note;

    item.append(mark, text, note);
    if (!role.done) {
      const candidate = bestRoleCandidate(role);
      const action = candidate ? createNeedAction(candidate, `Beste optie voor ${role.label}`) : null;
      if (action) item.append(action);
    }
    list.append(item);
  });

  panel.append(list);
  return panel;
}

function bestRoleCandidate(role) {
  const available = state.pokemon.filter((pokemon) => !state.team.some((member) => member.name === pokemon.name));
  const scored = available
    .filter(candidateIsActionable)
    .map((pokemon) => ({ pokemon, score: roleCandidateScore(pokemon, role.label) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst);
  return scored[0]?.pokemon ?? null;
}

function roleCandidateScore(pokemon, label) {
  const build = selectedBuild(pokemon);
  const role = displayRoleForBuild(pokemon);
  const offense = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;
  if (/fysieke druk/i.test(label)) return pokemon.atk >= pokemon.spa && offense >= 110 ? offense + pokemon.spe / 2 : 0;
  if (/speciale druk/i.test(label)) return pokemon.spa > pokemon.atk && offense >= 110 ? offense + pokemon.spe / 2 : 0;
  if (/speed/i.test(label)) return pokemon.spe >= 100 || /speed|sweeper/i.test(role) ? pokemon.spe + offense / 4 : 0;
  if (/defensieve/i.test(label)) return bulk >= 260 || /wall|support|pivot/i.test(role) ? bulk + pokemon.spe / 4 : 0;
  if (/ground/i.test(label)) return defensiveMultiplier(pokemon.types, "Ground") < 1 ? bulk + pokemon.bst / 5 : 0;
  if (/fairy/i.test(label)) return defensiveMultiplier(pokemon.types, "Fairy") < 1 ? bulk + pokemon.bst / 5 : 0;
  return setQualityClass(build) === "good" ? pokemon.bst : pokemon.bst / 2;
}

function createTypePanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block type-analysis";
  panel.append(createSmallTitle("Matchups"));

  const concerns = teamTypeSummary()
    .filter((item) => item.weak >= 2 && item.resist + item.immune === 0)
    .slice(0, 4);

  if (!concerns.length) {
    const good = document.createElement("p");
    good.textContent = "Geen onbeantwoorde gedeelde zwakte.";
    panel.append(good);
  } else {
    panel.append(createTypeList(concerns, "Let op"));
  }

  const covered = teamTypeSummary()
    .filter((item) => item.resist + item.immune >= 2)
    .slice(0, 4);
  if (covered.length) panel.append(createTypeList(covered, "Goed afgedekt"));

  return panel;
}

function createFormatFocusPanel() {
  const format = state.championsMeta.formats?.[state.battleFormat];
  const panel = document.createElement("div");
  panel.className = "analysis-block format-focus";
  panel.append(createSmallTitle("Formatregels"));

  const list = document.createElement("div");
  list.className = "format-priorities";
  (format?.priorities ?? []).forEach((priority) => {
    const item = document.createElement("span");
    item.textContent = priority;
    list.append(item);
  });

  panel.append(list);
  return panel;
}

function createSuggestionPanel() {
  const replacementMode = state.team.length >= maxTeamSize();
  const suggestions = replacementMode ? replacementSuggestions().slice(0, 3) : suggestedPokemon(3);
  const panel = document.createElement("details");
  panel.className = "analysis-block suggestion-panel";
  panel.open = !replacementMode;
  const summary = document.createElement("summary");
  summary.append(createSuggestionHeader(replacementMode ? "Vervang-suggesties" : "Suggesties"));
  panel.append(summary);

  if (!suggestions.length) {
    const done = document.createElement("p");
    done.textContent = replacementMode
      ? "Geen duidelijke vervanging gevonden met de huidige data."
      : "Geen duidelijke aanvulling gevonden met de huidige filters.";
    panel.append(done);
    return panel;
  }

  const list = document.createElement("div");
  list.className = "suggestions";
  suggestions.forEach(({ pokemon, reason, replace }) => {
    const card = document.createElement("article");
    card.className = "suggestion";

    const spriteWrap = document.createElement("span");
    spriteWrap.className = "suggestion-sprite";
    spriteWrap.title = `Bekijk details van ${displayPokemonName(pokemon)}`;
    spriteWrap.addEventListener("click", (event) => {
      event.stopPropagation();
      showPokemonDetails(pokemon);
    });
    const sprite = document.createElement("img");
    sprite.src = spriteUrl(pokemon.name);
    sprite.alt = "";
    sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, pokemon.name), { once: true });
    spriteWrap.append(sprite);

    const body = document.createElement("span");
    body.className = "suggestion-body";
    const top = document.createElement("span");
    top.className = "suggestion-top";
    const name = document.createElement("strong");
    name.textContent = displayPokemonName(pokemon);
    const bst = document.createElement("small");
    bst.textContent = `BST ${pokemon.bst}`;
    top.append(name, bst);

    const chips = document.createElement("span");
    chips.className = "suggestion-types";
    chips.replaceChildren(...pokemon.types.map(createTypeChip));

    const text = document.createElement("span");
    text.className = "suggestion-reason";
    text.textContent = replace
      ? `Vervang ${displayPokemonName(replace)}: ${reason}`
      : `${roleFor(pokemon).label}: ${reason}`;
    const build = selectedBuild(pokemon);
    const quality = document.createElement("span");
    quality.className = `suggestion-quality ${setQualityClass(build)}`;
    quality.textContent = quickDecisionLabel(pokemon, build);
    const details = document.createElement("span");
    details.className = "suggestion-details";
    details.textContent = suggestionDetailLine(pokemon, build);
    const actions = document.createElement("span");
    actions.className = "suggestion-actions";
    const add = document.createElement("button");
    add.type = "button";
    add.textContent = replace ? "Vervang" : "Voeg toe";
    add.addEventListener("click", () => {
      if (replace) replaceTeamMember(replace.name, pokemon);
      else addToTeam(pokemon, { deferRender: true });
      state.selected = pokemon;
      if (replace) render();
    });
    const explain = document.createElement("button");
    explain.type = "button";
    explain.textContent = state.explanationOpen === pokemon.name ? "Verberg uitleg" : "Waarom?";
    explain.addEventListener("click", () => {
      state.explanationOpen = state.explanationOpen === pokemon.name ? "" : pokemon.name;
      render();
    });
    actions.append(add, explain);
    body.append(top, chips, text, details, quality, actions);
    if (state.explanationOpen === pokemon.name) {
      const details = document.createElement("span");
      details.className = "suggestion-explain";
      details.textContent = suggestionExplanation(pokemon, reason);
      body.append(details);
    }
    card.append(spriteWrap, body);
    list.append(card);
  });

  panel.append(list);
  return panel;
}

function createSuggestionHeader(title) {
  const header = document.createElement("div");
  header.className = "suggestion-title-row";
  header.append(createSmallTitle(title));
  header.append(createSuggestionRefreshButton());
  return header;
}

function suggestionDetailLine(pokemon, build = selectedBuild(pokemon)) {
  const offense = pokemon.atk >= pokemon.spa ? `Atk ${pokemon.atk}` : `SpA ${pokemon.spa}`;
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;
  return `${offense} · Spe ${pokemon.spe} · Bulk ${bulk} · ${preferredAbility(pokemon)} · ${setQualityLabel(build)}`;
}

function createThreatChecklistPanel() {
  const threats = relevantThreats();
  const panel = document.createElement("details");
  panel.className = "analysis-block threat-checklist";
  const summary = document.createElement("summary");
  summary.textContent = "Threat-check";
  panel.append(summary);

  if (!threats.length) {
    const empty = document.createElement("p");
    empty.textContent = "Nog geen lokale threat-data voor dit format.";
    panel.append(empty);
    return panel;
  }

  const list = document.createElement("div");
  list.className = "threat-list";
  threats.slice(0, 6).forEach((threat) => {
    const status = threatAnswerStatus(threat);
    const item = document.createElement("div");
    item.className = `threat-item ${status.ok ? "covered" : "open"}`;

    const mark = document.createElement("span");
    mark.textContent = status.ok ? "OK" : "Check";
    const threatPokemon = state.pokemon.find((pokemon) => pokemon.name === threat.name);
    const spriteWrap = document.createElement("span");
    spriteWrap.className = "threat-sprite";
    if (threatPokemon) {
      const sprite = document.createElement("img");
      sprite.src = spriteUrl(threatPokemon.name);
      sprite.alt = "";
      sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, threatPokemon.name), { once: true });
      spriteWrap.append(sprite);
    } else {
      spriteWrap.textContent = threat.name.slice(0, 2).toUpperCase();
    }
    const body = document.createElement("div");
    const top = document.createElement("strong");
    top.textContent = displayPokemonName(threat.name);
    const tags = document.createElement("small");
    tags.textContent = `${(threat.tags ?? []).join(" · ")}${status.answer ? ` · ${status.answer}` : ""}`;
    const note = document.createElement("p");
    note.textContent = status.ok ? status.note : threat.note;
    body.append(top, tags, note);
    item.append(mark, spriteWrap, body);
    list.append(item);
  });

  panel.append(list);
  return panel;
}

function replacementSuggestions() {
  return cachedValue("replacementSuggestions", analysisSignature(state.team), () => {
    const baseline = teamScoreTotalFor(state.team);
    const candidates = state.pokemon
    .filter((pokemon) => !state.team.some((member) => member.name === pokemon.name))
    .filter((pokemon) => !needsValidationAsCore(pokemon))
    .map((pokemon) => {
      let best = null;
      state.team.forEach((member, index) => {
        if (index === 0) return;
        const hypotheticalTeam = state.team.map((item) => item.name === member.name ? pokemon : item);
        const bases = hypotheticalTeam.map((item) => baseSpecies(item.name));
        if (new Set(bases).size !== bases.length) return;
        if (usesMegaSlot(pokemon) && state.team.some((item) => item.name !== member.name && usesMegaSlot(item))) return;
        const score = teamScoreTotalFor(hypotheticalTeam);
        const gain = score - baseline;
        if (!best || gain > best.gain) best = { replace: member, gain };
      });
      const reasons = suggestionReasons(pokemon).reasons;
      return {
        pokemon,
        replace: best?.replace,
        score: best?.gain ?? 0,
        reason: reasons[0] || `verbetert mogelijk ${displayRoleForBuild(pokemon)}`
      };
    })
    .filter((item) => item.replace && item.score > -20)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst);
    return candidates.slice(0, 3);
  });
}

function replaceTeamMember(oldName, nextPokemon) {
  const index = state.team.findIndex((pokemon) => pokemon.name === oldName);
  if (index === -1) return;
  if (index === 0) {
    state.teamNotice = `${displayPokemonName(state.team[0])} is je core in slot 1 en wordt niet automatisch vervangen.`;
    return;
  }
  state.team[index] = nextPokemon;
  state.battleSelection = state.battleSelection.map((name) => name === oldName ? nextPokemon.name : name);
  state.selected = nextPokemon;
  delete state.manualSets[oldName];
  delete state.selectedSets[oldName];
  optimizeTeamSets();
  state.teamNotice = `${displayPokemonName(oldName)} vervangen door ${displayPokemonName(nextPokemon)}.`;
  invalidateCache();
}

function createTeamSelectionPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block team-selection-sim";

  const head = document.createElement("div");
  head.className = "selection-head";
  head.append(createSmallTitle(`Battle core (${BATTLE_FORMATS[state.battleFormat].label})`));
  const autoPick = document.createElement("button");
  autoPick.type = "button";
  autoPick.className = "analysis-action-button";
  autoPick.textContent = `Beste ${battleSelectionSize()}`;
  autoPick.disabled = state.team.length < battleSelectionSize();
  autoPick.title = `Kies automatisch de beste ${battleSelectionSize()} voor ${BATTLE_FORMATS[state.battleFormat].label}`;
  autoPick.addEventListener("click", () => {
    selectBestBattleTeam();
    state.teamNotice = `Beste ${battleSelectionSize()} gekozen voor ${BATTLE_FORMATS[state.battleFormat].label}.`;
    invalidateCache("battle");
    renderTeamPreviewAnalysis();
    renderBattleSim();
  });
  head.append(autoPick);
  panel.append(head);

  const note = document.createElement("p");
  note.textContent = state.team.length < maxTeamSize()
    ? `Bouw eerst richting een party van 6. Je battle core is de ${battleSelectionSize()} Pokémon die je echt meeneemt.`
    : `Je hebt een party van 6. Kies hieronder welke ${battleSelectionSize()} je als battle core meeneemt tegen de preview van je tegenstander.`;

  const list = document.createElement("div");
  list.className = "selection-list";
  state.team.forEach((pokemon, index) => {
    const build = selectedBuild(pokemon);
    const item = document.createElement("button");
    item.type = "button";
    const selected = state.battleSelection.includes(pokemon.name);
    item.className = `selection-item${selected ? " selected" : ""}`;
    item.innerHTML = `
      <span>${selected ? "✓" : index + 1}</span>
      <strong>${escapeHtml(displayPokemonName(pokemon))}</strong>
      <small>${escapeHtml(formatFitLabel(pokemon))} · ${escapeHtml(setQualityLabel(build))}</small>
    `;
    item.addEventListener("click", () => toggleBattleSelection(pokemon));
    list.append(item);
  });

  panel.append(note, list);
  return panel;
}

function selectBestBattleTeam() {
  state.battleSelection = state.team
    .map((pokemon, index) => ({ pokemon, score: previewCandidateScore(pokemon, index) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, battleSelectionSize())
    .sort((a, b) => state.team.indexOf(a.pokemon) - state.team.indexOf(b.pokemon))
    .map((item) => item.pokemon.name);
}

function previewCandidateScore(pokemon, index) {
  const build = selectedBuild(pokemon);
  const role = displayRoleForBuild(pokemon, build);
  const balance = teamBalance();
  let score = teamAroundCandidateScore(pokemon, state.team[0] ?? pokemon);
  if (index === 0) score += 55;
  if (teamStyleMatch(pokemon)) score += 45;
  if (build.status === "smogon-champions") score += 38;
  else if (build.status === "smogon-sv") score += 24;
  if (["Sweeper", "Wallbreaker", "Speed control"].includes(role)) score += 25;
  if (pokemon.spe >= 100) score += 18;
  if (state.teamStyle === "sun" && (hasAbility(pokemon, "Drought") || pokemon.types.includes("Fire") || hasAbility(pokemon, "Chlorophyll"))) score += 26;
  if (state.battleFormat === "double4" && selectedBuild(pokemon).moves?.some((move) => /protect|fake out|tailwind|icy wind|helping hand/i.test(move))) score += 32;
  if (balance.physical === 0 && pokemon.atk >= pokemon.spa) score += 18;
  if (balance.special === 0 && pokemon.spa > pokemon.atk) score += 18;
  if (weatherConflictsWithStyle(pokemon)) score -= 70;
  return score;
}

function createTeamUsagePanel() {
  const panel = document.createElement("details");
  panel.className = "analysis-block team-usage";
  const summary = document.createElement("summary");
  summary.textContent = "Zo gebruik je dit team";

  const picks = state.battleSelection
    .map((name) => state.team.find((pokemon) => pokemon.name === name))
    .filter(Boolean);
  const active = picks.length ? picks : state.team.slice(0, battleSelectionSize());
  const lead = recommendedLead(active);
  const wincons = active.filter((pokemon) => ["Sweeper", "Wallbreaker", "Speed control"].includes(displayRoleForBuild(pokemon))).slice(0, 2);
  const pivots = active.filter((pokemon) => ["Wall", "Bulky pivot", "Support", "Setup", "Allrounder"].includes(displayRoleForBuild(pokemon))).slice(0, 2);
  const risks = teamTypeSummary()
    .filter((item) => item.weak >= 2)
    .slice(0, 3)
    .map((item) => item.type);

  const body = document.createElement("div");
  body.className = "team-usage-body";

  const intro = document.createElement("p");
  intro.className = "usage-intro";
  intro.textContent = state.battleSelection.length === battleSelectionSize()
    ? `Gebaseerd op je huidige Team Preview-selectie: ${active.map(displayPokemonName).join(", ")}.`
    : `Kies eerst ${battleSelectionSize()} Pokémon in Team Preview voor een scherper gameplan.`;

  const list = document.createElement("div");
  list.className = "usage-grid";
  usageRows({
    lead,
    wincons,
    pivots,
    risks,
    complete: state.team.length >= maxTeamSize(),
    selected: state.battleSelection.length === battleSelectionSize()
  }).forEach(([label, value]) => {
    const row = document.createElement("div");
    row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    list.append(row);
  });

  const sequence = document.createElement("ol");
  sequence.className = "usage-sequence";
  teamGamePlanSteps({ lead, wincons, pivots, risks }).forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    sequence.append(item);
  });

  body.append(intro, list, sequence);
  panel.append(summary, body);
  return panel;
}

function recommendedLead(team) {
  return team.find((pokemon) => selectedBuild(pokemon).moves?.some((move) => /stealth rock|spikes|sticky web|tailwind|fake out/i.test(move)))
    ?? team.find((pokemon) => pokemon.spe >= 100)
    ?? team[0];
}

function usageRows({ lead, wincons, pivots, risks, complete, selected }) {
  const plan = TEAM_STYLES[state.teamStyle].label;
  const format = BATTLE_FORMATS[state.battleFormat].label;
  return [
    ["Teamplan", `${plan}: ${planGuideItems(state.teamStyle)[0]}`],
    ["Preview", selected ? `Speel vanuit je gekozen ${battleSelectionSize()} voor ${format}.` : `Kies nog ${battleSelectionSize()} Pokémon voor een concreet gameplan.`],
    ["Lead", lead ? `Start vaak met ${displayPokemonName(lead)} als tempo- of informatielead.` : "Kies eerst een stabiele lead."],
    ["Winconditie", wincons.length ? `${wincons.map(displayPokemonName).join(" / ")} bewaart druk voor mid- of late-game.` : "Voeg een duidelijke cleaner of breaker toe."],
    ["Veilige wissel", pivots.length ? `${pivots.map(displayPokemonName).join(" / ")} gebruiken om momentum terug te pakken.` : "Je mist nog een comfortabele switch-in."],
    ["Let op", risks.length ? `Bescherm tegen ${risks.join(", ")}.` : complete ? "Geen grote gedeelde typezwakte gevonden." : "Team nog in opbouw; check gedeelde zwaktes later opnieuw."]
  ];
}

function teamGamePlanSteps({ lead, wincons, pivots, risks }) {
  const steps = [
    lead
      ? `Open met ${displayPokemonName(lead)} wanneer je tempo, hazards of eerste informatie nodig hebt.`
      : "Open met je veiligste Pokémon en scout eerst de belangrijkste threat.",
    pivots.length
      ? `Gebruik ${pivots.map(displayPokemonName).join(" / ")} om ongunstige matchups op te vangen.`
      : "Vermijd onnodige harde switches totdat je een defensieve pivot hebt gekozen.",
    wincons.length
      ? `Bewaar ${wincons.map(displayPokemonName).join(" / ")} tot checks verzwakt of verwijderd zijn.`
      : "Zoek nog een duidelijke late-game cleaner of wallbreaker.",
    risks.length
      ? `Speel rond ${risks.join(", ")}: geef die types geen gratis switch-in.`
      : "Als de matchup neutraal is, speel rond positionering en behoud je snelste slot."
  ];
  if (state.battleFormat === "double4") {
    steps.splice(1, 0, "In Doubles: kies leads die elkaar beschermen, niet alleen de twee sterkste losse Pokémon.");
  }
  return steps;
}

function createDataStatusPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block data-status-panel";
  panel.append(createSmallTitle("Data-status"));

  const list = document.createElement("div");
  list.className = "data-status-list";
  state.team.forEach((pokemon) => {
    const build = selectedBuild(pokemon);
    const row = document.createElement("div");
    row.className = "data-status-row";
    row.innerHTML = `
      <strong>${escapeHtml(displayPokemonName(pokemon))}</strong>
      <span>${escapeHtml(setQualityLabel(build))}</span>
      <small>${escapeHtml(buildSourceLabel(build))}</small>
    `;
    list.append(row);
  });

  const note = document.createElement("p");
  note.textContent = "Door de app bedachte sets zijn offline startpunten en moeten voor Champions nog gevalideerd worden.";
  panel.append(list, note);
  return panel;
}

function relevantThreats() {
  const existing = new Set(state.pokemon.map((pokemon) => pokemon.name));
  const style = TEAM_STYLES[state.teamStyle].label;
  return (state.championsMeta.threats ?? [])
    .filter((threat) => existing.has(threat.name))
    .filter((threat) => !threat.formats || threat.formats.includes(state.battleFormat))
    .map((threat) => ({
      ...threat,
      weight: (threat.priority === "high" ? 3 : 1)
        + ((threat.tags ?? []).some((tag) => tag.toLowerCase().includes(style.toLowerCase())) ? 2 : 0)
    }))
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
}

function threatAnswerStatus(threat) {
  return threatAnswerStatusForTeam(threat, analysisTeam());
}

function threatAnswerStatusForTeam(threat, team) {
  const answers = threat.answers ?? [];
  const attackTypes = threat.attackTypes ?? [];
  const answerByType = team.find((pokemon) => isReliableThreatAnswer(pokemon) && answers.some((type) => pokemon.types.includes(type)));
  if (answerByType) {
    return {
      ok: true,
      answer: `${answerByType.name} heeft ${answerByType.types.filter((type) => answers.includes(type)).join("/")}`,
      note: `${answerByType.name} is een direct type-antwoord.`
    };
  }

  const defensiveAnswer = team.find((pokemon) => isReliableThreatAnswer(pokemon) && attackTypes.some((type) => defensiveMultiplier(pokemon.types, type) < 1));
  if (defensiveAnswer) {
    const resisted = attackTypes.filter((type) => defensiveMultiplier(defensiveAnswer.types, type) < 1);
    return {
      ok: true,
      answer: `${defensiveAnswer.name} resist ${resisted.join("/")}`,
      note: `${defensiveAnswer.name} kan minstens een belangrijke STAB opvangen.`
    };
  }

  const speedAnswer = team.find((pokemon) => isReliableThreatAnswer(pokemon) && pokemon.spe >= 110);
  if (speedAnswer && (threat.tags ?? []).some((tag) => tag.includes("speed") || tag.includes("setup"))) {
    return {
      ok: true,
      answer: `${speedAnswer.name} geeft snelheid`,
      note: `${speedAnswer.name} helpt met revenge-kill of tempo.`
    };
  }

  const softAnswer = team.find((pokemon) => answers.some((type) => pokemon.types.includes(type)) || attackTypes.some((type) => defensiveMultiplier(pokemon.types, type) < 1));
  if (softAnswer) {
    return {
      ok: false,
      answer: `${softAnswer.name} is alleen een soft check`,
      note: `${softAnswer.name} heeft nuttige typing, maar mist set-validatie, stats of teamwaarde om dit als hard antwoord te tellen.`
    };
  }

  return { ok: false, answer: "", note: threat.note };
}

function createExportPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block";
  panel.append(createSmallTitle("Starter export"));

  const note = document.createElement("p");
  note.textContent = "Deze export gebruikt placeholders voor moves/items, omdat de huidige dataset geen echte Champions movesets bevat.";

  const exportText = document.createElement("textarea");
  exportText.className = "team-export";
  exportText.readOnly = true;
  exportText.value = teamExportText();

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "copy-export";
  copy.textContent = "Kopieer export";
  copy.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(exportText.value).catch(() => {});
    copy.textContent = "Gekopieerd";
    window.setTimeout(() => {
      copy.textContent = "Kopieer export";
    }, 1000);
  });

  panel.append(note, exportText, copy);
  return panel;
}

function createTypeList(items, label) {
  const group = document.createElement("div");
  group.className = "type-match-list";

  const caption = document.createElement("span");
  caption.className = "match-caption";
  caption.textContent = label;
  group.append(caption);

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "type-match-row";
    row.append(createTypeChip(item.type));

    const text = document.createElement("span");
    text.textContent = `${item.weak} zwak, ${item.resist} resist, ${item.immune} immuun`;
    row.append(text);
    group.append(row);
  });

  return group;
}

function createSectionHead(title) {
  const head = document.createElement("div");
  head.className = "panel-head";
  const heading = document.createElement("h2");
  heading.textContent = title;
  head.append(heading);
  return head;
}

function createSmallTitle(title) {
  const heading = document.createElement("h3");
  heading.textContent = title;
  return heading;
}

function analysisTeam() {
  if (state.battleSelection.length === battleSelectionSize()) {
    const selectedNames = new Set(state.battleSelection);
    return state.team.filter((pokemon) => selectedNames.has(pokemon.name));
  }
  return state.team;
}

function teamSignature(team = state.team) {
  return team.map((pokemon) => pokemon.name).join("|");
}

function selectedSetsSignature() {
  return Object.keys(state.selectedSets)
    .sort()
    .map((name) => `${name}:${state.selectedSets[name]}`)
    .join("|");
}

function customSetsSignature() {
  return Object.keys(state.customSets)
    .sort()
    .map((name) => `${name}:${JSON.stringify(state.customSets[name])}`)
    .join("|");
}

function analysisSignature(team = analysisTeam()) {
  return [
    teamSignature(team),
    state.teamStyle,
    state.battleFormat,
    state.battleSelection.join("|"),
    selectedSetsSignature(),
    customSetsSignature()
  ].join("::");
}

function cachedValue(bucketName, key, compute) {
  state.cache[bucketName] ??= new Map();
  const bucket = state.cache[bucketName];
  if (bucket.has(key)) return bucket.get(key);
  const value = compute();
  bucket.set(key, value);
  return value;
}

function teamTypeSummary(team = state.team) {
  const resolvedTeam = team === state.team ? analysisTeam() : team;
  return cachedValue("teamTypeSummaries", teamSignature(resolvedTeam), () => pureTeamTypeSummary(resolvedTeam));
}

function defensiveMultiplier(defenderTypes, attackType) {
  return pureDefensiveMultiplier(defenderTypes, attackType);
}

function teamLegality(pokemon) {
  return pureTeamLegality({
    pokemon,
    team: state.team,
    battleFormat: state.battleFormat,
    battleFormats: BATTLE_FORMATS,
    selectedBuild
  });
}

function teamRules() {
  const megaUsers = state.team.filter(usesMegaSlot);
  const mismatchedMegaItems = state.team.filter((pokemon) => {
    const build = selectedBuild(pokemon);
    const itemBase = pureMegaBaseFromItem(build.item);
    return itemBase && itemBase !== baseSpecies(pokemon.name);
  });
  const baseSpeciesCounts = state.team.reduce((counts, pokemon) => {
    const base = baseSpecies(pokemon.name);
    counts.set(base, (counts.get(base) ?? 0) + 1);
    return counts;
  }, new Map());
  const duplicateBase = [...baseSpeciesCounts.entries()].find(([, count]) => count > 1);

  return [
    {
      ok: state.team.length <= maxTeamSize(),
      label: "Team van 6",
      note: `${state.team.length}/6 gekozen.`
    },
    {
      ok: state.battleSelection.length === battleSelectionSize(),
      label: `${BATTLE_FORMATS[state.battleFormat].label} selectie`,
      note: `${state.battleSelection.length}/${battleSelectionSize()} gekozen voor Team Preview.`
    },
    {
      ok: megaUsers.length <= 1,
      label: "Maximaal 1 Mega",
      note: megaUsers.length ? `${megaUsers.map(displayPokemonName).join(", ")} gebruikt Mega-slot.` : "Nog geen Mega gekozen."
    },
    {
      ok: !mismatchedMegaItems.length,
      label: "Mega-stone klopt",
      note: mismatchedMegaItems.length
        ? `${mismatchedMegaItems.map(displayPokemonName).join(", ")} heeft een stone voor een andere species.`
        : "Mega-stones passen bij hun Pokémon."
    },
    {
      ok: !duplicateBase,
      label: "Geen dubbele basisspecies",
      note: duplicateBase ? `${duplicateBase[0]} komt dubbel voor.` : "Normale en Mega-vorm tellen als dezelfde species."
    }
  ];
}

function maxTeamSize() {
  return BATTLE_FORMATS[state.battleFormat].maxTeamSize;
}

function isMega(pokemon) {
  return pureIsMega(pokemon);
}

function usesMegaSlot(pokemon, build = selectedBuild(pokemon)) {
  return purePokemonUsesMegaSlot(pokemon, build);
}

function baseSpecies(name) {
  return pureBaseSpecies(name);
}

function baseSpeciesLabel(name) {
  return pureBaseSpeciesLabel(name);
}

function teamBalance() {
  return teamBalanceFor(analysisTeam());
}

function teamBalanceFor(team) {
  const key = teamSignature(team);
  return cachedValue("teamBalances", key, () => team.reduce((totals, pokemon) => {
    if (needsValidationAsCore(pokemon)) {
      totals.unreliable += 1;
      return totals;
    }
    if (pokemon.atk >= pokemon.spa + 15) totals.physical += 1;
    else if (pokemon.spa >= pokemon.atk + 15) totals.special += 1;
    else totals.mixed += 1;
    if (pokemon.spe >= 100) totals.fast += 1;
    if (pokemon.hp + pokemon.def + pokemon.spd >= 280) totals.bulky += 1;
    return totals;
  }, { physical: 0, special: 0, mixed: 0, fast: 0, bulky: 0, unreliable: 0 }));
}

function balanceAdvice(balance) {
  const targets = TEAM_STYLES[state.teamStyle].targets;
  if (state.team.length < 3) return "Voeg eerst een paar favorieten toe; daarna wordt de analyse scherper.";
  if (balance.unreliable) return `${balance.unreliable} teamlid${balance.unreliable === 1 ? "" : "en"} telt nog niet als betrouwbare topteam-bouwsteen door lage basiswaarde of generated data.`;
  if (balance.special < targets.special) return "Je mist speciale aanvallers. Fysieke walls kunnen dit team anders afstoppen.";
  if (balance.physical < targets.physical) return "Je mist fysieke aanvallers. Speciale walls kunnen dit team anders afstoppen.";
  if (balance.fast < targets.fast) return "Je team heeft meer snelheid nodig om snelle threats af te maken.";
  if (balance.bulky < targets.bulky) return "Je team heeft meer veilige switch-ins nodig om druk op te vangen.";
  return "De basisbalans ziet er bruikbaar uit. Let nu vooral op gedeelde type-zwaktes.";
}

function suggestedPokemon(limit = 3) {
  const cacheKey = `${analysisSignature(state.team)}::${limit}::${state.startSuggestionPage}`;
  return cachedValue("suggestedPokemon", cacheKey, () => computeSuggestedPokemon(limit));
}

function computeSuggestedPokemon(limit = 3) {
  const names = new Set(state.team.map((pokemon) => pokemon.name));
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const topWeaknesses = teamTypeSummary()
    .filter((item) => item.weak >= 2)
    .map((item) => item.type);

  const ranked = state.pokemon
    .filter((pokemon) => !names.has(pokemon.name))
    .filter((pokemon) => teamLegality(pokemon).ok)
    .map((pokemon) => {
      const role = roleFor(pokemon);
      const build = selectedBuild(pokemon);
      let score = 0;
      const reasons = [];
      const explanation = suggestionReasons(pokemon, { balance, targets, topWeaknesses });

      topWeaknesses.forEach((type) => {
        const multiplier = defensiveMultiplier(pokemon.types, type);
        if (multiplier === 0) {
          score += 4;
          reasons.push(`immuun voor ${type}`);
        } else if (multiplier < 1) {
          score += 3;
          reasons.push(`resist ${type}`);
        }
      });

      if (balance.special < targets.special && pokemon.spa > pokemon.atk) {
        score += 2;
        reasons.push("voegt speciale druk toe");
      }
      if (balance.physical < targets.physical && pokemon.atk > pokemon.spa) {
        score += 2;
        reasons.push("voegt fysieke druk toe");
      }
      if (balance.fast < targets.fast && pokemon.spe >= 100) {
        score += 2;
        reasons.push("maakt het team sneller");
      }
      if (balance.bulky < targets.bulky && pokemon.hp + pokemon.def + pokemon.spd >= 280) {
        score += 2;
        reasons.push("kan aanvallen opvangen");
      }

      score += explanation.score;
      if (build.status === "generated") {
        score -= 3;
        reasons.push("set moet nog gevalideerd worden");
      } else if (["custom", "curated", "smogon-champions", "smogon-sv"].includes(build.status) || !build.status) {
        score += 1;
      }
      if (needsValidationAsCore(pokemon)) {
        score -= 4;
        reasons.push("lage topteam-betrouwbaarheid");
      }
      if (!reasons.length) reasons.push(...explanation.reasons);
      if (!reasons.length) reasons.push(role.description);
      return { pokemon, score, reason: reasons.slice(0, 3).join(" en ") };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst);
  const windowSize = Math.max(limit, 12);
  const pool = ranked.slice(0, Math.max(windowSize, limit * 3));
  const offset = pool.length ? (state.startSuggestionPage * limit) % pool.length : 0;
  return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, limit);
}

function suggestionReasons(pokemon, context = {}) {
  const balance = context.balance ?? teamBalance();
  const targets = context.targets ?? TEAM_STYLES[state.teamStyle].targets;
  const topWeaknesses = context.topWeaknesses ?? teamTypeSummary().filter((item) => item.weak >= 2).map((item) => item.type);
  const reasons = [];
  let score = 0;

  if (usesMegaSlot(pokemon) && state.team.some(usesMegaSlot)) {
    return { score: -10, reasons: ["valt af: je Mega-slot is al gebruikt"] };
  }

  const missingRole = roleCoverage().find((role) => !role.done);
  if (missingRole) {
    const roleReason = roleFitReason(pokemon, missingRole.label);
    if (roleReason) {
      score += 3;
      reasons.push(roleReason);
    }
  }

  topWeaknesses.slice(0, 2).forEach((type) => {
    const multiplier = defensiveMultiplier(pokemon.types, type);
    if (multiplier === 0) {
      score += 4;
      reasons.push(`lost ${type}-zwakte op met immunity`);
    } else if (multiplier < 1) {
      score += 3;
      reasons.push(`biedt ${type}-resist`);
    }
  });

  const styleReason = styleFitReason(pokemon);
  if (styleReason) {
    score += 2;
    reasons.push(styleReason);
  }

  if (weatherConflictsWithStyle(pokemon)) {
    score -= 6;
    reasons.push("botst met je weather-plan");
  }

  if (state.teamStyle === "sun") {
    const sunReason = sunFitReason(pokemon);
    if (sunReason) {
      score += 3;
      reasons.push(sunReason);
    }
    if (sunAntiSynergy(pokemon)) {
      score -= 4;
      reasons.push("Water-druk wordt zwakker in sun");
    }
  }

  if (balance.special < targets.special && pokemon.spa > pokemon.atk) {
    score += 2;
    reasons.push("vult speciale druk aan");
  }
  if (balance.physical < targets.physical && pokemon.atk > pokemon.spa) {
    score += 2;
    reasons.push("vult fysieke druk aan");
  }
  if (balance.fast < targets.fast && pokemon.spe >= 100) {
    score += 2;
    reasons.push("geeft speed-control");
  }
  if (balance.bulky < targets.bulky && pokemon.hp + pokemon.def + pokemon.spd >= 280) {
    score += 2;
    reasons.push("geeft een veiligere switch-in");
  }

  return { score, reasons: [...new Set(reasons)] };
}

function suggestionExplanation(pokemon, fallbackReason = "") {
  const reasons = suggestionReasons(pokemon).reasons;
  const missingRole = roleCoverage().find((role) => !role.done);
  const resists = teamTypeSummary()
    .filter((item) => item.weak >= 2 && defensiveMultiplier(pokemon.types, item.type) < 1)
    .map((item) => item.type);
  const parts = [
    ...reasons,
    resists.length ? `vangt ${resists.slice(0, 2).join(" en ")} beter op` : "",
    pokemon.spe >= 100 ? `brengt snelheid (${pokemon.spe} Spe)` : "",
    missingRole ? `open rol: ${missingRole.label}` : "",
    fallbackReason
  ].filter(Boolean);
  return [...new Set(parts)].slice(0, 4).join(" · ");
}

function roleFitReason(pokemon, label) {
  if (needsValidationAsCore(pokemon)) return "";
  if (label === "Fysieke druk" && pokemon.atk > pokemon.spa) return "past omdat je fysieke druk mist";
  if (label === "Speciale druk" && pokemon.spa > pokemon.atk) return "past omdat je speciale druk mist";
  if (label === "Speed control" && pokemon.spe >= 100) return "past omdat je snelheid mist";
  if (label === "Defensieve switch-ins" && pokemon.hp + pokemon.def + pokemon.spd >= 280) return "past omdat je bulk mist";
  if (label === "Ground antwoord" && (defensiveMultiplier(pokemon.types, "Ground") === 0 || defensiveMultiplier(pokemon.types, "Ground") < 1)) return "geeft een Ground-antwoord";
  if (label === "Fairy antwoord" && (pokemon.types.includes("Steel") || pokemon.types.includes("Poison"))) return "geeft een Fairy-antwoord";
  return "";
}

function teamStyleMatch(pokemon, style = state.teamStyle) {
  if (style === "balanced") return true;
  if (weatherConflictsWithStyle(pokemon, style)) return false;
  if (needsValidationAsCore(pokemon) && !usesMegaSlot(pokemon)) return false;

  const build = selectedBuild(pokemon);
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;
  const role = displayRoleForBuild(pokemon, build);
  const hasMove = (...moves) => build.moves?.some((move) => moves.some((wanted) => String(move).includes(wanted)));

  if (style === "offense") return bestAttack >= 120 || pokemon.spe >= 100 || ["Sweeper", "Wallbreaker", "Speed control"].includes(role);
  if (style === "bulky") return bulk >= 290 || ["Wall", "Bulky pivot"].includes(role);
  if (style === "rain") return hasAbility(pokemon, "Drizzle") || isRainAbuser(pokemon, build) || isRainWaterPressure(pokemon, build) || coversRainPressureType(pokemon);
  if (style === "sun") return hasAbility(pokemon, "Drought") || isChlorophyllAbuser(pokemon, build) || isSunFirePressure(pokemon, build) || pokemon.name === "Venusaur-Mega" || coversSunPressureType(pokemon);
  if (style === "trickroom") return pokemon.spe <= 65 && (bestAttack >= 105 || bulk >= 280);
  if (style === "doublesupport") return hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster") || hasAbility(pokemon, "Friend Guard") || role === "Bulky pivot" || role === "Wall";
  if (style === "hyperoffense") return bestAttack >= 125 || pokemon.spe >= 105 || hasMove("Swords Dance", "Dragon Dance", "Nasty Plot", "Quiver Dance", "Shell Smash");
  if (style === "voltturn") return hasMove("U-turn", "Volt Switch", "Flip Turn", "Parting Shot") || hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Intimidate");
  if (style === "sand") return hasAbility(pokemon, "Sand Stream") || isSandAbuser(pokemon, build) || isSandBreaker(pokemon, build) || coversSandPressureType(pokemon);
  if (style === "snow") return hasAbility(pokemon, "Snow Warning") || isSnowAbuser(pokemon, build) || isSnowIcePressure(pokemon, build) || coversSnowPressureType(pokemon);
  if (style === "stall") return bulk >= 305 || hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Unaware") || hasAbility(pokemon, "Poison Heal") || hasAbility(pokemon, "Magic Guard") || hasMove("Recover", "Roost", "Protect", "Will-O-Wisp", "Toxic");
  if (style === "antiMeta") return isReliableThreatAnswer(pokemon) && (pokemon.spe >= 100 || bulk >= 285 || pokemon.types.some((type) => ["Steel", "Fairy", "Ground", "Dark", "Ghost"].includes(type)));
  return true;
}

function weatherConflictsWithStyle(pokemon, style = state.teamStyle) {
  return weatherConflictMembers([pokemon], style).length > 0;
}

function sunAntiSynergy(pokemon, build = selectedBuild(pokemon)) {
  if (state.teamStyle !== "sun" || weatherConflictsWithStyle(pokemon, "sun")) return false;
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const hasWaterStab = pokemon.types.includes("Water") && moveTypesForBuild(build).includes("Water");
  return hasWaterStab && bestAttack >= 100 && !isSunTypeAnswer(pokemon, "Rock") && !isSunTypeAnswer(pokemon, "Dragon");
}

function weatherPlanAntiSynergy(pokemon) {
  if (state.teamStyle === "snow" && pokemon.types.includes("Water") && !pokemon.types.includes("Ice") && Math.max(pokemon.atk, pokemon.spa) >= 100) return true;
  if (state.teamStyle === "sand" && pokemon.types.includes("Water") && !pokemon.types.some((type) => ["Rock", "Ground", "Steel"].includes(type)) && Math.max(pokemon.atk, pokemon.spa) >= 100) return true;
  return false;
}

function buildSearchText(pokemon, build = selectedBuild(pokemon)) {
  return `${build.label ?? ""} ${build.role ?? ""} ${build.item ?? ""} ${(build.moves ?? []).join(" ")}`;
}

function hasMoveInBuild(pokemon, ...needles) {
  const text = buildSearchText(pokemon).toLowerCase();
  return needles.some((needle) => text.includes(String(needle).toLowerCase()));
}

function moveTypesForBuild(build = {}) {
  return (build.moves ?? [])
    .flatMap(moveOptionsForDisplay)
    .map((move) => moveDetails(move).type);
}

function hasTypedMove(pokemon, type, build = selectedBuild(pokemon)) {
  return moveTypesForBuild(build).includes(type);
}

function isRainAbuser(pokemon, build = selectedBuild(pokemon)) {
  if (hasAbility(pokemon, "Swift Swim")) return true;
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  return pokemon.types.includes("Water") && pokemon.spe >= 80 && bestAttack >= 105 && /rain|water|wave|hydro|liquidation|surf/i.test(buildSearchText(pokemon, build));
}

function isRainWaterPressure(pokemon, build = selectedBuild(pokemon)) {
  if (weatherConflictsWithStyle(pokemon, "rain")) return false;
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  return (pokemon.types.includes("Water") || hasTypedMove(pokemon, "Water", build)) && bestAttack >= 105;
}

function isRainTypeAnswer(pokemon, type) {
  if (defensiveMultiplier(pokemon.types, type) >= 1) return false;
  if (type === "Grass" && pokemon.types.includes("Water")) return false;
  return true;
}

function coversRainPressureType(pokemon) {
  return ["Electric", "Grass"].some((type) => isRainTypeAnswer(pokemon, type));
}

function isChlorophyllAbuser(pokemon, build = selectedBuild(pokemon)) {
  if (!hasAbility(pokemon, "Chlorophyll") || usesMegaSlot(pokemon, build)) return false;
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const setText = `${build.label ?? ""} ${build.role ?? ""} ${(build.moves ?? []).join(" ")}`;
  return bestAttack >= 95 || /sun|chlorophyll|sweeper|growth|solar/i.test(setText);
}

function isSunFirePressure(pokemon, build = selectedBuild(pokemon)) {
  if (weatherConflictsWithStyle(pokemon, "sun")) return false;
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const hasFireMove = moveTypesForBuild(build).includes("Fire");
  const isSetterOnly = hasAbility(pokemon, "Drought") && bestAttack < 105;
  return (pokemon.types.includes("Fire") || hasFireMove) && !isSetterOnly && (bestAttack >= 105 || /breaker|sweeper|attacker|offensive|eruption|overheat/i.test(`${build.label ?? ""} ${build.role ?? ""} ${(build.moves ?? []).join(" ")}`));
}

function coversSunPressureType(pokemon) {
  return ["Rock", "Water", "Dragon"].some((type) => isSunTypeAnswer(pokemon, type));
}

function isSunTypeAnswer(pokemon, type) {
  if (defensiveMultiplier(pokemon.types, type) >= 1) return false;
  if (type === "Water" && pokemon.types.includes("Water")) return false;
  return true;
}

function isSandAbuser(pokemon, build = selectedBuild(pokemon)) {
  if (hasAbility(pokemon, "Sand Rush") || hasAbility(pokemon, "Sand Force") || hasAbility(pokemon, "Sand Veil")) return true;
  return pokemon.types.includes("Rock") && pokemon.hp + pokemon.def + pokemon.spd >= 285 && /rock|sand|assault|tank|defensive/i.test(buildSearchText(pokemon, build));
}

function isSandBreaker(pokemon, build = selectedBuild(pokemon)) {
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  return pokemon.types.some((type) => ["Rock", "Ground", "Steel"].includes(type)) && bestAttack >= 110 && !weatherConflictsWithStyle(pokemon, "sand") && !/defensive|wall/i.test(buildSearchText(pokemon, build));
}

function coversSandPressureType(pokemon) {
  return ["Water", "Grass", "Fighting"].some((type) => isPlanTypeAnswer(pokemon, type));
}

function isSnowAbuser(pokemon, build = selectedBuild(pokemon)) {
  if (hasAbility(pokemon, "Slush Rush") || hasAbility(pokemon, "Ice Body")) return true;
  return pokemon.types.includes("Ice") && pokemon.hp + pokemon.def + pokemon.spd >= 285 && /snow|ice|veil|defensive|tank/i.test(buildSearchText(pokemon, build));
}

function isSnowIcePressure(pokemon, build = selectedBuild(pokemon)) {
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  return (pokemon.types.includes("Ice") || hasTypedMove(pokemon, "Ice", build)) && bestAttack >= 100 && !weatherConflictsWithStyle(pokemon, "snow");
}

function coversSnowPressureType(pokemon) {
  return ["Fire", "Steel", "Rock"].some((type) => isPlanTypeAnswer(pokemon, type));
}

function isPlanTypeAnswer(pokemon, type) {
  if (state.teamStyle === "sun") return isSunTypeAnswer(pokemon, type);
  if (state.teamStyle === "rain") return isRainTypeAnswer(pokemon, type);
  if (state.teamStyle === "sand" && type === "Water" && pokemon.types.includes("Water")) return false;
  if (state.teamStyle === "snow" && type === "Steel" && pokemon.types.includes("Water") && !pokemon.types.includes("Ice") && pokemon.hp + pokemon.def + pokemon.spd < 300) return false;
  return defensiveMultiplier(pokemon.types, type) < 1;
}

function isTrickRoomSetter(pokemon) {
  return hasMoveInBuild(pokemon, "Trick Room") && (pokemon.hp + pokemon.def + pokemon.spd >= 260 || pokemon.spe <= 70);
}

function isTrickRoomAbuser(pokemon) {
  return pokemon.spe <= 65 && Math.max(pokemon.atk, pokemon.spa) >= 105;
}

function hasTeamSpeedControl(pokemon) {
  return hasMoveInBuild(pokemon, "Tailwind", "Icy Wind", "Thunder Wave", "Trick Room", "Electroweb") || hasAbility(pokemon, "Prankster");
}

function isDoubleUtility(pokemon) {
  return hasAbility(pokemon, "Intimidate")
    || hasAbility(pokemon, "Prankster")
    || hasAbility(pokemon, "Friend Guard")
    || hasMoveInBuild(pokemon, "Fake Out", "Follow Me", "Rage Powder", "Helping Hand", "Wide Guard", "Parting Shot");
}

function hasPivotMove(pokemon) {
  return hasMoveInBuild(pokemon, "U-turn", "Volt Switch", "Flip Turn", "Parting Shot");
}

function isSetupPressure(pokemon) {
  return Math.max(pokemon.atk, pokemon.spa) >= 105 && hasMoveInBuild(pokemon, "Swords Dance", "Dragon Dance", "Nasty Plot", "Quiver Dance", "Shell Smash", "Bulk Up", "Calm Mind");
}

function hasEntryPressure(pokemon) {
  return hasMoveInBuild(pokemon, "Stealth Rock", "Spikes", "Sticky Web", "Toxic Spikes", "Reflect", "Light Screen", "Taunt");
}

function hasReliableRecovery(pokemon) {
  return hasMoveInBuild(pokemon, "Recover", "Roost", "Slack Off", "Wish", "Moonlight", "Morning Sun", "Synthesis", "Strength Sap");
}

function hasStatusOrChip(pokemon) {
  return hasMoveInBuild(pokemon, "Toxic", "Will-O-Wisp", "Thunder Wave", "Stealth Rock", "Spikes", "Toxic Spikes", "Salt Cure", "Leech Seed", "Whirlwind", "Roar");
}

function sunFitReason(pokemon) {
  if (weatherConflictsWithStyle(pokemon, "sun")) return "";
  if (hasAbility(pokemon, "Drought")) return "zet sun met Drought";
  if (isChlorophyllAbuser(pokemon)) return "kan sun omzetten in aanvallend tempo";
  if (pokemon.name === "Venusaur-Mega") return "bulky Sun-anchor; niet je primaire Chlorophyll-sweeper";
  if (isSunFirePressure(pokemon)) return "profiteert van sun-boosted Fire-druk";
  if (coversSunPressureType(pokemon)) {
    return "dekt typische Sun-checks af";
  }
  return "";
}

function styleFitReason(pokemon) {
  if (needsValidationAsCore(pokemon)) return "";
  if (!teamStyleMatch(pokemon)) return "";
  if (state.teamStyle === "offense") return "past bij Offense-plan";
  if (state.teamStyle === "bulky") return "past bij Bulky-plan";
  if (state.teamStyle === "rain" && (hasAbility(pokemon, "Drizzle") || isRainAbuser(pokemon) || isRainWaterPressure(pokemon))) {
    return "past bij Rain-plan";
  }
  if (state.teamStyle === "sun" && (hasAbility(pokemon, "Drought") || isChlorophyllAbuser(pokemon) || isSunFirePressure(pokemon) || pokemon.name === "Venusaur-Mega")) {
    return "past bij Sun-plan";
  }
  if (state.teamStyle === "trickroom" && pokemon.spe <= 65) {
    return "past bij Trick Room door lage Speed";
  }
  if (state.teamStyle === "doublesupport" && (hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster") || hasAbility(pokemon, "Friend Guard"))) {
    return "past bij Double support";
  }
  if (state.teamStyle === "hyperoffense") return "past bij Hyper Offense-plan";
  if (state.teamStyle === "voltturn") return "past bij VoltTurn-plan";
  if (state.teamStyle === "sand" && (hasAbility(pokemon, "Sand Stream") || isSandAbuser(pokemon) || isSandBreaker(pokemon))) return "past bij Sand-plan";
  if (state.teamStyle === "snow" && (hasAbility(pokemon, "Snow Warning") || isSnowAbuser(pokemon) || isSnowIcePressure(pokemon))) return "past bij Snow-plan";
  if (state.teamStyle === "stall") return "past bij Stall-plan";
  if (state.teamStyle === "antiMeta") return "past bij Anti-meta-plan";
  if (state.battleFormat === "double4" && (hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster"))) {
    return "extra nuttig in Double 4v4";
  }
  return "";
}

function currentTeamNeeds() {
  const needs = roleCoverage().map((role) => ({
    done: role.done,
    label: role.label,
    note: role.done ? "Afgedekt door je huidige team." : role.note
  }));
  const mega = state.team.find(usesMegaSlot);
  needs.push({
    done: !!mega,
    label: "Mega-slot",
    note: mega ? `${displayPokemonName(mega)} gebruikt je Mega-slot.` : "Nog vrij; Mega-opties blijven beschikbaar."
  });
  return needs.slice(0, 5);
}

function roleCoverage() {
  const key = analysisSignature();
  if (state.cache.roleCoverage?.key === key) return state.cache.roleCoverage.value;
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const team = analysisTeam();
  const hasGroundImmune = team.some((pokemon) => defensiveMultiplier(pokemon.types, "Ground") === 0);
  const hasSteelOrPoison = team.some((pokemon) => pokemon.types.includes("Steel") || pokemon.types.includes("Poison"));

  const value = [
    {
      label: "Fysieke druk",
      done: balance.physical >= targets.physical,
      note: "Nodig om speciale walls niet gratis te laten wisselen."
    },
    {
      label: "Speciale druk",
      done: balance.special >= targets.special,
      note: "Nodig om fysieke walls te breken."
    },
    {
      label: "Speed control",
      done: balance.fast >= targets.fast,
      note: "Minstens een snelle Pokémon helpt om games af te maken."
    },
    {
      label: "Defensieve switch-ins",
      done: balance.bulky >= targets.bulky,
      note: "Geeft beginners meer ruimte om fouten op te vangen."
    },
    {
      label: "Ground antwoord",
      done: hasGroundImmune || teamTypeSummary().find((item) => item.type === "Ground")?.resist > 0,
      note: "Ground-aanvallen zijn vaak sterk; een immunity of resist is waardevol."
    },
    {
      label: "Fairy antwoord",
      done: hasSteelOrPoison || teamTypeSummary().find((item) => item.type === "Fairy")?.resist > 0,
      note: "Steel of Poison helpt tegen Dragon- en Dark-checks."
    }
  ];
  state.cache.roleCoverage = { key, value };
  return value;
}

function teamExportText() {
  if (!state.team.length) return "Voeg Pokémon toe om een starter export te maken.";

  return state.team.map((pokemon) => {
    const build = selectedBuild(pokemon);
    return `${pokemon.name} @ ${build.item}\nAbility: ${build.ability}\nNature: ${build.nature}\nStat Points: ${safeSelectedSp(build.evs)}\nRole: ${displayRoleForBuild(pokemon, build)}\nSource: ${buildSourceLabel(build)}\n- ${build.moves.join("\n- ")}`;
  }).join("\n\n");
}

function buildAdviceHtml(pokemon) {
  const options = buildOptions(pokemon);
  const build = selectedBuild(pokemon);
  const moves = orderedMovesForDisplay(build.moves);
  return `
    <div class="set-advice">
      <div class="set-head">
        <h3>Set-richtlijn</h3>
      </div>
      ${setSourceCardsHtml(options, build)}
      <div class="set-build-layout">
        <div class="set-grid">
          <div><span>Item</span>${escapeHtml(build.item)}</div>
          <div><span>Ability</span>${escapeHtml(build.ability)}</div>
          <div><span>Nature</span>${escapeHtml(build.nature)}</div>
        </div>
        <div class="move-plan">
          ${moves.map(movePillHtml).join("")}
        </div>
      </div>
    </div>
  `;
}

function setSourceCardsHtml(options, build) {
  const grouped = options
    .filter((option) => option.status !== "custom")
    .reduce((groups, option) => {
      const key = setSourceShort(option);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(option);
      return groups;
    }, new Map());

  return `
    <div class="set-source-cards">
      ${sortedSetSourceGroups(grouped).map(([source, sourceOptions]) => setSourceCardHtml(source, sourceOptions, build)).join("")}
    </div>
  `;
}

function sortedSetSourceGroups(grouped) {
  return [...grouped].sort(([a], [b]) => setSourceRank(a) - setSourceRank(b) || a.localeCompare(b));
}

function setSourceRank(source) {
  return {
    Champions: 1,
    SV: 2,
    App: 3,
    Smogon: 4
  }[source] ?? 9;
}

function setSourceCardHtml(source, options, build) {
  return `
    <section class="set-source-card ${setQualityClass(options[0])}">
      <h4>${escapeHtml(source)}</h4>
      <div class="set-source-options">
        ${options.map((option) => setOptionButtonHtml(option, build)).join("")}
      </div>
    </section>
  `;
}

function setOptionButtonHtml(option, build, context = "builder") {
  const selected = option.id === build.id;
  const label = option.status === "custom" && context === "team" ? "Zelf set bouwen" : cleanSetLabel(option);
  return `
    <button class="set-tab set-option-button ${setQualityClass(option)}${selected ? " active" : ""}" type="button" data-set-id="${escapeHtml(option.id)}" aria-pressed="${selected ? "true" : "false"}">
      ${escapeHtml(label)}
    </button>
  `;
}

function quickDecisionLabel(pokemon, build = selectedBuild(pokemon)) {
  const weaknesses = TYPES
    .filter((type) => defensiveMultiplier(pokemon.types, type) > 1)
    .slice(0, 2);
  return weaknesses.length ? `zwak: ${weaknesses.join(", ")}` : "weinig zwaktes";
}

function displayRoleForBuild(pokemon, build = selectedBuild(pokemon)) {
  if (state.teamStyle === "sun" && pokemon.name === "Venusaur-Mega") return "Bulky Sun anchor";
  if (state.teamStyle === "sun" && pokemon.name === "Venusaur" && hasAbility(pokemon, "Chlorophyll")) return "Chlorophyll sweeper";
  if (build.status === "custom") return build.role || roleFor(pokemon).label;
  if (isSetupBuild(build)) return "Setup";
  return roleFor(pokemon).label;
}

function isSetupBuild(build = {}) {
  return (build.moves ?? []).some((move) => {
    return moveOptionsForDisplay(move).some((option) => /stealth rock|spikes|sticky web|toxic spikes|reflect|light screen|aurora veil|tailwind|trick room|rain dance|sunny day|sandstorm|snowscape/i.test(option));
  });
}

function cleanSetLabel(build) {
  return String(build.label || "Set")
    .replace(/\s*\((?:Champions|SV|Smogon Champions|Smogon SV)\)\s*/gi, "")
    .replace(/^Custom$/i, "Zelf bouwen");
}

function movePillHtml(move) {
  const options = moveOptionsForDisplay(move);
  if (options.length === 1) {
    const details = moveDetails(options[0]);
    const typeColor = TYPE_COLORS[details.type] || "#6657dc";
    return `<span class="move-type-pill" style="--type-color:${typeColor}"><strong>${escapeHtml(options[0])}</strong><small>${escapeHtml(details.type)}</small></span>`;
  }
  return `
    <span class="move-choice-pill">
      <small>Kies 1 move</small>
      <span>
        ${options.map((option) => {
          const details = moveDetails(option);
          const typeColor = TYPE_COLORS[details.type] || "#6657dc";
          return `<b style="--type-color:${typeColor}">${escapeHtml(option)} <em>${escapeHtml(details.type)}</em></b>`;
        }).join("")}
      </span>
    </span>
  `;
}

function orderedMovesForDisplay(moves = []) {
  return [...moves].sort((a, b) => Number(String(a).includes("/")) - Number(String(b).includes("/")));
}

function moveOptionsForDisplay(move) {
  const options = String(move)
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  return options.length ? options : [String(move)];
}

function selectedBuild(pokemon) {
  state.cache.selectedBuilds ??= new Map();
  const cacheKey = `${pokemon.name}:${state.selectedSets[pokemon.name] ?? ""}:${state.teamStyle}:${state.team.map((member) => member.name).join("|")}:${state.customSets[pokemon.name] ? JSON.stringify(state.customSets[pokemon.name]) : ""}`;
  if (state.cache.selectedBuilds.has(cacheKey)) return state.cache.selectedBuilds.get(cacheKey);
  const options = buildOptions(pokemon);
  const selectedId = state.selectedSets[pokemon.name] ?? bestBuildForTeam(pokemon, options).id;
  const build = options.find((option) => option.id === selectedId) ?? options[0];
  state.cache.selectedBuilds.set(cacheKey, build);
  return build;
}

function optimizeTeamSets({ force = false } = {}) {
  state.team.forEach((pokemon) => {
    const options = buildOptions(pokemon);
    const current = options.find((option) => option.id === state.selectedSets[pokemon.name]);
    if (!force && state.manualSets[pokemon.name]) return;
    if (!force && current?.status === "custom") return;
    state.selectedSets[pokemon.name] = bestBuildForTeam(pokemon, options).id;
  });
  invalidateCache("analysis");
  invalidateCache("battle");
}

function bestBuildForTeam(pokemon, options = buildOptions(pokemon)) {
  return options
    .filter((option) => option.status !== "custom" || state.selectedSets[pokemon.name] === "custom")
    .map((option) => ({ option, score: buildTeamFitScore(pokemon, option) }))
    .sort((a, b) => b.score - a.score)[0]?.option ?? options[0];
}

function buildTeamFitScore(pokemon, build) {
  const label = `${build.label ?? ""} ${build.role ?? ""} ${build.item ?? ""} ${build.nature ?? ""}`.toLowerCase();
  const moves = (build.moves ?? []).flatMap(moveOptionsForDisplay);
  const moveText = moves.join(" ").toLowerCase();
  const hasMove = (...needles) => needles.some((needle) => moveText.includes(needle.toLowerCase()));
  const moveTypes = moves.map((move) => moveDetails(move).type);
  const role = build.role || roleFor(pokemon).label;
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  let score = 0;

  if (build.status === "smogon-champions") score += 90;
  else if (build.status === "smogon-sv") score += 62;
  else if (build.status === "custom") score += 24;
  else score += 36;

  if (/choice scarf|boots|leftovers|life orb|booster|sitrus|assault vest/i.test(build.item ?? "")) score += 12;
  if (state.teamStyle === "sun") {
    if (hasAbility(pokemon, "Drought")) score += /sun|drought|solar|weather/i.test(label + moveText) ? 95 : 55;
    if (hasAbility(pokemon, "Chlorophyll") && !usesMegaSlot(pokemon, build)) score += /sun|sweeper|growth|solar/i.test(label + moveText) ? 90 : 45;
    if (pokemon.name === "Venusaur-Mega") score += /tank|defensive|bulky|anchor/i.test(label) ? 92 : 30;
    if (moveTypes.includes("Fire") || pokemon.types.includes("Fire")) score += 35;
    if (weatherConflictsWithStyle(pokemon, "sun")) score -= 160;
  }
  if (state.teamStyle === "hyperoffense" && (/sweeper|dance|setup|nasty|quiver|shell/i.test(label + moveText))) score += 50;
  if (state.teamStyle === "bulky" && (/defensive|tank|wall|pivot|boots|leftovers/i.test(label))) score += 45;
  if (state.teamStyle === "voltturn" && hasMove("U-turn", "Volt Switch", "Flip Turn", "Parting Shot")) score += 55;
  if (state.teamStyle === "trickroom" && pokemon.spe <= 65) score += 40;
  if (state.teamStyle === "trickroom" && hasMove("Trick Room")) score += 95;
  if (state.battleFormat === "double4" && hasMove("Protect", "Fake Out", "Tailwind", "Icy Wind", "Helping Hand")) score += 45;

  if (balance.physical < targets.physical && pokemon.atk >= pokemon.spa && ["Sweeper", "Wallbreaker"].includes(role)) score += 35;
  if (balance.special < targets.special && pokemon.spa > pokemon.atk && ["Sweeper", "Wallbreaker"].includes(role)) score += 35;
  if (balance.fast < targets.fast && (pokemon.spe >= 100 || /scarf|speed|tailwind/i.test(label + moveText))) score += 28;
  if (balance.bulky < targets.bulky && (pokemon.hp + pokemon.def + pokemon.spd >= 280 || /defensive|tank|wall|pivot/i.test(label))) score += 28;

  if (hasMove("Stealth Rock", "Spikes", "Thunder Wave", "Will-O-Wisp", "Recover", "Roost")) score += 10;
  if (build.status === "generated") score -= 35;
  return score;
}

function rawTeamBalanceForBuild(targetPokemon, targetBuild) {
  return state.team.reduce((balance, pokemon) => {
    const build = pokemon.name === targetPokemon.name ? targetBuild : buildOptions(pokemon)[0];
    const role = build.role || roleFor(pokemon).label;
    const bestAttack = Math.max(pokemon.atk, pokemon.spa);
    if (pokemon.atk >= pokemon.spa && bestAttack >= 105) balance.physical += 1;
    if (pokemon.spa > pokemon.atk && bestAttack >= 105) balance.special += 1;
    if (pokemon.spe >= 100 || /speed|scarf|tailwind/i.test(`${role} ${build.label ?? ""} ${build.item ?? ""}`)) balance.fast += 1;
    if (pokemon.hp + pokemon.def + pokemon.spd >= 280 || /wall|pivot|support|tank|defensive/i.test(`${role} ${build.label ?? ""}`)) balance.bulky += 1;
    return balance;
  }, { physical: 0, special: 0, fast: 0, bulky: 0 });
}

function buildOptions(pokemon) {
  const key = `${pokemon.name}:${state.teamStyle}:${state.battleFormat}:${customSetsSignature()}`;
  return cachedValue("buildOptions", key, () => computeBuildOptions(pokemon));
}

function computeBuildOptions(pokemon) {
  const curated = curatedBuildOptions(pokemon);
  if (curated.length) return curated;

  const primary = buildAdvice(pokemon);
  const options = [primary];
  const bulky = bulkyBuild(pokemon);
  const fast = fastBuild(pokemon);

  [bulky, fast].forEach((option) => {
    if (!options.some((existing) => sameBuildOption(existing, option))) {
      options.push(option);
    }
  });

  return options.slice(0, 3);
}

function sameBuildOption(a, b) {
  return a.id === b.id
    || a.evs === b.evs
    || `${a.item}|${a.nature}|${a.moves.join("|")}` === `${b.item}|${b.nature}|${b.moves.join("|")}`;
}

function curatedBuildOptions(pokemon) {
  const exact = state.movesets[pokemon.name] ?? [];
  const baseName = baseSpeciesLabel(pokemon.name);
  const base = baseName === pokemon.name ? [] : state.movesets[baseName] ?? [];
  const seen = new Set();
  const options = [...exact, ...base].filter((set) => {
    const key = `${set.id}:${set.evs}:${set.moves.join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((set) => ({
    ...set,
    sourceLabel: buildSourceLabel(set)
  }));
  options.push(customBuildOption(pokemon));
  return options;
}

function customBuildOption(pokemon) {
  const saved = state.customSets[pokemon.name];
  if (saved) {
    const validMoves = customMoveOptionsFromBase(pokemon);
    const moves = [0, 1, 2, 3]
      .map((index) => String(saved.moves?.[index] || safeSelectedMove("", validMoves, index)).trim())
      .filter(Boolean);
    const build = {
      ...saved,
      id: "custom",
      label: "Custom",
      status: "custom",
      item: splitOptions([saved.item])[0] ?? saved.item,
      nature: splitOptions([saved.nature])[0] ?? saved.nature,
      evs: safeSelectedSp(saved.evs),
      moves,
      sourceIds: ["custom-local"]
    };
    return {
      ...build,
      championsCompatibility: validateMoveSlotsForPokemon(pokemon, moves)
    };
  }

  const base = state.movesets[pokemon.name]?.[0] ?? buildAdvice(pokemon);
  const moves = base.championsCompatibility && !base.championsCompatibility.ok
    ? base.championsCompatibility.suggestedMoves
    : [...(base.moves ?? [])].slice(0, 4);
  const build = {
    ...base,
    id: "custom",
    label: "Custom",
    status: "custom",
    role: roleFor(pokemon).label,
    item: base.item || "",
    ability: base.ability || preferredAbility(pokemon),
    nature: base.nature || "",
    evs: base.evs || "",
    moves,
    sourceIds: ["custom-local"]
  };
  return {
    ...build,
    championsCompatibility: validateMoveSlotsForPokemon(pokemon, moves)
  };
}

function customMoveOptionsFromBase(pokemon) {
  const exact = state.movesets[pokemon.name] ?? [];
  const baseName = baseSpeciesLabel(pokemon.name);
  const base = baseName === pokemon.name ? [] : state.movesets[baseName] ?? [];
  const setMoves = splitOptions([...exact, ...base].flatMap((option) => option.moves ?? []));
  const typedMoves = Object.entries(state.moveDetails)
    .filter(([, details]) => pokemon.types.includes(details.type))
    .map(([move]) => move);
  return [...new Set([...setMoves, ...typedMoves, ...Object.keys(state.moveDetails)])]
    .filter((move) => moveAllowedForPokemon(pokemon, move))
    .sort();
}

function championsCompatibilityForBuild(pokemon, build) {
  return build.championsCompatibility ?? validateMoveSlotsForPokemon(pokemon, build.moves ?? [], build);
}

function validateMoveSlotsForPokemon(pokemon, moves = [], build = {}) {
  return pureValidateMoveSlots(pokemon.name, moves, state.moveDetails, {
    fallbackMoves: generatedMovePlan(pokemon, generatedModeForBuild(pokemon, build)),
    learnsets: state.championsLearnsets
  });
}

function generatedModeForBuild(pokemon, build = {}) {
  const haystack = `${build.id ?? ""} ${build.label ?? ""} ${build.role ?? ""}`.toLowerCase();
  if (haystack.includes("bulky") || haystack.includes("wall") || haystack.includes("tank")) return "bulky";
  if (haystack.includes("special")) return "special";
  if (haystack.includes("physical")) return "physical";
  if (pokemon.spa >= pokemon.atk + 15) return "special";
  if (pokemon.atk >= pokemon.spa + 15) return "physical";
  return "mixed";
}

function buildSourceLabel(build) {
  if (build.sourceLabel) return build.sourceLabel;
  if (!build.sourceIds?.length) return "Lokale heuristiek";
  return build.sourceIds
    .map((id) => state.movesetSources[id]?.label ?? id)
    .join(" + ");
}

function setQualityLabel(build) {
  if (build.status === "custom") return "Custom";
  if (build.status === "generated") return "Door app bedacht";
  if (build.status === "smogon-champions") return "Smogon Champions";
  if (build.status === "smogon-sv") return "Smogon SV";
  return "Smogon";
}

function setSourceShort(build) {
  if (build.status === "custom") return "Custom";
  if (build.status === "generated") return "App";
  if (build.status === "smogon-champions") return "Champions";
  if (build.status === "smogon-sv") return "SV";
  return "Smogon";
}

function setQualityClass(build) {
  if (build.championsCompatibility && !build.championsCompatibility.ok) return `${build.status === "smogon-sv" ? "sv" : build.status ?? "curated"} warning`;
  if (build.status === "custom") return "custom";
  if (build.status === "generated") return "generated";
  if (build.status === "smogon-sv") return "sv";
  return "curated";
}

function isDevelopmentCandidate(pokemon) {
  return Boolean(pokemon.evos?.length) && pokemon.bst < 500;
}

function isLowPowerCandidate(pokemon) {
  return pokemon.bst < 480;
}

function needsValidationAsCore(pokemon, build = null) {
  return isDevelopmentCandidate(pokemon) || isLowPowerCandidate(pokemon) || build?.status === "generated";
}

function teamMemberIssues(pokemon, build = selectedBuild(pokemon)) {
  const issues = [];
  if (isDevelopmentCandidate(pokemon)) issues.push("pre-evolution / ontwikkelvorm");
  if (isLowPowerCandidate(pokemon)) issues.push(`lage BST ${pokemon.bst}`);
  if (build.status === "generated") issues.push("door app bedacht");
  if (build.championsCompatibility && !build.championsCompatibility.ok) issues.push("Champions-movecheck nodig");
  return issues;
}

function isReliableThreatAnswer(pokemon) {
  const build = selectedBuild(pokemon);
  if (build.status === "generated") return false;
  if (build.championsCompatibility && !build.championsCompatibility.ok) return false;
  if (isDevelopmentCandidate(pokemon)) return false;
  if (pokemon.bst < 500) return false;
  return true;
}

function formatFitLabel(pokemon) {
  if (state.teamStyle === "sun" && pokemon.name === "Venusaur-Mega") {
    return "bulky Sun-anchor, geen pure Chlorophyll-sweeper";
  }
  if (state.teamStyle === "sun" && pokemon.name === "Venusaur" && hasAbility(pokemon, "Chlorophyll")) {
    return "klassieke Chlorophyll Sun-sweeper";
  }
  if (weatherConflictsWithStyle(pokemon)) {
    return "weather-conflict met je Sun-plan";
  }
  if (needsValidationAsCore(pokemon)) {
    return "niet als hard Champions-antwoord tellen";
  }
  if (state.battleFormat === "double4") {
    if (hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster") || hasAbility(pokemon, "Friend Guard")) return "sterk voor 4v4 support";
    if (pokemon.spe >= 100) return "goed voor 4v4 tempo";
    if (pokemon.hp + pokemon.def + pokemon.spd >= 280) return "bruikbare 4v4 switch-in";
    return "4v4 damage-slot";
  }
  if (pokemon.spe >= 100 && Math.max(pokemon.atk, pokemon.spa) >= 110) return "goed voor 3v3 revenge-kill";
  if (pokemon.hp + pokemon.def + pokemon.spd >= 290) return "goed voor 3v3 stabiliteit";
  if (Math.max(pokemon.atk, pokemon.spa) >= 125) return "goed voor 3v3 druk";
  return "3v3 flex-slot";
}

function selectionArchetypeNote() {
  const matches = (state.championsMeta.archetypes ?? [])
    .map((archetype) => {
      const hits = state.team.filter((pokemon) => (archetype.core ?? []).includes(pokemon.name)).length;
      return { archetype, hits };
    })
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (!matches.length) {
    return state.battleFormat === "double4"
      ? "Geen duidelijke weather/Trick Room-kern gedetecteerd; zorg dat support en damage elkaar helpen."
      : "Geen duidelijke archetype-kern gedetecteerd; focus op zelfstandige matchups en revenge-kill opties.";
  }

  const best = matches[0];
  return `${best.archetype.label}-richting gedetecteerd (${best.hits} kernlid${best.hits > 1 ? "en" : ""}). Check vooral antwoorden op ${best.archetype.checks.join(", ")}.`;
}

function buildAdvice(pokemon) {
  const role = roleFor(pokemon).label;
  const physical = pokemon.atk >= pokemon.spa + 15;
  const special = pokemon.spa >= pokemon.atk + 15;
  const bulky = pokemon.hp + pokemon.def + pokemon.spd >= 280;
  const fast = pokemon.spe >= 100;

  if (role === "Wall" || (bulky && !fast && Math.max(pokemon.atk, pokemon.spa) < 120)) {
    return {
      id: "bulky",
      label: "Bulky",
      role,
      item: "Leftovers",
      ability: preferredAbility(pokemon),
      nature: pokemon.def >= pokemon.spd ? "Impish / Bold" : "Careful / Calm",
      evs: pokemon.def >= pokemon.spd ? "32 HP / 32 Def / 2 SpD" : "32 HP / 2 Def / 32 SpD",
      moves: generatedMovePlan(pokemon, "bulky")
    };
  }

  if (special) {
    return {
      id: "special",
      label: "Special",
      role,
      item: isMega(pokemon) ? "Mega Stone" : "Life Orb / Choice Specs",
      ability: preferredAbility(pokemon),
      nature: fast ? "Timid" : "Modest",
      evs: "2 Def / 32 SpA / 32 Spe",
      moves: generatedMovePlan(pokemon, "special")
    };
  }

  if (physical) {
    return {
      id: "physical",
      label: "Physical",
      role,
      item: isMega(pokemon) ? "Mega Stone" : "Life Orb / Choice Band",
      ability: preferredAbility(pokemon),
      nature: fast ? "Jolly" : "Adamant",
      evs: "2 HP / 32 Atk / 32 Spe",
      moves: generatedMovePlan(pokemon, "physical")
    };
  }

  return {
    id: "mixed",
    label: "Mixed",
    role,
    item: isMega(pokemon) ? "Mega Stone" : "Expert Belt / Heavy-Duty Boots",
    ability: preferredAbility(pokemon),
    nature: fast ? "Naive / Hasty" : "Rash / Mild",
    evs: "2 HP / 32 Atk / 32 SpA",
    moves: generatedMovePlan(pokemon, "mixed")
  };
}

function bulkyBuild(pokemon) {
  return {
    id: "bulky",
    label: "Bulky",
    role: "Bulky pivot",
    item: isMega(pokemon) ? "Mega Stone" : "Leftovers / Heavy-Duty Boots",
    ability: preferredAbility(pokemon),
    nature: pokemon.def >= pokemon.spd ? "Impish / Bold" : "Careful / Calm",
    evs: pokemon.def >= pokemon.spd ? "32 HP / 32 Def / 2 SpD" : "32 HP / 2 Def / 32 SpD",
    moves: generatedMovePlan(pokemon, "bulky")
  };
}

function fastBuild(pokemon) {
  const special = pokemon.spa > pokemon.atk;
  return {
    id: special ? "fast-special" : "fast-physical",
    label: special ? "Fast special" : "Fast physical",
    role: "Speed control",
    item: isMega(pokemon) ? "Mega Stone" : "Choice Scarf / Life Orb",
    ability: preferredAbility(pokemon),
    nature: special ? "Timid" : "Jolly",
    evs: special ? "2 Def / 32 SpA / 32 Spe" : "2 HP / 32 Atk / 32 Spe",
    moves: generatedMovePlan(pokemon, special ? "special" : "physical")
  };
}

function generatedMovePlan(pokemon, mode) {
  const preferred = mode === "special" ? "Special" : mode === "physical" ? "Physical" : "";
  const stab = bestMovesForPokemon(pokemon, { types: pokemon.types, category: preferred, includeStatus: false });
  const anyStab = bestMovesForPokemon(pokemon, { types: pokemon.types, includeStatus: false });
  const coverage = bestMovesForPokemon(pokemon, { excludeTypes: pokemon.types, category: preferred, includeStatus: false });
  const anyCoverage = bestMovesForPokemon(pokemon, { excludeTypes: pokemon.types, includeStatus: false });
  const utility = bestMovesForPokemon(pokemon, { includeOnlyStatus: true });
  const setup = setupMovesForMode(mode);

  const moves = [];
  pushUnique(moves, ...stab, ...anyStab);
  pushUnique(moves, ...coverage, ...anyCoverage);
  pushUnique(moves, ...setup, ...utility);

  return moves.slice(0, 4);
}

function bestMovesForPokemon(pokemon, options = {}) {
  const entries = Object.entries(state.moveDetails).filter(([move, details]) => {
    if (options.includeOnlyStatus && details.category !== "Status") return false;
    if (options.includeStatus === false && details.category === "Status") return false;
    if (options.category && details.category !== options.category) return false;
    if (options.types && !options.types.includes(details.type)) return false;
    if (options.excludeTypes && options.excludeTypes.includes(details.type)) return false;
    return isMovePlausibleForPokemon(pokemon, move, details);
  });

  return entries
    .sort(([, a], [, b]) => moveScore(b) - moveScore(a))
    .map(([move]) => move);
}

function isMovePlausibleForPokemon(pokemon, move, details) {
  if (!moveAllowedForPokemon(pokemon, move)) return false;
  if (details.category === "Status") return true;
  if (pokemon.types.includes(details.type)) return true;
  if (details.type === "Normal") return true;
  if (details.type === "Ground" && (pokemon.types.includes("Rock") || pokemon.types.includes("Steel") || pokemon.types.includes("Dragon"))) return true;
  if (details.type === "Fire" && (pokemon.types.includes("Dragon") || pokemon.types.includes("Ground") || pokemon.types.includes("Steel"))) return true;
  if (details.type === "Ice" && (pokemon.types.includes("Water") || pokemon.types.includes("Dragon"))) return true;
  if (details.type === "Fighting" && (pokemon.atk >= pokemon.spa || pokemon.spa >= 100)) return true;
  if (details.type === "Rock" && pokemon.atk >= pokemon.spa) return true;
  return false;
}

function moveAllowedForPokemon(pokemon, move) {
  return restrictedMoveAllowed(pokemon, move) && !moveBlockedForPokemon(pokemon, move);
}

function restrictedMoveAllowed(pokemon, move) {
  const allowed = RESTRICTED_MOVE_LEARNERS[move];
  if (!allowed) return true;
  return allowed.includes(pokemon.name) || allowed.includes(baseSpeciesLabel(pokemon.name));
}

function moveBlockedForPokemon(pokemon, move) {
  return pureIsMoveBlockedForPokemon(pokemon.name, move, state.championsLearnsets);
}

function moveScore(details) {
  const numericPower = Number(String(details.power).replace(/\D/g, "")) || 0;
  const accuracy = details.accuracy === "-" ? 100 : Number(details.accuracy) || 80;
  const categoryBoost = details.category === "Status" ? 70 : numericPower;
  return categoryBoost + accuracy / 10;
}

function setupMovesForMode(mode) {
  if (mode === "special") return ["Quiver Dance", "Nasty Plot", "Calm Mind"];
  if (mode === "physical") return ["Swords Dance", "Dragon Dance"];
  if (mode === "bulky") return ["Stealth Rock", "Will-O-Wisp", "Thunder Wave", "Roost", "Protect"];
  return ["Swords Dance", "Calm Mind", "Thunder Wave", "Protect"];
}

function pushUnique(target, ...moves) {
  moves.filter(Boolean).forEach((move) => {
    if (target.length < 8 && !target.includes(move) && state.moveDetails[move]) target.push(move);
  });
}

function preferredAbility(pokemon) {
  return pokemon.abilities.find((ability) => !/cloak|veil/i.test(ability)) ?? pokemon.abilities[0] ?? "[ability]";
}

function roleFor(pokemon) {
  return cachedValue("roles", pokemon.name, () => computeRoleFor(pokemon));
}

function computeRoleFor(pokemon) {
  const bestAttack = Math.max(pokemon.atk, pokemon.spa);
  const bulk = pokemon.hp + pokemon.def + pokemon.spd;

  if (isDevelopmentCandidate(pokemon) || pokemon.bst < 420) {
    return {
      label: "Ontwikkeling",
      description: "Lage basiswaarde of pre-evolution. Gebruik vooral als favoriet of niche, niet als betrouwbare topteam-kern."
    };
  }

  if (pokemon.spe >= 105 && bestAttack >= 110) {
    return { label: "Sweeper", description: "Snel en offensief; goed om verzwakte teams af te maken." };
  }
  if (bestAttack >= 130) {
    return { label: "Wallbreaker", description: "Slaat hard en helpt defensieve tegenstanders open te breken." };
  }
  if (bulk >= 305) {
    return { label: "Wall", description: "Kan veel schade opvangen en geeft je team veilige wissels." };
  }
  if (pokemon.spe >= 100) {
    return { label: "Speed control", description: "Helpt tegen snelle tegenstanders en houdt tempo in het team." };
  }
  if (bulk >= 280) {
    return { label: "Bulky pivot", description: "Redelijk stevig en bruikbaar als tussenstap bij het wisselen." };
  }
  return { label: "Allrounder", description: "Flexibele keuze, maar kijk goed welke rol je team nog mist." };
}

function createRolePill(pokemon) {
  const role = roleFor(pokemon);
  const pill = document.createElement("span");
  pill.className = "role-pill";
  pill.textContent = role.label;
  return pill;
}

function createTypeChip(type) {
  const chip = document.createElement("span");
  chip.className = "type-chip";
  chip.textContent = type;
  chip.style.setProperty("--type-color", TYPE_COLORS[type] || "#167a90");
  return chip;
}

function typeChipHtml(type) {
  return `<span class="type-chip" style="--type-color:${TYPE_COLORS[type] || "#167a90"}">${escapeHtml(type)}</span>`;
}

function displayPokemonName(pokemonOrName) {
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName.name;
  const megaMatch = name.match(/^(.+)-Mega(?:-([XY]))?$/);
  if (!megaMatch) return name;
  return `Mega ${megaMatch[1]}${megaMatch[2] ? ` ${megaMatch[2]}` : ""}`;
}

function spriteUrl(name) {
  const id = spriteId(name);
  return `assets/sprites/${id}.png`;
}

function spriteId(name) {
  return normalize(name)
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace("-mega-x", "-megax")
    .replace("-mega-y", "-megay")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function showSpriteFallback(wrapper, name) {
  wrapper.replaceChildren();
  const fallback = document.createElement("span");
  fallback.className = "sprite-fallback";
  fallback.textContent = name.slice(0, 2).toUpperCase();
  wrapper.append(fallback);
}

function normalize(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatNumber(value) {
  return Number(value).toLocaleString("nl-NL", { maximumFractionDigits: 1 });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

