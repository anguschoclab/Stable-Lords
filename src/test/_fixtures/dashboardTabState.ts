/**
 * Shared dashboard-tab mock state — the Brutus/Cassius roster, Wolf Pack
 * rival, and Dragon's Hearth player pinned by the dashboard/gazette specs.
 */
export function dashboardTabState() {
  return {
    roster: [
      { id: 'w1', name: 'Brutus' },
      { id: 'w2', name: 'Cassius' },
    ],
    graveyard: [],
    retired: [],
    rivals: [{ owner: { stableName: 'Wolf Pack' }, roster: [] }],
    player: { stableName: "Dragon's Hearth" },
  };
}
