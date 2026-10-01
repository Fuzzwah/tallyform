import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = (name) => readFileSync(new URL(`../experiments/alarm-qualification/${name}`, import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?from '[^']+';\n/gm, '').replace(/^export /gm, '');

function watch({ fileWritesFail = false, wakeOnNotify = false, failRole = null,
  rejectBackground = false } = {}) {
  const files = new Map();
  const stored = new Map();
  const alarms = [];
  const cancelled = [];
  const notifications = [];
  const timers = [];
  let page;
  let service;
  let now = 100000;
  let screen = 1;
  let serviceRunning = false;
  let exited = false;
  let storageUnavailable = false;

  class LocalStorage {
    constructor() {
      if (storageUnavailable) throw new Error('receipt store unavailable');
      this.items = new Map(stored);
    }
    getItem(key) { return this.items.get(key); }
    setItem(key, value) {
      this.items.set(key, value);
      stored.clear();
      for (const [name, entry] of this.items) stored.set(name, entry);
    }
  }
  const ui = {
    widget: { TEXT: 1, BUTTON: 2 }, prop: { TEXT: 'text' }, align: {}, setStatusBarVisible() {},
    createWidget(type, props) {
      return { ...props, setProperty(property, value) { this[property] = value; } };
    },
  };
  const context = vm.createContext({
    console, ui, LocalStorage, px: (value) => value, Date: { now: () => now },
    getSettings: () => ({ screen: { status: screen } }),
    readFileSync: ({ path }) => files.get(path),
    writeFileSync: ({ path, data }) => {
      if (fileWritesFail) return;
      if (serviceRunning && screen === 1) throw new Error('screen-on service file write');
      files.set(path, data);
    },
    set: (options) => {
      if (options.param.split('|')[1] === failRole) return 0;
      const id = alarms.length + 1;
      alarms.push({ id, ...options });
      return id;
    },
    cancel: (id) => { cancelled.push(id); return 0; },
    notify: (options) => {
      notifications.push(options);
      if (wakeOnNotify) screen = 1;
      if (rejectBackground && options.content.startsWith('Background')) return 0;
      return notifications.length;
    },
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; },
    clearTimeout() {},
    exit: () => { exited = true; stored.clear(); },
    Page: (value) => { page = value; },
    AppService: (value) => { service = value; },
  });
  for (const name of ['probe-state.js', 'probe-file.js', 'app-service/alarm.js', 'page/index.js']) {
    vm.runInContext(source(name), context);
  }
  return {
    files, alarms, cancelled, notifications, timers,
    get exited() { return exited; },
    loseStorage() { storageUnavailable = true; },
    setScreen(status) { screen = status; },
    open() { const current = Object.assign({}, page); current.onInit(); current.build(); return current; },
    deliver(role, delay, display = 1) {
      const alarm = alarms.find((item) => item.param.split('|')[1] === role);
      assert.ok(alarm, `scheduled ${role}`);
      now = 100000 + delay * 1000;
      screen = display;
      serviceRunning = true;
      service.onInit(alarm.param);
      serviceRunning = false;
      if (exited) stored.clear();
    },
    leave() { now = 109000; timers.find((timer) => timer.delay === 9000).fn(); },
  };
}

