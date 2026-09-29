import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

export const ROOT = resolve(new URL('..', import.meta.url).pathname);
export const APP_DIR = join(ROOT, 'app');
export const WEBSITE_DIR = join(ROOT, 'website');
export const GENERATED_DIR = join(WEBSITE_DIR, 'dist');
export const ZEUS_TARGET = 'Amazfit Bip Max';
export const SIMULATOR_TARGET = 'Bip Max v1.0.0';
export const CANONICAL_DEMO_STATE = '4 m · 5 made · 1 missed · 83% make rate';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const SHA256 = /^[a-f0-9]{64}$/;
const GENERATED_APP_DIRECTORIES = new Set(['dist', 'node_modules', 'build', '.cache', '.git', '.zeus', '.turbo', 'coverage']);

export function uiSourceFingerprint({ rootDir = ROOT, canonicalDemoState = CANONICAL_DEMO_STATE } = {}) {
  const paths = [];
  function visit(directory) {
    for (const entry of readdirSync(join(rootDir, directory), { withFileTypes: true })) {
      if (entry.isDirectory() && GENERATED_APP_DIRECTORIES.has(entry.name)) continue;
      if (entry.name === '.DS_Store') continue;
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) paths.push(path);
      else throw new Error(`Unsupported app source entry: ${path}`);
    }
  }
  visit('app');
  paths.push('package-lock.json');
  const hash = createHash('sha256');
  function add(path, bytes) {
    hash.update(`${Buffer.byteLength(path)}:${path}${bytes.length}:`);
    hash.update(bytes);
  }
  for (const path of paths.sort()) add(path, readFileSync(join(rootDir, path)));
  add('canonicalDemoState', Buffer.from(canonicalDemoState));
  return hash.digest('hex');
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function readAppMetadata() {
  const manifest = readJson(join(APP_DIR, 'app.json'));
  return {
    name: manifest.app.appName,
    descriptor: manifest.app.description,
    version: manifest.app.version.name,
    code: manifest.app.version.code,
  };
}

export function readSiteMetadata() {
  return readJson(join(WEBSITE_DIR, 'site.json'));
}

export function currentRevision() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
}

export function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function pngInfo(path) {
  const data = readFileSync(path);
  if (!data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(`Screenshot is not a PNG: ${path}`);
  }
  if (data.length < 33 || data.readUInt32BE(8) !== 13 || data.toString('ascii', 1, 4) !== 'PNG'
    || data.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`Screenshot has no valid PNG header: ${path}`);
  }
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (!width || !height || width > 0x7fffffff || height > 0x7fffffff) {
    throw new Error(`PNG has invalid dimensions: ${path}`);
  }
  return { width, height, bytes: data.length };
}

