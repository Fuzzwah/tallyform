import test from 'node:test';
import assert from 'node:assert/strict';
import { newTimers, stopwatchReading, stopwatchTransition, countdownReading,
  countdownTransition, recoverTimers } from '../app/page/timers.js';
import { createPracticeSession, practiceTransition } from '../app/page/session.js';

const clock = (wallMs, monoMs = wallMs, bootId = 'boot-a') => ({ wallMs, monoMs, bootId });

test('stopwatch excludes pauses and freezes elapsed time on finish', () => {
  let state = stopwatchTransition(newTimers().stopwatch, 'start', clock(100000));
  assert.equal(stopwatchReading(state, clock(120000)).elapsedMs, 20000);
  state = stopwatchTransition(state, 'pause', clock(120000));
  assert.equal(stopwatchReading(state, clock(130000)).elapsedMs, 20000);
  state = stopwatchTransition(state, 'resume', clock(130000));
  state = stopwatchTransition(state, 'finish', clock(135000));
  assert.deepEqual(stopwatchReading(state, clock(200000)), {
    status: 'finished', elapsedMs: 25000, uncertain: false,
  });
  assert.throws(() => stopwatchTransition(state, 'resume', clock(200000)), /cannot resume/);
  assert.equal(stopwatchReading(stopwatchTransition(state, 'restart', clock(210000)), clock(210000)).elapsedMs, 0);
});

test('duration snapshot, pause and fresh-token resume do not affect an independent stopwatch', () => {
  let session = createPracticeSession({ id: 'duration-1', mode: 'outcome', type: 'duration' });
  session = practiceTransition(session, { type: 'select', value: 30 });
  const stopwatch = stopwatchTransition(newTimers().stopwatch, 'start', clock(100000));
  let countdown = countdownTransition(newTimers().countdown,
    { type: 'start', durationMs: session.measurement.selected, token: 'run-1' }, clock(100000));
  session = practiceTransition(session, { type: 'select', value: 45 });
  assert.equal(countdownReading(countdown, clock(110000)).remainingMs, 20000);
  countdown = countdownTransition(countdown, { type: 'pause' }, clock(110000));
  assert.equal(countdownReading(countdown, clock(125000)).remainingMs, 20000);
  assert.equal(countdown.durationMs, 30000);
  assert.throws(() => countdownTransition(countdown,
    { type: 'resume', token: 'run-1' }, clock(125000)), /Fresh/);
  countdown = countdownTransition(countdown, { type: 'resume', token: 'run-2' }, clock(125000));
  assert.equal(countdownReading(countdown, clock(130000)).remainingMs, 15000);
  assert.equal(countdownReading(countdown, clock(145000)).status, 'expired');
  assert.equal(stopwatchReading(stopwatch, clock(145000)).elapsedMs, 45000);
  const recovered = recoverTimers({ stopwatch, countdown }, clock(146000));
  assert.equal(recovered.countdown.status, 'expired');
  assert.equal(recovered.countdown.remainingMs, 0);
  assert.equal(recovered.stopwatch, stopwatch);
  assert.equal(recoverTimers(recovered, clock(147000)), recovered);
  countdown = countdownTransition(recovered.countdown,
    { type: 'start', durationMs: session.measurement.selected, token: 'run-3' }, clock(147000));
  assert.equal(countdown.durationMs, 45000);
  assert.equal(countdownReading(countdown, clock(147000)).remainingMs, 45000);
});

