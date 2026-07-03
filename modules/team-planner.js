import { baseSpecies, defensiveMultiplier, pokemonUsesMegaSlot, teamTypeSummary } from "./team-analysis.js";

// teamTypeSummary is puur en hangt alleen af van de types van de teamleden.
// Tijdens beam search en kandidaat-scoring komen dezelfde (deel)teams vele
// malen terug, dus cachen op teamsignatuur scheelt veel herberekening.
const typeSummaryCache = new Map();

function cachedTypeSummary(team) {
  const key = teamSignature(team);
  const hit = typeSummaryCache.get(key);
  if (hit) return hit;
  const value = teamTypeSummary(team);
  if (typeSummaryCache.size >= 5000) typeSummaryCache.clear();
  typeSummaryCache.set(key, value);
  return value;
}

const DEFAULT_FORMAT = { label: "Single 3v3", maxTeamSize: 6, selectionSize: 3 };
const DEFAULT_STYLE = { label: "Balanced", targets: { physical: 2, special: 2, fast: 1, bulky: 2 } };
const VARIANT_MODES = ["balanced", "safe", "pressure"];
const VARIANT_LABELS = {
  balanced: "Plan-fit",
  safe: "Veilig team",
  pressure: "Offensieve variant"
};

export function planTeam(context = {}, options = {}) {
  const ctx = normalizeContext(context);
  const team = legalTeam((context.team ?? []).slice(0, ctx.maxTeamSize), ctx);
  const core = legalTeam(((context.core?.length ? context.core : team) ?? []).slice(0, ctx.maxTeamSize), ctx);
  const includeVariants = options.includeVariants ?? true;
  const includeSuggestions = options.includeSuggestions ?? true;
  const includeReplacements = options.includeReplacements ?? true;
  const variants = includeVariants
    ? VARIANT_MODES
      .map((mode) => completeTeamVariant(core, ctx, mode))
      .filter(Boolean)
    : [];
  const evaluation = evaluateTeam(team, ctx);

  return {
    variants,
    suggestions: includeSuggestions
      ? candidateSuggestions(team, ctx, options.suggestionLimit ?? 12, options.suggestionMode ?? "balanced")
      : [],
    replacementSuggestions: includeReplacements
      ? replacementSuggestions(team, ctx, options.replacementLimit ?? 8)
      : [],
    selectionAdvice: chooseBestBattleSelection(team, ctx),
    diagnostics: evaluation.diagnostics,
    evaluation
  };
}

export function suggestTeamAdditions(context = {}, options = {}) {
  const ctx = normalizeContext(context);
  const team = legalTeam((context.team ?? []).slice(0, ctx.maxTeamSize), ctx);
  return candidateSuggestions(team, ctx, options.limit ?? options.suggestionLimit ?? 12, options.mode ?? options.suggestionMode ?? "balanced");
}

export function suggestTeamReplacements(context = {}, options = {}) {
  const ctx = normalizeContext(context);
  const team = legalTeam((context.team ?? []).slice(0, ctx.maxTeamSize), ctx);
  return replacementSuggestions(team, ctx, options.limit ?? options.replacementLimit ?? 8);
}

export function evaluateTeam(team = [], context = {}, options = {}) {
  const ctx = normalizeContext(context);
  const members = legalTeam(team, ctx);
  const legal = teamLegalityStatus(members, ctx);
  const balance = teamBalance(members, ctx);
  const roleChecks = roleChecksForTeam(members, ctx, balance);
  const typeRows = cachedTypeSummary(members);
  const typeRiskRows = typeRows.filter((item) => item.weak >= 2 && item.resist + item.immune === 0);
  const severeTypeRows = typeRows.filter((item) => item.weak >= 3);
  const threatRows = threatStatusesForTeam(members, ctx);
  const styleChecks = styleChecksForTeam(members, ctx);
  const setQuality = setQualitySummary(members, ctx);
  const format = formatSummary(members, ctx);
  const redundancy = redundancySummary(members, ctx, typeRows);
  const targetSize = options.selectionSize ?? ctx.maxTeamSize;
  const sizeScore = targetSize ? clamp(members.length / targetSize * 100, 0, 100) : 100;

  const roleScore = average(roleChecks.map((check) => check.score), 100);
  // 4x-zwaktes (severe) wegen extra mee: één dubbel-zwak teamlid is riskanter
  // dan twee enkel-zwakke leden met dekking.
  const quadWeakCount = typeRows.reduce((sum, item) => sum + (item.severe ?? 0), 0);
  const typeScore = clamp(100 - typeRiskRows.length * 23 - severeTypeRows.length * 10 - quadWeakCount * 6 + typeRows.filter((item) => item.resist + item.immune >= 2).length * 2, 0, 100);
  const threatScore = threatRows.length ? weightedAverage(threatRows.map((threat) => ({ value: threat.score, weight: threat.weight ?? 1 })), 100) : 100;
  const styleScore = styleChecks.length ? average(styleChecks.map((check) => check.score), 100) : 100;
  const weights = scoreWeights(options.mode);
  const breakdown = [
    scoreItem("size", "Teamgrootte", sizeScore, `${members.length}/${targetSize} slots gevuld`, weights.size),
    scoreItem("roles", "Rollen", roleScore, `${roleChecks.filter((check) => check.done).length}/${roleChecks.length} rolchecks`, weights.roles),
    scoreItem("types", "Type-risico", typeScore, typeRiskRows.length ? `${typeRiskRows.length} onbeantwoorde gedeelde zwakte${typeRiskRows.length === 1 ? "" : "s"}` : "Geen grote gedeelde zwakte", weights.types),
    scoreItem("threats", "Threats", threatScore, threatRows.length ? `${threatRows.filter((threat) => threat.ok).length}/${threatRows.length} lokale checks` : "Geen lokale threat-data", weights.threats),
    scoreItem("style", `${ctx.style.label}-kern`, styleScore, styleChecks.length ? `${styleChecks.filter((check) => check.done).length}/${styleChecks.length} planchecks` : "Geen specifieke planchecks", weights.style),
    scoreItem("format", ctx.format.label, format.value, format.note, weights.format),
    scoreItem("redundancy", "Redundantie", redundancy.value, redundancy.note, weights.redundancy),
    scoreItem("sets", "Setkwaliteit", setQuality.value, setQuality.note, weights.sets),
    scoreItem("legality", "Teamregels", legal.ok ? 100 : 15, legal.ok ? "Legaal roster" : legal.issues.join(" · "), weights.legality)
  ];
  const totalWeight = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const total = totalWeight ? breakdown.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight : 0;
  const normalized = clamp(Math.round(total), 0, 100);
  const risks = evaluationRisks({ legal, redundancy, typeRiskRows, threatRows, styleChecks, setQuality });
  const confidence = confidenceSummary({ legal, redundancy, typeRiskRows, threatRows, setQuality, format });

  return {
    total: normalized,
    rawTotal: total,
    breakdown,
    scoreBreakdown: breakdown,
    reasons: evaluationReasons({ breakdown, roleChecks, threatRows, styleChecks, typeRiskRows, format, setQuality }),
    risks,
    confidence,
    diagnostics: {
      scores: breakdown.map(({ weight, ...item }) => item),
      roleChecks,
      styleChecks,
      threats: threatRows,
      typeSummary: typeRows,
      balance,
      legal,
      redundancy,
      dataConfidence: setQuality,
      confidence,
      risks,
      format
    }
  };
}

