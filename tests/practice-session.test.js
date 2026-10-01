import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeSession, validatePracticeSession, practiceTransition,
  practiceTotals } from '../app/page/session.js';
import { toCanonical } from '../app/page/measurements.js';

test('simple unitless recording and undo never invent outcomes or quantities', () => {
  let state = createPracticeSession({ id: 'simple-1', mode: 'simple', type: 'none' });
  assert.deepEqual(practiceTotals(state), { count: 0 });
  for (let i = 0; i < 3; i++) state = practiceTransition(state, { type: 'record', kind: 'rep' });
  assert.deepEqual(state.events, [
    { kind: 'rep', value: null }, { kind: 'rep', value: null }, { kind: 'rep', value: null },
  ]);
  state = practiceTransition(state, { type: 'undo' });
  assert.deepEqual(practiceTotals(state), { count: 2 });
  assert.deepEqual(practiceTotals(state, null), { count: 2 });
  assert.equal(Object.hasOwn(practiceTotals(state), 'percent'), false);
  assert.throws(() => practiceTransition(state, { type: 'record', kind: 'success' }), /incompatible/);
  assert.throws(() => practiceTransition(state, { type: 'select', value: 1 }), /Incompatible/);
  assert.deepEqual(state.measurement, { type: 'none', unit: null, selected: null, step: null });
});

test('outcome totals distinguish selected weight from whole session, including empty rates', () => {
  let state = createPracticeSession({ id: 'weight-1', mode: 'outcome', type: 'weight' });
  assert.deepEqual(practiceTotals(state), { count: 0, success: 0, failure: 0, percent: null });
  const initial = state.measurement.selected;
  state = practiceTransition(state, { type: 'record', kind: 'success' });
  state = practiceTransition(state, { type: 'record', kind: 'failure' });
  state = practiceTransition(state, { type: 'select', value: 2 });
  state = practiceTransition(state, { type: 'record', kind: 'success' });
  assert.deepEqual(practiceTotals(state), { count: 3, success: 2, failure: 1, percent: 67 });
  assert.deepEqual(practiceTotals(state, initial), { count: 2, success: 1, failure: 1, percent: 50 });
  assert.deepEqual(practiceTotals(state, state.measurement.selected), {
    count: 1, success: 1, failure: 0, percent: 100,
  });
  state = practiceTransition(state, { type: 'unit', unit: 'lb' });
  assert.equal(state.measurement.selected, toCanonical('weight', 'kg', 2));
  assert.equal(state.events[0].value, initial);
  assert.equal(practiceTotals(state, initial).count, 2);
  state = practiceTransition(state, { type: 'undo' });
  assert.equal(state.measurement.selected, toCanonical('weight', 'kg', 2));
  assert.deepEqual(practiceTotals(state, state.measurement.selected), {
    count: 0, success: 0, failure: 0, percent: null,
  });
});

test('recorded distance values stay fixed when display units and adjustment steps change', () => {
  let state = createPracticeSession({ id: 'distance-1', mode: 'simple', type: 'distance' });
  state = practiceTransition(state, { type: 'unit', unit: 'ft' });
  state = practiceTransition(state, { type: 'select', value: 10 });
  const selected = state.measurement.selected;
  assert.equal(selected, 3048000);
  state = practiceTransition(state, { type: 'record', kind: 'rep' });
  const before = state.events[0];
  state = practiceTransition(state, { type: 'setStep', value: 1 });
  state = practiceTransition(state, { type: 'unit', unit: 'm' });
  state = practiceTransition(state, { type: 'step', direction: 1 });
  state = practiceTransition(state, { type: 'record', kind: 'rep' });
  assert.deepEqual(state.events[0], before);
  assert.equal(state.events[0].value, 3048000);
  assert.equal(state.events[1].value, 3352800);
  assert.deepEqual(practiceTotals(state), { count: 2 });
  assert.deepEqual(practiceTotals(state, selected), { count: 1 });
});

test('fixed mode and measurement type reject reinterpretation; saved validation rejects corrupt events', () => {
  const state = createPracticeSession({ id: 'duration-1', mode: 'outcome', type: 'duration' });
  assert.equal(state.measurement.unit, 's');
  for (const action of [{ type: 'mode', mode: 'simple' }, { type: 'measurement', typeName: 'distance' },
    { type: 'record', kind: 'rep' }, { type: 'unit', unit: 'kg' }]) {
    assert.throws(() => practiceTransition(state, action));
  }
  assert.equal(state.mode, 'outcome');
  assert.equal(state.measurement.type, 'duration');
  assert.equal(validatePracticeSession(state), state);
  const mapped = practiceTransition(state, { type: 'keys', keys: { silver: 12, red: 14 } });
  assert.deepEqual(mapped.keys, { silver: 12, red: 14 });
  assert.equal(state.keys, null);
  assert.throws(() => practiceTransition(mapped, { type: 'keys',
    keys: { silver: 12, red: 12 } }), /invalid/);
  for (const invalid of [{ ...state, version: 3 }, { ...state, measurement: { ...state.measurement, selected: -1 } },
    { ...state, events: [{ kind: 'success', value: 0 }] },
    { ...state, events: [{ kind: 'rep', value: state.measurement.selected }] },
    { ...state, startedAt: -1 }, { ...state, stopwatchElapsedMs: 0.5 },
    { ...state, keys: { silver: 12, red: 12 } }, { ...state, id: ' ' }]) {
    assert.throws(() => validatePracticeSession(invalid));
  }
  assert.throws(() => createPracticeSession({ id: '', mode: 'simple', type: 'none' }));
  assert.throws(() => createPracticeSession({ id: ' ', mode: 'simple', type: 'none' }));
});

test('capacity rejects extra records without losing events; finish is terminal, not a save claim', () => {
  const start = createPracticeSession({ id: 'full-1', mode: 'simple', type: 'none' });
  const events = Array.from({ length: 1000 }, () => ({ kind: 'rep', value: null }));
  const full = { ...start, events };
  assert.equal(validatePracticeSession(full), full);
  assert.throws(() => practiceTransition(full, { type: 'record', kind: 'rep' }), /full/);
  assert.equal(full.events, events);
  assert.equal(full.events.length, 1000);
  assert.deepEqual(practiceTotals(full), { count: 1000 });
  assert.throws(() => practiceTransition(full, { type: 'record', kind: 'success' }), /full/);
  const corrected = practiceTransition(full, { type: 'undo' });
  assert.equal(corrected.events.length, 999);
  assert.equal(full.events.length, 1000);
  const finished = practiceTransition(full, { type: 'finish' });
  assert.equal(finished.status, 'finished');
  assert.equal(finished.id, full.id);
  assert.equal(finished.events, full.events);
  assert.deepEqual(practiceTotals(finished), { count: 1000 });
  assert.equal(validatePracticeSession(finished), finished);
  assert.throws(() => practiceTransition(finished, { type: 'record', kind: 'rep' }), /not active/);
  assert.throws(() => practiceTransition(finished, { type: 'undo' }), /not active/);
});
