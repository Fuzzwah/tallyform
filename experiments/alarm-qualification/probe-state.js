export const PLAN = 'alarm-qualification-plan-v9';
export const PLAN_FILE = 'alarm-qualification-plan-v9.json';
export const RUN_FILE = 'alarm-qualification-latest-v9.json';
export const ORPHAN = 'alarm-qualification-orphan-v9';

export const resultKey = (runId, role) => `alarm-qualification-${runId}-${role}-v9`;
export const receiptKey = (runId) => `alarm-qualification-${runId}-bg-receipt-v9`;
export const snapshotFile = (runId) => `alarm-qualification-${runId}-snapshot-v9.json`;
export const resultFile = (runId, role) => `alarm-qualification-${runId}-${role}-v9.json`;
export const receiptFile = (runId) => `alarm-qualification-${runId}-bg-receipt-v9.txt`;

export function validPlan(plan) {
  return !!plan && plan.version === 9 && typeof plan.runId === 'string'
    && plan.runId.length > 0 && Number.isFinite(plan.startedAt)
    && typeof plan.status === 'string' && !!plan.tokens
    && plan.tokens.bg === `${plan.runId}/bg`;
}
