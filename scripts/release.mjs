#!/usr/bin/env node
// Release script: preflight → checks → release commit → Android + iOS builds →
// checksums → annotated tag → atomic push → draft GitHub release → publish.
//
//   npm run release -- X.Y.Z [--pause] [--ios-cloud] [--co-author "Name <email>"]
//   npm run release -- X.Y.Z --publish
//   npm run release -- X.Y.Z --abort
//
// The GitHub release notes are CHANGELOG.md's section for X.Y.Z (moved there
// from [Unreleased] by the release commit) plus a which-file-to-download footer.
// --pause stops after the builds (nothing pushed yet) so the artifacts can be
// smoke-tested; --publish then picks up from there. --abort drops an unpushed
// release commit so the release can be redone after a fix.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = 'what-did-i-eat';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
process.chdir(ROOT);

// ---------- helpers ----------

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function step(message) {
  console.log(`\n▶ ${message}`);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) fail(`\`${cmd} ${args.join(' ')}\` failed (exit ${r.status})`);
}

function out(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function succeeds(cmd, args) {
  return spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function parseVersion(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v ?? '');
  return m && m.slice(1).map(Number);
}

function isNewer(a, b) {
  const [x, y] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
}

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------- args ----------

const argv = process.argv.slice(2);
const version = argv.find((a) => !a.startsWith('--') && parseVersion(a));
const flag = (name) => argv.includes(name);
const option = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};

if (!version) fail('usage: npm run release -- X.Y.Z [--pause] [--ios-cloud] [--co-author "Name <email>"] | --publish | --abort');

const tag = `v${version}`;
const outDir = path.join('releases', tag);
const releaseSubject = `release ${tag}`;
const coAuthor = option('--co-author');

const headSubject = () => out('git', ['log', '-1', '--format=%s']);
const readPkgVersion = () => JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

function assertCleanMain() {
  if (out('git', ['branch', '--show-current']) !== 'main') fail('not on main');
  if (out('git', ['status', '--porcelain']) !== '') fail('working tree is not clean (commit, stash or gitignore first)');
}

// CHANGELOG.md's "## [name]" section; [1] is its body, up to the next "## [".
function changelogSection(changelog, name) {
  const heading = name.replace(/\./g, '\\.');
  return new RegExp(`^## \\[${heading}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|(?![\\s\\S]))`, 'm').exec(changelog);
}

// ---------- phase 1: preflight ----------

