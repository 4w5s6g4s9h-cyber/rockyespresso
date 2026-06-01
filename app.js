import { loadChampionsMeta as fetchChampionsMeta, loadPokemonData, officialPokemon } from './modules/data.js';
import { loadMovesets as fetchMovesets } from './modules/movesets.js';
import { renderApp, renderWithoutScrollJump } from './modules/rendering.js';
import { bindEvents as bindUiEvents } from './modules/ui-events.js';
import { baseSpecies as pureBaseSpecies, baseSpeciesLabel as pureBaseSpeciesLabel, defensiveMultiplier as pureDefensiveMultiplier, isMega as pureIsMega, normalizeSpSpread as pureNormalizeSpSpread, normalizeSpValues as pureNormalizeSpValues, parseSp as pureParseSp, spPartsFromValues as pureSpPartsFromValues, teamLegality as pureTeamLegality, teamTypeSummary as pureTeamTypeSummary } from './modules/team-analysis.js';

const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"
];

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

const SP_TOTAL_LIMIT = 66;
const SP_STAT_LIMIT = 32;
const STAT_LABELS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
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

const state = {
  pokemon: [],
  movesets: {},
  movesetSources: {},
  moveDetails: {},
  championsMeta: { formats: {}, archetypes: [], threats: [] },
  selected: null,
  selectedTypes: [],
  typeFiltersOpen: false,
  team: [],
  battleSelection: [],
  teamNotice: "",
  selectedSets: {},
  customSets: {},
  savedTeams: [],
  favorites: [],
  roleFilter: "all",
  compare: [],
  explanationOpen: "",
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
const builderTab = document.querySelector("#builderTab");
const teamTab = document.querySelector("#teamTab");
const builderView = document.querySelector("#builderView");
const teamView = document.querySelector("#teamView");
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
const randomUltraTeam = document.querySelector("#randomUltraTeam");
const backToBuilder = document.querySelector("#backToBuilder");
const floatingTeamLab = document.querySelector("#floatingTeamLab");
const floatingTeamCount = document.querySelector("#floatingTeamCount");

init();

async function init() {
  let data;
  try {
    data = await loadPokemonData();
  } catch (error) {
    showLoadError(error);
    return;
  }

  state.pokemon = officialPokemon(data.pokemon);
  const movesetBundle = await fetchMovesets({ pokemon: state.pokemon, generatedMovePlan });
  state.movesets = movesetBundle.movesets;
  state.movesetSources = movesetBundle.movesetSources;
  state.moveDetails = movesetBundle.moveDetails;
  try {
    state.championsMeta = await fetchChampionsMeta();
  } catch (error) {
    console.warn("Champions-meta niet geladen; threat-checklist wordt overgeslagen.", error);
    state.championsMeta = { formats: {}, archetypes: [], threats: [] };
  }
  loadCustomSets();
  loadSavedTeams();
  loadFavorites();
  state.selected = state.pokemon.find((pokemon) => pokemon.name === "Garchomp") ?? state.pokemon[0];

  renderTypeFilters();
  bindUiEvents(appContext());
  render();
}

function appContext() {
  return {
    state,
    grid,
    searchInput,
    sortSelect,
    sourceSelect,
    teamStyleSelect,
    roleFilterSelect,
    battleFormatSelect,
    metaRow,
    resultCount,
    resultLabel,
    builderTab,
    teamTab,
    builderView,
    teamView,
    clearTeam,
    resetApp,
    guideModeToggle,
    showAllPokemon,
    randomUltraTeam,
    backToBuilder,
    floatingTeamLab,
    typeToggle,
    render,
    renderTypeFilters,
    resetToStart,
    toggleGuideMode,
    generateRandomUltraTeam,
    showAllPokemonList,
    switchView,
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
    syncBattleSelection
  };
}

function invalidateCache() {
  state.cache = {};
}

function loadCustomSets() {
  try {
    state.customSets = JSON.parse(localStorage.getItem("championsCustomSets") || "{}");
  } catch {
    state.customSets = {};
  }
}

function saveCustomSets() {
  try {
    localStorage.setItem("championsCustomSets", JSON.stringify(state.customSets));
  } catch (error) {
    console.warn("Custom sets konden niet worden opgeslagen.", error);
  }
}

function loadSavedTeams() {
  try {
    state.savedTeams = JSON.parse(localStorage.getItem("championsSavedTeams") || "[]");
  } catch {
    state.savedTeams = [];
  }
}

function saveSavedTeams() {
  try {
    localStorage.setItem("championsSavedTeams", JSON.stringify(state.savedTeams));
  } catch (error) {
    console.warn("Teams konden niet worden opgeslagen.", error);
  }
}

function loadFavorites() {
  try {
    state.favorites = JSON.parse(localStorage.getItem("championsFavorites") || "[]");
  } catch {
    state.favorites = [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("championsFavorites", JSON.stringify(state.favorites));
  } catch (error) {
    console.warn("Favorieten konden niet worden opgeslagen.", error);
  }
}

function showLoadError(error) {
  console.error(error);
  resultCount.textContent = "0";
  resultLabel.textContent = "resultaten";
  grid.replaceChildren();
  detailPanel.replaceChildren();
  teamSlots.replaceChildren();
  teamOverview.replaceChildren();
  teamAnalysis.replaceChildren();
  teamWorkbench.replaceChildren();

  const message = document.createElement("article");
  message.className = "load-error";
  message.innerHTML = `
    <h2>Open de app via het startbestand</h2>
    <p>De Pokémon-data kan niet worden geladen als je <strong>index.html</strong> direct opent. Gebruik <strong>Open Champions Dex.command</strong> in deze map, of open de app via <strong>http://localhost:8000</strong>.</p>
  `;
  grid.append(message);
}

function showAllPokemonList() {
  searchInput.value = "";
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
  sortSelect.value = "name";
  sourceSelect.value = "all";
  teamStyleSelect.value = "balanced";
  roleFilterSelect.value = "all";
  battleFormatSelect.value = "single3";
  state.selectedTypes = [];
  state.typeFiltersOpen = false;
  state.team = [];
  state.battleSelection = [];
  state.teamNotice = "";
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

function generateRandomUltraTeam() {
  const previousTeam = [...state.team];
  state.team = [];
  state.battleSelection = [];
  state.teamNotice = "";

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
    state.teamNotice = "Kon geen volledig Ultra Team samenstellen met de huidige data.";
  } else {
    state.selected = state.team[0];
    state.battleSelection = state.team
      .slice()
      .sort((a, b) => ultraTeamCandidateScore(b) - ultraTeamCandidateScore(a))
      .slice(0, battleSelectionSize())
      .map((pokemon) => pokemon.name);
    state.hasExplored = true;
    state.guideMode = false;
    state.activeView = "team";
    state.teamNotice = "Willekeurig Ultra Team samengesteld op basis van rollen, checks en setkwaliteit.";
  }
  invalidateCache();
  render();
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
  const role = roleFor(pokemon).label;
  const build = selectedBuild(pokemon);
  let score = pokemon.bst + pokemon.spe * 0.6 + Math.max(pokemon.atk, pokemon.spa);
  if (["Sweeper", "Wallbreaker", "Speed control"].includes(role)) score += 80;
  if (["Wall", "Bulky pivot"].includes(role)) score += 50;
  if (build.status === "smogon-champions") score += 90;
  else if (build.status === "smogon-sv") score += 55;
  else if (build.status === "custom") score += 30;
  if (isMega(pokemon)) score += 35;
  return score + Math.random() * 80;
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
      render();
    });
    const isActive = type === "All" ? !state.selectedTypes.length : state.selectedTypes.includes(type);
    if (isActive) button.classList.add("active");
    typeFilters.append(button);
  });
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
  invalidateCache();
  renderApp(appContext());
}