export function chooseBestBattleSelection(team = [], context = {}) {
  const ctx = normalizeContext(context);
  const limit = Math.min(ctx.selectionSize, team.length);
  if (!limit) {
    return { picks: [], score: 0, reason: "Geen teamleden om te kiezen.", evaluated: 0 };
  }

  const combos = combinations(legalTeam(team, ctx), limit);
  const ranked = combos
    .map((combo) => {
      const evaluation = evaluateTeam(combo, { ...ctx, maxTeamSize: limit }, { selectionSize: limit, mode: ctx.battleFormat === "double4" ? "safe" : "pressure" });
      const leadBonus = leadScore(combo, ctx);
      const score = clamp(Math.round(evaluation.total + leadBonus), 0, 100);
      return {
        team: combo,
        picks: combo.map((pokemon) => pokemon.name),
        score,
        reason: selectionReason(combo, evaluation, ctx),
        evaluation
      };
    })
    .sort((a, b) => b.score - a.score || teamSignature(a.team).localeCompare(teamSignature(b.team)));

  return {
    ...(ranked[0] ?? { team: [], picks: [], score: 0, reason: "Geen geldige selectie." }),
    evaluated: ranked.length,
    alternatives: ranked.slice(1, 4)
  };
}

function completeTeamVariant(core, ctx, mode) {
  let beams = [{ team: legalTeam(core, ctx), evaluation: evaluateTeam(core, ctx, { mode }) }];
  if (!beams[0].team.length && ctx.team.length) {
    beams = [{ team: legalTeam(ctx.team, ctx), evaluation: evaluateTeam(ctx.team, ctx, { mode }) }];
  }

  while (beams.some((beam) => beam.team.length < ctx.maxTeamSize)) {
    const expanded = [];
    beams.forEach((beam) => {
      if (beam.team.length >= ctx.maxTeamSize) {
        expanded.push(beam);
        return;
      }
      candidateSuggestions(beam.team, ctx, ctx.candidateLimit, mode).forEach(({ pokemon }) => {
        const next = [...beam.team, pokemon];
        if (!isLegalTeam(next, ctx).ok) return;
        expanded.push({ team: next, evaluation: evaluateTeam(next, ctx, { mode }) });
      });
    });

    const unique = uniqueBeams(expanded);
    const nextBeams = unique
      .sort((a, b) => beamSortScore(b, mode) - beamSortScore(a, mode) || teamSignature(a.team).localeCompare(teamSignature(b.team)))
      .slice(0, ctx.beamWidth);
    if (!nextBeams.length || sameBeamSet(beams, nextBeams)) break;
    beams = nextBeams;
  }

  const best = beams
    .sort((a, b) => variantSortScore(b, mode) - variantSortScore(a, mode) || teamSignature(a.team).localeCompare(teamSignature(b.team)))[0];
  if (!best) return null;

  return {
    id: mode,
    label: VARIANT_LABELS[mode] ?? "Variant",
    team: best.team,
    score: best.evaluation.total,
    breakdown: best.evaluation.breakdown,
    scoreBreakdown: best.evaluation.scoreBreakdown,
    reasons: best.evaluation.reasons,
    risks: best.evaluation.risks,
    confidence: best.evaluation.confidence,
    diagnostics: best.evaluation.diagnostics
  };
}

function candidateSuggestions(team, ctx, limit = 12, mode = "balanced") {
  if (team.length >= ctx.maxTeamSize) return [];
  const existingNames = new Set(team.map((pokemon) => pokemon.name));
  const baseEvaluation = evaluateTeam(team, ctx, { mode });

  return ctx.pokemon
    .filter((pokemon) => pokemon?.name && !existingNames.has(pokemon.name))
    .filter((pokemon) => isLegalCandidate(pokemon, team, ctx))
    .filter((pokemon) => candidateBuildUsable(pokemon, ctx))
    .map((pokemon) => {
      const nextTeam = [...team, pokemon];
      const evaluation = evaluateTeam(nextTeam, ctx, { mode });
      const build = buildFor(pokemon, ctx);
      const score = Math.round((evaluation.total - baseEvaluation.total) * 2.1 + riskReductionScore(baseEvaluation, evaluation) + individualCandidateScore(pokemon, team, ctx, mode));
      const reasons = candidateReasons(pokemon, team, baseEvaluation, evaluation, ctx);
      return {
        pokemon,
        score,
        reason: reasons.join(" en "),
        reasons,
        confidence: suggestionConfidence(setQualityForBuild(build, pokemon, ctx), evaluation.confidence),
        scoreBreakdown: evaluation.scoreBreakdown,
        risks: evaluation.risks,
        evaluation
      };
    })
    .filter((item) => item.score > -20)
    .sort((a, b) => b.score - a.score || b.pokemon.bst - a.pokemon.bst || a.pokemon.name.localeCompare(b.pokemon.name))
    .slice(0, limit);
}

function replacementSuggestions(team, ctx, limit = 8) {
  if (team.length < ctx.maxTeamSize) return [];
  const locked = new Set(ctx.lockedNames);
  const baseline = evaluateTeam(team, ctx);
  return ctx.pokemon
    .filter((pokemon) => pokemon?.name && !team.some((member) => member.name === pokemon.name))
    .filter((pokemon) => candidateBuildUsable(pokemon, ctx))
    .map((pokemon) => {
      let best = null;
      team.forEach((member, index) => {
        if (index === 0 || locked.has(member.name)) return;
        const next = team.map((item) => item.name === member.name ? pokemon : item);
        if (!isLegalTeam(next, ctx).ok) return;
        const evaluation = evaluateTeam(next, ctx);
        const gain = evaluation.total - baseline.total;
        if (!best || gain > best.gain) best = { replace: member, gain, evaluation };
      });
      if (!best) return null;
      const reasons = candidateReasons(pokemon, team, baseline, best.evaluation, ctx);
      return {
        pokemon,
        replace: best.replace,
        score: Math.round(best.gain),
        gain: Math.round(best.gain),
        reason: reasons.join(" en "),
        reasons,
        confidence: suggestionConfidence(setQualityForBuild(buildFor(pokemon, ctx), pokemon, ctx), best.evaluation.confidence),
        scoreBreakdown: best.evaluation.scoreBreakdown,
        risks: best.evaluation.risks,
        evaluation: best.evaluation
      };
    })
    .filter(Boolean)
    .filter((item) => item.gain > -10)
    .sort((a, b) => b.gain - a.gain || b.pokemon.bst - a.pokemon.bst || a.pokemon.name.localeCompare(b.pokemon.name))
    .slice(0, limit);
}

