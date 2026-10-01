import * as ui from '@zos/ui';
import { set, cancel } from '@zos/alarm';
import { LocalStorage } from '@zos/storage';
import { exit } from '@zos/router';
import { px } from '@zos/utils';

import { readProbeFile, writeProbeFile } from '../probe-file';
import { PLAN, PLAN_FILE, RUN_FILE, ORPHAN, resultKey, receiptKey,
  snapshotFile, resultFile, receiptFile, validPlan } from '../probe-state';

const CHECKS = [
  { role: 'bg', delay: 30 },
  { role: 'dup', delay: 60 },
  { role: 'stale', delay: 75 },
];
let sequence = 0;

Page({
  onInit() {
    this.storage = null;
    this.plan = null;
    this.fileStatus = 'missing';
    this.lastRun = null;
    this.mirrorRunId = null;
    try {
      const saved = this.readPlan();
      this.plan = saved.plan;
      this.fileStatus = saved.status;
    } catch (error) {
      this.fileStatus = 'unreadable';
    }
    this.lastRun = this.readRunIndex();
    if (this.plan && this.lastRun && this.plan.runId !== this.lastRun.runId) {
      this.plan = null;
      this.fileStatus = 'index mismatch';
    }
    try {
      this.storage = new LocalStorage();
      const mirror = this.storage.getItem(PLAN);
      if (mirror) {
        try { this.mirrorRunId = JSON.parse(mirror).runId || null; } catch (error) {
          this.mirrorRunId = 'invalid';
        }
      }
    } catch (error) {
      this.storage = null;
      console.log(`Alarm self-test receipt storage unavailable: ${error}`);
    }
    this.message = this.plan ? 'Saved report; check each row'
      : `Plan file ${this.fileStatus}; new or lost`;
    this.widgets = {};
    this.exitTimer = 0;
  },

  build() {
    ui.setStatusBarVisible(false);
    const text = (y, value, size = 18) => ui.createWidget(ui.widget.TEXT, {
      x: px(22), y: px(y), w: px(388), h: px(33), text: value,
      text_size: px(size), color: 0xffffff,
      align_h: ui.align.CENTER_H, align_v: ui.align.CENTER_V,
    });
    text(20, 'ALARM TEST 0.0.9', 26);
    this.widgets.message = text(62, this.message, 19);
    this.widgets.go = ui.createWidget(ui.widget.BUTTON, {
      x: px(48), y: px(106), w: px(336), h: px(58), radius: px(14),
      text: 'GO', text_size: px(30), color: 0xffffff,
      normal_color: 0x237349, press_color: 0x42594d, click_func: () => this.go(),
    });
    this.widgets.rows = [];
    for (let i = 0; i < 9; i++) this.widgets.rows.push(text(176 + i * 34, '', 17));
    this.render();
  },

  readPlan() {
    const raw = readProbeFile(PLAN_FILE);
    if (typeof raw !== 'string') return { plan: null, status: 'missing' };
    try {
      const plan = JSON.parse(raw);
      if (validPlan(plan)) return { plan, status: 'readable' };
    } catch (error) {
      console.log(`Alarm self-test plan parse failed: ${error}`);
    }
    return { plan: null, status: 'invalid' };
  },

  readRunIndex() {
    try {
      const raw = readProbeFile(RUN_FILE);
      if (!raw) return null;
      const index = JSON.parse(raw);
      if (index.version === 9 && index.runId && index.tokens && index.startedAt) {
        return { version: 9, runId: index.runId, startedAt: index.startedAt,
          tokens: index.tokens, status: 'plan-file-missing' };
      }
    } catch (error) {
      console.log(`Alarm self-test run index unavailable: ${error}`);
    }
    return null;
  },

  commit(plan) {
    if (!this.storage) return false;
    try {
      const raw = JSON.stringify(plan);
      if (!writeProbeFile(PLAN_FILE, raw)) return false;
      this.storage.setItem(PLAN, raw);
      return new LocalStorage().getItem(PLAN) === raw;
    } catch (error) {
      console.log(`Alarm self-test plan write failed: ${error}`);
      return false;
    }
  },

  go() {
    if (this.fileStatus !== 'missing' && this.fileStatus !== 'readable') {
      this.message = `Plan ${this.fileStatus}; no new alarms`;
      this.render();
      return;
    }
    const previous = this.plan || this.lastRun;
    if (previous && Date.now() < previous.startedAt + 90000) {
      this.message = 'Wait for this run to finish';
      this.render();
      return;
    }
    const runId = `${Date.now().toString(36)}-${++sequence}`;
    const plan = { version: 9, runId, startedAt: Date.now(), status: 'pending',
      tokens: { bg: `${runId}/bg` }, ids: {} };
    try {
      const index = { version: 9, runId, startedAt: plan.startedAt, tokens: plan.tokens };
      if (!writeProbeFile(RUN_FILE, JSON.stringify(index))) {
        this.message = 'Run index write failed; no alarms';
        this.render();
        return;
      }
      this.lastRun = { version: 9, runId, startedAt: plan.startedAt, tokens: plan.tokens,
        status: 'plan-file-missing' };
    } catch (error) {
      this.message = 'Run index write failed; no alarms';
      this.render();
      return;
    }
    if (!this.commit(plan)) {
      this.message = 'Plan write failed; no alarms';
      this.render();
      return;
    }
    try {
      for (const { role, delay } of CHECKS) {
        const token = role === 'stale' ? `${runId}/obsolete` : plan.tokens.bg;
        const id = set({ url: 'app-service/alarm', delay, store: true,
          param: `${runId}|${role}|${token}` });
        if (!id) {
          plan.status = 'schedule-failed';
          plan.failedRole = role;
          break;
        }
        plan.ids[role] = id;
      }
      if (plan.status === 'pending') plan.status = 'armed';
      if (!this.commit(plan)) {
        plan.status = 'commit-failed';
      }
    } catch (error) {
      plan.status = 'native-error';
      plan.error = String(error);
    }
    if (plan.status !== 'armed') {
      let cleanupFailures = 0;
      for (const role of Object.keys(plan.ids)) {
        try {
          if (cancel(plan.ids[role]) !== 0) cleanupFailures++;
        } catch (error) {
          cleanupFailures++;
        }
      }
      plan.cleanupFailures = cleanupFailures;
      this.commit(plan);
      this.message = `Aborted: ${plan.status}${cleanupFailures ? ' cleanup failed' : ''}`;
      this.plan = plan;
      this.render();
      return;
    }
    this.plan = plan;
    this.message = 'Running; exits after 9s';
    this.render();
    this.exitTimer = setTimeout(() => {
      this.exitTimer = 0;
      this.snapshotExit(plan);
      exit();
    }, 9000);
  },

  snapshotExit(plan) {
    try {
      if (!writeProbeFile(snapshotFile(plan.runId),
        JSON.stringify({ version: 9, runId: plan.runId }))) {
        console.log('Alarm self-test exit snapshot unreadable');
      }
    } catch (error) {
      console.log(`Alarm self-test exit snapshot failed: ${error}`);
    }
  },

  render() {
    if (!this.widgets.message) return;
    this.widgets.message.setProperty(ui.prop.TEXT, this.message);
    const plan = this.plan || this.lastRun;
    if (!plan) {
      this.widgets.rows[0].setProperty(ui.prop.TEXT,
        `File ${this.fileStatus}; mirror ${this.mirrorRunId || 'none'}`);
      this.widgets.rows[1].setProperty(ui.prop.TEXT,
        'After GO? Saved state lost; do not retry');
      if (this.mirrorRunId && this.mirrorRunId !== 'invalid') {
        try {
          const raw = readProbeFile(resultFile(this.mirrorRunId, 'bg'));
          this.widgets.rows[2].setProperty(ui.prop.TEXT,
            raw ? `Off-screen BG: ${JSON.parse(raw).code}` : 'Off-screen BG: no file report');
        } catch (error) {
          this.widgets.rows[2].setProperty(ui.prop.TEXT, 'Off-screen BG: unreadable');
        }
      }
      return;
    }
    let storage = null;
    try { storage = new LocalStorage(); } catch (error) {
      console.log(`Alarm self-test report storage failed: ${error}`);
    }
    let snapshotStatus = 'missing';
    try {
      const raw = readProbeFile(snapshotFile(plan.runId));
      if (typeof raw === 'string') {
        const saved = JSON.parse(raw);
        snapshotStatus = saved.version === 9 && saved.runId === plan.runId
          ? 'saved' : 'invalid';
      }
    } catch (error) {
      snapshotStatus = 'unreadable';
    }
    const roles = ['bg', 'dup', 'stale'];
    const outcomes = {};
    for (const role of roles) {
      try {
        const file = readProbeFile(resultFile(plan.runId, role));
        const stored = storage && storage.getItem(resultKey(plan.runId, role));
        outcomes[role] = file ? JSON.parse(file) : stored ? JSON.parse(stored) : null;
      } catch (error) {
        outcomes[role] = { code: 'corrupt-report' };
      }
    }
    const line = (role, label) => {
      const event = outcomes[role];
      if (!event) return `${label}: no callback report`;
      const ms = event.workMs === null || event.workMs === undefined ? '?' : event.workMs;
      if (event.code === 'notified' || event.code === 'duplicate-notified') {
        return `${label}: alert #${event.notificationId} p=${event.parameterMatched ? 1 : 0} r=${event.receipt ? 1 : 0} ${ms}ms`;
      }
      return `${label}: ${event.code} ${ms}ms`;
    };
    let bgReceipt = false;
    let orphan = false;
    try {
      bgReceipt = readProbeFile(receiptFile(plan.runId)) === plan.tokens.bg
        || storage && storage.getItem(receiptKey(plan.runId)) === plan.tokens.bg;
      orphan = storage && !!storage.getItem(ORPHAN);
    } catch (error) {
      snapshotStatus = 'storage error';
    }
    const rows = [
      `Run ${plan.runId} (${plan.status})`,
      plan.status === 'armed' ? 'Set 3; control 30s'
        : `Scheduling: ${plan.status}${plan.failedRole ? ` @${plan.failedRole}` : ''}${plan.cleanupFailures ? ` cleanup ${plan.cleanupFailures}` : ''}`,
      line('bg', 'Control 30s'),
      line('dup', 'Duplicate 60s'),
      line('stale', 'Stale 75s'),
      `Receipt BG:${bgReceipt || outcomes.bg && outcomes.bg.receipt ? 'yes' : 'no'}`,
      orphan ? 'Other callback logged; report it' : `Exit snapshot: ${snapshotStatus}`,
      'After 85s: expect ONE alert',
      'Missing row is NOT suppression',
    ];
    for (let i = 0; i < rows.length; i++) this.widgets.rows[i].setProperty(ui.prop.TEXT, rows[i]);
  },

  onDestroy() {
    clearTimeout(this.exitTimer);
    ui.setStatusBarVisible(true);
  },
});