function renderGuideModeToggle() {
  guideModeToggle.classList.toggle("active", state.guideMode);
  guideModeToggle.setAttribute("aria-pressed", String(state.guideMode));
}

function switchView(view) {
  state.activeView = view;
  renderViewTabs();
  if (view === "team") {
    renderTeamManager();
    renderTeamWorkbench();
  }
}

function renderViewTabs() {
  const isTeamView = state.activeView === "team";
  builderTab.classList.toggle("active", !isTeamView);
  teamTab.classList.toggle("active", isTeamView);
  builderTab.setAttribute("aria-selected", String(!isTeamView));
  teamTab.setAttribute("aria-selected", String(isTeamView));
  builderView.classList.toggle("active", !isTeamView);
  teamView.classList.toggle("active", isTeamView);
  renderFloatingTeamAction();
}

function renderFloatingTeamAction() {
  floatingTeamLab.hidden = true;
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
  text.textContent = query
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
  if (query) state.hasExplored = true;
  const sort = sortSelect.value;

  return state.pokemon
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
      return matchesQuery && matchesType && matchesRole;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return b[sort] - a[sort] || a.name.localeCompare(b.name);
    });
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

function createSuggestionRefreshBar() {
  const bar = document.createElement("div");
  bar.className = "suggestion-refresh-row";
  const text = document.createElement("span");
  text.textContent = "Suggesties";
  const refresh = document.createElement("button");
  refresh.type = "button";
  refresh.className = "start-refresh";
  refresh.textContent = "Ververs";
  refresh.addEventListener("click", () => {
    state.startSuggestionPage += 1;
    render();
  });
  bar.append(text, refresh);
  return bar;
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
  const mega = state.team.find(isMega);

  return [
    ["Type aandacht", concern ? `${concern.type}: ${concern.weak} zwak, geen antwoord` : "Geen grote gedeelde zwakte"],
    ["Rol mist", missingRole ? missingRole.label : "Basisrollen op orde"],
    ["Mega-slot", mega ? mega.name : "Nog vrij"]
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
  spriteWrap.title = `Bekijk details van ${pokemon.name}`;
  spriteWrap.addEventListener("click", () => showPokemonDetails(pokemon));

  const sprite = document.createElement("img");
  sprite.src = spriteUrl(pokemon.name);
  sprite.alt = "";
  sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, pokemon.name), { once: true });
  spriteWrap.append(sprite);

  const body = document.createElement("span");
  body.className = "starter-pick-body";
  const name = document.createElement("strong");
  name.textContent = pokemon.name;
  const meta = document.createElement("span");
  meta.className = "starter-pick-meta";
  meta.textContent = `BST ${pokemon.bst} · ${pokemon.types.join(" / ")}`;
  const note = document.createElement("span");
  note.className = "starter-pick-note";
  note.textContent = reason;
  const risk = document.createElement("span");
  risk.className = "starter-pick-risk";
  risk.textContent = starterRisk(pokemon);
  body.append(name, meta, note, risk);

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
      addToTeam(pokemon);
      render();
    });
  });
  actions.append(details, add);

  card.append(spriteWrap, body, actions);
  return card;
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
      description: "Aanvallende druk, defensieve veiligheid en tempo in een compacte shortlist.",
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
      (pokemon) => pokemon.spe >= 110 || isMega(pokemon),
      1,
      (pokemon) => isMega(pokemon) ? "Sterke Mega-optie; let op de 1-Mega-regel." : "Helpt om sneller druk te zetten.",
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
  node.querySelector(".name").textContent = pokemon.name;
  node.querySelector(".bst").textContent = `BST ${pokemon.bst}`;
  node.querySelector(".types").replaceChildren(...pokemon.types.map(createTypeChip));
  node.querySelector(".abilities").textContent = pokemon.abilities.join(" / ");
  node.querySelector(".card-main").append(createRolePill(pokemon));
  const legality = teamLegality(pokemon);
  addButton.disabled = !legality.ok;
  addButton.title = legality.ok ? "Toevoegen aan team" : legality.reason;
  const actions = document.createElement("div");
  actions.className = "card-extra-actions";
  const favorite = document.createElement("button");
  favorite.type = "button";
  favorite.className = `mini-action${state.favorites.includes(pokemon.name) ? " active" : ""}`;
  favorite.textContent = state.favorites.includes(pokemon.name) ? "Shortlist" : "Bewaar";
  favorite.title = state.favorites.includes(pokemon.name) ? "Verwijder uit shortlist" : "Zet op shortlist";
  favorite.addEventListener("mousedown", (event) => event.preventDefault());
  favorite.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(pokemon);
  });
  const compare = document.createElement("button");
  compare.type = "button";
  compare.className = `mini-action${state.compare.includes(pokemon.name) ? " active" : ""}`;
  compare.textContent = state.compare.includes(pokemon.name) ? "Vergelijkt" : "Vergelijk";
  compare.title = "Voeg toe aan vergelijking";
  compare.addEventListener("mousedown", (event) => event.preventDefault());
  compare.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCompare(pokemon);
  });
  actions.append(favorite, compare);
  node.append(actions);

  sprite.src = spriteUrl(pokemon.name);
  sprite.alt = pokemon.name;
  spriteWrap.title = `Bekijk details van ${pokemon.name}`;
  sprite.addEventListener("error", () => showSpriteFallback(spriteWrap, pokemon.name), { once: true });

  mainButton.addEventListener("mousedown", (event) => event.preventDefault());
  mainButton.addEventListener("click", () => {
    showPokemonDetails(pokemon);
  });

  addButton.addEventListener("mousedown", (event) => event.preventDefault());
  addButton.addEventListener("click", () => {
    renderWithoutScrollJump(() => {
      state.selected = pokemon;
      addToTeam(pokemon);
      render();
    });
  });
  return node;
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
    state.compare = [...state.compare, pokemon.name].slice(-2);
  }
  renderTeamAnalysis();
  render();
}

