/**
 * Display-name helper — renders `name` + earned `epithet`.
 * The canonical `Warrior.name` stays immutable; this is for UI only.
 */
export function warriorDisplayName(w: { name: string; epithet?: string }): string {
  const epithet = w.epithet?.trim();
  return epithet ? `${w.name} ${epithet}` : w.name;
}
