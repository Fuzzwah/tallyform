import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  ZEUS_TARGET,
  buildProvenance,
  findProductionPackage,
  publishRenderedWebsite,
  readAppMetadata,
  renderWebsite,
} from './website-generator.mjs';
import { captureSimulator } from './capture-simulator.mjs';

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    let error = '';
    child.stdout.on('data', (chunk) => { output += chunk; process.stdout.write(chunk); });
    child.stderr.on('data', (chunk) => { error += chunk; process.stderr.write(chunk); });
    child.on('error', reject);
    child.on('close', (code) => code === 0
      ? resolvePromise(output)
      : reject(new Error(`${command} ${args.join(' ')} failed${error.trim() ? `: ${error.trim()}` : ''}`)));
  });
}

function waitForDev(child) {
  return new Promise((resolvePromise, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Timed out waiting for Zeus simulator refresh')), 90_000);
    const onData = (chunk) => {
      output += chunk;
      if (output.includes('watching the changes in this project')) {
        clearTimeout(timer);
        resolvePromise();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code !== null && code !== 0) reject(new Error(`Zeus dev exited before simulator refresh (${code})`));
    });
  });
}

async function startDev() {
  const child = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  await waitForDev(child);
  return child;
}

function stopDev(child) {
  if (!child || child.killed) return;
  if (process.platform !== 'win32') {
    try {
      process.kill(-child.pid, 'SIGTERM');
      return;
    } catch {
      // Fall through when the process group has already exited.
    }
  }
  child.kill('SIGTERM');
}

function zeusVersion() {
  return requireVersion('zeus');
}

function requireVersion(command) {
  const result = spawnSync('npm', ['run', '--silent', command, '--', '--version'], {
    cwd: ROOT, encoding: 'utf8',
  });
  return (result.stdout || '').trim();
}

async function main() {
  const tempDir = mkdtempSync(join('/tmp', 'tallyform-website-'));
  const screenshotPath = join(tempDir, 'screenshot.png');
  let dev;
  try {
    await run('npm', ['test']);
    await run('npm', ['run', 'build']);
    const builtPackagePath = findProductionPackage();
    const packagePath = join(tempDir, 'production.zab');
    copyFileSync(builtPackagePath, packagePath);
    dev = await startDev();
    const capture = captureSimulator(screenshotPath);
    const app = readAppMetadata();
    const provenance = buildProvenance({
      app,
      packagePath,
      screenshotPath,
      ocrText: capture.ocrText,
      zeusVersion: zeusVersion(),
    });
    const rendered = renderWebsite({
      provenance,
      screenshotPath,
    });
    publishRenderedWebsite(rendered);
    console.log(JSON.stringify({
      siteDir: rendered.finalOutputDir,
      technicalPath: join(rendered.finalOutputDir, 'technical.html'),
      heroPath: join(rendered.finalOutputDir, 'hero.png'),
      heroProvenancePath: join(rendered.finalOutputDir, 'hero-provenance.json'),
      screenshotPath: join(rendered.finalOutputDir, 'screenshot.png'),
      provenancePath: join(rendered.finalOutputDir, 'provenance.json'),
      sourceRevision: provenance.sourceRevision,
      appVersion: provenance.appVersion,
      target: ZEUS_TARGET,
    }, null, 2));
  } finally {
    stopDev(dev);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`generate-website: ${error.message}`);
  process.exitCode = 1;
});
