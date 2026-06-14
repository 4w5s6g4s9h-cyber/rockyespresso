import { SP_STAT_LIMIT, SP_TOTAL_LIMIT, STAT_LABELS, TYPES } from "./team-analysis.js";

export { SP_STAT_LIMIT, SP_TOTAL_LIMIT, STAT_LABELS, TYPES };

export const TYPE_COLORS = {
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

export const TEAM_STYLES = {
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

export const BATTLE_FORMATS = {
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

export const ITEM_OPTIONS = [
  "Aerodactylite", "Black Glasses", "Charizardite Y", "Choice Band", "Choice Scarf", "Choice Specs",
  "Covert Cloak", "Damp Rock", "Expert Belt", "Focus Sash", "Heavy-Duty Boots", "Leftovers",
  "Life Orb", "Lum Berry", "Mega Stone", "Mystic Water", "Rocky Helmet", "Safety Goggles",
  "Sitrus Berry", "Spell Tag", "Tyranitarite", "Venusaurite", "White Herb", "Yache Berry"
];

export const NATURE_OPTIONS = [
  "Adamant", "Jolly", "Modest", "Timid", "Bold", "Impish", "Calm", "Careful",
  "Quiet", "Naive", "Hasty", "Rash", "Mild"
];

export const SP_PRESETS = [
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

export const RESTRICTED_MOVE_LEARNERS = {
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

export const MOVE_LEARNSET_BLOCKLIST = {
  Toxic: ["Steelix"]
};

export const MOVE_REPLACEMENTS = {
  Toxic: {
    Steelix: ["Protect", "Dragon Tail", "Heavy Slam"]
  }
};
