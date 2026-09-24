#!/usr/bin/env node
// Stand-in for `xcrun` (only `altool --upload-package`) in scripts/release.test.ts.
//   STUB_FAIL   comma list: altool
const fs = require('node:fs');

const args = process.argv.slice(2);
fs.appendFileSync(process.env.STUB_LOG, JSON.stringify(['xcrun', ...args]) + '\n');
const failing = (process.env.STUB_FAIL || '').split(',');

if (args[0] !== 'altool' || args[1] !== '--upload-package') {
  console.error(`xcrun stub: unexpected command ${args.join(' ')}`);
  process.exit(1);
}
if (!fs.existsSync(args[2])) {
  console.error(`xcrun stub: ${args[2]} doesn't exist`);
  process.exit(1);
}
process.exit(failing.includes('altool') ? 1 : 0);
