const AUTO_OPEN_PATHS = ['/', '/stable/arena', '/stable/planner'];
const AUTO_CLOSE_PATHS = ['/stable', '/world', '/stable/roster', '/stable/training'];

/**
 * Resolve event-feed visibility after a route change.
 * Desktop keeps the user's rail state on neutral routes; compact shells use a
 * modal sheet, so navigation closes it except on explicitly contextual routes.
 */
export function resolveEventLogRouteState(
  pathname: string,
  isCompactShell: boolean,
  currentlyOpen: boolean
): boolean {
  if (isCompactShell) return false;
  if (AUTO_OPEN_PATHS.includes(pathname)) return true;
  if (AUTO_CLOSE_PATHS.some((path) => pathname.startsWith(path))) return false;
  return currentlyOpen;
}