function normalizeContext(context = {}) {
  const battleFormats = context.battleFormats ?? {};
  const format = context.format ?? battleFormats[context.battleFormat] ?? DEFAULT_FORMAT;
  const style = context.style ?? context.teamStyles?.[context.teamStyle] ?? DEFAULT_STYLE;
  return {
    ...context,
    pokemon: context.pokemon ?? [],
    team: context.team ?? [],
    format,
    style,
    maxTeamSize: context.maxTeamSize ?? format.maxTeamSize ?? DEFAULT_FORMAT.maxTeamSize,
    selectionSize: context.selectionSize ?? format.selectionSize ?? DEFAULT_FORMAT.selectionSize,
    selectedBuild: context.selectedBuild ?? (() => ({})),
    roleFor: context.roleFor ?? fallbackRoleFor,
    championsMeta: context.championsMeta ?? { threats: [], archetypes: [] },
    moveDetails: context.moveDetails ?? null,
    hasMoveDetails: Boolean(context.moveDetails),
    teamStyle: context.teamStyle ?? "balanced",
    battleFormat: context.battleFormat ?? "single3",
    lockedNames: new Set(context.lockedNames ?? []),
    beamWidth: context.beamWidth ?? 20,
    candidateLimit: context.candidateLimit ?? 80
  };
}

function scoreWeights(mode = "balanced") {
  const base = { size: 0.55, roles: 1.15, types: 1.2, threats: 1.35, style: 1.1, format: 1.1, redundancy: 0.9, sets: 0.85, legality: 1.65 };
  if (mode === "safe") return { ...base, types: 1.55, threats: 1.55, format: 0.95, roles: 1.05 };
  if (mode === "pressure") return { ...base, format: 1.45, roles: 1.25, types: 1.0, threats: 1.2 };
  return base;
}

function scoreItem(id, label, value, note, weight) {
  const normalized = clamp(Math.round(value), 0, 100);
  return {
    id,
    label,
    value: normalized,
    note,
    weight,
    level: normalized >= 75 ? "good" : normalized >= 45 ? "warn" : "bad"
  };
}

function teamBalance(team, ctx) {
  return team.reduce((totals, pokemon) => {
    const role = roleLabel(pokemon, ctx);
    const build = buildFor(pokemon, ctx);
    const text = buildText(build);
    const bestAttack = Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0);
    if ((pokemon.atk ?? 0) >= (pokemon.spa ?? 0) + 15 && bestAttack >= 95) totals.physical += 1;
    else if ((pokemon.spa ?? 0) >= (pokemon.atk ?? 0) + 15 && bestAttack >= 95) totals.special += 1;
    else if (bestAttack >= 105) totals.mixed += 1;
    if ((pokemon.spe ?? 0) >= 100 || /speed|scarf|tailwind|icy wind|trick room/i.test(`${role} ${text}`)) totals.fast += 1;
    if (bulk(pokemon) >= 280 || /wall|pivot|support|tank|defensive|leftovers|recover|roost|wish/i.test(`${role} ${text}`)) totals.bulky += 1;
    if (/support|pivot|wall|intimidate|prankster|fake out|tailwind|helping hand/i.test(`${role} ${text}`)) totals.support += 1;
    if (/swords dance|dragon dance|nasty plot|quiver dance|shell smash|calm mind|bulk up/i.test(text)) totals.setup += 1;
    return totals;
  }, { physical: 0, special: 0, mixed: 0, fast: 0, bulky: 0, support: 0, setup: 0 });
}

function roleChecksForTeam(team, ctx, balance = teamBalance(team, ctx)) {
  const targets = ctx.style.targets ?? DEFAULT_STYLE.targets;
  const groundRows = cachedTypeSummary(team).find((item) => item.type === "Ground");
  const fairyRows = cachedTypeSummary(team).find((item) => item.type === "Fairy");
  const hasGroundAnswer = team.some((pokemon) => defensiveMultiplier(pokemon.types ?? [], "Ground") === 0) || (groundRows?.resist ?? 0) > 0;
  const hasFairyAnswer = team.some((pokemon) => (pokemon.types ?? []).includes("Steel") || (pokemon.types ?? []).includes("Poison")) || (fairyRows?.resist ?? 0) > 0;
  return [
    check("Fysieke druk", balance.physical >= targets.physical, ratioScore(balance.physical, targets.physical), `${balance.physical}/${targets.physical} fysiek`),
    check("Speciale druk", balance.special >= targets.special, ratioScore(balance.special, targets.special), `${balance.special}/${targets.special} speciaal`),
    check("Speed control", balance.fast >= targets.fast, ratioScore(balance.fast, targets.fast), `${balance.fast}/${targets.fast} snelle slots`),
    check("Defensieve switch-ins", balance.bulky >= targets.bulky, ratioScore(balance.bulky, targets.bulky), `${balance.bulky}/${targets.bulky} bulky`),
    check("Ground antwoord", hasGroundAnswer, hasGroundAnswer ? 100 : 20, hasGroundAnswer ? "Ground wordt opgevangen" : "Geen Ground-resist of immunity"),
    check("Fairy antwoord", hasFairyAnswer, hasFairyAnswer ? 100 : 35, hasFairyAnswer ? "Fairy wordt opgevangen" : "Steel/Poison of resist ontbreekt")
  ];
}

function styleChecksForTeam(team, ctx) {
  const style = ctx.teamStyle;
  if (style === "rain") return rainChecks(team, ctx);
  if (style === "sun") return sunChecks(team, ctx);
  if (style === "sand") return sandChecks(team, ctx);
  if (style === "snow") return snowChecks(team, ctx);
  if (style === "trickroom") return trickRoomChecks(team, ctx);
  if (style === "doublesupport") return doubleSupportChecks(team, ctx);
  if (style === "hyperoffense") return hyperOffenseChecks(team, ctx);
  if (style === "voltturn") return voltTurnChecks(team, ctx);
  if (style === "stall") return stallChecks(team, ctx);
  if (style === "antiMeta") return antiMetaChecks(team, ctx);
  return [];
}

function rainChecks(team, ctx) {
  const drizzle = team.filter((pokemon) => hasAbility(pokemon, "Drizzle"));
  const abusers = team.filter((pokemon) => isRainAbuser(pokemon, ctx));
  const water = team.filter((pokemon) => isRainWaterPressure(pokemon, ctx));
  const conflict = weatherConflictMembers(team, "rain");
  return [
    check("Drizzle setter", drizzle.length > 0, drizzle.length ? 100 : 10, drizzle.length ? `${names(drizzle)} zet rain.` : "Pelipper of Politoed geeft rain."),
    check("Swift Swim-abuser", abusers.length > 0, abusers.length ? 100 : 25, abusers.length ? `${names(abusers)} gebruikt rain.` : "Rain wil een snelle abuser."),
    check("Rain water-druk", water.length > 0, water.length ? 100 : 35, water.length ? `${names(water)} zet Water-druk.` : "Waterdruk ontbreekt."),
    planTypeCheck(team, "Electric"),
    planTypeCheck(team, "Grass"),
    check("Geen weather-conflict", conflict.length === 0, conflict.length ? 15 : 100, conflict.length ? `${names(conflict)} zet ander weer.` : "Geen conflicterende setter.")
  ];
}

