import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as domain from '../app/page/session.js';
import * as measurement from '../app/page/measurements.js';
import { createRepository } from '../app/page/repository.js';
import { createPracticeSummary } from '../app/page/summary.js';
import { migrateLegacy } from '../app/page/migration.js';

const pageSource = readFileSync(new URL('../app/page/index.js', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?;\n/gm, '');

function watch({ files = new Map(), legacy = null } = {}) {
  let fault = null;
  let reads = 0;
  let keyHandler;
  let gestureHandler;
  let page;
  const io = {
    read(path) { return files.get(path); },
    write(path, data) {
      if (fault && fault(path)) { fault = null; throw new Error('interrupted write'); }
      files.set(path, data);
    },
    remove(path) { files.delete(path); },
  };
  const ui = {
    widget: { TEXT: 'text', BUTTON: 'button', FILL_RECT: 'rect' },
    prop: { TEXT: 'text', VISIBLE: 'visible' },
    align: { CENTER_H: 1, CENTER_V: 2 },
    createWidget(type, props) {
      return { type, props: { ...props }, setProperty(property, value) { this.props[property] = value; } };
    },
    setStatusBarVisible() {},
  };
  const context = {
    Page(value) { page = value; }, ui, console,
    LocalStorage: class { getItem(key) { assert.equal(key, 'putting-session-v1'); reads++; return legacy; } },
    exit() {}, px: (n) => n,
    onKey(handler) { keyHandler = handler; }, offKey() {},
    onGesture(handler) { gestureHandler = handler; }, offGesture() {},
    KEY_EVENT_CLICK: 1, GESTURE_UP: 2, GESTURE_DOWN: 3,
    ...domain, ...measurement, createPracticeSummary, migrateLegacy,
    openNativeRepository: () => createRepository(io),
  };
  vm.runInNewContext(pageSource, context, { filename: 'app/page/index.js' });
  page.onInit();
  page.build();
  function visibleButtons() {
    return [...page.widgets.buttons, ...['decrease', 'increase', 'success', 'failure',
      'record', 'undo', 'more', 'unit', 'finish'].map((name) => page.widgets[name])]
      .filter((button) => button.props.visible);
  }
  function labels() {
    return visibleButtons().map((button) => button.props.text);
  }
  function tap(label) {
    const button = visibleButtons().find((item) => item.props.text === label);
    assert.ok(button, `${label} missing in ${page.view}: ${labels().join(', ')}`);
    button.props.click_func();
  }
  return { page, io, files, labels, tap, get reads() { return reads; },
    key: (...args) => keyHandler(...args), gesture: (...args) => gestureHandler(...args),
    failNext: (predicate) => { fault = predicate; } };
}

for (const mode of ['simple', 'outcome']) {
  for (const type of ['distance', 'weight', 'duration', 'none']) {
    test(`native ${mode} ${type}: record, correct, finish and reopen history`, () => {
      const w = watch();
      if (mode === 'simple') w.tap('Mode');
      for (let n = 0; n < ['distance', 'weight', 'duration', 'none'].indexOf(type); n++) w.tap('Measure');
      w.tap('Start');
      assert.equal(w.page.active.measurement.type, type);
      if (type === 'none') {
        assert.equal(w.page.widgets.activeValue.props.text, mode === 'simple' ? '0 reps' : '0 attempts');
        assert.equal(w.labels().includes('Unit'), false);
        assert.equal(w.labels().includes('+'), false);
        assert.equal(w.gesture(2), false);
      } else {
        w.tap('+');
        const selected = w.page.active.measurement.selected;
        w.tap('Unit');
        assert.equal(w.page.active.measurement.selected, selected);
      }
      w.tap(mode === 'simple' ? 'Record rep' : '✓ Success');
      if (mode === 'outcome') {
        w.tap('× Failure');
        assert.match(w.page.widgets.activeTotal.props.text, /50%/);
      }
      w.tap('Undo');
      assert.equal(w.page.active.events.length, mode === 'simple' ? 0 : 1);
      w.tap('Finish');
      assert.equal(w.page.view, 'confirm-finish');
      w.tap('Cancel');
      assert.ok(w.page.active);
      w.tap('Finish');
      w.tap('Yes');
      assert.equal(w.page.active, null);
      assert.equal(w.page.history.length, 1);
      assert.equal(w.page.history[0].totals.count, mode === 'simple' ? 0 : 1);
      const reopened = watch({ files: w.files });
      assert.equal(reopened.page.view, 'setup');
      reopened.tap('History');
      assert.equal(reopened.page.history.length, 1);
      reopened.tap('Open');
      assert.equal(reopened.page.view, 'detail');
      reopened.tap('Delete');
      reopened.tap('Cancel');
      assert.equal(reopened.page.history.length, 1);
      reopened.tap('Delete');
      reopened.tap('Yes');
      assert.equal(watch({ files: w.files }).page.history.length, 0);
    });
  }
}

test('selected outcome and session rate stay distinct across value and unit changes', () => {
  const w = watch();
  w.tap('Start');
  assert.equal(w.page.widgets.activeTotal.props.text, '— total');
  w.tap('−');
  w.tap('✓ Success');
  w.tap('✓ Success');
  w.tap('× Failure');
  const recorded = w.page.active.events.map((event) => event.value);
  w.tap('+');
  w.tap('× Failure');
  w.tap('−');
  assert.equal(w.page.widgets.activeValue.props.text, '4 m');
  assert.equal(w.page.widgets.activeHere.props.text, '2/3 here');
  assert.equal(w.page.widgets.activeTotal.props.text, '50% total');
  w.tap('Unit');
  assert.deepEqual(w.page.active.events.slice(0, 3).map((event) => event.value), recorded);
  assert.equal(w.page.widgets.activeValue.props.text, '0.004 km');
  w.tap('More');
  assert.equal(w.page.view, 'options');
  assert.ok(w.labels().some((label) => label.startsWith('Step ')));
  assert.equal(w.page.widgets.finish.props.visible, false);
  w.tap('Back');
  assert.equal(w.page.widgets.activeHere.props.text, '2/3 here');
});

test('long converted values remain visible between step controls and restore large type for shorter units', () => {
  const w = watch();
  w.tap('Mode');
  w.tap('Start');
  w.tap('More');
  for (let i = 0; i < 5; i++) w.tap(w.labels().find((label) => label.startsWith('Step ')));
  w.tap('Back');
  for (let i = 0; i < 5; i++) w.tap('+');
  w.tap('Unit'); // km
  w.tap('Unit'); // in
  assert.equal(w.page.widgets.activeValueMedium.props.text, '12007.874 in');
  assert.equal(w.page.widgets.activeValueMedium.props.visible, true);
  assert.equal(w.page.widgets.activeValue.props.visible, false);
  for (let i = 0; i < 4; i++) w.tap('Unit'); // cm
  assert.equal(w.page.widgets.activeValue.props.text, '30500 cm');
  assert.equal(w.page.widgets.activeValue.props.visible, true);
  assert.equal(w.page.widgets.activeValueMedium.props.visible, false);
  assert.equal(w.page.active.events.length, 0);
});

test('unitless simple counts offer correction without classification or quantity controls', () => {
  const w = watch();
  w.tap('Mode');
  for (let i = 0; i < 3; i++) w.tap('Measure');
  w.tap('Start');
  assert.deepEqual(w.labels(), ['Record rep', 'Undo', 'More', 'Finish']);
  w.tap('Record rep');
  assert.equal(w.page.widgets.activeValue.props.text, '1 rep');
  assert.equal(w.page.widgets.activeTotal.props.text, '1 total');
  w.tap('Undo');
  assert.equal(w.page.widgets.activeHere.props.text, '0 here');
  assert.equal(w.page.active.events.length, 0);
});

test('an out-of-range step leaves selected value and events intact with visible feedback', () => {
  const w = watch();
  w.tap('Start');
  for (let i = 0; i < 4; i++) w.tap('−');
  assert.equal(w.page.widgets.activeValue.props.text, '1 m');
  w.tap('−');
  assert.equal(w.page.widgets.activeValue.props.text, '1 m');
  assert.equal(w.page.active.events.length, 0);
  assert.equal(w.page.widgets.subtitle.props.text, 'Value limit reached');
});

test('committed summary freezes active events across failed clear and restart', () => {
  const w = watch();
  w.tap('Start');
  w.tap('✓ Success');
  w.failNext((path) => path.startsWith('tallyform-active-pointer-'));
  w.tap('Finish');
  w.tap('Yes');
  assert.equal(w.page.history.length, 1);
  assert.equal(w.page.active.events.length, 1);
  assert.deepEqual(w.labels(), ['Complete finish']);
  assert.equal(w.key(2, 1), false);
  const reopened = watch({ files: w.files });
  assert.equal(reopened.page.view, 'active');
  assert.deepEqual(reopened.labels(), ['Complete finish']);
  reopened.tap('Complete finish');
  assert.equal(reopened.page.history.length, 1);
  assert.equal(watch({ files: w.files }).page.active, null);
});

test('failed active write shows no false success and reopens committed record', () => {
  const w = watch();
  w.tap('Start');
  w.failNext((path) => path.startsWith('tallyform-active-generation-'));
  w.tap('✓ Success');
  assert.equal(w.page.active.events.length, 0);
  assert.match(w.page.widgets.subtitle.props.text, /Save not confirmed/);
  assert.equal(watch({ files: w.files }).page.active.events.length, 0);
});

test('legacy snapshot imports once, preserves outcomes and keys, and never reappears after discard', () => {
  const raw = JSON.stringify({ version: 1, unit: 'ft', distanceM: 3.048,
    keys: { silver: 2, red: 9 }, attempts: [{ distanceM: 3.048, made: true }] });
  const w = watch({ legacy: raw });
  assert.equal(w.page.view, 'active');
  assert.equal(w.page.active.events[0].value, 3048000);
  w.tap('Finish');
  assert.equal(w.key(2, 1), false);
  w.tap('Cancel');
  assert.equal(w.key(2, 0), true);
  assert.equal(w.page.active.events.length, 1);
  assert.equal(w.key(9, 1), true);
  assert.equal(w.page.active.events.length, 2);
  w.tap('More');
  w.tap('Discard');
  w.tap('Yes');
  const reopened = watch({ files: w.files, legacy: raw });
  assert.equal(reopened.page.view, 'setup');
  assert.equal(reopened.reads, 0);
  assert.equal(reopened.page.history.length, 0);
});

test('corrupt active pointer preserves access to independently committed history', () => {
  const w = watch();
  w.tap('Start');
  w.tap('✓ Success');
  w.tap('Finish');
  w.tap('Yes');
  w.files.set('tallyform-active-pointer-a.json', '{torn');
  const reopened = watch({ files: w.files });
  assert.equal(reopened.page.view, 'recovery');
  assert.ok(reopened.labels().includes('Safe history'));
  reopened.tap('Safe history');
  assert.equal(reopened.page.history.length, 1);
  reopened.tap('Open');
  assert.equal(reopened.page.history[0].totals.count, 1);
});

test('corrupt history pointer blocks finish but does not block independent active records', () => {
  const w = watch();
  w.tap('Start');
  w.tap('✓ Success');
  w.files.set('tallyform-history-pointer-a.json', '{torn');
  const reopened = watch({ files: w.files });
  assert.equal(reopened.page.view, 'recovery');
  assert.ok(reopened.labels().includes('Active session'));
  reopened.tap('Active session');
  assert.equal(reopened.labels().includes('Finish'), false);
  assert.match(reopened.page.widgets.subtitle.props.text, /Finish blocked/);
  assert.equal(reopened.page.widgets.finish.props.visible, false);
  reopened.tap('✓ Success');
  assert.equal(watch({ files: w.files }).page.active.events.length, 2);
});

test('discarding a later active session leaves earlier saved history intact', () => {
  const w = watch();
  w.tap('Start');
  w.tap('✓ Success');
  w.tap('Finish');
  w.tap('Yes');
  w.tap('New session');
  w.tap('Mode');
  w.tap('Start');
  w.tap('Record rep');
  w.tap('More');
  w.tap('Discard');
  w.tap('Yes');
  const reopened = watch({ files: w.files });
  assert.equal(reopened.page.active, null);
  assert.equal(reopened.page.history.length, 1);
  assert.equal(reopened.page.history[0].totals.count, 1);
});