function showPokemonDetails(pokemon) {
  state.selected = pokemon;
  render();
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
        <h2>${escapeHtml(pokemon.name)}</h2>
        <div class="types">${pokemon.types.map(typeChipHtml).join("")}</div>
      </div>
    </div>
    <div class="quick-facts">
      <div class="fact"><span>BST</span><strong>${pokemon.bst}</strong></div>
      <div class="fact"><span>Hoogte</span><strong>${formatNumber(pokemon.height)} m</strong></div>
      <div class="fact"><span>Gewicht</span><strong>${formatNumber(pokemon.weight)} kg</strong></div>
    </div>
    <div class="fact"><span>Abilities</span><strong>${escapeHtml(pokemon.abilities.join(" / "))}</strong></div>
    <div class="fact"><span>Rol</span><strong>${escapeHtml(roleFor(pokemon).label)}</strong></div>
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
      renderDetail(pokemon);
    });
  });
  detailPanel.append(wrapper);
}

function trainingOverviewHtml(pokemon) {
  const build = selectedBuild(pokemon);
  const safeSp = safeSelectedSp(build.evs);
  const sp = parseSp(safeSp);
  const stats = statEntries(pokemon);
  const basePoints = radarPoints(stats.map(([, value]) => value));
  const trainedStats = stats.map(([label, value]) => [label, trainedStatValue(value, sp[label] ?? 0)]);
  const trainedPoints = radarPoints(trainedStats.map(([, value]) => value));

  return `
    <div class="training-overview">
      <div class="set-head">
        <h3>Stats & training</h3>
        <span>BST ${pokemon.bst} · 66 SP</span>
      </div>
      <div class="training-body">
        <svg class="stat-radar" viewBox="0 0 120 120" role="img" aria-label="Stat radar">
          <polygon class="radar-grid" points="${radarPoints([160, 160, 160, 160, 160, 160])}"></polygon>
          <polygon class="radar-mid" points="${radarPoints([100, 100, 100, 100, 100, 100])}"></polygon>
          <polygon class="radar-base" points="${basePoints}"></polygon>
          <polygon class="radar-trained" points="${trainedPoints}"></polygon>
          ${stats.map(([label], index) => radarLabel(label, index)).join("")}
        </svg>
        <div class="stat-training-list">
          <div class="stat-training-header">
            <span>Stat</span><span>Base</span><span>SP</span><span>Final</span>
          </div>
          ${stats.map(([label, value]) => statTrainingRow(label, value, sp[label] ?? 0)).join("")}
        </div>
      </div>
      <div class="sp-summary">${escapeHtml(safeSp)}</div>
    </div>
  `;
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

function statTrainingRow(label, value, sp) {
  const trained = trainedStatValue(value, sp);
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

function trainedStatValue(base, sp) {
  return base + Math.round(sp * 63 / SP_STAT_LIMIT);
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

function radarLabel(label, index) {
  const center = 60;
  const radius = 54;
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 6);
  const x = center + Math.cos(angle) * radius;
  const y = center + Math.sin(angle) * radius + 3;
  return `<text x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
}

function addToTeam(pokemon) {
  const legality = teamLegality(pokemon);
  if (!legality.ok) {
    state.teamNotice = legality.reason;
    renderTeamAnalysis();
    return false;
  }
  state.team.push(pokemon);
  syncBattleSelection();
  state.teamNotice = "";
  renderTeam();
  return true;
}

function renderTeam() {
  teamSlots.replaceChildren();
  document.querySelector(".team .panel-head h2").textContent = `Team`;
  document.querySelector(".team .team-inline-summary")?.remove();
  for (let index = 0; index < maxTeamSize(); index += 1) {
    const member = state.team[index];
    const slot = document.createElement(member ? "div" : "button");
    slot.className = `team-slot${member ? " filled" : ""}${member && member.name === state.selected?.name ? " selected" : ""}`;
    if (member) {
      slot.innerHTML = `
        <button class="team-slot-main" type="button" title="${escapeHtml(member.name)}">
          <img src="${spriteUrl(member.name)}" alt="">
        </button>
        <button class="remove-member" type="button" title="Verwijder ${escapeHtml(member.name)}">×</button>
      `;
      slot.querySelector(".team-slot-main").addEventListener("click", () => {
        state.selected = member;
        render();
      });
      slot.querySelector("img").addEventListener("error", (event) => event.target.remove(), { once: true });
      slot.querySelector(".remove-member").addEventListener("click", () => removeFromTeam(index));
    } else {
      slot.type = "button";
      slot.textContent = `Slot ${index + 1}`;
    }
    teamSlots.append(slot);
  }
  teamSlots.append(createTeamLabSlot());
  renderTeamManager();
  renderTeamAnalysis();
  renderTeamOverview();
  renderTeamWorkbench();
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
    ["Mega", state.team.find(isMega)?.name ?? "Nog vrij"],
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
  state.team.splice(index, 1);
  if (removed) state.battleSelection = state.battleSelection.filter((name) => name !== removed.name);
  state.teamNotice = "";
  if (!state.team.includes(state.selected)) {
    state.selected = state.team[0] ?? state.pokemon.find((pokemon) => pokemon.name === "Garchomp") ?? state.pokemon[0];
  }
  invalidateCache();
  syncBattleSelection();
  render();
}

function renderTeamManager() {
  if (!teamManager) return;
  teamManager.replaceChildren();

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

  teamManager.append(saveRow, list);
}

function defaultTeamName() {
  const names = state.team.map((pokemon) => pokemon.name).join(" + ");
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
    <small>${escapeHtml(BATTLE_FORMATS[savedTeam.format]?.label ?? savedTeam.format)} · ${escapeHtml(savedTeam.members.join(", "))}</small>
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
  syncBattleSelection();
  state.selectedSets = { ...(saved.selectedSets ?? {}) };
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

  for (let index = 0; index < maxTeamSize(); index += 1) {
    const pokemon = state.team[index];
    teamWorkbench.append(pokemon ? createWorkbenchCard(pokemon, index) : createEmptyWorkbenchSlot(index));
  }
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
  render();
}

function createWorkbenchCard(pokemon, index) {
  const build = selectedBuild(pokemon);
  const card = document.createElement("article");
  card.className = `workbench-card${build.status === "generated" ? " generated" : ""}`;
  card.dataset.pokemon = pokemon.name;

  const header = document.createElement("div");
  header.className = "workbench-head";
  header.innerHTML = `
    <span class="slot-badge">Slot ${index + 1}</span>
    <span class="sprite-wrap"><img class="sprite" src="${spriteUrl(pokemon.name)}" alt=""></span>
    <div>
      <h3>${escapeHtml(pokemon.name)}</h3>
      <div class="types">${pokemon.types.map(typeChipHtml).join("")}</div>
    </div>
  `;
  header.querySelector("img").addEventListener("error", (event) => {
    showSpriteFallback(event.target.closest(".sprite-wrap"), pokemon.name);
  }, { once: true });
  header.querySelector(".sprite-wrap").title = `Bekijk ${pokemon.name} in Builder`;
  header.querySelector(".sprite-wrap").addEventListener("click", () => {
    state.selected = pokemon;
    switchView("builder");
    renderDetail(pokemon);
  });

  const tabs = createSetSourceCards(buildOptions(pokemon), build, (option) => {
    const scrollY = window.scrollY;
    state.selectedSets[pokemon.name] = option.id;
    state.selected = pokemon;
    render();
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

  const training = document.createElement("div");
  training.className = "workbench-training";
  training.innerHTML = trainingOverviewHtml(pokemon);

  const movesTitle = document.createElement("h4");
  movesTitle.className = "workbench-section-title";
  movesTitle.textContent = "Moves";

  const moves = document.createElement("div");
  moves.className = "workbench-moves";
  orderedMovesForDisplay(build.moves).forEach((move, moveIndex) => {
    moves.append(createMoveCard(move, moveIndex));
  });

  const customEditor = build.status === "custom" ? createCustomSetEditor(pokemon, build) : null;

  const actions = document.createElement("div");
  actions.className = "workbench-actions";
  const viewButton = document.createElement("button");
  viewButton.type = "button";
  viewButton.textContent = "Bekijk in builder";
  viewButton.addEventListener("click", () => {
    state.selected = pokemon;
    switchView("builder");
    renderDetail(pokemon);
  });
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Verwijder";
  removeButton.addEventListener("click", () => removeFromTeam(index));
  actions.append(viewButton);
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
  actions.append(removeButton);

  card.append(header, tabs, grid);
  if (customEditor) card.append(customEditor);
  card.append(training, movesTitle, moves, actions);
  return card;
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
  button.className = `set-tab set-option-button ${setQualityClass(option)}${option.id === build.id ? " active" : ""}`;
  button.setAttribute("aria-pressed", String(option.id === build.id));
  button.textContent = option.status === "custom" && context === "team" ? "Zelf set bouwen" : cleanSetLabel(option);
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
  updateCustomValidation(form);

  form.addEventListener("change", () => {
    const formData = new FormData(form);
    const next = {
      ...build,
      role: String(formData.get("role") || "Custom"),
      item: String(formData.get("item") || ""),
      ability: String(formData.get("ability") || ""),
      nature: String(formData.get("nature") || ""),
      evs: spSpreadFromForm(formData),
      moves: [0, 1, 2, 3].map((index) => String(formData.get(`move${index}`) || "").trim()).filter(Boolean)
    };
    state.customSets[pokemon.name] = next;
    saveCustomSets();
    updateCustomValidation(form);
    updateCustomWorkbenchCard(pokemon, next);
  });

  return form;
}

function updateCustomValidation(form) {
  const panel = form.querySelector(".custom-validation");
  if (!panel) return;
  const formData = new FormData(form);
  const spValues = Object.fromEntries(STAT_LABELS.map((stat) => [stat, clampSp(Number(formData.get(`sp${stat}`) || 0))]));
  const spTotal = STAT_LABELS.reduce((sum, stat) => sum + spValues[stat], 0);
  const moves = [0, 1, 2, 3].map((index) => String(formData.get(`move${index}`) || "").trim()).filter(Boolean);
  const duplicateMoves = moves.filter((move, index) => moves.indexOf(move) !== index);
  const issues = [];
  if (spTotal !== SP_TOTAL_LIMIT) issues.push(`SP totaal is ${spTotal}/${SP_TOTAL_LIMIT}.`);
  if (moves.length < 4) issues.push(`Je hebt ${moves.length}/4 moves gekozen.`);
  if (duplicateMoves.length) issues.push(`Dubbele move: ${[...new Set(duplicateMoves)].join(", ")}.`);
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
  return [...new Set([roleFor(pokemon).label, "Wallbreaker", "Sweeper", "Bulky pivot", "Support", "Speed control", "Wall", "Allrounder"])];
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
  return [...new Set([...setMoves, ...customMoveOptionsFromBase(pokemon)])].sort();
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
  teamAnalysis.replaceChildren();
  teamAnalysis.append(createSectionHead("Team analyse"));

  if (!state.team.length) {
    const empty = document.createElement("p");
    empty.className = "empty-detail";
    empty.textContent = "Voeg Pokémon toe aan je team. Dan zie je hier zwaktes, balans en passende suggesties.";
    teamAnalysis.append(empty);
    return;
  }

  teamAnalysis.append(createBuilderExplanationPanel());
  teamAnalysis.append(createTeamSummaryPanel());
  teamAnalysis.append(createRulesPanel());
  teamAnalysis.append(createTeamSelectionPanel());
  teamAnalysis.append(createTeamScorePanel());
  teamAnalysis.append(createTypePanel());
  teamAnalysis.append(createThreatChecklistPanel());
  teamAnalysis.append(createRoleChecklistPanel());
  teamAnalysis.append(createSuggestionPanel());
}

function renderTeamOverview() {
  teamOverview.replaceChildren();
  const hasContent = state.team.length || state.favorites.length || state.compare.length;
  teamOverview.hidden = !hasContent;
  if (!hasContent) return;

  teamOverview.append(createSmallTitle("Shortlist & vergelijking"));
  if (state.favorites.length) teamOverview.append(createFavoritesPanel());
  if (state.compare.length) teamOverview.append(createComparePanel());
  if (!state.favorites.length && !state.compare.length) {
    const empty = document.createElement("p");
    empty.className = "empty-detail";
    empty.textContent = "Bewaar Pokémon op je shortlist of vergelijk twee opties vanuit de kaarten.";
    teamOverview.append(empty);
  }
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
        <span><strong>${escapeHtml(pokemon.name)}</strong><small>${escapeHtml(displayRoleForBuild(pokemon))} · BST ${pokemon.bst}</small></span>
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
  const head = document.createElement("div");
  head.className = "compare-head";
  head.innerHTML = `<strong>Vergelijking</strong><small>${selected.length}/2 gekozen</small>`;
  panel.append(head);

  if (selected.length < 2) {
    const hint = document.createElement("p");
    hint.textContent = "Kies nog een tweede Pokémon via Vergelijk.";
    panel.append(hint);
    return panel;
  }

  const names = document.createElement("div");
  names.className = "compare-name-row";
  names.innerHTML = `
    <span>Pokemon</span>
    ${selected.map((pokemon) => `
      <strong>
        <img src="${spriteUrl(pokemon.name)}" alt="">
        <span>${escapeHtml(pokemon.name)}<small>${escapeHtml(displayRoleForBuild(pokemon))}</small></span>
      </strong>
    `).join("")}
  `;
  names.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", (event) => event.target.remove(), { once: true });
  });
  panel.append(names);

  const rows = [
    ["Rol", selected.map((pokemon) => displayRoleForBuild(pokemon))],
    ["Typing", selected.map((pokemon) => pokemon.types.join(" / "))],
    ["Ability", selected.map((pokemon) => preferredAbility(pokemon))],
    ["BST", selected.map((pokemon) => pokemon.bst)],
    ["Speed", selected.map((pokemon) => pokemon.spe)],
    ["Set", selected.map((pokemon) => setQualityLabel(selectedBuild(pokemon)))],
    ["Teamfit", selected.map((pokemon) => suggestionReasons(pokemon).reasons[0] ?? formatFitLabel(pokemon))]
  ];
  rows.forEach(([label, values]) => {
    const row = document.createElement("div");
    row.className = "compare-row";
    row.innerHTML = `
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(values[0])}</strong>
      <strong>${escapeHtml(values[1])}</strong>
    `;
    panel.append(row);
  });

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "compare-clear";
  clear.textContent = "Vergelijking leegmaken";
  clear.addEventListener("click", () => {
    state.compare = [];
    render();
  });
  panel.append(clear);
  return panel;
}

function createTeamSummaryPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block analysis-summary";

  const title = document.createElement("h3");
  title.textContent = state.team.length >= maxTeamSize() ? "Team van 6 klaar" : "Team in opbouw";

  const chips = document.createElement("div");
  chips.className = "summary-chips";
  [
    ["Team", `${state.team.length}/6`],
    ["Preview", `${state.battleSelection.length}/${battleSelectionSize()} gekozen`],
    ["Format", BATTLE_FORMATS[state.battleFormat].label],
    ["Plan", TEAM_STYLES[state.teamStyle].label]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    chips.append(item);
  });

  panel.append(title, chips);
  return panel;
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
  const panel = document.createElement("div");
  panel.className = "analysis-block score-overview";
  panel.append(createSmallTitle("Team score"));
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
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const typeRisk = teamTypeSummary().filter((item) => item.weak >= 2 && item.resist + item.immune === 0).length;
  const threats = relevantThreats().slice(0, 6);
  const coveredThreats = threats.filter((threat) => threatAnswerStatus(threat).ok).length;
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
  ];
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
  panel.append(createSmallTitle(`Plan: ${style.label}`));

  const note = document.createElement("p");
  note.textContent = style.description;
  panel.append(note);
  return panel;
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
  const panel = document.createElement("div");
  panel.className = "analysis-block";
  panel.append(createSmallTitle("Rollen"));

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
    list.append(item);
  });

  panel.append(list);
  return panel;
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
  const suggestions = replacementMode ? replacementSuggestions() : suggestedPokemon();
  const panel = document.createElement("div");
  panel.className = "analysis-block";
  panel.append(createSmallTitle(replacementMode ? "Vervang-suggesties" : "Suggesties"));

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
    spriteWrap.title = `Bekijk details van ${pokemon.name}`;
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
    name.textContent = pokemon.name;
    const bst = document.createElement("small");
    bst.textContent = `BST ${pokemon.bst}`;
    top.append(name, bst);

    const chips = document.createElement("span");
    chips.className = "suggestion-types";
    chips.replaceChildren(...pokemon.types.map(createTypeChip));

    const text = document.createElement("span");
    text.className = "suggestion-reason";
    text.textContent = replace
      ? `Vervang ${replace.name}: ${reason}`
      : `${roleFor(pokemon).label}: ${reason}`;
    const build = selectedBuild(pokemon);
    const quality = document.createElement("span");
    quality.className = `suggestion-quality ${setQualityClass(build)}`;
    quality.textContent = quickDecisionLabel(pokemon, build);
    const actions = document.createElement("span");
    actions.className = "suggestion-actions";
    const add = document.createElement("button");
    add.type = "button";
    add.textContent = replace ? "Vervang" : "Voeg toe";
    add.addEventListener("click", () => {
      if (replace) replaceTeamMember(replace.name, pokemon);
      else addToTeam(pokemon);
      state.selected = pokemon;
      render();
    });
    const explain = document.createElement("button");
    explain.type = "button";
    explain.textContent = state.explanationOpen === pokemon.name ? "Verberg uitleg" : "Waarom?";
    explain.addEventListener("click", () => {
      state.explanationOpen = state.explanationOpen === pokemon.name ? "" : pokemon.name;
      render();
    });
    actions.append(add, explain);
    body.append(top, chips, text, quality, actions);
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

function createThreatChecklistPanel() {
  const threats = relevantThreats();
  const panel = document.createElement("div");
  panel.className = "analysis-block threat-checklist";
  panel.append(createSmallTitle("Threat-check"));

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
    const body = document.createElement("div");
    const top = document.createElement("strong");
    top.textContent = threat.name;
    const tags = document.createElement("small");
    tags.textContent = `${(threat.tags ?? []).join(" · ")}${status.answer ? ` · ${status.answer}` : ""}`;
    const note = document.createElement("p");
    note.textContent = status.ok ? status.note : threat.note;
    body.append(top, tags, note);
    item.append(mark, body);
    list.append(item);
  });

  panel.append(list);
  return panel;
}

function replacementSuggestions() {
  const originalSelection = [...state.battleSelection];
  state.battleSelection = [];
  invalidateCache();
  const baseline = teamScores().reduce((sum, item) => sum + item.value, 0);
  const candidates = state.pokemon
    .filter((pokemon) => !state.team.some((member) => member.name === pokemon.name))
    .filter((pokemon) => !needsValidationAsCore(pokemon))
    .map((pokemon) => {
      let best = null;
      state.team.forEach((member) => {
        const hypotheticalTeam = state.team.map((item) => item.name === member.name ? pokemon : item);
        const bases = hypotheticalTeam.map((item) => baseSpecies(item.name));
        if (new Set(bases).size !== bases.length) return;
        if (isMega(pokemon) && state.team.some((item) => item.name !== member.name && isMega(item))) return;
        const original = [...state.team];
        state.team = state.team.map((item) => item.name === member.name ? pokemon : item);
        invalidateCache();
        const scores = teamScores();
        const score = scores.reduce((sum, item) => sum + item.value, 0);
        state.team = original;
        invalidateCache();
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
  state.battleSelection = originalSelection;
  invalidateCache();
  return candidates.slice(0, 3);
}

function replaceTeamMember(oldName, nextPokemon) {
  const index = state.team.findIndex((pokemon) => pokemon.name === oldName);
  if (index === -1) return;
  state.team[index] = nextPokemon;
  state.battleSelection = state.battleSelection.map((name) => name === oldName ? nextPokemon.name : name);
  state.selected = nextPokemon;
  state.teamNotice = `${oldName} vervangen door ${nextPokemon.name}.`;
  invalidateCache();
}

function createTeamSelectionPanel() {
  const panel = document.createElement("div");
  panel.className = "analysis-block team-selection-sim";
  panel.append(createSmallTitle(`Team Preview (${BATTLE_FORMATS[state.battleFormat].label})`));

  const note = document.createElement("p");
  note.textContent = state.team.length < maxTeamSize()
    ? `Bouw eerst richting een team van 6. Daarna kies je bij Team Preview ${battleSelectionSize()} Pokémon voor het gevecht.`
    : `Je hebt 6 Pokémon. Kies hieronder welke ${battleSelectionSize()} je zou meenemen tegen de preview van je tegenstander.`;

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
      <strong>${escapeHtml(pokemon.name)}</strong>
      <small>${escapeHtml(formatFitLabel(pokemon))} · ${escapeHtml(setQualityLabel(build))}</small>
    `;
    item.addEventListener("click", () => toggleBattleSelection(pokemon));
    list.append(item);
  });

  const selectedText = document.createElement("p");
  selectedText.className = "selection-note";
  selectedText.textContent = state.battleSelection.length
    ? `Gekozen: ${state.battleSelection.join(", ")} (${state.battleSelection.length}/${battleSelectionSize()})`
    : `Nog geen battle-selectie gekozen (${battleSelectionSize()} nodig).`;
  const archetype = document.createElement("p");
  archetype.className = "selection-note";
  archetype.textContent = selectionArchetypeNote();

  panel.append(note, list, selectedText, archetype);
  return panel;
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
      <strong>${escapeHtml(pokemon.name)}</strong>
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
  const answers = threat.answers ?? [];
  const attackTypes = threat.attackTypes ?? [];
  const team = analysisTeam();
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

