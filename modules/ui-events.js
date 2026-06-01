export function bindEvents(ctx) {
  ctx.searchInput.addEventListener("input", ctx.render);
  ctx.sortSelect.addEventListener("change", () => {
    ctx.state.hasExplored = !ctx.state.guideMode;
    ctx.render();
  });
  ctx.sourceSelect.addEventListener("change", () => {
    ctx.state.hasExplored = !ctx.state.guideMode;
    ctx.state.startSuggestionPage = 0;
    ctx.render();
  });
  ctx.teamStyleSelect.addEventListener("change", () => {
    ctx.state.teamStyle = ctx.teamStyleSelect.value;
    ctx.state.startSuggestionPage = 0;
    ctx.invalidateCache();
    ctx.render();
  });
  ctx.roleFilterSelect.addEventListener("change", () => {
    ctx.state.roleFilter = ctx.roleFilterSelect.value;
    ctx.state.hasExplored = true;
    ctx.render();
  });
  ctx.battleFormatSelect.addEventListener("change", () => {
    ctx.state.battleFormat = ctx.battleFormatSelect.value;
    ctx.state.startSuggestionPage = 0;
    ctx.syncBattleSelection();
    ctx.state.teamNotice = "";
    ctx.invalidateCache();
    ctx.render();
  });
  ctx.builderTab.addEventListener("click", () => ctx.switchView("builder"));
  ctx.teamTab.addEventListener("click", () => ctx.switchView("team"));
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
  ctx.clearTeam.addEventListener("click", () => {
    ctx.state.team = [];
    ctx.state.teamNotice = "";
    ctx.invalidateCache();
    ctx.render();
  });
}