function sunChecks(team, ctx) {
  const drought = team.filter((pokemon) => hasAbility(pokemon, "Drought"));
  const chlorophyll = team.filter((pokemon) => isChlorophyllAbuser(pokemon, ctx));
  const fire = team.filter((pokemon) => isSunFirePressure(pokemon, ctx));
  const conflict = weatherConflictMembers(team, "sun");
  return [
    check("Drought setter", drought.length > 0, drought.length ? 100 : 10, drought.length ? `${names(drought)} zet sun.` : "Torkoal, Ninetales of Mega Charizard Y geeft sun."),
    check("Chlorophyll-abuser", chlorophyll.length > 0 || team.some((pokemon) => pokemon.name === "Venusaur-Mega"), chlorophyll.length ? 100 : team.some((pokemon) => pokemon.name === "Venusaur-Mega") ? 70 : 25, chlorophyll.length ? `${names(chlorophyll)} gebruikt sun-tempo.` : "Voeg een sun-abuser toe."),
    check("Fire-druk", fire.length > 0, fire.length ? 100 : 35, fire.length ? `${names(fire)} profiteert van sun.` : "Fire-druk ontbreekt."),
    planTypeCheck(team, "Rock"),
    planTypeCheck(team, "Water"),
    planTypeCheck(team, "Dragon"),
    check("Geen weather-conflict", conflict.length === 0, conflict.length ? 15 : 100, conflict.length ? `${names(conflict)} zet ander weer.` : "Geen conflicterende setter.")
  ];
}

function sandChecks(team, ctx) {
  const stream = team.filter((pokemon) => hasAbility(pokemon, "Sand Stream"));
  const abusers = team.filter((pokemon) => isSandAbuser(pokemon, ctx));
  const breakers = team.filter((pokemon) => isSandBreaker(pokemon, ctx));
  const conflict = weatherConflictMembers(team, "sand");
  return [
    check("Sand Stream setter", stream.length > 0, stream.length ? 100 : 10, stream.length ? `${names(stream)} zet sand.` : "Tyranitar of Hippowdon geeft sand."),
    check("Sand abuser", abusers.length > 0, abusers.length ? 100 : 25, abusers.length ? `${names(abusers)} gebruikt sand.` : "Sand Rush/Force-abuser ontbreekt."),
    check("Sand breaker", breakers.length > 0, breakers.length ? 100 : 35, breakers.length ? `${names(breakers)} geeft Rock/Ground/Steel-druk.` : "Breaker ontbreekt."),
    planTypeCheck(team, "Water"),
    planTypeCheck(team, "Grass"),
    planTypeCheck(team, "Fighting"),
    check("Geen weather-conflict", conflict.length === 0, conflict.length ? 15 : 100, conflict.length ? `${names(conflict)} zet ander weer.` : "Geen conflicterende setter.")
  ];
}

function snowChecks(team, ctx) {
  const warning = team.filter((pokemon) => hasAbility(pokemon, "Snow Warning"));
  const abusers = team.filter((pokemon) => isSnowAbuser(pokemon, ctx));
  const ice = team.filter((pokemon) => isSnowIcePressure(pokemon, ctx));
  const conflict = weatherConflictMembers(team, "snow");
  return [
    check("Snow Warning setter", warning.length > 0, warning.length ? 100 : 10, warning.length ? `${names(warning)} zet snow.` : "Abomasnow of Aurorus geeft snow."),
    check("Snow abuser", abusers.length > 0, abusers.length ? 100 : 25, abusers.length ? `${names(abusers)} gebruikt snow.` : "Snow-abuser ontbreekt."),
    check("Ice-druk", ice.length > 0, ice.length ? 100 : 35, ice.length ? `${names(ice)} zet Ice-druk.` : "Ice-druk ontbreekt."),
    planTypeCheck(team, "Fire"),
    planTypeCheck(team, "Steel"),
    planTypeCheck(team, "Rock"),
    check("Geen weather-conflict", conflict.length === 0, conflict.length ? 15 : 100, conflict.length ? `${names(conflict)} zet ander weer.` : "Geen conflicterende setter.")
  ];
}

function trickRoomChecks(team, ctx) {
  const setters = team.filter((pokemon) => isTrickRoomSetter(pokemon, ctx));
  const abusers = team.filter((pokemon) => isTrickRoomAbuser(pokemon, ctx));
  const fast = team.filter((pokemon) => (pokemon.spe ?? 0) >= 100);
  return [
    check("Trick Room setter", setters.length > 0, setters.length ? 100 : 10, setters.length ? `${names(setters)} kan Room zetten.` : "Setter ontbreekt."),
    check("Trick Room abuser", abusers.length >= 2, ratioScore(abusers.length, 2), abusers.length ? `${names(abusers)} benut Room.` : "Langzame abusers ontbreken."),
    check("Speed-discipline", fast.length <= 2, fast.length <= 2 ? 100 : 35, fast.length <= 2 ? "Niet te veel snelle slots." : `${names(fast)} maakt Room dubbelzinnig.`),
    planTypeCheck(team, "Dark"),
    planTypeCheck(team, "Ghost")
  ];
}

function doubleSupportChecks(team, ctx) {
  const speed = team.filter((pokemon) => hasTeamSpeedControl(pokemon, ctx));
  const utility = team.filter((pokemon) => isDoubleUtility(pokemon, ctx));
  const protect = team.filter((pokemon) => hasMove(pokemon, ctx, /protect/i));
  return [
    check("Speed-control support", speed.length > 0, speed.length ? 100 : 25, speed.length ? `${names(speed)} stuurt tempo.` : "Tailwind/Icy Wind/Thunder Wave ontbreekt."),
    check("Double utility", utility.length >= 2, ratioScore(utility.length, 2), utility.length ? `${names(utility)} brengt utility.` : "Fake Out, Intimidate of Prankster ontbreekt."),
    check("Protect-plan", protect.length >= 2, ratioScore(protect.length, 2), protect.length ? `${names(protect)} heeft Protect.` : "Meerdere Protect-gebruikers zijn nuttig.")
  ];
}

function hyperOffenseChecks(team, ctx) {
  const setup = team.filter((pokemon) => isSetupPressure(pokemon, ctx));
  const entry = team.filter((pokemon) => hasEntryPressure(pokemon, ctx));
  const passive = team.filter((pokemon) => /wall|pivot/i.test(roleLabel(pokemon, ctx)) && !isSetupPressure(pokemon, ctx));
  return [
    check("Setupdruk", setup.length >= 2, ratioScore(setup.length, 2), setup.length ? `${names(setup)} kan setupdruk geven.` : "Setupdruk ontbreekt."),
    check("Lead pressure", entry.length > 0, entry.length ? 100 : 30, entry.length ? `${names(entry)} kan openen.` : "Hazards/screens/Taunt ontbreken."),
    check("Weinig passiviteit", passive.length <= 1, passive.length <= 1 ? 100 : 35, passive.length <= 1 ? "Niet te passief." : `${names(passive)} maakt HO passief.`)
  ];
}

function voltTurnChecks(team, ctx) {
  const pivots = team.filter((pokemon) => hasPivotMove(pokemon, ctx));
  const speed = team.filter((pokemon) => (pokemon.spe ?? 0) >= 100 || hasAbility(pokemon, "Regenerator") || hasAbility(pokemon, "Intimidate"));
  return [
    check("Pivot-kern", pivots.length >= 2, ratioScore(pivots.length, 2), pivots.length ? `${names(pivots)} houdt momentum.` : "Meerdere pivotmoves ontbreken."),
    check("Tempo na pivot", speed.length >= 2, ratioScore(speed.length, 2), speed.length ? `${names(speed)} houdt tempo.` : "Snelheid/Regenerator/Intimidate ontbreekt."),
    planTypeCheck(team, "Ground")
  ];
}

