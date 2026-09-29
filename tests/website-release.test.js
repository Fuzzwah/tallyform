import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const cli = resolve('tools/website-release.mjs');
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tallyform-release-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const site = join(root, 'site');
  const bundle = join(root, 'review');
  mkdirSync(site);
  for (const file of ['index.html', 'technical.html', 'styles.css', 'hero.png', 'screenshot.png', 'provenance.json', 'hero-provenance.json']) {
    writeFileSync(join(site, file), `Synthetic identity fixture: ${file}`);
  }
  return { root, site, bundle };
}

test('sealed site is independent of later generation and must match explicit approval', (t) => {
  const { site, bundle } = fixture(t);
  const sealed = run('seal', site, bundle);
  assert.equal(sealed.status, 0, sealed.stderr);
  const digest = sealed.stdout.trim();
  writeFileSync(join(site, 'index.html'), 'Later generation');
  assert.equal(run('verify', bundle, digest).status, 0);
  assert.equal(readFileSync(join(bundle, 'site', 'index.html'), 'utf8'), 'Synthetic identity fixture: index.html');
  assert.notEqual(run('verify', bundle, '0'.repeat(64)).status, 0);
  assert.notEqual(run('seal', site, bundle).status, 0, 'existing reviewed bytes cannot be overwritten');
});

for (const mutation of ['modify', 'add', 'remove', 'rename']) {
  test(`publication rejects ${mutation} after sealing`, (t) => {
    const { site, bundle } = fixture(t);
    const sealed = run('seal', site, bundle);
    assert.equal(sealed.status, 0, sealed.stderr);
    const path = join(bundle, 'site', 'styles.css');
    if (mutation === 'modify') writeFileSync(path, 'Changed style');
    if (mutation === 'add') writeFileSync(join(bundle, 'site', 'extra.js'), 'Changed behavior');
    if (mutation === 'remove') rmSync(path);
    if (mutation === 'rename') {
      writeFileSync(join(bundle, 'site', 'renamed.css'), readFileSync(path));
      rmSync(path);
    }
    assert.notEqual(run('verify', bundle, sealed.stdout.trim()).status, 0);
  });
}

test('sealing rejects symlinks and overlapping paths without deleting the source', (t) => {
  const { site, bundle } = fixture(t);
  assert.notEqual(run('seal', site, site).status, 0);
  assert.notEqual(run('seal', site, join(site, 'review')).status, 0);
  assert.equal(readFileSync(join(site, 'index.html'), 'utf8'), 'Synthetic identity fixture: index.html');
  symlinkSync(join(site, 'index.html'), join(site, 'linked.html'));
  assert.notEqual(run('seal', site, bundle).status, 0);
});
