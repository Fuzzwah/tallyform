import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CANONICAL_DEMO_STATE,
  publishRenderedWebsite,
  renderWebsite,
  sha256,
  uiSourceFingerprint,
  validateProvenance,
} from '../tools/website-generator.mjs';

const referenceScreenshot = 'docs/evidence/putting-practice/04-mockup-layout.png';
// Synthetic contract-test bytes only: never artwork or evidence of visual approval.
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tallyform-website-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceRoot = join(root, 'source');
  mkdirSync(join(sourceRoot, 'app', 'page'), { recursive: true });
  writeFileSync(join(sourceRoot, 'app', 'app.json'), '{"app":{"appName":"Tallyform"}}');
  writeFileSync(join(sourceRoot, 'app', 'page', 'index.js'), 'export const label = "Made";');
  writeFileSync(join(sourceRoot, 'package-lock.json'), '{"lockfileVersion":3}');
  const assetDir = join(root, 'assets');
  mkdirSync(join(assetDir, 'references'), { recursive: true });
  const imagePath = join(assetDir, 'hero.png');
  const referencePath = join(assetDir, 'references', 'capture.png');
  const screenshotPath = join(root, 'screenshot.png');
  writeFileSync(imagePath, pixel);
  copyFileSync(referenceScreenshot, referencePath);
  copyFileSync(referenceScreenshot, screenshotPath);
  const manifest = {
    referenceCapturePath: 'references/capture.png',
    referenceCaptureSha256: sha256(referencePath),
    uiSourceFingerprint: uiSourceFingerprint({ rootDir: sourceRoot }),
    canonicalDemoState: CANONICAL_DEMO_STATE,
    imageSha256: sha256(imagePath),
    imageWidth: 1,
    imageHeight: 1,
    provider: 'synthetic test provider',
    model: 'synthetic test model',
    prompt: 'Synthetic bytes for validation tests; not real approved artwork.',
    referenceSource: {
      capture: 'Historical repository screenshot used only as a contract-test reference',
      composition: 'Synthetic contract test; no approved hardware reference',
    },
    review: { status: 'approved', reviewedAt: '2026-09-29T00:00:00.000Z' },
  };
  const provenance = {
    generatedAt: '2026-09-29T00:00:00.000Z',
    sourceRevision: 'b'.repeat(40),
    appName: 'Tallyform',
    appVersion: '0.1.0',
    appCode: 1,
    zeusTarget: 'Amazfit Bip Max',
    simulatorTarget: 'Bip Max v1.0.0',
    zeusVersion: '1.9.3',
    packagePath: 'app/dist/example.zab',
    packageSha256: 'a'.repeat(64),
    screenshotPath: 'screenshot.png',
    screenshotSha256: sha256(screenshotPath),
    canonicalDemoState: CANONICAL_DEMO_STATE,
    simulatorOcr: 'Synthetic contract-test provenance',
  };
  const site = {
    name: 'Tallyform',
    descriptor: 'Test descriptor',
    demoState: CANONICAL_DEMO_STATE,
    evidenceNote: 'Synthetic contract-test evidence',
  };
  const outputDir = join(root, 'dist');
  const manifestPath = join(assetDir, 'hero.json');
  function saveManifest() {
    writeFileSync(manifestPath, JSON.stringify(manifest));
  }
  saveManifest();
  return {
    root, sourceRoot, assetDir, outputDir, imagePath, referencePath, screenshotPath,
    manifestPath, manifest, provenance, site, saveManifest,
    render: () => renderWebsite({
      outputDir, assetDir, provenance, screenshotPath, site,
      uiSourceFingerprint: uiSourceFingerprint({ rootDir: sourceRoot }),
    }),
  };
}

function snapshot(directory) {
  return Object.fromEntries(readdirSync(directory).sort().map((name) => [name, readFileSync(join(directory, name))]));
}