function stallChecks(team, ctx) {
  const recovery = team.filter((pokemon) => hasReliableRecovery(pokemon, ctx));
  const chip = team.filter((pokemon) => hasStatusOrChip(pokemon, ctx));
  const answers = team.filter((pokemon) => bulk(pokemon) >= 305 || hasAbility(pokemon, "Unaware") || hasAbility(pokemon, "Regenerator"));
  return [
    check("Recovery-kern", recovery.length >= 2, ratioScore(recovery.length, 2), recovery.length ? `${names(recovery)} heeft recovery.` : "Recovery ontbreekt."),
    check("Status/chip", chip.length >= 2, ratioScore(chip.length, 2), chip.length ? `${names(chip)} forceert chip.` : "Status/hazards ontbreken."),
    check("Defensieve antwoorden", answers.length >= 3, ratioScore(answers.length, 3), answers.length ? `${names(answers)} geeft marge.` : "Defensieve kern mist diepte.")
  ];
}

function antiMetaChecks(team, ctx) {
  const threats = threatStatusesForTeam(team, ctx);
  const high = threats.filter((threat) => threat.priority === "high");
  const covered = high.filter((threat) => threat.ok);
  return [
    check("High-priority threats", high.length ? covered.length >= Math.ceil(high.length * 0.65) : true, high.length ? ratioScore(covered.length, Math.ceil(high.length * 0.65)) : 100, high.length ? `${covered.length}/${high.length} high threats` : "Geen high-threat data.")
  ];
}

function planTypeCheck(team, type) {
  const answers = team.filter((pokemon) => isPlanTypeAnswer(pokemon, type));
  return check(`${type}-antwoord`, answers.length > 0, answers.length ? 100 : 35, answers.length ? `${names(answers)} vangt ${type} op.` : `${type}-antwoord ontbreekt.`);
}

function threatStatusesForTeam(team, ctx) {
  const existing = new Set(ctx.pokemon.map((pokemon) => pokemon.name));
  return (ctx.championsMeta.threats ?? [])
    .filter((threat) => existing.has(threat.name))
    .filter((threat) => !threat.formats || threat.formats.includes(ctx.battleFormat))
    .map((threat) => threatAnswerStatus(threat, team, ctx))
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name))
    .slice(0, 8);
}

function threatAnswerStatus(threat, team, ctx) {
  const answers = threat.answers ?? [];
  const attackTypes = threat.attackTypes ?? [];
  const weight = (threat.priority === "high" ? 3 : 1) + (threat.tags ?? []).filter((tag) => String(tag).toLowerCase().includes(String(ctx.style.label).toLowerCase())).length;
  const direct = team.find((pokemon) => isReliableAnswer(pokemon, ctx) && answers.some((type) => (pokemon.types ?? []).includes(type)));
  if (direct) {
    return {
      ...threat,
      ok: true,
      score: 100,
      weight,
      answer: `${direct.name} heeft ${direct.types.filter((type) => answers.includes(type)).join("/")}`,
      note: `${direct.name} is een hard type-antwoord.`
    };
  }

  const defensive = team.find((pokemon) => isReliableAnswer(pokemon, ctx) && attackTypes.some((type) => defensiveMultiplier(pokemon.types ?? [], type) < 1));
  if (defensive) {
    const resisted = attackTypes.filter((type) => defensiveMultiplier(defensive.types ?? [], type) < 1);
    return {
      ...threat,
      ok: true,
      score: 82,
      weight,
      answer: `${defensive.name} resist ${resisted.join("/")}`,
      note: `${defensive.name} kan belangrijke STAB opvangen.`
    };
  }

  const speed = team.find((pokemon) => isReliableAnswer(pokemon, ctx) && (pokemon.spe ?? 0) >= 110);
  if (speed && (threat.tags ?? []).some((tag) => /speed|setup|sweeper/i.test(tag))) {
    return {
      ...threat,
      ok: true,
      score: 72,
      weight,
      answer: `${speed.name} geeft snelheid`,
      note: `${speed.name} helpt als revenge-kill of tempo-slot.`
    };
  }

  const soft = team.find((pokemon) => answers.some((type) => (pokemon.types ?? []).includes(type)) || attackTypes.some((type) => defensiveMultiplier(pokemon.types ?? [], type) < 1));
  return {
    ...threat,
    ok: false,
    score: soft ? 45 : 15,
    weight,
    answer: soft ? `${soft.name} is een soft check` : "",
    note: soft ? `${soft.name} heeft nuttige typing maar mist betrouwbaarheid.` : threat.note
  };
}

function setQualitySummary(team, ctx) {
  if (!team.length) return { value: 0, label: "Geen data", note: "Nog geen teamleden", issues: [] };
  const scores = team.map((pokemon) => setQualityForBuild(buildFor(pokemon, ctx), pokemon, ctx));
  const value = Math.round(average(scores.map((item) => item.value), 0));
  const issues = scores.flatMap((item) => item.issues).slice(0, 4);
  return {
    value,
    label: value >= 78 ? "Hoog" : value >= 55 ? "Middel" : "Laag",
    note: issues.length ? issues.join(" · ") : `${scores.filter((item) => item.value >= 75).length}/${scores.length} sterke sets`,
    issues
  };
}

function setQualityForBuild(build = {}, pokemon = null, ctx = {}) {
  const qualityOverride = normalizedBuildQuality(build);
  let value = qualityOverride ?? 58;
  const issues = [];
  if (qualityOverride == null) {
    if (build.status === "smogon-champions") value = 96;
    else if (build.status === "smogon-sv") value = 82;
    else if (build.status === "custom") value = 76;
    else if (build.status === "generated") value = 45;
  }
  if (build.status === "generated") {
    if (pokemon) issues.push(`${pokemon.name}: generated set`);
  }
  if (build.championsCompatibility && !build.championsCompatibility.ok) {
      value -= 30;
    if (pokemon) issues.push(`${pokemon.name}: movecheck`);
  }
  if (Array.isArray(build.issues) && pokemon) {
    build.issues.slice(0, 2).forEach((issue) => issues.push(`${pokemon.name}: ${issue}`));
  }
  if ((build.moves ?? []).length < 4) {
    value -= 12;
    if (pokemon) issues.push(`${pokemon.name}: incomplete set`);
  }
  if (pokemon && ctx.hasMoveDetails) {
    const unknownMoves = buildMoves(pokemon, ctx).filter((move) => !moveDetailFor(ctx, move).type);
    if (unknownMoves.length) {
      value -= Math.min(18, unknownMoves.length * 6);
      issues.push(`${pokemon.name}: onbekende move-data`);
    }
  }
  return {
    value: clamp(value, 5, 100),
    label: value >= 78 ? "Hoog" : value >= 55 ? "Middel" : "Laag",
    issues
  };
}

function normalizedBuildQuality(build = {}) {
  if (Number.isFinite(build.quality)) return clamp(Number(build.quality), 5, 100);
  if (Number.isFinite(build.quality?.value)) return clamp(Number(build.quality.value), 5, 100);
  return null;
}

