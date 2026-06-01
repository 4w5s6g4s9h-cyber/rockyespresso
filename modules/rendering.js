export function renderApp(ctx) {
  ctx.renderViewTabs();
  ctx.renderGuideModeToggle();
  const list = ctx.getFilteredPokemon();
  const isStart = ctx.state.guideMode && !ctx.state.hasExplored && !ctx.normalize(ctx.searchInput.value);
  ctx.metaRow.classList.toggle("hidden", isStart);
  ctx.resultCount.textContent = isStart ? "Start" : list.length.toLocaleString("nl-NL");
  ctx.resultLabel.textContent = isStart ? "team-builder" : "resultaten";
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
}

export function renderWithoutScrollJump(update) {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  update();

  const restore = () => window.scrollTo(scrollX, scrollY);
  restore();
  window.requestAnimationFrame(restore);
  window.requestAnimationFrame(() => window.requestAnimationFrame(restore));
  window.setTimeout(restore, 0);
}