function teamTypeSummary(team = state.team) {
  if (team === state.team) team = analysisTeam();
  if (team !== state.team) return pureTeamTypeSummary(team);
  state.cache.teamTypeSummary ??= pureTeamTypeSummary(state.team);
  return state.cache.teamTypeSummary;
}

function defensiveMultiplier(defenderTypes, attackType) {
  return pureDefensiveMultiplier(defenderTypes, attackType);
}

function teamLegality(pokemon) {
  return pureTeamLegality({
    pokemon,
    team: state.team,
    battleFormat: state.battleFormat,
    battleFormats: BATTLE_FORMATS
  });
}

function teamRules() {
  const megaCount = state.team.filter(isMega).length;
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
      ok: megaCount <= 1,
      label: "Maximaal 1 Mega",
      note: megaCount ? `${megaCount} Mega gekozen.` : "Nog geen Mega gekozen."
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

function baseSpecies(name) {
  return pureBaseSpecies(name);
}

function baseSpeciesLabel(name) {
  return pureBaseSpeciesLabel(name);
}

function teamBalance() {
  return analysisTeam().reduce((totals, pokemon) => {
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
  }, { physical: 0, special: 0, mixed: 0, fast: 0, bulky: 0, unreliable: 0 });
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
  const names = new Set(state.team.map((pokemon) => pokemon.name));
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const topWeaknesses = teamTypeSummary()
    .filter((item) => item.weak >= 2)
    .map((item) => item.type);

  return state.pokemon
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
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst)
    .slice(0, limit);
}

