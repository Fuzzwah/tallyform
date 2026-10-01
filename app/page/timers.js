import { validCanonical } from './measurements.js';

// Wall time detects jumps; boot-scoped monotonic time measures elapsed intervals.
// A native adapter must establish that its monotonic clock and boot ID are reliable.
const MAX_CLOCK_SKEW_MS = 5000;

const idleStopwatch = () => ({ status: 'idle', elapsedMs: 0, anchor: null, uncertain: false });
const idleCountdown = () => ({ status: 'idle', durationMs: null, remainingMs: null,
  anchor: null, token: null, uncertain: false });

export function newTimers() {
  return { stopwatch: idleStopwatch(), countdown: idleCountdown() };
}

function validateClock(clock) {
  if (!clock || !Number.isSafeInteger(clock.wallMs) || clock.wallMs < 0
    || !Number.isSafeInteger(clock.monoMs) || clock.monoMs < 0
    || typeof clock.bootId !== 'string' || !clock.bootId) throw new Error('Invalid clock sample');
  return clock;
}

function snapshotClock(clock) {
  const sample = validateClock(clock);
  return { wallMs: sample.wallMs, monoMs: sample.monoMs, bootId: sample.bootId };
}

function elapsedSince(anchor, clock) {
  const now = validateClock(clock);
  if (now.bootId !== anchor.bootId) return null;
  const mono = now.monoMs - anchor.monoMs;
  const wall = now.wallMs - anchor.wallMs;
  return mono < 0 || wall < 0 || Math.abs(mono - wall) > MAX_CLOCK_SKEW_MS ? null : mono;
}

export function stopwatchReading(state, clock) {
  if (state.status !== 'running') {
    return { status: state.status, elapsedMs: state.elapsedMs, uncertain: state.uncertain };
  }
  const delta = elapsedSince(state.anchor, clock);
  if (delta === null || !Number.isSafeInteger(state.elapsedMs + delta)) {
    return { status: 'uncertain', elapsedMs: state.elapsedMs, uncertain: true };
  }
  return { status: 'running', elapsedMs: state.elapsedMs + delta, uncertain: state.uncertain };
}

export function stopwatchTransition(state, action, clock) {
  switch (action) {
    case 'start':
      if (state.status !== 'idle') throw new Error('Stopwatch already started');
      return { ...state, status: 'running', anchor: snapshotClock(clock) };
    case 'restart':
      return { ...idleStopwatch(), status: 'running', anchor: snapshotClock(clock) };
    case 'resume':
      if (state.status !== 'paused' && state.status !== 'uncertain') {
        throw new Error('Stopwatch cannot resume');
      }
      return { ...state, status: 'running', anchor: snapshotClock(clock) };
    case 'pause':
    case 'finish': {
      if (state.status === 'finished') throw new Error('Stopwatch already finished');
      if (action === 'pause' && state.status === 'idle') throw new Error('Stopwatch not started');
      if (action === 'pause' && state.status === 'paused') return state;
      const reading = stopwatchReading(state, clock);
      if (reading.status === 'uncertain') return state.status === 'uncertain' ? state
        : { ...state, status: 'uncertain', anchor: null, uncertain: true };
      return { ...state, status: action === 'finish' ? 'finished' : 'paused',
        elapsedMs: reading.elapsedMs, anchor: null };
    }
    default: throw new Error('Unknown stopwatch action');
  }
}

export function countdownReading(state, clock) {
  if (state.status !== 'running') return { status: state.status,
    remainingMs: state.remainingMs, uncertain: state.uncertain };
  const delta = elapsedSince(state.anchor, clock);
  if (delta === null) return { status: 'uncertain',
    remainingMs: state.remainingMs, uncertain: true };
  const remaining = Math.max(0, state.remainingMs - delta);
  return { status: remaining === 0 ? 'expired' : 'running',
    remainingMs: remaining, uncertain: state.uncertain };
}

function beginCountdown(state, durationMs, token, clock) {
  if (!validCanonical('duration', durationMs)) throw new Error('Invalid countdown duration');
  if (typeof token !== 'string' || !token || token === state.token) {
    throw new Error('Fresh countdown token required');
  }
  return { status: 'running', durationMs, remainingMs: durationMs,
    anchor: snapshotClock(clock), token, uncertain: false };
}

export function countdownTransition(state, action, clock) {
  switch (action && action.type) {
    case 'start':
      if (state.status !== 'idle' && state.status !== 'expired') {
        throw new Error('Explicit restart required');
      }
      return beginCountdown(state, action.durationMs, action.token, clock);
    case 'restart':
      return beginCountdown(state, action.durationMs, action.token, clock);
    case 'pause': {
      if (state.status !== 'running') throw new Error('Countdown not running');
      const reading = countdownReading(state, clock);
      return { ...state, status: reading.status === 'running' ? 'paused' : reading.status,
        remainingMs: reading.remainingMs, anchor: null,
        uncertain: reading.uncertain };
    }
    case 'resume':
      if (state.status !== 'paused' && state.status !== 'uncertain') {
        throw new Error('Countdown cannot resume');
      }
      if (typeof action.token !== 'string' || !action.token || action.token === state.token) {
        throw new Error('Fresh countdown token required');
      }
      return { ...state, status: 'running', token: action.token, anchor: snapshotClock(clock) };
    case 'cancel':
      return state.status === 'idle' ? state : { ...idleCountdown(), token: state.token };
    case 'dismiss':
      if (state.status !== 'expired') throw new Error('Countdown not expired');
      return { ...idleCountdown(), token: state.token };
    default: throw new Error('Unknown countdown action');
  }
}

export function recoverTimers(timers, clock) {
  let stopwatch = timers.stopwatch;
  let countdown = timers.countdown;
  if (stopwatch.status === 'running') {
    const reading = stopwatchReading(stopwatch, clock);
    if (reading.status === 'uncertain') stopwatch = { ...stopwatch,
      status: 'uncertain', anchor: null, uncertain: true };
  }
  if (countdown.status === 'running') {
    const reading = countdownReading(countdown, clock);
    if (reading.status !== 'running') countdown = { ...countdown,
      status: reading.status, remainingMs: reading.remainingMs,
      anchor: null, uncertain: reading.uncertain };
  }
  return stopwatch === timers.stopwatch && countdown === timers.countdown
    ? timers : { stopwatch, countdown };
}
