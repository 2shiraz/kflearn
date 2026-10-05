import { getOsceStation, listOsceAttempts, listOsceStations } from "./api";
import { createResource, createResourceFamily } from "./resource";

// OSCE data shared across pages, so moving between the dashboard, the station
// bank, a specialty and a station doesn't fetch the same list again.
const MINUTE = 60 * 1000;

// The station list (titles, specialties, practice modes; no station content).
export const stationList = createResource(() => listOsceStations(), { maxAgeMs: 5 * MINUTE });

// One station's page, by slug. Opened from a list, it's often already loaded
// because the card was hovered or focused first.
export const stationDetails = createResourceFamily((slug) => getOsceStation(slug), { maxAgeMs: 5 * MINUTE });
export const prefetchStation = (slug) => slug && stationDetails.member(slug).prefetch();

// The student's marked attempts. Cleared whenever an attempt is marked or
// discarded, so history and progress are always up to date.
export const attemptList = createResource(() => listOsceAttempts(), { maxAgeMs: MINUTE });

export function attemptsChanged() {
  attemptList.clear();
}

// Station content changed (an admin edit in this tab).
export function stationsChanged() {
  stationList.clear();
  stationDetails.clear();
}

export function clearOsceCache() {
  stationsChanged();
  attemptList.clear();
}