function preflight() {
  step('Preflight');
  assertCleanMain();
  if (!succeeds('gh', ['auth', 'status'])) fail('gh is not authenticated (run `gh auth login`)');
  run('git', ['fetch', '--quiet', 'origin']);
  if (out('git', ['rev-list', '--count', 'HEAD..origin/main']) !== '0') fail('main is behind origin/main — pull first');

  const current = readPkgVersion();
  if (!isNewer(version, current)) {
    const hint = headSubject() === releaseSubject ? ` (HEAD is already "${releaseSubject}" — run with --abort to redo it)` : '';
    fail(`${version} is not newer than the current ${current}${hint}`);
  }
  if (succeeds('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`])) fail(`tag ${tag} already exists locally`);
  if (out('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]) !== '') fail(`tag ${tag} already exists on origin`);
  if (succeeds('gh', ['release', 'view', tag])) fail(`GitHub release ${tag} already exists`);
}

// ---------- phase 2: local checks ----------

function checks() {
  step('Type-check');
  run('npx', ['tsc', '--noEmit']);
  step('Tests');
  run('npx', ['jest', '--ci']);
}

// ---------- phase 3: release commit ----------

function releaseCommit() {
  step(`Release commit (${releaseSubject})`);

  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  const m = changelogSection(changelog, 'Unreleased');
  if (!m || m[1].trim() === '') fail('CHANGELOG.md has nothing under [Unreleased]');
  const released = `## [Unreleased]\n\n## [${version}] - ${today()}\n\n${m[1].trim()}\n\n`;
  fs.writeFileSync('CHANGELOG.md', changelog.slice(0, m.index) + released + changelog.slice(m.index + m[0].length));

  const bump = (file, re) => {
    const text = fs.readFileSync(file, 'utf8');
    if (!re.test(text)) fail(`couldn't find the version string in ${file}`);
    fs.writeFileSync(file, text.replace(re, (s) => s.replace(/\d+\.\d+\.\d+/, version)));
  };
  bump('package.json', /"version": "\d+\.\d+\.\d+"/);
  bump('app.config.js', /version: '\d+\.\d+\.\d+'/);

  run('git', ['add', 'CHANGELOG.md', 'package.json', 'app.config.js']);
  const message = coAuthor ? `${releaseSubject}\n\nCo-Authored-By: ${coAuthor}` : releaseSubject;
  run('git', ['commit', '--quiet', '-m', message]);
}

// ---------- phase 4: builds ----------

function buildAndroid() {
  step('Android build (production-apk, local)');
  const archive = path.join(outDir, 'android-build.tar.gz');
  run('npx', ['eas-cli', 'build', '--platform', 'android', '--profile', 'production-apk', '--local', '--non-interactive', '--output', archive]);

  const raw = path.join(outDir, 'android-raw');
  fs.mkdirSync(raw, { recursive: true });
  run('tar', ['-xzf', archive, '-C', raw]);

  const apks = new Map();
  for (const file of fs.readdirSync(raw, { recursive: true })) {
    const abi = /(?:^|\/)app-(.+)-release\.apk$/.exec(file)?.[1];
    if (abi) apks.set(abi, path.join(raw, file));
  }

  // The universal APK carries every ABI the build targets; there must be
  // exactly one split APK per ABI, each holding only its own native libs.
  const libAbis = (apk) => new Set(out('unzip', ['-Z1', apk]).split('\n').map((e) => /^lib\/([^/]+)\//.exec(e)?.[1]).filter(Boolean));
  if (!apks.has('universal')) fail(`no universal APK in the build output (found: ${[...apks.keys()].join(', ') || 'nothing'})`);
  const abis = [...libAbis(apks.get('universal'))].sort();
  const splits = [...apks.keys()].filter((k) => k !== 'universal').sort();
  if (abis.length === 0 || abis.join() !== splits.join()) {
    fail(`split APKs [${splits}] don't match the universal APK's ABIs [${abis}]`);
  }
  for (const abi of splits) {
    const inside = [...libAbis(apks.get(abi))].sort();
    if (inside.length !== 1 || inside[0] !== abi) fail(`app-${abi}-release.apk contains native libs for [${inside}]`);
  }

  for (const [abi, file] of apks) fs.renameSync(file, path.join(outDir, `${APP}-${tag}-${abi}.apk`));
  fs.rmSync(raw, { recursive: true });
  fs.rmSync(archive);
  console.log(`  ${apks.size} APKs: ${splits.join(', ')} + universal`);
}

async function buildIos() {
  const ipa = path.join(outDir, `${APP}-${tag}.ipa`);
  if (!flag('--ios-cloud')) {
    step('iOS build (production, local)');
    run('npx', ['eas-cli', 'build', '--platform', 'ios', '--profile', 'production', '--local', '--non-interactive', '--output', ipa]);
    return;
  }
  step('iOS build (production, EAS cloud)');
  const r = spawnSync('npx', ['eas-cli', 'build', '--platform', 'ios', '--profile', 'production', '--non-interactive', '--wait', '--json'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8',
  });
  if (r.status !== 0) fail('EAS cloud iOS build failed');
  const url = JSON.parse(r.stdout)[0]?.artifacts?.applicationArchiveUrl;
  if (!url) fail('EAS cloud build finished without an .ipa URL');
  const res = await fetch(url);
  if (!res.ok) fail(`downloading the .ipa failed: HTTP ${res.status}`);
  fs.writeFileSync(ipa, Buffer.from(await res.arrayBuffer()));
}

function assetFiles() {
  return fs.readdirSync(outDir).filter((f) => f.endsWith('.apk') || f.endsWith('.ipa')).sort();
}

function writeChecksums() {
  step('SHA256SUMS');
  const lines = assetFiles().map((f) => `${sha256(path.join(outDir, f))}  ${f}`);
  fs.writeFileSync(path.join(outDir, 'SHA256SUMS'), lines.join('\n') + '\n');
  console.log(lines.map((l) => `  ${l}`).join('\n'));
}

// ---------- phase 5: publish ----------

function verifyArtifacts() {
  step('Verify artifacts');
  const sums = path.join(outDir, 'SHA256SUMS');
  if (!fs.existsSync(sums)) fail(`${sums} missing — run the build phase first`);
  const listed = fs.readFileSync(sums, 'utf8').trim().split('\n').map((l) => l.split(/\s+/));
  const files = assetFiles();
  if (listed.map(([, f]) => f).sort().join() !== files.join()) fail('SHA256SUMS does not match the files in ' + outDir);
  for (const [hash, f] of listed) if (sha256(path.join(outDir, f)) !== hash) fail(`checksum mismatch for ${f}`);
  if (!files.some((f) => f.endsWith('-universal.apk'))) fail('universal APK missing');
  if (!files.some((f) => f.endsWith('.ipa'))) fail('.ipa missing');
}

function releaseNotes() {
  const body = changelogSection(fs.readFileSync('CHANGELOG.md', 'utf8'), version)?.[1].trim();
  if (!body) fail(`CHANGELOG.md has no [${version}] section to use as release notes`);
  const apk = (abi) => `\`${APP}-${tag}-${abi}.apk\``;
  const footer = [
    '',
    '---',
    `**Android:** most phones → ${apk('arm64-v8a')} · older 32-bit phones → ${apk('armeabi-v7a')} · not sure → ${apk('universal')} (x86/x86_64 are for emulators).`,
    `**iOS:** \`${APP}-${tag}.ipa\` · \`SHA256SUMS\` to verify downloads.`,
  ].join('\n');
  const file = path.join(outDir, 'release-notes.md');
  fs.writeFileSync(file, body + '\n' + footer + '\n');
  return file;
}

function publish() {
  assertCleanMain();
  if (headSubject() !== releaseSubject) fail(`HEAD is not "${releaseSubject}"`);
  if (readPkgVersion() !== version) fail(`package.json version is not ${version}`);
  verifyArtifacts();

  step('Tag + push');
  run('git', ['fetch', '--quiet', 'origin']);
  if (!succeeds('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'])) fail('origin/main has moved on — not a fast-forward');
  if (succeeds('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`])) {
    if (out('git', ['rev-list', '-n1', tag]) !== out('git', ['rev-parse', 'HEAD'])) fail(`tag ${tag} exists but isn't on HEAD`);
  } else {
    run('git', ['tag', '-a', tag, '-m', tag]);
  }
  run('git', ['push', '--atomic', 'origin', 'main', `refs/tags/${tag}`]);

  step('GitHub release (draft → published)');
  const assets = [...assetFiles(), 'SHA256SUMS'].map((f) => path.join(outDir, f));
  const notes = releaseNotes();
  if (succeeds('gh', ['release', 'view', tag])) {
    // Re-run after a failed upload: refresh the draft's assets and notes.
    run('gh', ['release', 'upload', tag, ...assets, '--clobber']);
    run('gh', ['release', 'edit', tag, '--notes-file', notes]);
  } else {
    run('gh', ['release', 'create', tag, ...assets, '--draft', '--verify-tag', '--title', tag, '--notes-file', notes]);
  }
  run('gh', ['release', 'edit', tag, '--draft=false', '--latest']);
  console.log(`\n✔ Released ${tag}: ${out('gh', ['release', 'view', tag, '--json', 'url', '-q', '.url'])}`);
}

// ---------- abort ----------

function abort() {
  if (headSubject() !== releaseSubject) fail(`HEAD is not "${releaseSubject}" — nothing to abort`);
  run('git', ['fetch', '--quiet', 'origin']);
  if (succeeds('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'])) fail('the release commit is already on origin/main — too late to abort');
  if (out('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]) !== '') fail(`tag ${tag} is already on origin — too late to abort`);
  if (succeeds('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`])) run('git', ['tag', '-d', tag]);
  run('git', ['reset', '--keep', 'HEAD~1']);
  console.log(`\n✔ Dropped the unpushed "${releaseSubject}" commit; working-tree changes kept.`);
}

// ---------- main ----------

if (flag('--abort')) {
  abort();
} else if (flag('--publish')) {
  publish();
} else {
  preflight();
  checks();
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  releaseCommit();
  buildAndroid();
  await buildIos();
  writeChecksums();
  if (flag('--pause')) {
    console.log(`\n⏸ Paused before publishing. Nothing is pushed yet. Artifacts are in ${outDir}/.`);
    console.log(`  Smoke-test them, then:  npm run release -- ${version} --publish`);
    console.log(`  Or to redo the release: npm run release -- ${version} --abort`);
  } else {
    publish();
  }
}