test('cancel and explicit restart do not revive a countdown', () => {
  let state = countdownTransition(newTimers().countdown,
    { type: 'start', durationMs: 1000, token: 'first' }, clock(100000));
  assert.throws(() => countdownTransition(state,
    { type: 'start', durationMs: 1000, token: 'second' }, clock(100100)), /restart/);
  state = countdownTransition(state, { type: 'cancel' });
  assert.equal(state.status, 'idle');
  assert.equal(state.remainingMs, null);
  assert.throws(() => countdownTransition(state,
    { type: 'start', durationMs: 1000, token: 'first' }, clock(101000)), /Fresh/);
  state = countdownTransition(state,
    { type: 'start', durationMs: 1000, token: 'second' }, clock(101000));
  state = countdownTransition(state,
    { type: 'restart', durationMs: 2000, token: 'third' }, clock(101500));
  assert.equal(countdownReading(state, clock(102000)).remainingMs, 1500);
  assert.equal(countdownTransition({ ...state, status: 'expired', remainingMs: 0 },
    { type: 'dismiss' }).status, 'idle');
});

test('exit/reopen recovers elapsed and expiry without a foreground tick or negative display', () => {
  const timers = newTimers();
  timers.stopwatch = stopwatchTransition(timers.stopwatch, 'start', clock(200000));
  timers.countdown = countdownTransition(timers.countdown,
    { type: 'start', durationMs: 12000, token: 'leave' }, clock(200000));
  assert.equal(recoverTimers(timers, clock(210000)), timers);
  assert.equal(stopwatchReading(timers.stopwatch, clock(230000)).elapsedMs, 30000);
  const reopened = recoverTimers(timers, clock(230000));
  assert.equal(reopened.countdown.status, 'expired');
  assert.equal(countdownReading(reopened.countdown, clock(290000)).remainingMs, 0);
  assert.equal(recoverTimers(reopened, clock(290000)), reopened);
});

test('timebase jumps and boot changes become uncertain until explicit resumption or restart', () => {
  let timers = newTimers();
  timers.stopwatch = stopwatchTransition(timers.stopwatch, 'start', clock(100000));
  timers.countdown = countdownTransition(timers.countdown,
    { type: 'start', durationMs: 30000, token: 'before' }, clock(100000));
  const backward = recoverTimers(timers, clock(99000, 101000));
  assert.equal(backward.stopwatch.status, 'uncertain');
  assert.equal(backward.countdown.status, 'uncertain');
  assert.equal(backward.stopwatch.elapsedMs, 0);
  assert.equal(backward.countdown.remainingMs, 30000);
  timers = { stopwatch: stopwatchTransition(backward.stopwatch, 'resume', clock(110000)),
    countdown: countdownTransition(backward.countdown,
      { type: 'resume', token: 'after' }, clock(110000)) };
  assert.equal(stopwatchReading(timers.stopwatch, clock(115000)).elapsedMs, 5000);
  assert.equal(stopwatchReading(timers.stopwatch, clock(115000)).uncertain, true);
  assert.equal(countdownReading(timers.countdown, clock(115000)).remainingMs, 25000);
  assert.equal(countdownReading(timers.countdown, clock(115000)).uncertain, true);
  const rebooted = recoverTimers(timers, clock(120000, 200, 'boot-b'));
  assert.equal(rebooted.stopwatch.status, 'uncertain');
  assert.equal(rebooted.countdown.status, 'uncertain');
  assert.equal(rebooted.countdown.remainingMs, 30000);
  assert.equal(countdownTransition(rebooted.countdown,
    { type: 'restart', durationMs: 30000, token: 'new-run' }, clock(121000, 1200, 'boot-b')).uncertain, false);
});

test('invalid durations, clocks and tokens are rejected instead of fabricating time', () => {
  const idle = newTimers();
  for (const durationMs of [0, -1, 86400001, NaN, Infinity]) {
    assert.throws(() => countdownTransition(idle.countdown,
      { type: 'start', durationMs, token: 'run' }, clock(0)), /duration/);
  }
  assert.throws(() => stopwatchTransition(idle.stopwatch, 'start', clock(-1)), /clock/);
  assert.throws(() => countdownTransition(idle.countdown,
    { type: 'start', durationMs: 1000, token: '' }, clock(0)), /token/);
  assert.throws(() => countdownTransition(idle.countdown,
    { type: 'start', durationMs: 1000, token: 'run' }, { wallMs: 0, monoMs: null, bootId: 'a' }), /clock/);
});
