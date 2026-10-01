import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePracticeSession } from '../app/page/session.js';
import { convertLegacy, migrateLegacy, LEGACY_SESSION_ID } from '../app/page/migration.js';
import { createRepository } from '../app/page/repository.js';

const newSession = () => ({
  version: 1, unit: 'm', distanceM: 5, keys: null, attempts: [],
});

function legacyStorage(raw) {
  let reads = 0;
  return {
    getItem(key) {
      assert.equal(key, 'putting-session-v1');
      reads++;
      return raw;
    },
    setItem() { throw new Error('Legacy data must remain untouched'); },
    removeItem() { throw new Error('Legacy data must remain untouched'); },
    get reads() { return reads; },
  };
}

function memoryIO() {
  const files = new Map();
  let writes = 0;
  let failAt = null;
  return {
    read(path) { return files.get(path); },
    write(path, raw) {
      writes++;
      if (writes === failAt) throw new Error('interrupted commit');
      files.set(path, raw);
    },
    remove(path) { files.delete(path); },
    interruptAt(writeNumber) { failAt = writeNumber; },
    resume() { failAt = null; },
    get writes() { return writes; },
  };
}

test('legacy metres preserve each outcome and exact selected and event distances', () => {
  const source = { ...newSession(), distanceM: 5.0001, keys: { silver: 2, red: 9 },
    attempts: [
      { distanceM: 0.3048, made: true },
      { distanceM: 5.0001, made: false },
      { distanceM: 30.48, made: true },
    ] };
  const raw = JSON.stringify(source);
  const converted = convertLegacy(raw);
  assert.equal(validatePracticeSession(converted), converted);
  assert.equal(converted.id, LEGACY_SESSION_ID);
  assert.equal(converted.mode, 'outcome');
  assert.equal(converted.status, 'active');
  assert.deepEqual(converted.measurement, {
    type: 'distance', unit: 'm', selected: 5000100, step: 1000000,
  });
  assert.deepEqual(converted.events, [
    { kind: 'success', value: 304800 },
    { kind: 'failure', value: 5000100 },
    { kind: 'success', value: 30480000 },
  ]);
  assert.deepEqual(converted.keys, source.keys);
  assert.notEqual(converted.keys, source.keys);
  assert.equal(converted.startedAt, null);
  assert.equal(converted.stopwatchElapsedMs, null);
});

test('legacy feet retain feet controls and canonical foot adjustment', () => {
  const source = { ...newSession(), unit: 'ft', distanceM: 3.048, keys: null,
    attempts: [{ distanceM: 3.3528, made: false }, { distanceM: 3.048, made: true }] };
  const converted = convertLegacy(JSON.stringify(source));
  assert.equal(validatePracticeSession(converted), converted);
  assert.deepEqual(converted.measurement, {
    type: 'distance', unit: 'ft', selected: 3048000, step: 304800,
  });
  assert.deepEqual(converted.events, [
    { kind: 'failure', value: 3352800 }, { kind: 'success', value: 3048000 },
  ]);
  assert.equal(converted.keys, null);
});

test('corrupt and unknown legacy versions cannot overwrite active state', () => {
  const invalid = ['{invalid', JSON.stringify({ ...newSession(), version: 3 }),
    JSON.stringify({ ...newSession(), attempts: [{ distanceM: 1, made: 'yes' }] })];
  for (const raw of invalid) {
    assert.throws(() => convertLegacy(raw));
    const io = memoryIO();
    const repo = createRepository(io);
    const storage = legacyStorage(raw);
    assert.throws(() => migrateLegacy(repo, storage));
    assert.deepEqual(repo.loadActive(), { value: null, issue: null, committed: false });
    assert.equal(storage.getItem('putting-session-v1'), raw);
  }
});

test('interrupted commit keeps old bytes and permits a verified retry without duplicate import', () => {
  const io = memoryIO();
  const raw = JSON.stringify({ ...newSession(), unit: 'ft', distanceM: 3.048,
    attempts: [{ distanceM: 3.048, made: true }] });
  const storage = legacyStorage(raw);
  const repo = createRepository(io);
  io.interruptAt(2);
  assert.throws(() => migrateLegacy(repo, storage), /interrupted commit/);
  assert.equal(storage.getItem('putting-session-v1'), raw);
  io.resume();
  const result = migrateLegacy(createRepository(io), storage);
  assert.equal(result.issue, null);
  assert.equal(result.value.id, LEGACY_SESSION_ID);
  assert.deepEqual(result.value.events, [{ kind: 'success', value: 3048000 }]);
  const before = io.writes;
  const reread = legacyStorage(JSON.stringify({ ...newSession(), attempts: [
    { distanceM: 5, made: false }, { distanceM: 5, made: false },
  ] }));
  assert.deepEqual(migrateLegacy(createRepository(io), reread), result);
  assert.equal(reread.reads, 0);
  assert.equal(io.writes, before);
  assert.equal(storage.getItem('putting-session-v1'), raw);
});

test('committed empty active slot prevents reimport after finish or discard', () => {
  const io = memoryIO();
  const first = migrateLegacy(createRepository(io), legacyStorage(JSON.stringify(newSession())));
  assert.equal(first.value.id, LEGACY_SESSION_ID);
  createRepository(io).saveActive(null);
  const legacy = legacyStorage(JSON.stringify(newSession()));
  const cleared = migrateLegacy(createRepository(io), legacy);
  assert.deepEqual(cleared, { value: null, issue: null, committed: true });
  assert.equal(legacy.reads, 0);
});

test('missing legacy data leaves the uncommitted active slot empty', () => {
  const io = memoryIO();
  const result = migrateLegacy(createRepository(io), legacyStorage(null));
  assert.deepEqual(result, { value: null, issue: null, committed: false });
  assert.equal(io.writes, 0);
});

test('new active records and recovery issues take precedence over legacy reads', () => {
  const storage = legacyStorage(JSON.stringify(newSession()));
  const active = { value: { version: 2, id: 'already-saved' }, issue: null };
  const issue = { value: null, issue: 'Unsupported active version' };
  for (const expected of [active, issue]) {
    const repo = { loadActive() { return expected; }, saveActive() { throw new Error('unexpected write'); } };
    assert.equal(migrateLegacy(repo, storage), expected);
  }
  assert.equal(storage.reads, 0);
});
