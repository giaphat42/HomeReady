/** Check every source module, not only the entry point. */
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

async function walk(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(path)));
    else if (/\.(js|mjs)$/.test(entry.name)) result.push(path);
  }
  return result;
}
const files = await walk(fileURLToPath(new URL('../src/js/', import.meta.url)));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}
console.log(`Syntax checked ${files.length} source modules.`);
