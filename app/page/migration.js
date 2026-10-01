import { LEGACY_STORAGE_KEY, validateLegacySession, createPracticeSession,
  validatePracticeSession } from './session.js';

export const LEGACY_SESSION_ID = 'legacy-putting-session-v1';

export function convertLegacy(raw) {
  const legacy = validateLegacySession(JSON.parse(raw));
  const session = createPracticeSession({
    id: LEGACY_SESSION_ID, mode: 'outcome', type: 'distance',
  });
  return validatePracticeSession({
    ...session,
    measurement: {
      type: 'distance', unit: legacy.unit,
      selected: Math.round(legacy.distanceM * 1000000),
      step: legacy.unit === 'ft' ? 304800 : 1000000,
    },
    events: legacy.attempts.map((attempt) => ({
      kind: attempt.made ? 'success' : 'failure',
      value: Math.round(attempt.distanceM * 1000000),
    })),
    keys: legacy.keys === null ? null : { silver: legacy.keys.silver, red: legacy.keys.red },
    startedAt: null,
    stopwatchElapsedMs: null,
  });
}

export function migrateLegacy(repo, storage) {
  const active = repo.loadActive();
  if (active.issue || active.committed || active.value !== null && active.value !== undefined) return active;
  const raw = storage.getItem(LEGACY_STORAGE_KEY);
  if (raw === null || raw === undefined) return active;
  repo.saveActive(convertLegacy(raw));
  return repo.loadActive();
}
