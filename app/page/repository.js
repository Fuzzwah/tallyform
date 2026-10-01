import { validatePracticeSession } from './session.js';
import { UNITS, validCanonical } from './measurements.js';

const MAX_HISTORY = 100;
const MAX_EVENTS = 1000;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const identity = (id) => typeof id === 'string' && id.trim().length > 0;

function validateTotals(totals, mode) {
  if (!object(totals) || !integer(totals.count) || totals.count > MAX_EVENTS) {
    throw new Error('History totals invalid');
  }
  if (mode === 'simple') {
    if (own(totals, 'success') || own(totals, 'failure') || own(totals, 'percent')) {
      throw new Error('Simple history cannot contain outcomes');
    }
  } else if (!integer(totals.success) || !integer(totals.failure)
    || totals.success + totals.failure !== totals.count
    || totals.percent !== (totals.count ? Math.round(100 * totals.success / totals.count) : null)) {
    throw new Error('History outcomes invalid');
  }
}

function validateHistory(entries) {
  if (!Array.isArray(entries) || entries.length > MAX_HISTORY) {
    throw new Error('History capacity or format invalid');
  }
  const ids = new Set();
  for (const entry of entries) {
    if (!object(entry) || entry.version !== 1 || !identity(entry.id) || ids.has(entry.id)
      || (entry.mode !== 'simple' && entry.mode !== 'outcome')
      || !own(UNITS, entry.type)
      || (entry.type === 'none' ? entry.unit !== null : !UNITS[entry.type].includes(entry.unit))
      || !validCanonical(entry.type, entry.selected)
      || !Array.isArray(entry.groups) || entry.groups.length > MAX_EVENTS
      || !(entry.elapsedMs === null || integer(entry.elapsedMs))
      || !(entry.finishedAt === null || integer(entry.finishedAt))) {
      throw new Error('History summary invalid');
    }
    ids.add(entry.id);
    validateTotals(entry.totals, entry.mode);
    const values = new Set();
    let count = 0;
    let success = 0;
    let failure = 0;
    for (const group of entry.groups) {
      if (!object(group) || !validCanonical(entry.type, group.value)
        || values.has(group.value)) throw new Error('History group invalid');
      values.add(group.value);
      validateTotals(group.totals, entry.mode);
      if (group.totals.count === 0) throw new Error('Empty history group invalid');
      count += group.totals.count;
      if (entry.mode === 'outcome') {
        success += group.totals.success;
        failure += group.totals.failure;
      }
    }
    if (count !== entry.totals.count || (entry.mode === 'outcome'
      && (success !== entry.totals.success || failure !== entry.totals.failure))) {
      throw new Error('History groups do not match totals');
    }
  }
  return entries;
}

function validateValue(area, value) {
  if (area === 'history') return validateHistory(value);
  return value === null ? null : validatePracticeSession(value);
}

// Two independent, deterministic hashes detect torn records without native crypto.
// This is an integrity check against storage faults, not an authentication scheme.
function fingerprint(raw) {
  let fnv = 2166136261;
  let djb = 5381;
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    fnv = Math.imul(fnv ^ code, 16777619) >>> 0;
    djb = (Math.imul(djb, 33) ^ code) >>> 0;
  }
  return `${raw.length}:${fnv.toString(16)}:${djb.toString(16)}`;
}

function pointerPath(area, slot) {
  return `tallyform-${area}-pointer-${slot}.json`;
}

function generationPath(area, generation) {
  return `tallyform-${area}-generation-${generation}.json`;
}

function parse(raw) {
  if (typeof raw !== 'string') throw new Error('Non-text repository data');
  try { return JSON.parse(raw); } catch (_) { throw new Error('Torn or invalid repository JSON'); }
}

function validateRecord(raw, area, generation) {
  const record = parse(raw);
  if (!object(record) || record.version !== 1 || record.area !== area
    || record.generation !== generation || !own(record, 'value')) {
    throw new Error('Unsupported or corrupt repository record');
  }
  validateValue(area, record.value);
  return record.value;
}

function readCandidate(io, area, slot) {
  const raw = io.read(pointerPath(area, slot));
  if (raw === null || raw === undefined) return null;
  const pointer = parse(raw);
  if (!object(pointer) || pointer.version !== 1 || pointer.area !== area
    || !Number.isSafeInteger(pointer.generation) || pointer.generation <= 0
    || typeof pointer.fingerprint !== 'string'
    || !/^\d+:[0-9a-f]+:[0-9a-f]+$/.test(pointer.fingerprint)) {
    throw new Error('Unsupported or corrupt repository pointer');
  }
  const recordRaw = io.read(generationPath(area, pointer.generation));
  if (recordRaw === null || recordRaw === undefined) throw new Error('Missing repository generation');
  if (typeof recordRaw !== 'string' || fingerprint(recordRaw) !== pointer.fingerprint) {
    throw new Error('Corrupt repository generation');
  }
  const value = validateRecord(recordRaw, area, pointer.generation);
  return { generation: pointer.generation, value, fingerprint: pointer.fingerprint, slot };
}

