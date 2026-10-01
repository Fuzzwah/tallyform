import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, UNITS, toCanonical, toCanonicalStep, fromCanonical, fromCanonicalStep,
  adjustCanonical, defaultMeasurement, validCanonical } from '../app/page/measurements.js';

test('distance conversions preserve exact canonical groups across metric and imperial units', () => {
  const tenFeet = toCanonical('distance', 'ft', 10);
  assert.equal(tenFeet, 3048000);
  assert.equal(tenFeet, toCanonical('distance', 'm', 3.048));
  assert.equal(fromCanonical('distance', 'ft', tenFeet), 10);
  assert.equal(toCanonical('distance', 'in', 120), tenFeet);
  assert.equal(toCanonical('distance', 'yd', 1), 914400);
  assert.equal(toCanonical('distance', 'mi', 1), 1609344000);
  assert.equal(toCanonical('distance', 'cm', 0.1), LIMITS.distance.min);
  assert.equal(toCanonical('distance', 'km', 100), LIMITS.distance.max);
  assert.equal(toCanonical('distance', 'm', 1.23456789), 1234568);
});

test('pounds and ounces share one exact nanogram value, with bounded round trips', () => {
  const pound = toCanonical('weight', 'lb', 1);
  assert.equal(pound, 453592370000);
  assert.equal(toCanonical('weight', 'oz', 16), pound);
  assert.equal(fromCanonical('weight', 'oz', pound), 16);
  assert.equal(toCanonical('weight', 'g', 0.001), LIMITS.weight.min);
  assert.equal(toCanonical('weight', 'kg', 1000), LIMITS.weight.max);
  assert.equal(toCanonical('weight', 'g', fromCanonical('weight', 'g', pound)), pound);
  assert.equal(toCanonical('duration', 'min', 1), toCanonical('duration', 's', 60));
  assert.equal(toCanonical('duration', 'h', 24), LIMITS.duration.max);
  assert.equal(fromCanonical('duration', 'min', 60000), 1);
});

test('unitless sessions have no selected value, unit or artificial step', () => {
  assert.deepEqual(defaultMeasurement('none'), { type: 'none', unit: null, selected: null, step: null });
  assert.deepEqual(UNITS.none, []);
  assert.equal(validCanonical('none', null), true);
  assert.equal(validCanonical('none', 0), false);
  assert.throws(() => toCanonical('none', 'm', 1), /Incompatible/);
});

test('configurable canonical steps retain quantity across unit changes and reject boundaries', () => {
  const chosen = toCanonical('distance', 'ft', 10);
  const step = toCanonicalStep('distance', 'ft', 1);
  assert.equal(fromCanonical('distance', 'm', adjustCanonical('distance', chosen, step, 1)), 3.3528);
  assert.equal(adjustCanonical('distance', chosen, step, -1), 2743200);
  assert.equal(toCanonicalStep('distance', 'm', 0.000001), 1);
  assert.equal(fromCanonicalStep('distance', 'm', 1), 0.000001);
  assert.equal(toCanonicalStep('distance', 'm', fromCanonicalStep('distance', 'm', step)), step);
  assert.equal(adjustCanonical('distance', LIMITS.distance.min, 1, 1), 1001);
  assert.throws(() => adjustCanonical('distance', LIMITS.distance.min, 1, -1), /bounds/);
  assert.throws(() => adjustCanonical('distance', LIMITS.distance.max, 1, 1), /bounds/);
  assert.throws(() => toCanonicalStep('distance', 'm', 0.0000001), /bounds/);
  assert.throws(() => adjustCanonical('weight', LIMITS.weight.min, 0, 1), /step/);
});

test('invalid units, non-finite input, limits and intermediate overflow never become values', () => {
  for (const value of [0, -1, NaN, Infinity, -Infinity]) {
    assert.throws(() => toCanonical('distance', 'm', value), /positive and finite/);
  }
  assert.throws(() => toCanonical('distance', 'lb', 1), /Incompatible/);
  assert.throws(() => toCanonical('distance', 'm', 0.0009), /bounds/);
  assert.throws(() => toCanonical('weight', 'kg', 1001), /bounds/);
  assert.throws(() => toCanonical('duration', 's', 0.99), /bounds/);
  assert.throws(() => toCanonical('duration', 'h', 25), /bounds/);
  assert.throws(() => toCanonical('weight', 'kg', 10000), /overflow/);
  assert.throws(() => fromCanonical('weight', 'g', Number.MAX_SAFE_INTEGER), /Invalid/);
  assert.throws(() => defaultMeasurement('speed'), /Unknown/);
});
