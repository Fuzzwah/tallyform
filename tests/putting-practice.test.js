import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as session from '../page/session.js';
const { newSession, transition, totals, distanceLabel, loadSession, saveSession, STORAGE_KEY } = session;

class Storage {
  getItem(key) { return this[key]; }
  setItem(key, value) { this[key] = value; }
}

test('distance unit conversion preserves physical distance and recorded groups', () => {
  let state = { ...newSession(), unit: 'ft', distanceM: 3.048 };
  state = transition(state, { type: 'record', made: true });
  state = transition(state, { type: 'unit' });
  assert.equal(distanceLabel(state), '3.05 m');
  assert.equal(state.distanceM, 3.048);
  assert.equal(totals(state, 3.048).made, 1);
  state = transition(state, { type: 'unit' });
  state = transition(state, { type: 'step', direction: 1 });
  assert.equal(distanceLabel(state), '11 ft');
  assert.equal(state.distanceM, 3.3528);
  assert.equal(totals(state, state.distanceM).count, 0);
  state = transition(state, { type: 'step', direction: -1 });
  assert.equal(totals(state, state.distanceM).made, 1);
});

test('steps clamp to positive bounds and repeated feet steps have no floating drift', () => {
  let state = { ...newSession(), unit: 'ft', distanceM: 0.3048 };
  assert.equal(transition(state, { type: 'step', direction: -1 }).distanceM, 0.3048);
  for (let i = 0; i < 110; i++) state = transition(state, { type: 'step', direction: 1 });
  assert.equal(state.distanceM, 30.48);
  for (let i = 0; i < 90; i++) state = transition(state, { type: 'step', direction: -1 });
  assert.equal(state.distanceM, 3.048);
});

test('mixed-distance totals, undo, empty rate, bounded session and reset settings', () => {
  let state = newSession();
  assert.equal(totals(state).percent, null);
  state = transition(state, { type: 'record', made: true });
  state = transition(state, { type: 'record', made: false });
  state = transition(state, { type: 'step', direction: 1 });
  state = transition(state, { type: 'record', made: true });
  assert.deepEqual(totals(state), { made: 2, missed: 1, count: 3, percent: 67 });
  assert.deepEqual(totals(state, 5), { made: 1, missed: 1, count: 2, percent: 50 });
  state = transition(state, { type: 'step', direction: 1 });
  state = transition(state, { type: 'undo' });
  assert.equal(totals(state, 6).count, 0);
  assert.equal(state.distanceM, 7);
  const full = { ...state, attempts: Array.from({ length: 1000 }, () => ({ distanceM: 5, made: true })) };
  assert.throws(() => transition(full, { type: 'record', made: false }), /1000/);
  const reset = transition(state, { type: 'reset' });
  assert.equal(reset.distanceM, 7);
  assert.equal(reset.attempts.length, 0);
  assert.equal(state.attempts.length, 2);
});

test('snapshot validation rejects corruption, future versions, and invalid outcomes', () => {
  const storage = new Storage();
  assert.deepEqual(loadSession(storage), newSession());
  const state = transition(newSession(), { type: 'keys', keys: { silver: 1, red: 2 } });
  saveSession(storage, state);
  assert.deepEqual(loadSession(storage), state);
  for (const invalid of [null, { ...state, version: 2 }, { ...state, distanceM: -1 },
    { ...state, keys: { silver: 1, red: 1 } }, { ...state, attempts: [{ distanceM: 5, made: 1 }] }]) {
    storage.setItem(STORAGE_KEY, JSON.stringify(invalid));
    assert.throws(() => loadSession(storage));
  }
  storage.setItem(STORAGE_KEY, '{broken');
  assert.throws(() => loadSession(storage));
  assert.throws(() => saveSession({ setItem() {}, getItem() {} }, state), /verification/);
});

