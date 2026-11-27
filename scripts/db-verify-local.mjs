// Applies every migration + seed to an in-memory PostgreSQL (PGlite) and runs supabase/verify.sql.
// Usage: npm run db:verify
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
const t0 = Date.now(); const log = (m) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', m);
const db = new PGlite(); await db.waitReady; log('ready');
const run = async (name, sql) => { try { await db.exec(sql); log('ok ' + name); } catch (e) { log('FAIL ' + name + ': ' + e.message); process.exit(1); } };
await run('stub', readFileSync('tests/db/supabase-stub.sql', 'utf8'));
for (const f of readdirSync('supabase/migrations').sort()) await run(f, readFileSync('supabase/migrations/' + f, 'utf8'));
await run('seed', readFileSync('supabase/seed.sql', 'utf8'));
const r = await db.exec(readFileSync('supabase/verify.sql', 'utf8')).catch((e) => { log('VERIFY FAIL: ' + e.message); process.exit(1); });
log(JSON.stringify(r.flatMap((x) => x.rows)));
