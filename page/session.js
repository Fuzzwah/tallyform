export const MIN_DISTANCE_M = 0.3048;
export const MAX_DISTANCE_M = 30.48;
export const MAX_ATTEMPTS = 1000;
export const STORAGE_KEY = 'putting-session-v1';
const round = (value) => Math.round(value * 10000) / 10000;
const validDistance = (value) => Number.isFinite(value)
  && value >= MIN_DISTANCE_M && value <= MAX_DISTANCE_M && value === round(value);
const validKey = (key) => Number.isInteger(key) && key >= 0;

export const newSession = () => ({
  version: 1, unit: 'm', distanceM: 5, keys: null, attempts: [],
});

export function validateSession(state) {
  if (!state || state.version !== 1 || !['m', 'ft'].includes(state.unit)
    || !validDistance(state.distanceM) || !Array.isArray(state.attempts)
    || state.attempts.length > MAX_ATTEMPTS
    || !state.attempts.every((a) => a && validDistance(a.distanceM) && typeof a.made === 'boolean')
    || !(state.keys === null || (state.keys && validKey(state.keys.silver)
      && validKey(state.keys.red) && state.keys.silver !== state.keys.red))) {
    throw new Error('Saved session invalid. Reset to start.');
  }
  return state;
}

export function transition(state, action) {
  switch (action.type) {
    case 'step':
      if (action.direction !== 1 && action.direction !== -1) throw new Error('Invalid step');
      return { ...state, distanceM: round(Math.max(MIN_DISTANCE_M, Math.min(MAX_DISTANCE_M,
        state.distanceM + action.direction * (state.unit === 'ft' ? 0.3048 : 1)))) };
    case 'unit': return { ...state, unit: state.unit === 'm' ? 'ft' : 'm' };
    case 'record':
      if (state.attempts.length >= MAX_ATTEMPTS) throw new Error('1000 putts reached. Reset to start.');
      if (typeof action.made !== 'boolean') throw new Error('Invalid outcome');
      return { ...state, attempts: state.attempts.concat({ distanceM: state.distanceM, made: action.made }) };
    case 'undo': return { ...state, attempts: state.attempts.slice(0, -1) };
    case 'reset': return { ...state, attempts: [] };
    case 'keys': return validateSession({ ...state, keys: action.keys });
    default: throw new Error('Unknown action');
  }
}

export function totals(state, distanceM) {
  const attempts = distanceM === undefined ? state.attempts
    : state.attempts.filter((a) => a.distanceM === distanceM);
  const made = attempts.filter((a) => a.made).length;
  return { made, missed: attempts.length - made, count: attempts.length,
    percent: attempts.length ? Math.round(100 * made / attempts.length) : null };
}

export function distanceLabel(state) {
  const value = state.unit === 'ft' ? state.distanceM / 0.3048 : state.distanceM;
  return `${Number(value.toFixed(2))} ${state.unit}`;
}

export function loadSession(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === undefined || raw === null ? newSession() : validateSession(JSON.parse(raw));
}

export function saveSession(storage, state) {
  const raw = JSON.stringify(validateSession(state));
  storage.setItem(STORAGE_KEY, raw);
  if (storage.getItem(STORAGE_KEY) !== raw) throw new Error('Save verification failed');
  return state;
}