function pageHarness(storage = new Storage()) {
  let page, keyCallback, gestureCallback, exited = false, removed = 0;
  const buttons = {};
  const ui = {
    widget: { TEXT: 'text', BUTTON: 'button' }, prop: { TEXT: 'text', VISIBLE: 'visible' }, align: {}, setStatusBarVisible() {},
    createWidget(type, props) {
      const widget = { ...props, setProperty(prop, value) { this[prop] = value; } };
      if (type === 'button') buttons[props.text] = widget;
      assert.ok(props.y + props.h <= 450);
      assert.ok(props.x + props.w <= 390);
      return widget;
    },
  };
  const source = readFileSync(new URL('../page/index.js', import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?from '[^']+';\n/gm, '');
  vm.runInNewContext(source, { ...session, ui, console, px: (value) => value * 390 / 432, Page(value) { page = value; },
    LocalStorage: function () { return storage; }, exit() { exited = true; },
    KEY_EVENT_CLICK: 3, GESTURE_UP: 1, GESTURE_DOWN: 2,
    onKey(fn) { keyCallback = fn; }, onGesture(fn) { gestureCallback = fn; },
    offKey() { removed++; }, offGesture() { removed++; },
  });
  page.onInit(); page.build();
  return { page, buttons, storage, key: (...args) => keyCallback(...args),
    gesture: (value) => gestureCallback(value), exited: () => exited, removed: () => removed };
}

test('watch adapter calibrates colours, counts clicks only, swipes and cleans up', () => {
  const h = pageHarness();
  h.key(10, 1); h.key(10, 3); h.key(10, 2);
  assert.equal(h.page.setup, 'red');
  h.key(10, 3);
  assert.equal(h.page.setup, 'red');
  h.key(20, 3); h.key(20, 2);
  assert.equal(h.page.setup, null);
  assert.equal(h.page.session.attempts.length, 0);
  for (const event of [1, 2, 4, 5]) h.key(10, event);
  assert.equal(h.page.session.attempts.length, 0);
  h.key(10, 3); h.key(20, 3);
  assert.equal(totals(h.page.session).made, 1);
  assert.equal(totals(h.page.session).missed, 1);
  assert.equal(h.key(30, 3), false);
  h.page.widgets.feet.click_func();
  h.page.widgets.feet.click_func();
  assert.equal(h.page.session.unit, 'ft');
  assert.equal(h.page.widgets.feetActive.visible, true);
  h.page.widgets.metres.click_func();
  assert.equal(h.page.session.distanceM, 5);
  h.gesture(1);
  assert.equal(h.page.session.distanceM, 6);
  h.buttons.Undo.click_func();
  assert.equal(totals(h.page.session, 5).missed, 0);
  h.page.widgets.missed.click_func();
  assert.equal(totals(h.page.session, 6).missed, 1);
  h.buttons.Exit.click_func();
  assert.equal(h.exited(), true);
  h.page.onDestroy();
  assert.equal(h.removed(), 2);
  const restored = pageHarness(h.storage);
  assert.deepEqual(restored.page.session, JSON.parse(JSON.stringify(h.page.session)));
});

test('reset confirmation blocks scores, cancel retains data, reset preserves settings', () => {
  const h = pageHarness();
  // The harness indexes buttons by their initial label.
  h.page.widgets.setup.click_func();
  h.page.widgets.made.click_func();
  h.buttons.Reset.click_func();
  h.page.widgets.missed.click_func(); h.key(20, 3); h.gesture(1);
  assert.equal(h.page.session.attempts.length, 1);
  h.buttons.Undo.click_func();
  assert.equal(h.page.session.attempts.length, 1);
  h.buttons.Reset.click_func(); h.buttons.Reset.click_func();
  assert.equal(h.page.session.attempts.length, 0);
  assert.equal(h.page.session.distanceM, 5);
});

test('failed write never updates displayed state; invalid recovery requires explicit reset', () => {
  const h = pageHarness();
  h.storage.setItem = () => { throw new Error('full'); };
  h.page.widgets.made.click_func();
  assert.equal(h.page.session.attempts.length, 0);
  assert.match(h.page.message, /Save failed/);
  const storage = new Storage();
  storage.setItem(STORAGE_KEY, '{corrupt');
  const broken = pageHarness(storage);
  broken.page.widgets.made.click_func();
  assert.equal(storage.getItem(STORAGE_KEY), '{corrupt');
  broken.buttons.Reset.click_func(); broken.buttons.Reset.click_func();
  assert.equal(broken.page.blocked, false);
  assert.equal(loadSession(storage).attempts.length, 0);
});
