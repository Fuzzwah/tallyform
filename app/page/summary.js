import { validatePracticeSession } from './session.js';

const validTime = (value) => value === null
  || Number.isSafeInteger(value) && value >= 0;

function totals(mode, count, success) {
  if (mode === 'simple') return { count };
  return { count, success, failure: count - success,
    percent: count ? Math.round(100 * success / count) : null };
}

export function createPracticeSummary(session, finishedAt = null) {
  validatePracticeSession(session);
  if (session.status !== 'finished' || !validTime(finishedAt)) {
    throw new Error('Finished session and valid completion time required');
  }
  const groups = new Map();
  let success = 0;
  for (const event of session.events) {
    let group = groups.get(event.value);
    if (!group) {
      group = { value: event.value, count: 0, success: 0 };
      groups.set(event.value, group);
    }
    group.count++;
    if (event.kind === 'success') {
      group.success++;
      success++;
    }
  }
  return {
    version: 1,
    id: session.id,
    mode: session.mode,
    type: session.measurement.type,
    unit: session.measurement.unit,
    selected: session.measurement.selected,
    totals: totals(session.mode, session.events.length, success),
    groups: Array.from(groups.values(), ({ value, count, success: made }) =>
      ({ value, totals: totals(session.mode, count, made) })),
    elapsedMs: session.stopwatchElapsedMs,
    finishedAt,
  };
}
