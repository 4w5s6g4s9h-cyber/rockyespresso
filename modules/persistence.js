const ALLOWED_OPPONENT_MODES = new Set(["manual", "counter", "bulky", "offense", "random", "mirror"]);

export function restoreBattleOpponentState(saved = {}, pokemon = []) {
  const byName = new Map(pokemon.map((entry) => [entry.name, entry]));
  const opponentTeam = [...new Set(saved.opponentTeam ?? [])]
    .map((name) => byName.get(name))
    .filter(Boolean)
    .slice(0, 6);
  const teamNames = new Set(opponentTeam.map((entry) => entry.name));
  const opponentSelection = [...new Set(saved.opponentSelection ?? [])]
    .filter((name) => teamNames.has(name))
    .slice(0, 4);

  return {
    opponentTeam,
    opponentSelection,
    opponentMode: ALLOWED_OPPONENT_MODES.has(saved.opponentMode) ? saved.opponentMode : "manual"
  };
}
