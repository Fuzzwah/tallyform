import { UNITS, defaultMeasurement, validCanonical, validStep,
  toCanonical, toCanonicalStep, adjustCanonical } from './measurements.js';

const MIN_DISTANCE_M = 0.3048;
const MAX_DISTANCE_M = 30.48;
export const MAX_ATTEMPTS = 1000;
export const LEGACY_STORAGE_KEY = 'putting-session-v1';
const round = (value) => Math.round(value * 10000) / 10000;
const validDistance = (value) => Number.isFinite(value)
  && value >= MIN_DISTANCE_M && value <= MAX_DISTANCE_M && value === round(value);
const validKey = (key) => Number.isInteger(key) && key >= 0;

// Read-only decoder for the inherited single-session snapshot.
export function validateLegacySession(state) {
  if (!state || state.version !== 1 || !['m', 'ft'].includes(state.unit)
    || !validDistance(state.distanceM) || !Array.isArray(state.attempts)
    || state.attempts.length > MAX_ATTEMPTS
    || !state.attempts.every((a) => a && validDistance(a.distanceM) && typeof a.made === 'boolean')
    || !(state.keys === null || (state.keys && validKey(state.keys.silver)
      && validKey(state.keys.red) && state.keys.silver !== state.keys.red))) {
    throw new Error('Legacy session invalid; original data preserved');
  }
  return state;
}


// Pure v2 domain; legacy decoding above exists solely for one-time import.
export function createPracticeSession({ id, mode, type }) {
  if (typeof id !== 'string' || !id.trim() || !['simple', 'outcome'].includes(mode)) {
    throw new Error('Session identity and mode required');
  }
  return { version: 2, id, mode, measurement: defaultMeasurement(type),
    events: [], status: 'active', keys: null, startedAt: null, stopwatchElapsedMs: null };
}

export function validatePracticeSession(state) {
  const m = state && state.measurement;
  if (!state || state.version !== 2 || typeof state.id !== 'string' || !state.id.trim()
    || !['simple', 'outcome'].includes(state.mode)
    || (state.status !== 'active' && state.status !== 'finished')
    || !m || !Object.prototype.hasOwnProperty.call(UNITS, m.type)
    || !Array.isArray(state.events) || state.events.length > MAX_ATTEMPTS
    || !(state.keys === null || (state.keys && validKey(state.keys.silver)
      && validKey(state.keys.red) && state.keys.silver !== state.keys.red))
    || !(state.startedAt === null || Number.isSafeInteger(state.startedAt) && state.startedAt >= 0)
    || !(state.stopwatchElapsedMs === null
      || Number.isSafeInteger(state.stopwatchElapsedMs) && state.stopwatchElapsedMs >= 0)) {
    throw new Error('Practice session invalid');
  }
  if (m.type === 'none' ? m.unit !== null || m.selected !== null || m.step !== null
    : !UNITS[m.type].includes(m.unit) || !validCanonical(m.type, m.selected)
      || !validStep(m.type, m.step)) throw new Error('Measurement configuration invalid');
  for (const event of state.events) {
    if (!event || (state.mode === 'simple' ? event.kind !== 'rep'
      : event.kind !== 'success' && event.kind !== 'failure')
      || !validCanonical(m.type, event.value)) throw new Error('Practice event invalid');
  }
  return state;
}

export function practiceTransition(state, action) {
  if (!state || state.version !== 2 || state.status !== 'active') {
    throw new Error('Practice session not active');
  }
  const m = state.measurement;
  switch (action && action.type) {
    case 'finish':
      return { ...state, status: 'finished' };
    case 'keys':
      return validatePracticeSession({ ...state, keys: action.keys });
    case 'record':
      if (state.events.length >= MAX_ATTEMPTS) throw new Error('Session full; recording rejected');
      if (state.mode === 'simple' ? action.kind !== 'rep'
        : action.kind !== 'success' && action.kind !== 'failure') {
        throw new Error('Recording kind incompatible with session mode');
      }
      return { ...state, events: state.events.concat({ kind: action.kind, value: m.selected }) };
    case 'undo':
      return state.events.length ? { ...state, events: state.events.slice(0, -1) } : state;
    case 'unit':
      if (!UNITS[m.type].includes(action.unit)) throw new Error('Incompatible measurement unit');
      return action.unit === m.unit ? state
        : { ...state, measurement: { ...m, unit: action.unit } };
    case 'select': {
      const selected = toCanonical(m.type, m.unit, action.value);
      return selected === m.selected ? state
        : { ...state, measurement: { ...m, selected } };
    }
    case 'setStep': {
      const step = toCanonicalStep(m.type, m.unit, action.value);
      return step === m.step ? state
        : { ...state, measurement: { ...m, step } };
    }
    case 'step':
      return { ...state, measurement: { ...m,
        selected: adjustCanonical(m.type, m.selected, m.step, action.direction) } };
    default:
      throw new Error('Unknown or fixed session action');
  }
}

export function practiceTotals(state, selected) {
  if (!state || state.version !== 2) throw new Error('Practice session invalid');
  const { type } = state.measurement;
  if (selected !== undefined && !validCanonical(type, selected)) {
    throw new Error('Selected measurement invalid');
  }
  let count = 0;
  let success = 0;
  for (const event of state.events) {
    if (selected !== undefined && event.value !== selected) continue;
    count++;
    if (event.kind === 'success') success++;
  }
  if (state.mode === 'simple') return { count };
  return { count, success, failure: count - success,
    percent: count ? Math.round(100 * success / count) : null };
}