export function validateHeroAsset({
  assetDir = join(WEBSITE_DIR, 'assets'),
  uiSourceFingerprint: expectedFingerprint = uiSourceFingerprint(),
} = {}) {
  const imagePath = join(assetDir, 'hero.png');
  if (!existsSync(imagePath)) {
    throw new Error(`Missing reviewed hero image: ${imagePath}. Generate and approve the artwork before generating the website.`);
  }
  const manifestPath = join(assetDir, 'hero.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing hero review manifest: ${manifestPath}. Record artwork provenance and approval before generating the website.`);
  }
  const manifest = readJson(manifestPath);
  for (const field of [
    'referenceCapturePath', 'referenceCaptureSha256', 'uiSourceFingerprint', 'canonicalDemoState',
    'imageSha256', 'provider', 'model', 'prompt',
  ]) {
    if (typeof manifest?.[field] !== 'string' || !manifest[field].trim()) {
      throw new Error(`Hero manifest is missing ${field}`);
    }
  }
  for (const field of ['referenceCaptureSha256', 'uiSourceFingerprint', 'imageSha256']) {
    if (!SHA256.test(manifest[field])) throw new Error(`Hero manifest has an invalid ${field}`);
  }
  for (const field of ['capture', 'composition']) {
    if (typeof manifest.referenceSource?.[field] !== 'string' || !manifest.referenceSource[field].trim()) {
      throw new Error(`Hero manifest is missing referenceSource.${field}`);
    }
  }
  if (manifest.review?.status !== 'approved') {
    throw new Error('Hero artwork is not approved. Review the generated image against its references before generating the website.');
  }
  if (typeof manifest.review.reviewedAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T/.test(manifest.review.reviewedAt)
    || !Number.isFinite(Date.parse(manifest.review.reviewedAt))) {
    throw new Error('Hero manifest is missing a valid review.reviewedAt timestamp');
  }
  if (manifest.canonicalDemoState !== CANONICAL_DEMO_STATE) {
    throw new Error('Hero canonicalDemoState is stale. Regenerate and review the hero for the current canonical demo state.');
  }
  if (!SHA256.test(expectedFingerprint) || manifest.uiSourceFingerprint !== expectedFingerprint) {
    throw new Error('Hero uiSourceFingerprint is stale. Regenerate and review the hero for the current app source.');
  }
  const referencePath = resolve(assetDir, manifest.referenceCapturePath);
  const referenceRelative = relative(resolve(assetDir), referencePath);
  if (isAbsolute(manifest.referenceCapturePath) || !referenceRelative
    || referenceRelative === '..' || referenceRelative.startsWith(`..${sep}`)) {
    throw new Error('Hero referenceCapturePath must stay within the asset directory');
  }
  if (!existsSync(referencePath)) throw new Error(`Missing hero reference capture: ${referencePath}`);
  const realReferenceRelative = relative(realpathSync(assetDir), realpathSync(referencePath));
  if (realReferenceRelative === '..' || realReferenceRelative.startsWith(`..${sep}`) || isAbsolute(realReferenceRelative)) {
    throw new Error('Hero referenceCapturePath must stay within the asset directory');
  }
  pngInfo(referencePath);
  if (sha256(referencePath) !== manifest.referenceCaptureSha256) {
    throw new Error('Hero reference capture digest does not match referenceCaptureSha256. Restore the reviewed reference or regenerate and review the hero.');
  }
  const image = pngInfo(imagePath);
  if (sha256(imagePath) !== manifest.imageSha256) {
    throw new Error('Hero image digest does not match imageSha256. Restore the approved artwork or regenerate and review the hero.');
  }
  for (const [field, actual] of [['imageWidth', image.width], ['imageHeight', image.height]]) {
    if (!Number.isInteger(manifest[field]) || manifest[field] <= 0 || manifest[field] !== actual) {
      throw new Error(`Hero ${field} does not match the PNG dimensions`);
    }
  }
  return { imagePath, manifest, width: image.width, height: image.height };
}

