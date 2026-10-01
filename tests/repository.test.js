import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../app/page/repository.js';
import { createPracticeSession, practiceTransition } from '../app/page/session.js';
import { createPracticeSummary } from '../app/page/summary.js';

const pathFor = (area, part) => `tallyform-${area}-${part}.json`;
const session = (id) => createPracticeSession({ id, mode: 'outcome', type: 'distance' });
const summary = (id) => ({ version: 1, id, mode: 'outcome', type: 'distance', unit: 'm',
  selected: 5000000, totals: { count: 1, success: 1, failure: 0, percent: 100 },
  groups: [{ value: 5000000, totals: { count: 1, success: 1, failure: 0, percent: 100 } }],
  elapsedMs: null, finishedAt: null });

function storage() {
  const files = new Map();
  let fault = null;
  const io = {
    read: (path) => files.get(path),
    write(path, raw) {
      if (fault) return fault(path, raw, files);
      files.set(path, raw);
    },
    remove(path) { files.delete(path); },
  };
  return { files, io, failOnce(callback, when = () => true) {
    fault = (path, raw, all) => {
      if (!when(path)) {
        all.set(path, raw);
        return;
      }
      fault = null;
      callback(path, raw, all);
    };
  } };
}

function digest(raw) {
  let fnv = 2166136261;
  let djb = 5381;
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    fnv = Math.imul(fnv ^ code, 16777619) >>> 0;
    djb = (Math.imul(djb, 33) ^ code) >>> 0;
  }
  return `${raw.length}:${fnv.toString(16)}:${djb.toString(16)}`;
}

function replaceRecord(files, area, generation, mutate) {
  const recordPath = pathFor(area, `generation-${generation}`);
  const record = JSON.parse(files.get(recordPath));
  const raw = JSON.stringify(mutate(record));
  files.set(recordPath, raw);
  const pointerPath = pathFor(area, `pointer-${generation % 2 ? 'a' : 'b'}`);
  const pointer = JSON.parse(files.get(pointerPath));
  files.set(pointerPath, JSON.stringify({ ...pointer, fingerprint: digest(raw) }));
}

test('active and history reopen independently with their validated values', () => {
  const { io } = storage();
  const first = createRepository(io);
  assert.deepEqual(first.loadActive(), { value: null, issue: null, committed: false });
  assert.deepEqual(first.loadHistory(), { value: [], issue: null });
  const active = practiceTransition(session('active-1'), { type: 'record', kind: 'success' });
  first.saveActive(active);
  first.saveHistory([summary('saved-1')]);
  const reopened = createRepository(io);
  assert.deepEqual(reopened.loadActive(), { value: active, issue: null, committed: true });
  assert.deepEqual(reopened.loadHistory(), { value: [summary('saved-1')], issue: null });
  reopened.saveActive(null);
  assert.deepEqual(createRepository(io).loadActive(), { value: null, issue: null, committed: true });
  assert.deepEqual(createRepository(io).loadHistory().value, [summary('saved-1')]);
});

test('successful commits retain only the two referenced active generations', () => {
  const store = storage();
  const repo = createRepository(store.io);
  for (let n = 1; n <= 6; n++) repo.saveActive(session(`step-${n}`));
  assert.deepEqual([...store.files.keys()].filter((path) => path.includes('active-generation-')),
    [pathFor('active', 'generation-5'), pathFor('active', 'generation-6')]);
  assert.equal(createRepository(store.io).loadActive().value.id, 'step-6');
});

test('finished simple session with no events saves its real summary without invented rates', () => {
  const store = storage();
  const repo = createRepository(store.io);
  const finished = practiceTransition(createPracticeSession({
    id: 'empty-timed', mode: 'simple', type: 'none',
  }), { type: 'finish' });
  const record = createPracticeSummary({ ...finished, stopwatchElapsedMs: 4500 }, null);
  repo.saveHistory([record]);
  assert.deepEqual(createRepository(store.io).loadHistory(), { value: [record], issue: null });
  assert.deepEqual(record.totals, { count: 0 });
  assert.deepEqual(record.groups, []);
});

test('failed and torn generation writes cannot claim success or replace the committed state', () => {
  for (const fault of ['throw', 'truncate']) {
    const store = storage();
    const repo = createRepository(store.io);
    const previous = session('previous');
    repo.saveActive(previous);
    store.failOnce((path, raw, files) => {
      assert.equal(path, pathFor('active', 'generation-2'));
      if (fault === 'throw') throw new Error('power loss');
      files.set(path, raw.slice(0, raw.length - 3));
    });
    assert.throws(() => repo.saveActive(session('new')), /power loss|verification failed/);
    const recovered = createRepository(store.io).loadActive();
    assert.deepEqual(recovered.value, previous);
    if (fault === 'truncate') assert.match(recovered.issue, /uncommitted generation 2/);
    else assert.equal(recovered.issue, null);
    if (fault === 'throw') {
      repo.saveActive(session('new'));
      assert.equal(createRepository(store.io).loadActive().value.id, 'new');
    } else {
      assert.throws(() => repo.saveActive(session('new')), /invalid repository JSON|Unsupported|corrupt|Torn/i);
    }
  }
});

