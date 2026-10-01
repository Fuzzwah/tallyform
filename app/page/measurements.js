// Canonical integers: micrometres, nanograms, milliseconds. Unitless has no quantity.
const FACTORS = {
  distance: { cm: 10000, m: 1000000, km: 1000000000,
    in: 25400, ft: 304800, yd: 914400, mi: 1609344000 },
  weight: { g: 1000000000, kg: 1000000000000,
    oz: 28349523125, lb: 453592370000 },
  duration: { s: 1000, min: 60000, h: 3600000 },
};

export const LIMITS = {
  distance: { min: 1000, max: 100000000000 }, // 0.001 m to 100 km
  weight: { min: 1000000, max: 1000000000000000 }, // 0.001 g to 1000 kg
  duration: { min: 1000, max: 86400000 }, // 1 s to 24 h
};

export const UNITS = {
  distance: ['cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
  weight: ['g', 'kg', 'oz', 'lb'],
  duration: ['s', 'min', 'h'],
  none: [],
};

export function validCanonical(type, value) {
  if (type === 'none') return value === null;
  const limit = LIMITS[type];
  return Boolean(limit) && Number.isSafeInteger(value) && value >= limit.min && value <= limit.max;
}

export function validStep(type, value) {
  const limit = LIMITS[type];
  return Boolean(limit) && Number.isSafeInteger(value) && value > 0 && value <= limit.max;
}

function factorFor(type, unit) {
  const factors = FACTORS[type];
  const factor = factors && Object.prototype.hasOwnProperty.call(factors, unit) && factors[unit];
  if (!factor) throw new Error('Incompatible measurement unit');
  return factor;
}

function convert(type, unit, value, step) {
  const factor = factorFor(type, unit);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Measurement must be positive and finite');
  const product = value * factor;
  // Reject unsafe intermediate arithmetic, even when rounding might hide the overflow.
  if (!Number.isFinite(product) || Math.abs(product) > Number.MAX_SAFE_INTEGER) {
    throw new Error('Measurement arithmetic overflow');
  }
  const canonical = Math.round(product);
  if (step ? !validStep(type, canonical) : !validCanonical(type, canonical)) {
    throw new Error('Measurement outside supported bounds');
  }
  return canonical;
}

export function toCanonical(type, unit, value) {
  return convert(type, unit, value, false);
}

export function toCanonicalStep(type, unit, value) {
  return convert(type, unit, value, true);
}

export function fromCanonical(type, unit, value) {
  const factor = factorFor(type, unit);
  if (!validCanonical(type, value)) throw new Error('Invalid canonical measurement');
  return value / factor;
}

export function fromCanonicalStep(type, unit, value) {
  const factor = factorFor(type, unit);
  if (!validStep(type, value)) throw new Error('Invalid canonical step');
  return value / factor;
}

export function adjustCanonical(type, selected, step, direction) {
  if (!validCanonical(type, selected) || !validStep(type, step)
    || (direction !== 1 && direction !== -1)) throw new Error('Invalid measurement step');
  const next = selected + direction * step;
  if (!validCanonical(type, next)) throw new Error('Measurement outside supported bounds');
  return next;
}

export function defaultMeasurement(type) {
  switch (type) {
    case 'distance': return { type, unit: 'm', selected: 5000000, step: 1000000 };
    case 'weight': return { type, unit: 'kg', selected: 1000000000000, step: 100000000000 };
    case 'duration': return { type, unit: 's', selected: 60000, step: 1000 };
    case 'none': return { type, unit: null, selected: null, step: null };
    default: throw new Error('Unknown measurement type');
  }
}