function suggestionReasons(pokemon, context = {}) {
  const balance = context.balance ?? teamBalance();
  const targets = context.targets ?? TEAM_STYLES[state.teamStyle].targets;
  const topWeaknesses = context.topWeaknesses ?? teamTypeSummary().filter((item) => item.weak >= 2).map((item) => item.type);
  const reasons = [];
  let score = 0;

  if (isMega(pokemon) && state.team.some(isMega)) {
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

function styleFitReason(pokemon) {
  if (needsValidationAsCore(pokemon)) return "";
  if (state.teamStyle === "rain" && (hasAbility(pokemon, "Drizzle") || hasAbility(pokemon, "Swift Swim") || pokemon.types.includes("Water"))) {
    return "past bij Rain-plan";
  }
  if (state.teamStyle === "sun" && (hasAbility(pokemon, "Drought") || hasAbility(pokemon, "Chlorophyll") || pokemon.types.includes("Fire") || pokemon.types.includes("Grass"))) {
    return "past bij Sun-plan";
  }
  if (state.teamStyle === "trickroom" && pokemon.spe <= 65) {
    return "past bij Trick Room door lage Speed";
  }
  if (state.teamStyle === "doublesupport" && (hasAbility(pokemon, "Intimidate") || hasAbility(pokemon, "Prankster") || hasAbility(pokemon, "Friend Guard"))) {
    return "past bij Double support";
  }
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
  const mega = state.team.find(isMega);
  needs.push({
    done: !!mega,
    label: "Mega-slot",
    note: mega ? `${mega.name} gebruikt je Mega-slot.` : "Nog vrij; Mega-opties blijven beschikbaar."
  });
  return needs.slice(0, 5);
}

function roleCoverage() {
  if (state.cache.roleCoverage) return state.cache.roleCoverage;
  const balance = teamBalance();
  const targets = TEAM_STYLES[state.teamStyle].targets;
  const team = analysisTeam();
  const hasGroundImmune = team.some((pokemon) => defensiveMultiplier(pokemon.types, "Ground") === 0);
  const hasSteelOrPoison = team.some((pokemon) => pokemon.types.includes("Steel") || pokemon.types.includes("Poison"));

  state.cache.roleCoverage = [
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
  return state.cache.roleCoverage;
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
  if (build.status === "custom") return build.role || roleFor(pokemon).label;
  return roleFor(pokemon).label;
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
  const cacheKey = `${pokemon.name}:${state.selectedSets[pokemon.name] ?? ""}:${state.customSets[pokemon.name] ? JSON.stringify(state.customSets[pokemon.name]) : ""}`;
  if (state.cache.selectedBuilds.has(cacheKey)) return state.cache.selectedBuilds.get(cacheKey);
  const options = buildOptions(pokemon);
  const selectedId = state.selectedSets[pokemon.name] ?? options[0].id;
  const build = options.find((option) => option.id === selectedId) ?? options[0];
  state.cache.selectedBuilds.set(cacheKey, build);
  return build;
}

function buildOptions(pokemon) {
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
    const moves = [0, 1, 2, 3].map((index) => safeSelectedMove(saved.moves?.[index], validMoves, index)).filter(Boolean);
    return {
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
  }

  const base = state.movesets[pokemon.name]?.[0] ?? buildAdvice(pokemon);
  return {
    ...base,
    id: "custom",
    label: "Custom",
    status: "custom",
    role: roleFor(pokemon).label,
    item: base.item || "",
    ability: base.ability || preferredAbility(pokemon),
    nature: base.nature || "",
    evs: base.evs || "",
    moves: [...(base.moves ?? [])].slice(0, 4),
    sourceIds: ["custom-local"]
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
  return [...new Set([...setMoves, ...typedMoves, ...Object.keys(state.moveDetails)])].sort();
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

function needsValidationAsCore(pokemon) {
  const build = selectedBuild(pokemon);
  return isDevelopmentCandidate(pokemon) || isLowPowerCandidate(pokemon) || build.status === "generated";
}

function teamMemberIssues(pokemon, build = selectedBuild(pokemon)) {
  const issues = [];
  if (isDevelopmentCandidate(pokemon)) issues.push("pre-evolution / ontwikkelvorm");
  if (isLowPowerCandidate(pokemon)) issues.push(`lage BST ${pokemon.bst}`);
  if (build.status === "generated") issues.push("door app bedacht");
  return issues;
}

function isReliableThreatAnswer(pokemon) {
  const build = selectedBuild(pokemon);
  if (build.status === "generated") return false;
  if (isDevelopmentCandidate(pokemon)) return false;
  if (pokemon.bst < 500) return false;
  return true;
}

function formatFitLabel(pokemon) {
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
  if (!restrictedMoveAllowed(pokemon, move)) return false;
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

function restrictedMoveAllowed(pokemon, move) {
  const allowed = RESTRICTED_MOVE_LEARNERS[move];
  if (!allowed) return true;
  return allowed.includes(pokemon.name) || allowed.includes(baseSpeciesLabel(pokemon.name));
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
