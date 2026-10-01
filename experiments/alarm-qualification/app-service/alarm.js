import { notify } from '@zos/notification';
import { LocalStorage } from '@zos/storage';
import { getSettings } from '@zos/display';
import { readProbeFile, writeProbeFile } from '../probe-file';
import { PLAN, PLAN_FILE, ORPHAN, resultKey, receiptKey,
  resultFile, receiptFile, validPlan } from '../probe-state';

AppService({
  onInit(param) {
    const started = Date.now();
    const parts = typeof param === 'string' ? param.split('|') : [];
    const [runId, role, token] = parts;
    try {
      let storage = null;
      try { storage = new LocalStorage(); } catch (error) {
        console.log(`Alarm self-test receipt storage unavailable: ${error}`);
      }
      if (parts.length !== 3 || !runId) {
        if (storage) storage.setItem(ORPHAN, `Unmatched callback: ${String(param)}`);
        return;
      }
      const record = (code, extra) => {
        const workMs = Date.now() - started;
        const entry = { code, param, workMs: workMs >= 0 ? workMs : null };
        if (extra) Object.assign(entry, extra);
        const value = JSON.stringify(entry);
        const key = resultKey(runId, role);
        try {
          if (storage) {
            storage.setItem(key, value);
            if (new LocalStorage().getItem(key) !== value) {
              console.log(`Alarm self-test result unreadable: ${role}`);
            }
          }
        } catch (error) {
          console.log(`Alarm self-test result write failed: ${error}`);
        }
        try {
          if (getSettings().screen.status === 2
            && !writeProbeFile(resultFile(runId, role), value)) {
            console.log(`Alarm self-test file result unreadable: ${role}`);
          }
        } catch (error) {
          console.log(`Alarm self-test off-screen file write failed: ${error}`);
        }
      };
      const rawPlan = readProbeFile(PLAN_FILE);
      let plan;
      try {
        plan = typeof rawPlan === 'string' ? JSON.parse(rawPlan) : null;
      } catch (error) {
        record('invalid-plan-file');
        return;
      }
      if (typeof rawPlan !== 'string') {
        record('missing-plan-file', { mirrorPresent: !!(storage && storage.getItem(PLAN)) });
        return;
      }
      if (!validPlan(plan)) {
        record('invalid-plan-file', { mirrorPresent: !!(storage && storage.getItem(PLAN)) });
        return;
      }
      if (plan.runId !== runId || plan.status !== 'armed') {
        record('stale-plan');
        return;
      }
      if (role !== 'bg' && role !== 'dup' && role !== 'stale') {
        record('invalid-role');
        return;
      }
      if (token !== plan.tokens.bg) {
        record('stale-suppressed', { mismatch: true });
        return;
      }
      const key = receiptKey(runId);
      const path = receiptFile(runId);
      let screenStatus;
      try { screenStatus = getSettings().screen.status; } catch (error) {
        record('screen-state-unknown');
        return;
      }
      const fileReceipt = readProbeFile(path);
      if (fileReceipt === token || storage && storage.getItem(key) === token) {
        record('duplicate-suppressed', { receipt: true });
        return;
      }
      if (screenStatus === 2) {
        if (!writeProbeFile(path, token)) {
          record('receipt-unreadable');
          return;
        }
        record('notification-attempt', { receipt: true, parameterMatched: true });
      } else if (screenStatus === 1) {
        if (!storage) {
          record('receipt-unavailable');
          return;
        }
        storage.setItem(key, token);
        if (new LocalStorage().getItem(key) !== token) {
          record('receipt-unreadable');
          return;
        }
      } else {
        record('screen-state-unknown');
        return;
      }
      const id = notify({
        title: 'Tallyform alarm self-test',
        content: `Background run ${runId}`,
        actions: [],
        vibrate: 5,
      });
      if (!id) {
        let cleared = false;
        if (screenStatus === 2 && getSettings().screen.status === 2) {
          cleared = writeProbeFile(path, '');
        } else if (screenStatus === 1 && storage) {
          storage.setItem(key, '');
          cleared = new LocalStorage().getItem(key) === '';
        }
        record('notification-rejected', { receiptCleared: cleared });
        return;
      }
      record(role === 'dup' ? 'duplicate-notified' : 'notified',
        { notificationId: id, receipt: true, parameterMatched: true });
    } catch (error) {
      console.log(`Alarm self-test callback failed: ${error}`);
    }
  },
});
