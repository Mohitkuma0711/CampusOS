#!/usr/bin/env node
/**
 * Build-time sanity check for required VITE_FIREBASE_* environment variables.
 * Reads from env/.env (matching Vite's envDir: ../../env) before build.
 *
 * Exit code 1 = build should be blocked.
 */

const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load env/.env the same way Vite would (envDir: ../../env)
const envPath = resolve(__dirname, '../../../env/.env');
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // File may not exist — the missing-var check below will catch it.
}

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

const PLACEHOLDER_PREFIXES = ['your-'];

let failed = false;

for (const name of REQUIRED_VARS) {
  const value = process.env[name];

  if (!value) {
    console.error(`\n❌  MISSING: ${name} is not set.`);
    console.error(`   Set it in env/.env (local) or as a build environment variable (CI/deploy).\n`);
    failed = true;
    continue;
  }

  if (PLACEHOLDER_PREFIXES.some((p) => value.startsWith(p))) {
    console.error(`\n❌  PLACEHOLDER: ${name} looks like a placeholder (${value.slice(0, 12)}...).`);
    console.error(`   Replace it with the real value before building.\n`);
    failed = true;
  }
}

if (failed) {
  console.error(
    '🚫  Build aborted — required Firebase environment variables are missing or invalid.\n' +
    '   Copy env/frontend.env.example → env/.env and fill in real values.\n'
  );
  process.exit(1);
}

console.log('✅  Firebase environment variables OK.');