function redundancySummary(team, ctx, typeRows = cachedTypeSummary(team)) {
  if (!team.length) return { value: 100, label: "Geen data", note: "Nog geen teamleden", issues: [] };
  const issues = [];
  let penalty = 0;

  const roleCounts = team.reduce((counts, pokemon) => {
    const role = broadRole(roleLabel(pokemon, ctx));
    counts.set(role, (counts.get(role) ?? 0) + 1);
    return counts;
  }, new Map());
  roleCounts.forEach((count, role) => {
    if (role !== "flex" && count >= 4) {
      penalty += (count - 3) * 14;
      issues.push(`veel ${role}-slots`);
    }
  });

  const severeTypes = typeRows.filter((item) => item.weak >= 3 && item.resist + item.immune <= 1);
  if (severeTypes.length) {
    penalty += severeTypes.length * 14;
    issues.push(`${severeTypes.slice(0, 2).map((item) => item.type).join("/")} stapelt`);
  }

  const conflicts = weatherConflictMembers(team, ctx.teamStyle);
  if (conflicts.length) {
    penalty += conflicts.length * 24;
    issues.push(`${names(conflicts)} botst met weather`);
  }

  const attackingTypes = team.flatMap((pokemon) => moveTypeProfile(pokemon, ctx).damageTypes);
  const typeCounts = attackingTypes.reduce((counts, type) => counts.set(type, (counts.get(type) ?? 0) + 1), new Map());
  typeCounts.forEach((count, type) => {
    if (count >= 4) {
      penalty += (count - 3) * 8;
      issues.push(`veel ${type}-coverage`);
    }
  });

  const lowInfo = team.filter((pokemon) => {
    const build = buildFor(pokemon, ctx);
    return build.status === "generated" || (ctx.hasMoveDetails && moveTypeProfile(pokemon, ctx).unknown > 1);
  });
  if (lowInfo.length >= 2) {
    penalty += (lowInfo.length - 1) * 12;
    issues.push(`${lowInfo.length} lage-datavertrouwen sets`);
  }

  const value = clamp(100 - penalty, 0, 100);
  return {
    value,
    label: value >= 78 ? "Schoon" : value >= 55 ? "Let op" : "Risicovol",
    note: issues.length ? issues.slice(0, 3).join(" · ") : "Rollen, typings en coverage overlappen niet te zwaar",
    issues
  };
}

function broadRole(role = "") {
  if (/sweeper|wallbreaker|speed|attacker|breaker/i.test(role)) return "druk";
  if (/wall|pivot|support|tank|defensive/i.test(role)) return "defensief";
  if (/setup/i.test(role)) return "setup";
  return "flex";
}

function moveTypeProfile(pokemon, ctx) {
  const moves = buildMoves(pokemon, ctx);
  return moves.reduce((profile, move) => {
    const details = moveDetailFor(ctx, move);
    if (!details.type) {
      profile.unknown += 1;
      return profile;
    }
    if (details.category !== "Status") profile.damageTypes.push(details.type);
    else profile.utility += 1;
    return profile;
  }, { damageTypes: [], utility: 0, unknown: 0 });
}

function moveDetailFor(ctx, move) {
  if (typeof ctx.moveDetails !== "function") return {};
  return ctx.moveDetails(move) ?? {};
}

function evaluationRisks({ legal, redundancy, typeRiskRows, threatRows, styleChecks, setQuality }) {
  const risks = [];
  if (!legal.ok) risks.push(...legal.issues);
  redundancy.issues.slice(0, 3).forEach((issue) => risks.push(issue));
  typeRiskRows.slice(0, 2).forEach((row) => risks.push(`${row.type}-zwakte zonder genoeg antwoord`));
  threatRows.filter((threat) => !threat.ok).slice(0, 2).forEach((threat) => risks.push(`${threat.name} blijft open`));
  styleChecks.filter((check) => !check.done).slice(0, 2).forEach((check) => risks.push(`${check.label} ontbreekt`));
  setQuality.issues.slice(0, 2).forEach((issue) => risks.push(issue));
  return [...new Set(risks)].slice(0, 6);
}

function confidenceSummary({ legal, redundancy, typeRiskRows, threatRows, setQuality, format }) {
  const typeSafety = clamp(100 - typeRiskRows.length * 18, 0, 100);
  const threatSafety = threatRows.length ? weightedAverage(threatRows.map((threat) => ({ value: threat.score, weight: threat.weight ?? 1 })), 100) : 75;
  const value = Math.round(average([
    setQuality.value,
    redundancy.value,
    typeSafety,
    threatSafety,
    format.value,
    legal.ok ? 100 : 20
  ], 0));
  return {
    value: clamp(value, 0, 100),
    label: value >= 78 ? "Hoog" : value >= 55 ? "Middel" : "Laag"
  };
}

function suggestionConfidence(setConfidence, teamConfidence) {
  const value = Math.round(average([setConfidence.value, teamConfidence.value], setConfidence.value));
  return {
    ...setConfidence,
    value,
    label: value >= 78 ? "Hoog" : value >= 55 ? "Middel" : "Laag",
    teamValue: teamConfidence.value,
    setValue: setConfidence.value
  };
}

function formatSummary(team, ctx) {
  if (ctx.battleFormat === "double4") {
    const protect = team.filter((pokemon) => hasMove(pokemon, ctx, /protect/i)).length;
    const speed = team.filter((pokemon) => hasTeamSpeedControl(pokemon, ctx)).length;
    const utility = team.filter((pokemon) => isDoubleUtility(pokemon, ctx)).length;
    const damage = team.filter((pokemon) => Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 110).length;
    const value = average([ratioScore(protect, 2), ratioScore(speed, 1), ratioScore(utility, 2), ratioScore(damage, 2)], 0);
    return { value, note: `${protect} Protect · ${speed} speed-control · ${utility} utility` };
  }
  const wincons = team.filter((pokemon) => /sweeper|wallbreaker|speed/i.test(roleLabel(pokemon, ctx)) || Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 125).length;
  const speed = team.filter((pokemon) => (pokemon.spe ?? 0) >= 100 || hasPriority(pokemon, ctx)).length;
  const pivots = team.filter((pokemon) => bulk(pokemon) >= 280 || /wall|pivot/i.test(roleLabel(pokemon, ctx))).length;
  const value = average([ratioScore(wincons, 1), ratioScore(speed, 1), ratioScore(pivots, 1)], 0);
  return { value, note: `${wincons} wincon · ${speed} speed/prio · ${pivots} switch-in` };
}

function individualCandidateScore(pokemon, team, ctx, mode) {
  const build = buildFor(pokemon, ctx);
  let score = (pokemon.bst ?? 0) / 12 + Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) / 4 + (pokemon.spe ?? 0) / 5;
  score += setQualityForBuild(build, pokemon, ctx).value / 4;
  if (mode === "safe") score += bulk(pokemon) / 8;
  if (mode === "pressure") score += Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) / 2 + (pokemon.spe ?? 0) / 4;
  if (styleChecksForTeam([...team, pokemon], ctx).some((check) => check.done && !styleChecksForTeam(team, ctx).find((base) => base.label === check.label)?.done)) score += 28;
  const profile = moveTypeProfile(pokemon, ctx);
  if (profile.damageTypes.length >= 2 && new Set(profile.damageTypes).size >= 2) score += 12;
  if (profile.utility && /support|pivot|wall|bulky/i.test(roleLabel(pokemon, ctx))) score += 10;
  if (ctx.hasMoveDetails && profile.unknown) score -= profile.unknown * 8;
  return score;
}