test('pointer write failure preserves old commit and a later retry never overwrites orphan bytes', () => {
  const store = storage();
  const repo = createRepository(store.io);
  const old = session('old');
  repo.saveActive(old);
  const replacement = session('replacement');
  store.failOnce((path) => {
    assert.equal(path, pathFor('active', 'pointer-b'));
    throw new Error('pointer unavailable');
  }, (path) => path === pathFor('active', 'pointer-b'));
  assert.throws(() => repo.saveActive(replacement), /pointer unavailable/);
  const orphan = store.files.get(pathFor('active', 'generation-2'));
  assert.deepEqual(createRepository(store.io).loadActive(), { value: old, issue: null, committed: true });
  createRepository(store.io).saveActive(replacement);
  assert.equal(orphan.length > 0, true);
  assert.equal(store.files.has(pathFor('active', 'generation-2')), false);
  assert.deepEqual(createRepository(store.io).loadActive(), { value: replacement, issue: null, committed: true });
  assert.ok(store.files.has(pathFor('active', 'generation-3')));
  assert.ok(store.files.has(pathFor('active', 'generation-1')));
});

test('torn pointer reveals previous verified generation and blocks unsafe writes', () => {
  const store = storage();
  const repo = createRepository(store.io);
  const old = session('old');
  repo.saveActive(old);
  store.failOnce((path, raw, files) => {
    assert.equal(path, pathFor('active', 'pointer-b'));
    files.set(path, raw.slice(0, 10));
  }, (path) => path === pathFor('active', 'pointer-b'));
  assert.throws(() => repo.saveActive(session('new')), /verification failed/);
  const reopened = createRepository(store.io);
  const result = reopened.loadActive();
  assert.deepEqual(result.value, old);
  assert.match(result.issue, /pointer b/);
  assert.throws(() => reopened.saveActive(session('retry')), /pointer b/);
  assert.equal(store.files.has(pathFor('active', 'generation-3')), false);
});

test('torn history generation returns previous summaries without disturbing active state', () => {
  const store = storage();
  const repo = createRepository(store.io);
  const active = session('untouched');
  repo.saveActive(active);
  repo.saveHistory([summary('first')]);
  repo.saveHistory([summary('first'), summary('second')]);
  const newest = pathFor('history', 'generation-2');
  store.files.set(newest, store.files.get(newest).slice(0, 20));
  const reopened = createRepository(store.io);
  assert.deepEqual(reopened.loadHistory().value, [summary('first')]);
  assert.match(reopened.loadHistory().issue, /history pointer b/);
  assert.deepEqual(reopened.loadActive(), { value: active, issue: null, committed: true });
  assert.throws(() => reopened.saveHistory([]), /history pointer b/);
  reopened.saveActive(null);
  assert.deepEqual(createRepository(store.io).loadHistory().value, [summary('first')]);
});

test('unsupported pointer/record version and corrupt active record never reset unrelated history', () => {
  const store = storage();
  const repo = createRepository(store.io);
  repo.saveActive(session('first'));
  repo.saveActive(session('second'));
  repo.saveHistory([summary('safe')]);
  const newestPath = pathFor('active', 'pointer-b');
  const original = store.files.get(newestPath);
  store.files.set(newestPath, JSON.stringify({ ...JSON.parse(original), version: 99 }));
  assert.equal(createRepository(store.io).loadActive().value.id, 'first');
  assert.match(createRepository(store.io).loadActive().issue, /pointer b/);
  assert.throws(() => repo.saveActive(null), /pointer b/);
  store.files.set(newestPath, original);
  replaceRecord(store.files, 'active', 2, (record) => ({ ...record, version: 99 }));
  assert.equal(createRepository(store.io).loadActive().value.id, 'first');
  assert.match(createRepository(store.io).loadActive().issue, /Unsupported/);
  assert.deepEqual(createRepository(store.io).loadHistory(), { value: [summary('safe')], issue: null });
  replaceRecord(store.files, 'active', 2, (record) => ({ ...record, version: 1,
    value: { ...record.value, version: 500 } }));
  assert.equal(createRepository(store.io).loadActive().value.id, 'first');
  assert.match(createRepository(store.io).loadActive().issue, /Practice session invalid/);
});

test('history rejects unknown versions, malformed or duplicate identities, bad aggregates and capacity', () => {
  const store = storage();
  const repo = createRepository(store.io);
  const valid = summary('saved');
  for (const invalid of [
    [{ ...valid, version: 5 }], [{ ...valid, id: ' ' }], [valid, valid],
    [{ ...valid, totals: { ...valid.totals, count: 2 } }],
    [{ ...valid, groups: [valid.groups[0], valid.groups[0]] }],
    [{ ...valid, unit: 'kg' }], [{ ...valid, elapsedMs: -1 }],
    Array.from({ length: 101 }, (_, n) => summary(`saved-${n}`)),
  ]) assert.throws(() => repo.saveHistory(invalid));
  assert.deepEqual(createRepository(store.io).loadHistory(), { value: [], issue: null });
  repo.saveHistory([valid]);
  repo.saveHistory([valid, summary('second')]);
  replaceRecord(store.files, 'history', 2, (record) => ({ ...record,
    value: [{ ...valid, version: 5 }] }));
  const result = createRepository(store.io).loadHistory();
  assert.deepEqual(result.value, [valid]);
  assert.match(result.issue, /History summary invalid/);
  assert.throws(() => repo.saveHistory([]), /History summary invalid/);
});