test('source fingerprint is deterministic and ignores marketing and generated build files', (t) => {
  const f = fixture(t);
  const fingerprint = () => uiSourceFingerprint({ rootDir: f.sourceRoot });
  const original = fingerprint();
  for (const directory of ['website', 'app/dist', 'app/node_modules', 'app/build', 'app/.cache', 'app/page/.cache']) {
    mkdirSync(join(f.sourceRoot, directory), { recursive: true });
    writeFileSync(join(f.sourceRoot, directory, 'changed'), 'not represented UI source');
  }
  assert.equal(fingerprint(), original);
  // Recreating files in a different directory-entry order must not alter identity.
  const pagePath = join(f.sourceRoot, 'app', 'page', 'index.js');
  const page = readFileSync(pagePath);
  rmSync(pagePath);
  writeFileSync(pagePath, page);
  assert.equal(fingerprint(), original);
});

test('source fingerprint detects dirty app bytes, source paths, manifest, lockfile and canonical state', (t) => {
  const f = fixture(t);
  const fingerprint = () => uiSourceFingerprint({ rootDir: f.sourceRoot });
  const original = fingerprint();
  for (const path of ['app/page/index.js', 'app/app.json', 'package-lock.json']) {
    const absolute = join(f.sourceRoot, path);
    const bytes = readFileSync(absolute);
    writeFileSync(absolute, Buffer.concat([bytes, Buffer.from('\nchanged')]));
    assert.notEqual(fingerprint(), original, path);
    writeFileSync(absolute, bytes);
  }
  const extraPath = join(f.sourceRoot, 'app', 'page', 'renamed.js');
  copyFileSync(join(f.sourceRoot, 'app', 'page', 'index.js'), extraPath);
  assert.notEqual(fingerprint(), original);
  rmSync(extraPath);
  assert.notEqual(uiSourceFingerprint({ rootDir: f.sourceRoot, canonicalDemoState: 'different state' }), original);
});

const rejectedStates = [
  ['missing hero', (f) => rmSync(f.imagePath), /Missing reviewed hero image: .*hero\.png\. Generate and approve/],
  ['missing manifest', (f) => rmSync(f.manifestPath), /Missing hero review manifest/],
  ['missing generation identity', (f) => { delete f.manifest.provider; f.saveManifest(); }, /missing provider/],
  ['missing reference source', (f) => { delete f.manifest.referenceSource.composition; f.saveManifest(); }, /missing referenceSource.composition/],
  ['invalid digest', (f) => { f.manifest.imageSha256 = 'not-a-digest'; f.saveManifest(); }, /invalid imageSha256/],
  ['unreviewed artwork', (f) => { f.manifest.review.status = 'pending'; f.saveManifest(); }, /not approved/],
  ['missing review date', (f) => { delete f.manifest.review.reviewedAt; f.saveManifest(); }, /valid review.reviewedAt/],
  ['altered hero', (f) => writeFileSync(f.imagePath, Buffer.concat([pixel, Buffer.from('modified')])), /Hero image digest does not match/],
  ['invalid hero image', (f) => { writeFileSync(f.imagePath, 'not a PNG'); f.manifest.imageSha256 = sha256(f.imagePath); f.saveManifest(); }, /not a PNG/],
  ['mismatched dimensions', (f) => { f.manifest.imageWidth = 2; f.saveManifest(); }, /imageWidth does not match/],
  ['zero dimensions', (f) => {
    const bytes = Buffer.from(pixel);
    bytes.writeUInt32BE(0, 16);
    writeFileSync(f.imagePath, bytes);
    f.manifest.imageSha256 = sha256(f.imagePath);
    f.manifest.imageWidth = 0;
    f.saveManifest();
  }, /invalid dimensions/],
  ['stale app UI', (f) => writeFileSync(join(f.sourceRoot, 'app', 'page', 'index.js'), 'changed uncommitted UI'), /uiSourceFingerprint is stale/],
  ['stale canonical state', (f) => { f.manifest.canonicalDemoState = 'wrong state'; f.saveManifest(); }, /canonicalDemoState is stale/],
  ['self-consistent but stale capture and hero state', (f) => {
    f.provenance.canonicalDemoState = 'wrong state';
    f.manifest.canonicalDemoState = 'wrong state';
    f.saveManifest();
  }, /canonicalDemoState does not match the current build/],
  ['missing reference capture', (f) => rmSync(f.referencePath), /Missing hero reference capture/],
  ['altered reference capture', (f) => writeFileSync(f.referencePath, pixel), /reference capture digest does not match/],
  ['escaping reference path', (f) => { f.manifest.referenceCapturePath = '../screenshot.png'; f.saveManifest(); }, /must stay within the asset directory/],
  ['escaping reference symlink', (f) => { rmSync(f.referencePath); symlinkSync(f.screenshotPath, f.referencePath); }, /must stay within the asset directory/],
  ['missing raw capture', (f) => rmSync(f.screenshotPath), /ENOENT/],
  ['altered raw capture', (f) => writeFileSync(f.screenshotPath, pixel), /Screenshot digest does not match provenance/],
];

