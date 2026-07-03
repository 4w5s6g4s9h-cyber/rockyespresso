export const TYPE_CHART = {
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

export const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
];

export const STAT_LABELS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
export const SP_TOTAL_LIMIT = 66;
export const SP_STAT_LIMIT = 32;
export const BATTLE_STAT_LEVEL = 50;
export const PERFECT_IV = 31;

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

export const MEGA_STONE_BASES = {
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

export function defensiveMultiplier(defenderTypes, attackType, typeChart = TYPE_CHART) {
  return defenderTypes.reduce((multiplier, defenderType) => {
    return multiplier * (typeChart[attackType]?.[defenderType] ?? 1);
  }, 1);
}

export function teamTypeSummary(team = [], types = TYPES, typeChart = TYPE_CHART) {
  return types.map((type) => {
    const matchups = team.map((pokemon) => defensiveMultiplier(pokemon.types, type, typeChart));
    return {
      type,
      weak: matchups.filter((value) => value > 1).length,
      severe: matchups.filter((value) => value >= 4).length,
      resist: matchups.filter((value) => value > 0 && value < 1).length,
      immune: matchups.filter((value) => value === 0).length
    };
  }).sort((a, b) => {
    const riskA = a.weak - a.resist - a.immune;
    const riskB = b.weak - b.resist - b.immune;
    return riskB - riskA || b.weak - a.weak || a.type.localeCompare(b.type);
  });
}

export function isMega(pokemonOrName) {
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName?.name;
  return /-Mega(?:-|$)/.test(name ?? "");
}

export function megaBaseFromItem(item = "") {
  return splitItemOptions(item)
    .map((option) => MEGA_STONE_BASES[option] ?? "")
    .find(Boolean) ?? "";
}

export function megaStoneOptionsForPokemon(pokemonOrName) {
  const pokemon = typeof pokemonOrName === "string" ? null : pokemonOrName;
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName?.name;
  if (!isMega(name)) return [];

  const stored = pokemon?.megaStones?.filter(Boolean) ?? [];
  if (stored.length) return [...new Set(stored)];

  const base = baseSpecies(name);
  const suffix = name?.endsWith("-Mega-X") ? " X" : name?.endsWith("-Mega-Y") ? " Y" : "";
  const inferred = Object.entries(MEGA_STONE_BASES)
    .filter(([stone, stoneBase]) => {
      if (stoneBase !== base) return false;
      if (!suffix) return true;
      return stone.endsWith(suffix);
    })
    .map(([stone]) => stone);
  return inferred.length ? inferred : ["Mega Stone"];
}

export function normalizeMegaItem(pokemonOrName, item = "") {
  if (!isMega(pokemonOrName)) return item;
  const options = megaStoneOptionsForPokemon(pokemonOrName);
  const selected = splitItemOptions(item).find((option) => options.includes(option));
  return selected ?? options[0] ?? "Mega Stone";
}

export function pokemonUsesMegaSlot(pokemonOrName, build = {}) {
  const name = typeof pokemonOrName === "string" ? pokemonOrName : pokemonOrName?.name;
  if (isMega(name)) return true;
  const itemOptions = splitItemOptions(build.item);
  const knownMegaStones = typeof pokemonOrName === "string" ? [] : pokemonOrName?.megaStones ?? [];
  const nonMegaItemOptions = itemOptions.filter((option) => !MEGA_STONE_BASES[option] && !knownMegaStones.includes(option));
  if (nonMegaItemOptions.length) return false;
  if (knownMegaStones.some((stone) => itemOptions.includes(stone))) return true;
  const itemBase = megaBaseFromItem(build.item);
  return Boolean(itemBase && itemBase === baseSpecies(name));
}

export function baseSpecies(name) {
  return String(name).replace(/-Mega(?:-[XY])?$/, "");
}

export function baseSpeciesLabel(name) {
  return baseSpecies(name).replace(/-/g, " ");
}

function splitItemOptions(item = "") {
  return String(item).split("/").map((part) => part.trim()).filter(Boolean);
}

export function maxTeamSize(battleFormat, battleFormats) {
  return battleFormats[battleFormat].maxTeamSize;
}

export function teamLegality({ pokemon, team = [], battleFormat, battleFormats, selectedBuild = () => ({}) }) {
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

export function reorderTeam(team = [], fromIndex, toIndex, { lockedNames = [], keepLockedSlotOne = true } = {}) {
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

export function suggestedPokemon({ pokemon = [], team = [], battleFormat, battleFormats, teamStyle, teamStyles, roleFor, selectedBuild = () => ({}), limit = 3 }) {
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

export function parseSp(spread) {
  const values = Object.fromEntries(STAT_LABELS.map((stat) => [stat, 0]));
  String(spread).split("/").forEach((part) => {
    const match = part.trim().match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/);
    if (match) values[match[2]] = Math.max(0, Math.min(SP_STAT_LIMIT, Number(match[1])));
  });
  return values;
}

export function spPartsFromValues(values) {
  return STAT_LABELS
    .map((stat) => [stat, values[stat] ?? 0])
    .filter(([, value]) => value > 0)
    .map(([stat, value]) => `${value} ${stat}`);
}

export function normalizeSpValues(values) {
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

export function convertEvSpreadToSpSpread(spread) {
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

export function normalizeSpSpread(spread) {
  const values = normalizeSpValues(parseSp(convertEvSpreadToSpSpread(spread)));
  return spPartsFromValues(values).join(" / ");
}

export function trainedStatValue(base, sp, stat = "HP", nature = "", level = BATTLE_STAT_LEVEL) {
  const clampedBase = Math.max(1, Number(base) || 1);
  const clampedSp = Math.max(0, Math.min(SP_STAT_LIMIT, Number(sp) || 0));
  const ev = Math.round(clampedSp * 252 / SP_STAT_LIMIT);
  const evContribution = Math.floor(ev / 4);
  const baseValue = Math.floor(((2 * clampedBase + PERFECT_IV + evContribution) * level) / 100);
  if (stat === "HP") return baseValue + level + 10;
  return Math.floor((baseValue + 5) * natureMultiplier(stat, nature));
}

export function natureMultiplier(stat, nature = "") {
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