test('off-screen control establishes a durable receipt before duplicate and stale callbacks', () => {
  const device = watch();
  const page = device.open();
  page.widgets.go.click_func();
  const runId = page.plan.runId;
  assert.equal(page.plan.status, 'armed');
  device.leave();
  device.deliver('bg', 30, 2);
  device.deliver('dup', 60, 2);
  device.deliver('stale', 75, 2);
  const rows = device.open().widgets.rows.map((item) => item.text);
  assert.match(rows[0], new RegExp(runId));
  assert.match(rows[2], /Control 30s: alert #/);
  assert.match(rows[3], /Duplicate 60s: duplicate-suppressed/);
  assert.match(rows[4], /Stale 75s: stale-suppressed/);
  assert.match(rows[5], /Receipt BG:yes/);
  assert.match(rows[6], /Exit snapshot: saved/);
  assert.equal(device.notifications.length, 1);
  assert.equal(device.files.get(`alarm-qualification-${runId}-bg-receipt-v9.txt`),
    page.plan.tokens.bg);
});

test('lit-screen duplicate reads the file receipt without another notification or forbidden service write', () => {
  const device = watch();
  const page = device.open();
  page.widgets.go.click_func();
  device.leave();
  device.deliver('bg', 30, 2);
  device.deliver('dup', 60, 1);
  assert.equal(device.notifications.length, 1);
  assert.equal(device.files.has(`alarm-qualification-${page.plan.runId}-dup-v9.json`), false);
  device.deliver('dup', 60, 2);
  assert.match(device.open().widgets.rows[3].text, /duplicate-suppressed/);
  assert.equal(device.notifications.length, 1);
});

test('control notification waking the display cannot turn preflight into a false success report', () => {
  const device = watch({ wakeOnNotify: true });
  const page = device.open();
  page.widgets.go.click_func();
  device.leave();
  device.deliver('bg', 30, 2);
  device.deliver('dup', 60, 2);
  const rows = device.open().widgets.rows.map((item) => item.text);
  assert.match(rows[2], /notification-attempt/);
  assert.doesNotMatch(rows[2], /alert #/);
  assert.match(rows[3], /duplicate-suppressed/);
  assert.equal(device.notifications.length, 1);
});

test('rejected control notification clears the off-screen receipt rather than claiming suppression', () => {
  const device = watch({ rejectBackground: true });
  const page = device.open();
  page.widgets.go.click_func();
  device.leave();
  device.deliver('bg', 30, 2);
  const rows = device.open().widgets.rows.map((item) => item.text);
  assert.match(rows[2], /notification-rejected/);
  assert.match(rows[5], /Receipt BG:no/);
  assert.equal(device.files.get(`alarm-qualification-${page.plan.runId}-bg-receipt-v9.txt`), '');
});

test('missing or corrupt committed plan blocks alerts and preserves independent run evidence', () => {
  for (const broken of [null, '{"version":9,"status":"armed"}']) {
    const device = watch();
    const page = device.open();
    page.widgets.go.click_func();
    const runId = page.plan.runId;
    device.leave();
    if (broken === null) device.files.delete('alarm-qualification-plan-v9.json');
    else device.files.set('alarm-qualification-plan-v9.json', broken);
    device.deliver('bg', 30, 2);
    const reopened = device.open();
    assert.match(reopened.widgets.rows[0].text, new RegExp(runId));
    assert.match(reopened.widgets.rows[2].text,
      broken === null ? /missing-plan-file/ : /invalid-plan-file/);
    assert.equal(device.notifications.length, 0);
    reopened.widgets.go.click_func();
    assert.equal(device.alarms.length, 3);
    assert.match(reopened.widgets.message.text,
      broken === null ? /Wait for this run to finish/ : /Plan invalid; no new alarms/);
  }
});

test('rejected run-index commit schedules nothing', () => {
  const device = watch({ fileWritesFail: true });
  const page = device.open();
  page.widgets.go.click_func();
  assert.equal(device.alarms.length, 0);
  assert.match(page.widgets.message.text, /Run index write failed; no alarms/);
});

test('partial scheduling failure cancels prior alarms and retains the failed role', () => {
  const device = watch({ failRole: 'stale' });
  const page = device.open();
  page.widgets.go.click_func();
  assert.equal(page.plan.status, 'schedule-failed');
  assert.deepEqual(device.cancelled, [1, 2]);
  assert.match(device.open().widgets.rows[1].text, /schedule-failed @stale/);
  assert.equal(device.notifications.length, 0);
});

test('file-backed plan remains readable after page exit with LocalStorage unavailable', () => {
  const device = watch();
  const page = device.open();
  page.widgets.go.click_func();
  const runId = page.plan.runId;
  device.leave();
  device.loseStorage();
  const reopened = device.open();
  assert.equal(reopened.plan.runId, runId);
  assert.match(reopened.widgets.rows[6].text, /Exit snapshot: saved/);
});
