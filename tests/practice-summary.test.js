import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeSession, practiceTransition } from '../app/page/session.js';
import { createPracticeSummary } from '../app/page/summary.js';

test('finished mixed-value outcomes keep canonical groups and whole-session totals', () => {
  let session = createPracticeSession({ id: 'weights-1', mode: 'outcome', type: 'weight' });
  const first = session.measurement.selected;
  session = practiceTransition(session, { type: 'record', kind: 'success' });
  session = practiceTransition(session, { type: 'select', value: 2 });
  session = practiceTransition(session, { type: 'record', kind: 'failure' });
  session = practiceTransition(session, { type: 'record', kind: 'success' });
  session = practiceTransition(session, { type: 'unit', unit: 'lb' });
  session = practiceTransition(session, { type: 'finish' });
  const summary = createPracticeSummary(session, 5000);
  assert.equal(summary.unit, 'lb');
  assert.deepEqual(summary.totals, { count: 3, success: 2, failure: 1, percent: 67 });
  assert.deepEqual(summary.groups, [
    { value: first, totals: { count: 1, success: 1, failure: 0, percent: 100 } },
    { value: 2000000000000, totals: { count: 2, success: 1, failure: 1, percent: 50 } },
  ]);
  assert.equal(summary.finishedAt, 5000);
  assert.equal(summary.elapsedMs, null);
  assert.equal(session.events[0].value, first);
});

test('empty simple and timed sessions do not invent outcomes, groups or dates', () => {
  let simple = createPracticeSession({ id: 'simple-1', mode: 'simple', type: 'none' });
  simple = practiceTransition(simple, { type: 'finish' });
  assert.deepEqual(createPracticeSummary(simple).groups, []);
  assert.deepEqual(createPracticeSummary(simple).totals, { count: 0 });
  let timed = createPracticeSession({ id: 'timed-1', mode: 'outcome', type: 'duration' });
  timed = practiceTransition(timed, { type: 'finish' });
  const summary = createPracticeSummary(timed);
  assert.deepEqual(summary.totals, { count: 0, success: 0, failure: 0, percent: null });
  assert.equal(summary.finishedAt, null);
  assert.equal(summary.elapsedMs, null);
  assert.throws(() => createPracticeSummary(createPracticeSession({ id: 'active-1',
    mode: 'simple', type: 'none' })), /Finished/);
});

test('unitless simple summary has one null-valued group without success classification', () => {
  let session = createPracticeSession({ id: 'reps-1', mode: 'simple', type: 'none' });
  session = practiceTransition(session, { type: 'record', kind: 'rep' });
  session = practiceTransition(session, { type: 'record', kind: 'rep' });
  session = practiceTransition(session, { type: 'finish' });
  const summary = createPracticeSummary(session);
  assert.deepEqual(summary.totals, { count: 2 });
  assert.deepEqual(summary.groups, [{ value: null, totals: { count: 2 } }]);
  assert.equal(summary.selected, null);
});