for (const [name, invalidate, expectedError] of rejectedStates) {
  test(`${name} fails before staging and preserves the last complete website`, (t) => {
    const f = fixture(t);
    publishRenderedWebsite(f.render());
    const previous = snapshot(f.outputDir);
    invalidate(f);
    assert.throws(f.render, expectedError);
    assert.deepEqual(snapshot(f.outputDir), previous);
    assert.equal(existsSync(`${f.outputDir}.staging-${process.pid}`), false);
  });
}

test('unchanged UI reuses approved artwork with changed copy and independently identified fresh capture', (t) => {
  const f = fixture(t);
  publishRenderedWebsite(f.render());
  const approvedHero = readFileSync(join(f.outputDir, 'hero.png'));
  const approvedMetadata = readFileSync(join(f.outputDir, 'hero-provenance.json'));
  f.site.descriptor = 'Updated customer copy';
  f.provenance.sourceRevision = 'c'.repeat(40);
  writeFileSync(f.screenshotPath, pixel);
  f.provenance.screenshotSha256 = sha256(f.screenshotPath);
  assert.notEqual(f.provenance.screenshotSha256, f.manifest.referenceCaptureSha256);
  const rendered = f.render();
  assert.equal(JSON.parse(readFileSync(join(f.outputDir, 'provenance.json'))).sourceRevision, 'b'.repeat(40));
  publishRenderedWebsite(rendered);
  assert.deepEqual(readdirSync(f.outputDir).sort(), [
    'hero-provenance.json', 'hero.png', 'index.html', 'provenance.json', 'screenshot.png', 'styles.css', 'technical.html',
  ]);
  assert.deepEqual(readFileSync(join(f.outputDir, 'hero.png')), approvedHero);
  assert.deepEqual(readFileSync(join(f.outputDir, 'hero-provenance.json')), approvedMetadata);
  assert.deepEqual(readFileSync(join(f.outputDir, 'screenshot.png')), pixel);
  const publishedCapture = JSON.parse(readFileSync(join(f.outputDir, 'provenance.json')));
  assert.equal(publishedCapture.sourceRevision, f.provenance.sourceRevision);
  assert.equal(publishedCapture.screenshotSha256, sha256(join(f.outputDir, 'screenshot.png')));
});

test('publishing a missing stage cannot remove the previous website', (t) => {
  const f = fixture(t);
  publishRenderedWebsite(f.render());
  const previous = snapshot(f.outputDir);
  assert.throws(() => publishRenderedWebsite({ outputDir: join(f.root, 'missing-stage'), finalOutputDir: f.outputDir }), /ENOENT/);
  assert.deepEqual(snapshot(f.outputDir), previous);
});

test('provenance validation rejects mismatched build identity and invalid digests', (t) => {
  const { provenance } = fixture(t);
  assert.throws(() => validateProvenance({ ...provenance, appVersion: '9.9.9' }, provenance), /appVersion does not match/);
  assert.throws(() => validateProvenance({ ...provenance, screenshotSha256: 'not-a-digest' }, provenance), /invalid SHA-256 digest/);
});

test('website rendering rejects a different app identity', (t) => {
  const f = fixture(t);
  f.site.name = 'Different app';
  assert.throws(f.render, /does not match app name Tallyform/);
  assert.equal(existsSync(f.outputDir), false);
});