function inspect(io, area) {
  const candidates = [];
  const problems = [];
  for (const slot of ['a', 'b']) {
    try {
      const candidate = readCandidate(io, area, slot);
      if (candidate) candidates.push(candidate);
    } catch (error) {
      problems.push(`${area} pointer ${slot}: ${error.message}`);
    }
  }
  candidates.sort((a, b) => b.generation - a.generation);
  if (candidates.length === 2 && candidates[0].generation === candidates[1].generation
    && candidates[0].fingerprint !== candidates[1].fingerprint) {
    problems.push(`${area} pointers disagree on generation contents`);
  }
  const latest = candidates[0] || null;
  let nextGeneration = latest ? latest.generation + 1 : 1;
  // An interrupted generation write is never promoted to a commit. Validate
  // even unreferenced records so damage is visible rather than silently reset.
  try {
    while (Number.isSafeInteger(nextGeneration)) {
      const raw = io.read(generationPath(area, nextGeneration));
      if (raw === null || raw === undefined) break;
      validateRecord(raw, area, nextGeneration);
      nextGeneration++;
    }
    if (!Number.isSafeInteger(nextGeneration)) throw new Error('Repository generation exhausted');
  } catch (error) {
    problems.push(`${area} uncommitted generation ${nextGeneration}: ${error.message}`);
  }
  return { latest, nextGeneration, issue: problems.length ? problems.join('; ') : null };
}

export function createRepository(io) {
  if (!io || typeof io.read !== 'function' || typeof io.write !== 'function'
    || typeof io.remove !== 'function') {
    throw new Error('Repository requires synchronous read, write and remove');
  }

  function load(area) {
    const state = inspect(io, area);
    return area === 'active'
      ? { value: state.latest ? state.latest.value : null, issue: state.issue,
        committed: !!state.latest }
      : { value: state.latest ? state.latest.value : [], issue: state.issue };
  }

  function save(area, value) {
    validateValue(area, value);
    const state = inspect(io, area);
    if (state.issue) throw new Error(state.issue);
    // Valid uncommitted generations remain untouched after an interrupted
    // pointer write; corrupt ones were reported by inspect and block saving.
    const generation = state.nextGeneration;
    const recordPath = generationPath(area, generation);
    const existing = io.read(recordPath);
    if (existing !== null && existing !== undefined) {
      throw new Error('Repository generation changed during commit');
    }
    const slot = state.latest && state.latest.slot === 'a' ? 'b' : 'a';
    const overwritten = readCandidate(io, area, slot);
    const recordRaw = JSON.stringify({ version: 1, area, generation, value });
    if (typeof recordRaw !== 'string') throw new Error('Repository value cannot be encoded');
    io.write(recordPath, recordRaw);
    if (io.read(recordPath) !== recordRaw) throw new Error('Repository generation verification failed');
    // The other pointer still protects the previous committed generation.
    const pointerRaw = JSON.stringify({ version: 1, area, generation,
      fingerprint: fingerprint(recordRaw) });
    const path = pointerPath(area, slot);
    io.write(path, pointerRaw);
    if (io.read(path) !== pointerRaw) throw new Error('Repository pointer verification failed');
    const committed = inspect(io, area);
    if (committed.issue || !committed.latest || committed.latest.generation !== generation
      || committed.latest.slot !== slot) throw new Error('Repository commit verification failed');
    // Cleanup is post-commit: a removal failure must never report a valid
    // save as failed. Normal operation retains at most two generations.
    const removeObsolete = (old) => {
      try { io.remove(generationPath(area, old)); }
      catch (error) { console.log(`Repository cleanup: ${error}`); }
    };
    if (overwritten && (!state.latest || overwritten.generation !== state.latest.generation)) {
      removeObsolete(overwritten.generation);
    }
    for (let old = state.latest ? state.latest.generation + 1 : 1; old < generation; old++) {
      removeObsolete(old);
    }
    return value;
  }

  return {
    loadActive: () => load('active'),
    loadHistory: () => load('history'),
    saveActive: (state) => save('active', state),
    saveHistory: (entries) => save('history', entries),
  };
}
