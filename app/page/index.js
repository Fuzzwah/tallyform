import * as ui from '@zos/ui';
import { LocalStorage } from '@zos/storage';
import { exit } from '@zos/router';
import { px } from '@zos/utils';
import { onKey, offKey, onGesture, offGesture, KEY_EVENT_CLICK,
  GESTURE_UP, GESTURE_DOWN } from '@zos/interaction';
import { createPracticeSession, practiceTransition, practiceTotals } from './session';
import { UNITS, fromCanonical, fromCanonicalStep } from './measurements';
import { createPracticeSummary } from './summary';
import { migrateLegacy } from './migration';
import { openNativeRepository } from './storage-native';

const TYPES = ['distance', 'weight', 'duration', 'none'];
const MODES = ['simple', 'outcome'];
const STEPS = [0.1, 0.5, 1, 2, 5, 10, 30, 60];
const buttonPositions = [
  [24, 260], [222, 260], [24, 318], [222, 318],
  [24, 376], [222, 376], [24, 434], [222, 434],
];
const baseText = ['heading', 'value', 'status'];
const activeText = ['activeHeading', 'activeValue', 'activeValueMedium', 'activeValueSmall', 'activeHere', 'activeTotal'];
const activeButtons = ['decrease', 'increase', 'success', 'failure', 'record',
  'undo', 'more', 'unit', 'finish'];

