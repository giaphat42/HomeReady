/** Static deploy output is generated from src/. Edit src/, never dist/. */
import { cp, mkdir, rm } from 'node:fs/promises';
const destination = new URL('../dist/', import.meta.url);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(new URL('../src/', import.meta.url), destination, { recursive: true });
console.log('Built src/ -> dist/. No dependencies or bundler required.');
