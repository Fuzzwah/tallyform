import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run only after explicit sign-off on this exact bundle and digest.
const root = fileURLToPath(new URL('..', import.meta.url));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, encoding: 'utf8' }).trim();
let staging;
try {
  const [bundlePath, approvedDigest, ...extra] = process.argv.slice(2);
  if (!bundlePath || !/^[a-f0-9]{64}$/.test(approvedDigest || '') || extra.length) {
    throw new Error('Usage (after user sign-off): node tools/publish-reviewed-website.mjs BUNDLE APPROVED_SHA256');
  }
  const bundle = resolve(bundlePath);
  const verifier = join(root, 'tools', 'website-release.mjs');
  run(process.execPath, [verifier, 'verify', bundle, approvedDigest]);
  const repository = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  const owner = repository.split('/')[0];
  const actor = run('gh', ['api', 'user', '--jq', '.login']);
  if (actor.toLowerCase() !== owner.toLowerCase()) throw new Error('Publication must be dispatched by the repository owner');
  const remote = run('git', ['remote', 'get-url', 'origin']);
  staging = mkdtempSync(join(tmpdir(), 'tallyform-publish-'));
  cpSync(join(bundle, 'site'), join(staging, 'site'), { recursive: true });
  cpSync(join(bundle, 'review.json'), join(staging, 'review.json'));
  run(process.execPath, [verifier, 'verify', staging, approvedDigest]);
  const branch = `website-review/${approvedDigest.slice(0, 12)}-${Date.now()}`;
  run('git', ['init', '--initial-branch', branch], staging);
  run('git', ['add', 'site', 'review.json'], staging);
  run('git', ['commit', '-m', `Preserve approved website ${approvedDigest}`], staging);
  const commit = run('git', ['rev-parse', 'HEAD'], staging);
  run('git', ['push', remote, `HEAD:refs/heads/${branch}`], staging);
  console.log(JSON.stringify({ repository, branch, reviewCommit: commit, approvedSha256: approvedDigest }, null, 2));
  run('gh', ['workflow', 'run', 'publish-website.yml', '--repo', repository, '--ref', 'main', '-f', `review_commit=${commit}`, '-f', `approved_sha256=${approvedDigest}`, '-f', 'confirm_approval=true']);
  console.log('Publication dispatched. Observe the Actions result and verify the live URL before claiming delivery.');
} catch (error) {
  console.error(`publish-reviewed-website: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (staging) rmSync(staging, { recursive: true, force: true });
}