export function findProductionPackage() {
  const distDir = join(APP_DIR, 'dist');
  const packages = readdirSync(distDir)
    .filter((name) => name.endsWith('.zab'))
    .map((name) => join(distDir, name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  if (!packages.length) throw new Error(`No Zeus production package found in ${distDir}`);
  return packages[0];
}

export function validateProvenance(provenance, expected) {
  const required = [
    'sourceRevision', 'appVersion', 'appCode', 'zeusTarget', 'simulatorTarget',
    'packageSha256', 'screenshotSha256', 'canonicalDemoState',
  ];
  for (const field of required) {
    if (!provenance[field]) throw new Error(`Provenance is missing ${field}`);
  }
  for (const field of ['sourceRevision', 'appVersion', 'appCode', 'zeusTarget', 'simulatorTarget', 'canonicalDemoState']) {
    if (provenance[field] !== expected[field]) {
      throw new Error(`Provenance ${field} does not match the current build`);
    }
  }
  if (!/^[a-f0-9]{64}$/.test(provenance.packageSha256)
    || !/^[a-f0-9]{64}$/.test(provenance.screenshotSha256)) {
    throw new Error('Provenance contains an invalid SHA-256 digest');
  }
  return provenance;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildProvenance({ app, packagePath, screenshotPath, ocrText, zeusVersion }) {
  const screenshot = pngInfo(screenshotPath);
  return {
    generatedAt: new Date().toISOString(),
    sourceRevision: currentRevision(),
    appName: app.name,
    appVersion: app.version,
    appCode: app.code,
    zeusTarget: ZEUS_TARGET,
    simulatorTarget: SIMULATOR_TARGET,
    zeusVersion,
    packagePath: relative(ROOT, packagePath),
    packageSha256: sha256(packagePath),
    screenshotPath: 'screenshot.png',
    screenshotSha256: sha256(screenshotPath),
    screenshotWidth: screenshot.width,
    screenshotHeight: screenshot.height,
    canonicalDemoState: CANONICAL_DEMO_STATE,
    simulatorOcr: ocrText,
  };
}

export function renderWebsite({
  outputDir = GENERATED_DIR,
  provenance,
  screenshotPath,
  site = readSiteMetadata(),
  assetDir = join(WEBSITE_DIR, 'assets'),
  uiSourceFingerprint: expectedFingerprint = uiSourceFingerprint(),
}) {
  const expected = {
    sourceRevision: provenance.sourceRevision,
    appVersion: provenance.appVersion,
    appCode: provenance.appCode,
    zeusTarget: provenance.zeusTarget,
    simulatorTarget: provenance.simulatorTarget,
    canonicalDemoState: CANONICAL_DEMO_STATE,
  };
  validateProvenance(provenance, expected);
  if (site.name !== provenance.appName) {
    throw new Error(`Website name ${site.name} does not match app name ${provenance.appName}`);
  }
  pngInfo(screenshotPath);
  if (sha256(screenshotPath) !== provenance.screenshotSha256) {
    throw new Error('Screenshot digest does not match provenance screenshotSha256');
  }
  const hero = validateHeroAsset({ assetDir, uiSourceFingerprint: expectedFingerprint });

  const values = {
    TITLE: escapeHtml(site.name),
    DESCRIPTOR: escapeHtml(site.descriptor),
    DEMO_STATE: escapeHtml(site.demoState),
    EVIDENCE_NOTE: escapeHtml(site.evidenceNote),
    APP_VERSION: escapeHtml(`${provenance.appVersion} (code ${provenance.appCode})`),
    SOURCE_REVISION: escapeHtml(provenance.sourceRevision),
    ZEUS_TARGET: escapeHtml(provenance.zeusTarget),
    SIMULATOR_TARGET: escapeHtml(provenance.simulatorTarget),
    CAPTURED_AT: escapeHtml(provenance.generatedAt),
    HERO_IMAGE: 'hero.png',
    HERO_ALT: escapeHtml('Illustrative Amazfit Bip Max render displaying Tallyform, with 4 m, 5 made, 1 missed and an 83% make rate.'),
    HERO_WIDTH: hero.width,
    HERO_HEIGHT: hero.height,
  };
  const pages = [
    ['template.html', 'index.html'],
    ['technical.html', 'technical.html'],
  ].map(([template, filename]) => ({
    filename,
    html: readFileSync(join(WEBSITE_DIR, template), 'utf8').replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Unknown website template field: ${key}`);
      return values[key];
    }),
  }));
  const stage = `${outputDir}.staging-${process.pid}`;
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  try {
    for (const page of pages) writeFileSync(join(stage, page.filename), page.html);
    copyFileSync(join(WEBSITE_DIR, 'styles.css'), join(stage, 'styles.css'));
    copyFileSync(hero.imagePath, join(stage, 'hero.png'));
    copyFileSync(screenshotPath, join(stage, 'screenshot.png'));
    writeFileSync(join(stage, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
    writeFileSync(join(stage, 'hero-provenance.json'), `${JSON.stringify(hero.manifest, null, 2)}\n`);
  } catch (error) {
    rmSync(stage, { recursive: true, force: true });
    throw error;
  }
  // The staged directory is complete before it replaces the previous published output.
  return { outputDir: stage, finalOutputDir: outputDir };
}

export function publishRenderedWebsite({ outputDir, finalOutputDir }) {
  if (!statSync(outputDir).isDirectory()) throw new Error('Rendered website staging path is not a directory');
  if (!existsSync(finalOutputDir)) {
    renameSync(outputDir, finalOutputDir);
    return;
  }
  const backup = mkdtempSync(`${finalOutputDir}.previous-`);
  const previous = join(backup, 'site');
  renameSync(finalOutputDir, previous);
  try {
    renameSync(outputDir, finalOutputDir);
  } catch (error) {
    renameSync(previous, finalOutputDir);
    rmSync(backup, { recursive: true, force: true });
    throw error;
  }
  rmSync(backup, { recursive: true, force: true });
}
