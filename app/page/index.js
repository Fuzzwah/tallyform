import * as ui from '@zos/ui';
import { LocalStorage } from '@zos/storage';
import { exit } from '@zos/router';
import { px } from '@zos/utils';
import { onKey, offKey, onGesture, offGesture, KEY_EVENT_CLICK,
  GESTURE_UP, GESTURE_DOWN } from '@zos/interaction';
import { newSession, transition, totals, distanceLabel, loadSession, saveSession } from './session';

Page({
  onInit() {
    this.storage = null;
    this.session = newSession();
    this.widgets = {};
    this.message = '';
    this.blocked = false;
    this.confirmReset = false;
    try {
      this.storage = new LocalStorage();
      this.session = loadSession(this.storage);
    } catch (error) {
      this.blocked = true;
      this.message = 'Cannot load. Reset to start.';
      console.log(`Putting recovery: ${error}`);
    }
    this.setup = this.session.keys || this.blocked ? null : 'silver';
  },

  build() {
    ui.setStatusBarVisible(false);
    const green = 0x84f5a1;
    const muted = 0xa3b2ae;
    const rect = (x, y, w, h, color, radius = 20) => ui.createWidget(ui.widget.FILL_RECT, {
      x: px(x), y: px(y), w: px(w), h: px(h), radius: px(radius), color,
    });
    const text = (name, x, y, w, h, size, color, value = '') => {
      this.widgets[name] = ui.createWidget(ui.widget.TEXT, {
        x: px(x), y: px(y), w: px(w), h: px(h), text: value, text_size: px(size), color,
        align_h: ui.align.CENTER_H, align_v: ui.align.CENTER_V,
      });
    };
    const button = (name, x, y, w, h, label, color, callback, size = 19) => {
      this.widgets[name] = ui.createWidget(ui.widget.BUTTON, {
        x: px(x), y: px(y), w: px(w), h: px(h), radius: px(14), text: label, text_size: px(size),
        color: 0xffffff, normal_color: color, press_color: 0x42594d,
        click_func: callback,
      });
    };
    text('title', 24, 26, 384, 37, 30, 0xffffff, 'Basket Birdie');
    text('subtitle', 24, 65, 384, 27, 21, muted, 'Putting Practice');

    rect(24, 105, 384, 172, 0x4dad72, 28);
    rect(26, 107, 380, 168, 0x10271d, 26);
    text('farther', 40, 117, 272, 26, 18, muted, '↑  Swipe up for farther');
    text('distance', 36, 148, 282, 80, 58, green);
    text('closer', 40, 238, 272, 26, 18, muted, '↓  Swipe down for closer');
    button('metres', 330, 143, 58, 50, 'm', 0x29352f, () => this.selectUnit('m'), 25);
    button('feet', 330, 203, 58, 50, 'ft', 0x29352f, () => this.selectUnit('ft'), 25);
    button('metresActive', 330, 143, 58, 50, 'm', 0x398e50, () => this.selectUnit('m'), 25);
    button('feetActive', 330, 203, 58, 50, 'ft', 0x398e50, () => this.selectUnit('ft'), 25);

    rect(24, 290, 186, 91, 0x397951);
    rect(26, 292, 182, 87, 0x142b20, 18);
    rect(222, 290, 186, 91, 0xa34b53);
    rect(224, 292, 182, 87, 0x321d21, 18);
    text('madeLabel', 32, 297, 88, 27, 21, green, 'Made');
    text('missedLabel', 230, 297, 88, 27, 21, 0xff9295, 'Missed');
    text('madeCount', 32, 323, 92, 51, 40, 0xffffff);
    text('missedCount', 230, 323, 92, 51, 40, 0xffffff);
    button('made', 132, 307, 60, 58, '+', 0x398e50,
      () => this.act({ type: 'record', made: true }), 38);
    button('missed', 330, 307, 60, 58, '+', 0xc54c55,
      () => this.act({ type: 'record', made: false }), 38);

    rect(24, 387, 384, 40, 0x202724, 22);
    text('rate', 38, 388, 100, 38, 28, green);
    text('rateLabel', 145, 389, 248, 36, 18, 0xd0d8d3, 'Make rate · this distance');
    text('status', 24, 429, 384, 24, 16, 0xbac7c0);
    button('undo', 24, 454, 88, 36, 'Undo', 0x202724, () => {
      if (this.confirmReset) {
        this.confirmReset = false;
        this.render();
      } else this.act({ type: 'undo' });
    });
    button('reset', 122, 454, 88, 36, 'Reset', 0x202724, () => {
      if (this.confirmReset) {
        this.confirmReset = false;
        if (this.act({ type: 'reset' }, true)) {
          this.blocked = false;
          this.setup = this.session.keys ? null : 'silver';
        }
      } else this.confirmReset = true;
      this.render();
    });
    button('setup', 222, 454, 88, 36, 'Keys', 0x202724, () => {
      if (this.confirmReset || this.blocked) return;
      this.setup = this.setup ? null : 'silver';
      this.message = '';
      this.render();
    });
    button('exit', 320, 454, 88, 36, 'Exit', 0x202724, () => exit());
    onKey((key, event) => this.handleKey(key, event));
    onGesture((gesture) => {
      if (gesture !== GESTURE_UP && gesture !== GESTURE_DOWN) return false;
      this.act({ type: 'step', direction: gesture === GESTURE_UP ? 1 : -1 });
      return true;
    });
    this.render();
  },

  selectUnit(unit) {
    if (this.session.unit !== unit) this.act({ type: 'unit' });
  },

  handleKey(key, event) {
    if (this.blocked || this.confirmReset) return true;
    if (this.setup) {
      if (event !== KEY_EVENT_CLICK) return true;
      if (this.setup === 'silver') {
        this.silverKey = key;
        this.setup = 'red';
        this.message = '';
      } else if (key === this.silverKey) {
        this.message = 'Use the other (red) button';
      } else if (this.act({ type: 'keys', keys: { silver: this.silverKey, red: key } })) {
        this.setup = null;
      }
      this.render();
      return true;
    }
    const keys = this.session.keys;
    if (!keys || (key !== keys.silver && key !== keys.red)) return false;
    if (event === KEY_EVENT_CLICK) this.act({ type: 'record', made: key === keys.silver });
    return true;
  },

  act(action, recovery = false) {
    if (this.confirmReset || (this.blocked && !recovery)) return false;
    try {
      if (!this.storage) this.storage = new LocalStorage();
      const next = transition(this.session, action);
      saveSession(this.storage, next);
      this.session = next;
      this.message = action.type === 'record' ? (action.made ? 'Made recorded' : 'Miss recorded') : '';
      this.render();
      return true;
    } catch (error) {
      this.message = action.type === 'record' && this.session.attempts.length >= 1000
        ? '1000 putts: reset to continue' : 'Save failed. Please retry.';
      console.log(`Putting action: ${error}`);
      this.render();
      return false;
    }
  },

  render() {
    if (!this.widgets.distance) return;
    const selected = totals(this.session, this.session.distanceM);
    const all = totals(this.session);
    const rate = (value) => value.percent === null ? '--' : `${value.percent}%`;
    const set = (name, value) => this.widgets[name].setProperty(ui.prop.TEXT, value);
    set('distance', distanceLabel(this.session));
    this.widgets.metresActive.setProperty(ui.prop.VISIBLE, this.session.unit === 'm');
    this.widgets.feetActive.setProperty(ui.prop.VISIBLE, this.session.unit === 'ft');
    set('madeCount', `${selected.made}`);
    set('missedCount', `${selected.missed}`);
    set('rate', rate(selected));
    set('status', this.confirmReset ? 'Clear all practice putts?' : this.message
      || (this.setup ? `Press ${this.setup.toUpperCase()} once · or Skip`
        : `Session: ${all.made} made / ${all.missed} missed · ${rate(all)}`));
    set('undo', this.confirmReset ? 'Cancel' : 'Undo');
    set('reset', this.confirmReset ? 'Clear all' : 'Reset');
    set('setup', this.setup ? 'Skip' : 'Keys');
  },

  onDestroy() {
    offKey();
    offGesture();
    ui.setStatusBarVisible(true);
  },
});