function riskReductionScore(before, after) {
  const riskDelta = (before.risks?.length ?? 0) - (after.risks?.length ?? 0);
  const confidenceDelta = (after.confidence?.value ?? 0) - (before.confidence?.value ?? 0);
  const redundancyDelta = (after.diagnostics?.redundancy?.value ?? 0) - (before.diagnostics?.redundancy?.value ?? 0);
  return riskDelta * 9 + confidenceDelta * 0.28 + redundancyDelta * 0.18;
}

function candidateReasons(pokemon, team, before, after, ctx) {
  const reasons = [];
  const beforeRoles = new Map(before.diagnostics.roleChecks.map((check) => [check.label, check.done]));
  after.diagnostics.roleChecks.forEach((check) => {
    if (check.done && !beforeRoles.get(check.label)) reasons.push(check.label.toLowerCase());
  });

  const openTypes = before.diagnostics.typeSummary
    .filter((item) => item.weak >= 2 && item.resist + item.immune === 0)
    .map((item) => item.type)
    .filter((type) => defensiveMultiplier(pokemon.types ?? [], type) < 1);
  if (openTypes.length) reasons.push(`vangt ${openTypes.slice(0, 2).join("/")} op`);

  const beforeThreats = new Map(before.diagnostics.threats.map((threat) => [threat.name, threat.ok]));
  const coveredThreat = after.diagnostics.threats.find((threat) => threat.ok && !beforeThreats.get(threat.name));
  if (coveredThreat) reasons.push(`checkt ${coveredThreat.name}`);

  const beforeStyle = new Map(before.diagnostics.styleChecks.map((check) => [check.label, check.done]));
  const styleHit = after.diagnostics.styleChecks.find((check) => check.done && !beforeStyle.get(check.label));
  if (styleHit) reasons.push(styleHit.label.toLowerCase());

  const quality = setQualityForBuild(buildFor(pokemon, ctx), pokemon, ctx);
  if (quality.value >= 78) reasons.push(`${quality.label.toLowerCase()} setdata`);
  if (!reasons.length) reasons.push(roleLabel(pokemon, ctx).toLowerCase() || "algemene teamfit");
  return [...new Set(reasons)].slice(0, 3);
}

function evaluationReasons({ breakdown, roleChecks, threatRows, styleChecks, typeRiskRows, format, setQuality }) {
  const reasons = [];
  const weak = [...breakdown].sort((a, b) => a.value - b.value).slice(0, 2);
  weak.forEach((item) => {
    if (item.value < 75) reasons.push(`${item.label}: ${item.note}`);
  });
  const missingRole = roleChecks.find((check) => !check.done);
  if (missingRole) reasons.push(`open rol: ${missingRole.label}`);
  const missingStyle = styleChecks.find((check) => !check.done);
  if (missingStyle) reasons.push(`plancheck: ${missingStyle.label}`);
  const openThreat = threatRows.find((threat) => !threat.ok);
  if (openThreat) reasons.push(`threat open: ${openThreat.name}`);
  if (typeRiskRows.length) reasons.push(`type-risico: ${typeRiskRows.slice(0, 2).map((row) => row.type).join("/")}`);
  if (format.value >= 80) reasons.push(format.note);
  if (setQuality.value < 60) reasons.push(setQuality.note);
  return [...new Set(reasons)].slice(0, 4);
}

function isLegalCandidate(candidate, team, ctx) {
  return isLegalTeam([...team, candidate], ctx).ok;
}

function candidateBuildUsable(pokemon, ctx) {
  const build = buildFor(pokemon, ctx);
  return !build.championsCompatibility || build.championsCompatibility.ok;
}

function isLegalTeam(team, ctx) {
  return teamLegalityStatus(team, ctx);
}

function teamLegalityStatus(team, ctx) {
  const issues = [];
  if (team.length > ctx.maxTeamSize) issues.push(`Meer dan ${ctx.maxTeamSize} teamleden`);
  const bases = new Set();
  team.forEach((pokemon) => {
    const base = baseSpecies(pokemon.name);
    if (bases.has(base)) issues.push(`Dubbele basisspecies: ${base}`);
    bases.add(base);
  });
  const megaUsers = team.filter((pokemon) => pokemonUsesMegaSlot(pokemon, buildFor(pokemon, ctx)));
  if (megaUsers.length > 1) issues.push("Meer dan 1 Mega-slot");
  return { ok: issues.length === 0, issues };
}

function legalTeam(team, ctx) {
  const next = [];
  team.forEach((pokemon) => {
    if (pokemon?.name && isLegalCandidate(pokemon, next, ctx)) next.push(pokemon);
  });
  return next;
}

function uniqueBeams(beams) {
  const best = new Map();
  beams.forEach((beam) => {
    const key = teamSignature(beam.team);
    const current = best.get(key);
    if (!current || beam.evaluation.total > current.evaluation.total) best.set(key, beam);
  });
  return [...best.values()];
}

function sameBeamSet(a, b) {
  return a.map((beam) => teamSignature(beam.team)).join("|") === b.map((beam) => teamSignature(beam.team)).join("|");
}

function beamSortScore(beam, mode) {
  return beam.evaluation.total + beam.team.length * 4 + (mode === "pressure" ? offensiveAverage(beam.team) / 40 : 0) + (mode === "safe" ? average(beam.team.map(bulk), 0) / 65 : 0);
}

function variantSortScore(beam, mode) {
  return beam.evaluation.total + (beam.team.length >= 6 ? 8 : 0) + (mode === "pressure" ? offensiveAverage(beam.team) / 55 : 0) + (mode === "safe" ? average(beam.team.map(bulk), 0) / 90 : 0);
}

function offensiveAverage(team) {
  return average(team.map((pokemon) => Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0)), 0);
}

function selectionReason(combo, evaluation, ctx) {
  const format = ctx.format.label ?? DEFAULT_FORMAT.label;
  const top = evaluation.reasons[0] ?? evaluation.diagnostics.format.note;
  return `${format}: ${top}`;
}

function leadScore(combo, ctx) {
  return combo.some((pokemon) => hasMove(pokemon, ctx, /stealth rock|spikes|sticky web|tailwind|fake out|taunt/i)) ? 3 : 0;
}

function combinations(items, size, start = 0, prefix = [], out = []) {
  if (prefix.length === size) {
    out.push(prefix);
    return out;
  }
  for (let index = start; index < items.length; index += 1) {
    combinations(items, size, index + 1, [...prefix, items[index]], out);
  }
  return out;
}

function roleLabel(pokemon, ctx) {
  return ctx.roleFor(pokemon)?.label ?? "";
}

function fallbackRoleFor(pokemon) {
  const bestAttack = Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0);
  const memberBulk = bulk(pokemon);
  if ((pokemon.spe ?? 0) >= 105 && bestAttack >= 110) return { label: "Sweeper" };
  if (bestAttack >= 130) return { label: "Wallbreaker" };
  if (memberBulk >= 305) return { label: "Wall" };
  if ((pokemon.spe ?? 0) >= 100) return { label: "Speed control" };
  if (memberBulk >= 280) return { label: "Bulky pivot" };
  return { label: "Allrounder" };
}

function buildFor(pokemon, ctx) {
  return ctx.selectedBuild(pokemon) ?? {};
}

