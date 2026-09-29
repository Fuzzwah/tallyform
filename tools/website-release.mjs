import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';

function digestSite(directory) {
  const hash = createHash('sha256');
  const visit = (directoryPath) => {
    for (const name of readdirSync(directoryPath).sort()) {
      const path = resolve(directoryPath, name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw new Error(`Site contains a symbolic link: ${path}`);
      if (stat.isDirectory()) visit(path);
      else if (stat.isFile()) {
        const data = readFileSync(path);
        const key = relative(directory, path).split(sep).join('/');
        hash.update(`${Buffer.byteLength(key)}:${key}:${data.length}:`);
        hash.update(data);
      } else throw new Error(`Unsupported site entry: ${path}`);
    }
  };
  for (const required of ['index.html', 'technical.html', 'styles.css', 'hero.png', 'screenshot.png', 'provenance.json', 'hero-provenance.json']) {
    if (!existsSync(resolve(directory, required))) throw new Error(`Incomplete website: missing ${required}`);
  }
  visit(directory);
  return hash.digest('hex');
}

try {
  const [action, input, argument] = process.argv.slice(2);
  if (action === 'seal' && input && argument) {
    const source = realpathSync(input);
    const bundle = resolve(argument);
    // Never erase an input directory or accept overlapping source/output trees.
    if (source === bundle || source.startsWith(`${bundle}${sep}`) || bundle.startsWith(`${source}${sep}`)) {
      throw new Error('Source and review bundle must not overlap');
    }
    if (existsSync(bundle)) throw new Error('Review bundle already exists; choose a new bundle directory');
    const digest = digestSite(source);
    mkdirSync(bundle, { recursive: true });
    try {
      cpSync(source, resolve(bundle, 'site'), { recursive: true });
      if (digestSite(resolve(bundle, 'site')) !== digest) throw new Error('Site changed while sealing review bundle');
      writeFileSync(resolve(bundle, 'review.json'), `${JSON.stringify({ schemaVersion: 1, siteSha256: digest }, null, 2)}\n`);
    } catch (error) {
      rmSync(bundle, { recursive: true, force: true });
      throw error;
    }
    console.log(digest);
  } else if (action === 'verify' && input && /^[a-f0-9]{64}$/.test(argument || '')) {
    const bundle = realpathSync(input);
    const manifest = JSON.parse(readFileSync(resolve(bundle, 'review.json'), 'utf8'));
    const actual = digestSite(resolve(bundle, 'site'));
    if (manifest.schemaVersion !== 1 || manifest.siteSha256 !== argument || actual !== argument) {
      throw new Error('Website does not match the explicitly approved digest');
    }
    console.log(actual);
  } else {
    throw new Error('Usage: website-release.mjs seal SITE NEW_BUNDLE | verify BUNDLE APPROVED_SHA256');
  }
} catch (error) {
  console.error(`website-release: ${error.message}`);
  process.exitCode = 1;
}
