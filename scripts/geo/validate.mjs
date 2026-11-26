import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGeo } from './lib.mjs';
const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/geo');
const read = (f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
const errors = validateGeo(read('governorates.geojson'), read('ben-arous-delegations.geojson'));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Geographic data valid.');