function buildText(build = {}) {
  return `${build.label ?? ""} ${build.role ?? ""} ${build.item ?? ""} ${build.ability ?? ""} ${build.nature ?? ""} ${(build.moves ?? []).join(" ")}`;
}

function buildMoves(pokemon, ctx) {
  return (buildFor(pokemon, ctx).moves ?? []).flatMap((move) => String(move).split("/").map((part) => part.trim()).filter(Boolean));
}

function hasMove(pokemon, ctx, pattern) {
  return buildMoves(pokemon, ctx).some((move) => pattern.test(move));
}

function hasAbility(pokemon, ability) {
  return (pokemon.abilities ?? []).some((item) => String(item).toLowerCase() === String(ability).toLowerCase());
}

function hasAnyAbility(pokemon, abilities) {
  return abilities.some((ability) => hasAbility(pokemon, ability));
}

function isRainAbuser(pokemon, ctx) {
  return hasAbility(pokemon, "Swift Swim") || ((pokemon.types ?? []).includes("Water") && ((pokemon.spe ?? 0) >= 95 || hasMove(pokemon, ctx, /rain dance|weather ball/i)));
}

function isRainWaterPressure(pokemon, ctx) {
  return (pokemon.types ?? []).includes("Water") && Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 105 && buildMoves(pokemon, ctx).some((move) => /hydro|surf|scald|water|liquidation|wave|pump/i.test(move));
}

function isChlorophyllAbuser(pokemon, ctx) {
  return hasAbility(pokemon, "Chlorophyll") || ((pokemon.types ?? []).includes("Grass") && hasMove(pokemon, ctx, /growth|solar beam|weather ball/i));
}

function isSunFirePressure(pokemon, ctx) {
  return ((pokemon.types ?? []).includes("Fire") || buildMoves(pokemon, ctx).some((move) => /fire|flame|flare|heat|overheat/i.test(move))) && Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 100;
}

function isSandAbuser(pokemon, ctx) {
  return hasAnyAbility(pokemon, ["Sand Rush", "Sand Force", "Sand Veil"]) || (["Rock", "Ground", "Steel"].some((type) => (pokemon.types ?? []).includes(type)) && (pokemon.spe ?? 0) >= 95);
}

function isSandBreaker(pokemon, ctx) {
  return ["Rock", "Ground", "Steel"].some((type) => (pokemon.types ?? []).includes(type) || buildMoves(pokemon, ctx).some((move) => move.toLowerCase().includes(type.toLowerCase()))) && Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 115;
}

function isSnowAbuser(pokemon, ctx) {
  return hasAnyAbility(pokemon, ["Slush Rush", "Ice Body", "Snow Cloak"]) || ((pokemon.types ?? []).includes("Ice") && ((pokemon.spe ?? 0) >= 95 || bulk(pokemon) >= 295));
}

function isSnowIcePressure(pokemon, ctx) {
  return ((pokemon.types ?? []).includes("Ice") || buildMoves(pokemon, ctx).some((move) => /ice|blizzard|freeze|frost|icicle/i.test(move))) && Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 100;
}

function isTrickRoomSetter(pokemon, ctx) {
  return hasMove(pokemon, ctx, /trick room/i);
}

function isTrickRoomAbuser(pokemon, ctx) {
  return (pokemon.spe ?? 0) <= 65 && (Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 105 || bulk(pokemon) >= 280);
}

function hasTeamSpeedControl(pokemon, ctx) {
  return hasMove(pokemon, ctx, /tailwind|icy wind|thunder wave|trick room|electroweb|nuzzle|string shot/i) || hasAbility(pokemon, "Prankster") || (pokemon.spe ?? 0) >= 110;
}

function isDoubleUtility(pokemon, ctx) {
  return hasAnyAbility(pokemon, ["Intimidate", "Prankster", "Friend Guard"]) || hasMove(pokemon, ctx, /fake out|follow me|rage powder|helping hand|wide guard|quick guard|parting shot|will-o-wisp|taunt/i);
}

function hasPivotMove(pokemon, ctx) {
  return hasMove(pokemon, ctx, /u-turn|volt switch|flip turn|parting shot|baton pass/i);
}

function isSetupPressure(pokemon, ctx) {
  return hasMove(pokemon, ctx, /swords dance|dragon dance|nasty plot|quiver dance|shell smash|calm mind|bulk up/i) || (/sweeper|wallbreaker/i.test(roleLabel(pokemon, ctx)) && Math.max(pokemon.atk ?? 0, pokemon.spa ?? 0) >= 120);
}

function hasEntryPressure(pokemon, ctx) {
  return hasMove(pokemon, ctx, /stealth rock|spikes|sticky web|reflect|light screen|taunt/i);
}

function hasReliableRecovery(pokemon, ctx) {
  return hasMove(pokemon, ctx, /recover|roost|slack off|synthesis|wish|moonlight|shore up|soft-boiled/i);
}

function hasStatusOrChip(pokemon, ctx) {
  return hasMove(pokemon, ctx, /toxic|will-o-wisp|thunder wave|stealth rock|spikes|leech seed|knock off|salt cure/i);
}

function hasPriority(pokemon, ctx) {
  return hasMove(pokemon, ctx, /quick attack|extreme speed|aqua jet|bullet punch|ice shard|shadow sneak|sucker punch|mach punch|vacuum wave/i);
}

function isPlanTypeAnswer(pokemon, type) {
  return defensiveMultiplier(pokemon.types ?? [], type) < 1;
}

function weatherConflictMembers(team, style) {
  const conflictAbilities = {
    rain: ["Drought", "Sand Stream", "Snow Warning"],
    sun: ["Drizzle", "Sand Stream", "Snow Warning"],
    sand: ["Drizzle", "Drought", "Snow Warning"],
    snow: ["Drizzle", "Drought", "Sand Stream"]
  }[style] ?? [];
  return team.filter((pokemon) => conflictAbilities.some((ability) => hasAbility(pokemon, ability)));
}

function isReliableAnswer(pokemon, ctx) {
  const build = buildFor(pokemon, ctx);
  if (build.status === "generated") return false;
  if (build.championsCompatibility && !build.championsCompatibility.ok) return false;
  return (pokemon.bst ?? 0) >= 480 || pokemonUsesMegaSlot(pokemon, build);
}

function check(label, done, score, note) {
  return {
    label,
    done: Boolean(done),
    ok: Boolean(done),
    score: clamp(Math.round(score), 0, 100),
    note
  };
}

function ratioScore(value, target) {
  if (!target) return 100;
  return clamp(value / target * 100, 0, 100);
}

function names(items) {
  return items.slice(0, 3).map((pokemon) => pokemon.name).join(", ");
}

function teamSignature(team) {
  return team.map((pokemon) => pokemon.name).sort().join("|");
}

function bulk(pokemon) {
  return (pokemon.hp ?? 0) + (pokemon.def ?? 0) + (pokemon.spd ?? 0);
}

function average(values, fallback = 0) {
  const safe = values.filter((value) => Number.isFinite(value));
  return safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : fallback;
}

function weightedAverage(items, fallback = 0) {
  const safe = items.filter((item) => Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0);
  const totalWeight = safe.reduce((sum, item) => sum + item.weight, 0);
  return totalWeight ? safe.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
