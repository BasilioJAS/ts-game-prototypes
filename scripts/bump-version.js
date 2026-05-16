import { readFileSync, writeFileSync } from 'fs';

const path = 'shared/version.ts';

let content;
try {
  content = readFileSync(path, 'utf8');
} catch {
  content = `export const APP_VERSION = '1.0.0';`;
}

const match = content.match(/'(\d+)\.(\d+)\.(\d+)'/);
if (!match) throw new Error('Could not parse version');

const major = parseInt(match[1]);
const minor = parseInt(match[2]);
const patch = parseInt(match[3]) + 1;
const next = `${major}.${minor}.${patch}`;

const newContent = `export const APP_VERSION = '${next}';\n`;
writeFileSync(path, newContent, 'utf8');
console.log(`Bumped to ${next}`);