Page({
  onInit() {
    this.repo = null;
    this.active = null;
    this.history = [];
    this.issue = null;
    this.activeIssue = null;
    this.historyIssue = null;
    this.message = '';
    this.mode = 'outcome';
    this.type = 'distance';
    this.view = 'setup';
    this.historyIndex = 0;
    this.groupIndex = 0;
    this.widgets = {};
    this.actions = [];
    try {
      this.repo = openNativeRepository();
      const history = this.repo.loadHistory();
      const active = this.repo.loadActive();
      this.history = history.value;
      this.active = active.value;
      this.historyIssue = history.issue;
      this.activeIssue = active.issue;
      if (history.issue || active.issue) {
        this.issue = history.issue || active.issue;
      } else if (!this.active) {
        // A committed null active record is a migration tombstone.
        const migrated = migrateLegacy(this.repo, new LocalStorage());
        this.active = migrated.value;
        this.activeIssue = migrated.issue;
        this.issue = migrated.issue;
      }
      this.view = this.issue ? 'recovery' : this.active ? 'active' : 'setup';
    } catch (error) {
      this.issue = String(error);
      this.view = 'recovery';
      console.log(`Practice recovery: ${error}`);
    }
  },

  build() {
    ui.setStatusBarVisible(false);
    const text = (name, x, y, w, h, size, color) => {
      this.widgets[name] = ui.createWidget(ui.widget.TEXT, {
        x: px(x), y: px(y), w: px(w), h: px(h), text: '', text_size: px(size),
        color, align_h: ui.align.CENTER_H, align_v: ui.align.CENTER_V,
      });
    };
    this.widgets.baseCard = ui.createWidget(ui.widget.FILL_RECT, {
      x: px(24), y: px(100), w: px(384), h: px(110), radius: px(22), color: 0x143726,
    });
    text('title', 24, 20, 384, 38, 28, 0xffffff);
    text('subtitle', 24, 62, 384, 28, 20, 0xbac7c0);
    text('heading', 35, 109, 362, 35, 21, 0x84f5a1);
    text('value', 35, 145, 362, 56, 34, 0xffffff);
    text('status', 24, 212, 384, 43, 17, 0xffffff);
    this.widgets.buttons = buttonPositions.map(([x, y], slot) => ui.createWidget(ui.widget.BUTTON, {
      x: px(x), y: px(y), w: px(186), h: px(48), radius: px(12),
      text: '', text_size: px(19), color: 0xffffff,
      normal_color: slot === 0 ? 0x398e50 : 0x29352f,
      press_color: 0x42594d, click_func: () => this.press(slot),
    }));
    this.widgets.activeCard = ui.createWidget(ui.widget.FILL_RECT, {
      x: px(18), y: px(85), w: px(396), h: px(206), radius: px(26), color: 0x103b29,
    });
    text('activeHeading', 30, 96, 372, 32, 23, 0xa4f8be);
    text('activeValue', 98, 137, 236, 76, 42, 0xffffff);
    text('activeValueMedium', 98, 137, 236, 76, 30, 0xffffff);
    text('activeValueSmall', 98, 137, 236, 76, 22, 0xffffff);
    text('activeHere', 34, 244, 170, 33, 21, 0xffffff);
    text('activeTotal', 222, 244, 176, 33, 21, 0xffffff);
    const activeButton = (name, slot, x, y, w, h, label, color, size = 20) => {
      this.widgets[name] = ui.createWidget(ui.widget.BUTTON, {
        x: px(x), y: px(y), w: px(w), h: px(h), radius: px(18),
        text: label, text_size: px(size), color: 0xffffff,
        normal_color: color, press_color: 0x42594d, click_func: () => this.press(slot),
      });
    };
    activeButton('decrease', 0, 28, 157, 64, 58, '−', 0x255c42, 30);
    activeButton('increase', 1, 340, 157, 64, 58, '+', 0x255c42, 30);
    activeButton('success', 2, 18, 303, 192, 62, '✓ Success', 0x188849, 22);
    activeButton('failure', 3, 222, 303, 192, 62, '× Failure', 0x793031, 22);
    activeButton('record', 4, 18, 303, 396, 62, 'Record rep', 0x188849, 23);
    activeButton('undo', 5, 18, 373, 124, 48, 'Undo', 0x29352f, 19);
    activeButton('more', 6, 150, 373, 124, 48, 'More', 0x29352f, 19);
    activeButton('unit', 7, 282, 373, 132, 48, 'Unit', 0x29352f, 19);
    activeButton('finish', 8, 18, 429, 396, 62, 'Finish', 0x146e42, 24);
    onKey((key, event) => this.handleKey(key, event));
    onGesture((gesture) => this.handleGesture(gesture));
    this.render();
  },

  press(slot) {
    const action = this.actions[slot];
    if (action) action();
  },

  committed(action) {
    if (!this.active || this.activeIssue || this.history.some((item) => item.id === this.active.id)) return false;
    let next;
    try {
      next = practiceTransition(this.active, action);
    } catch (error) {
      this.message = action.type === 'step' ? 'Value limit reached' : String(error);
      this.render();
      return false;
    }
    if (next === this.active) return true;
    try {
      this.repo.saveActive(next);
      this.active = next;
      this.message = '';
      this.render();
      return true;
    } catch (error) {
      const recovered = this.repo.loadActive();
      if (recovered.issue) { this.activeIssue = recovered.issue; this.issue = recovered.issue; this.view = 'recovery'; }
      else this.active = recovered.value;
      this.message = `Save not confirmed: ${error}`;
      this.render();
      return false;
    }
  },

  start() {
    if (this.active || this.activeIssue || this.historyIssue) return;
    try {
      const now = Date.now().toString(36);
      let suffix = 1;
      while (this.history.some((item) => item.id === `${now}-${suffix}`)) suffix++;
      const session = createPracticeSession({ id: `${now}-${suffix}`, mode: this.mode, type: this.type });
      this.repo.saveActive(session);
      this.active = session;
      this.view = 'active';
      this.message = '';
    } catch (error) {
      this.message = String(error);
    }
    this.render();
  },

  finish() {
    if (!this.active || this.activeIssue || this.historyIssue) return;
    try {
      const sessionId = this.active.id;
      if (!this.history.some((item) => item.id === sessionId)) {
        const finished = practiceTransition(this.active, { type: 'finish' });
        const summary = createPracticeSummary(finished, Date.now());
        this.repo.saveHistory(this.history.concat(summary));
        const saved = this.repo.loadHistory();
        if (saved.issue) throw new Error(saved.issue);
        this.history = saved.value;
      }
      this.repo.saveActive(null);
      this.active = null;
      this.historyIndex = this.history.findIndex((item) => item.id === sessionId);
      this.groupIndex = 0;
      this.view = 'detail';
      this.message = 'Session saved';
    } catch (error) {
      const saved = this.repo.loadHistory();
      const active = this.repo.loadActive();
      this.historyIssue = saved.issue;
      this.activeIssue = active.issue;
      if (saved.issue || active.issue) {
        this.issue = saved.issue || active.issue;
        this.view = 'recovery';
      } else {
        this.history = saved.value;
        this.active = active.value;
        this.view = this.active ? 'active' : 'history';
        if (!this.active) this.historyIndex = this.history.findIndex((item) => item.id === sessionId);
      }
      this.message = `Finish not confirmed: ${error}`;
    }
    this.render();
  },

  discard() {
    if (!this.active || this.activeIssue) return;
    try {
      this.repo.saveActive(null);
      this.active = null;
      this.view = 'setup';
      this.message = 'Active session discarded';
    } catch (error) {
      const recovered = this.repo.loadActive();
      if (recovered.issue) { this.activeIssue = recovered.issue; this.issue = recovered.issue; this.view = 'recovery'; }
      else { this.active = recovered.value; this.view = this.active ? 'active' : 'setup'; }
      this.message = `Discard not confirmed: ${error}`;
    }
    this.render();
  },

  deleteSummary() {
    if (this.historyIssue) return;
    const id = this.history[this.historyIndex].id;
    try {
      this.repo.saveHistory(this.history.filter((item) => item.id !== id));
      const saved = this.repo.loadHistory();
      if (saved.issue) throw new Error(saved.issue);
      this.history = saved.value;
      this.historyIndex = Math.min(this.historyIndex, this.history.length - 1);
      this.view = 'history';
      this.message = 'Summary deleted';
    } catch (error) {
      const saved = this.repo.loadHistory();
      if (saved.issue) { this.historyIssue = saved.issue; this.issue = saved.issue; this.view = 'recovery'; }
      else {
        this.history = saved.value;
        this.historyIndex = this.history.findIndex((item) => item.id === id);
        this.view = this.historyIndex < 0 ? 'history' : 'detail';
      }
      this.message = `Deletion not confirmed: ${error}`;
    }
    this.render();
  },

  stepSize() {
    if (!this.active || this.active.measurement.type === 'none') return;
    const m = this.active.measurement;
    const current = fromCanonicalStep(m.type, m.unit, m.step);
    const next = STEPS.find((value) => value > current + 0.000001) || STEPS[0];
    this.committed({ type: 'setStep', value: next });
  },

  formatValue(type, unit, value) {
    if (type === 'none') return 'No measurement';
    const displayed = fromCanonical(type, unit, value);
    return `${Number(displayed >= 0.001 ? displayed.toFixed(3) : displayed.toPrecision(3))} ${unit}`;
  },

  handleKey(key, event) {
    if (this.view !== 'active' || !this.active || this.activeIssue || !this.active.keys
      || this.history.some((item) => item.id === this.active.id)) return false;
    const keys = this.active.keys;
    if (key !== keys.silver && key !== keys.red) return false;
    if (event === KEY_EVENT_CLICK) {
      if (key === keys.silver) this.committed({ type: 'record', kind: this.active.mode === 'simple' ? 'rep' : 'success' });
      else this.committed(this.active.mode === 'simple' ? { type: 'undo' }
        : { type: 'record', kind: 'failure' });
    }
    return true;
  },

  handleGesture(gesture) {
    if (this.view !== 'active' || !this.active || this.activeIssue
      || this.active.measurement.type === 'none'
      || this.history.some((item) => item.id === this.active.id)
      || gesture !== GESTURE_UP && gesture !== GESTURE_DOWN) return false;
    this.committed({ type: 'step', direction: gesture === GESTURE_UP ? 1 : -1 });
    return true;
  },

  renderActive() {
    const m = this.active.measurement;
    const all = practiceTotals(this.active);
    const selected = practiceTotals(this.active, m.selected);
    const pendingFinish = this.history.some((item) => item.id === this.active.id);
    const measured = m.type !== 'none';
    const outcome = this.active.mode === 'outcome';
    const countLabel = outcome ? 'attempt' : 'rep';
    const available = !pendingFinish;
    const status = this.message
      ? this.message.startsWith('Save not confirmed') ? 'Save not confirmed' : this.message
      : this.historyIssue ? 'Finish blocked · history'
        : pendingFinish ? 'Summary saved · finish' : 'Reps & Practice Tracker';
    this.widgets.subtitle.setProperty(ui.prop.TEXT, status);
    this.widgets.baseCard.setProperty(ui.prop.VISIBLE, false);
    for (const name of baseText) {
      this.widgets[name].setProperty(ui.prop.VISIBLE, false);
    }
    for (const button of this.widgets.buttons) button.setProperty(ui.prop.VISIBLE, false);
    this.widgets.activeCard.setProperty(ui.prop.VISIBLE, true);
    for (const name of activeText) this.widgets[name].setProperty(ui.prop.VISIBLE, true);
    this.widgets.activeHeading.setProperty(ui.prop.TEXT, `${this.active.mode} · ${m.type}`);
    const value = measured
      ? this.formatValue(m.type, m.unit, m.selected)
      : `${all.count} ${countLabel}${all.count === 1 ? '' : 's'}`;
    const valueWidget = value.length >= 13 ? 'activeValueSmall'
      : value.length >= (measured ? 10 : 11) ? 'activeValueMedium' : 'activeValue';
    for (const name of ['activeValue', 'activeValueMedium', 'activeValueSmall']) {
      this.widgets[name].setProperty(ui.prop.VISIBLE, name === valueWidget);
    }
    this.widgets[valueWidget].setProperty(ui.prop.TEXT, value);
    this.widgets.activeHere.setProperty(ui.prop.TEXT, outcome
      ? `${selected.success}/${selected.count} here` : `${selected.count} here`);
    this.widgets.activeTotal.setProperty(ui.prop.TEXT, outcome
      ? `${all.percent === null ? '—' : `${all.percent}%`} total` : `${all.count} total`);

    this.actions = [];
    this.actions[0] = measured && available ? () => this.committed({ type: 'step', direction: -1 }) : null;
    this.actions[1] = measured && available ? () => this.committed({ type: 'step', direction: 1 }) : null;
    this.actions[2] = outcome && available ? () => this.committed({ type: 'record', kind: 'success' }) : null;
    this.actions[3] = outcome && available ? () => this.committed({ type: 'record', kind: 'failure' }) : null;
    this.actions[4] = !outcome && available ? () => this.committed({ type: 'record', kind: 'rep' }) : null;
    this.actions[5] = available ? () => this.committed({ type: 'undo' }) : null;
    this.actions[6] = available ? () => { this.view = 'options'; this.message = ''; this.render(); } : null;
    this.actions[7] = measured && available ? () => this.committed({ type: 'unit', unit: UNITS[m.type][
      (UNITS[m.type].indexOf(m.unit) + 1) % UNITS[m.type].length] }) : null;
    this.actions[8] = pendingFinish
      ? this.historyIssue ? null : () => this.finish()
      : this.historyIssue ? null : () => { this.view = 'confirm-finish'; this.message = ''; this.render(); };
    for (let i = 0; i < activeButtons.length; i++) {
      this.widgets[activeButtons[i]].setProperty(ui.prop.VISIBLE, !!this.actions[i]);
    }
    this.widgets.finish.setProperty(ui.prop.TEXT, pendingFinish ? 'Complete finish' : 'Finish');
  },

  render() {
    if (!this.widgets.title) return;
    if (this.view === 'active' && this.active) {
      this.widgets.title.setProperty(ui.prop.TEXT, 'Tallyform');
      this.renderActive();
      return;
    }
    this.widgets.baseCard.setProperty(ui.prop.VISIBLE, true);
    for (const name of baseText) {
      this.widgets[name].setProperty(ui.prop.VISIBLE, true);
    }
    this.widgets.activeCard.setProperty(ui.prop.VISIBLE, false);
    for (const name of activeText) this.widgets[name].setProperty(ui.prop.VISIBLE, false);
    for (const name of activeButtons) this.widgets[name].setProperty(ui.prop.VISIBLE, false);
    let heading = '';
    let value = '';
    let status = this.message;
    const controls = [];
    const add = (label, fn) => controls.push([label, fn]);
    const back = () => {
      this.view = this.activeIssue ? 'recovery' : this.active ? 'active' : 'setup';
      this.message = '';
      this.render();
    };
    if (this.view === 'recovery') {
      heading = 'Storage needs recovery';
      value = this.activeIssue ? 'Active data preserved' : 'History preserved';
      status = this.issue || 'Unknown storage error';
      if (!this.historyIssue) add('Safe history', () => { this.view = 'history'; this.message = ''; this.render(); });
      if (!this.activeIssue && this.active) add('Active session', () => { this.view = 'active'; this.message = ''; this.render(); });
      add('Exit', () => exit());
    } else if (this.view === 'setup') {
      heading = 'New practice';
      value = `${this.mode} · ${this.type}`;
      status = status || 'Choose mode and measurement';
      add('Mode', () => { this.mode = MODES[(MODES.indexOf(this.mode) + 1) % MODES.length]; this.render(); });
      add('Measure', () => { this.type = TYPES[(TYPES.indexOf(this.type) + 1) % TYPES.length]; this.render(); });
      add('Start', () => this.start());
      if (!this.historyIssue) add('History', () => { this.view = 'history'; this.message = ''; this.render(); });
      add('Exit', () => exit());
    } else if (this.view === 'options') {
      heading = 'Session options';
      value = this.active ? this.active.mode : '';
      status = status || 'Settings and active-session controls';
      if (this.active && this.active.measurement.type !== 'none') {
        const m = this.active.measurement;
        const step = fromCanonicalStep(m.type, m.unit, m.step);
        add(`Step ${Number(step >= 0.001 ? step.toFixed(3) : step.toPrecision(3))} ${m.unit}`,
          () => this.stepSize());
      }
      if (!this.historyIssue) add('History', () => { this.view = 'history'; this.message = ''; this.render(); });
      add('Discard', () => { this.view = 'confirm-discard'; this.render(); });
      add('Back', back);
      add('Exit', () => exit());
    } else if (this.view === 'confirm-finish' || this.view === 'confirm-discard'
      || this.view === 'confirm-delete') {
      heading = 'Confirm action';
      value = this.view === 'confirm-finish' ? 'Finish & save?'
        : this.view === 'confirm-discard' ? 'Discard active?' : 'Delete summary?';
      status = status || 'Choose Yes or Cancel';
      add('Yes', () => this.view === 'confirm-finish' ? this.finish()
        : this.view === 'confirm-discard' ? this.discard() : this.deleteSummary());
      add('Cancel', () => { this.view = this.view === 'confirm-delete' ? 'detail' : 'active'; this.message = ''; this.render(); });
    } else if (this.view === 'history') {
      heading = 'Saved sessions';
      value = `${this.history.length} ${this.history.length === 1 ? 'summary' : 'summaries'}`;
      const selected = this.history[this.historyIndex];
      status = status || (selected ? `${this.historyIndex + 1}: ${selected.mode} · ${selected.type} · ${selected.totals.count}`
        : 'No saved sessions');
      if (selected) {
        add('Previous', () => { this.historyIndex = (this.historyIndex + this.history.length - 1) % this.history.length; this.message = ''; this.render(); });
        add('Next', () => { this.historyIndex = (this.historyIndex + 1) % this.history.length; this.message = ''; this.render(); });
        add('Open', () => { this.groupIndex = 0; this.view = 'detail'; this.message = ''; this.render(); });
      }
      add('Back', back);
    } else if (this.view === 'detail') {
      const item = this.history[this.historyIndex];
      if (!item) { this.view = 'history'; this.render(); return; }
      const group = item.groups[this.groupIndex];
      heading = item.finishedAt === null ? 'Date unknown' : `${item.mode} · ${item.type}`;
      value = `${item.totals.count} ${item.mode === 'simple' ? 'reps' : 'attempts'}${
        item.mode === 'outcome' ? ` · ${item.totals.percent === null ? '—' : `${item.totals.percent}%`}` : ''}`;
      status = status || (group ? `${this.formatValue(item.type, item.unit, group.value)}: ${
        item.mode === 'outcome' ? `${group.totals.success}/${group.totals.count}` : group.totals.count}`
        : 'No recorded events');
      if (item.groups.length > 1) {
        add('Prev group', () => { this.groupIndex = (this.groupIndex + item.groups.length - 1) % item.groups.length; this.message = ''; this.render(); });
        add('Next group', () => { this.groupIndex = (this.groupIndex + 1) % item.groups.length; this.message = ''; this.render(); });
      }
      add('Delete', () => { this.view = 'confirm-delete'; this.render(); });
      add('History', () => { this.view = 'history'; this.message = ''; this.render(); });
      add('New session', () => { this.view = this.active ? 'active' : 'setup'; this.message = ''; this.render(); });
    }
    this.widgets.title.setProperty(ui.prop.TEXT, 'Tallyform');
    this.widgets.subtitle.setProperty(ui.prop.TEXT, 'Reps & Practice Tracker');
    this.widgets.heading.setProperty(ui.prop.TEXT, heading);
    this.widgets.value.setProperty(ui.prop.TEXT, value);
    this.widgets.status.setProperty(ui.prop.TEXT, status);
    this.actions = controls.map((control) => control[1]);
    for (let i = 0; i < this.widgets.buttons.length; i++) {
      const control = controls[i];
      this.widgets.buttons[i].setProperty(ui.prop.VISIBLE, !!control);
      if (control) this.widgets.buttons[i].setProperty(ui.prop.TEXT, control[0]);
    }
  },

  onDestroy() {
    offKey();
    offGesture();
    ui.setStatusBarVisible(true);
  },
});
