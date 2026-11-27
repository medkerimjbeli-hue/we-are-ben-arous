// Spins up an in-memory Postgres (PGlite), applies the Supabase stand-ins, every migration and the seed.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

export const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
export const USER_ID = '22222222-2222-4222-8222-222222222222';

export async function createDb() {
  const db = new PGlite();
  await db.exec(read('tests/db/supabase-stub.sql'));
  for (const f of readdirSync(resolve(root, 'supabase/migrations')).sort()) await db.exec(read(`supabase/migrations/${f}`));
  await db.exec(read('supabase/seed.sql'));
  await db.exec(`insert into auth.users (id, email) values ('${ADMIN_ID}', 'admin@test'), ('${USER_ID}', 'user@test');
                 insert into public.admin_users (user_id, email) values ('${ADMIN_ID}', 'admin@test');`);
  return db;
}

/** Runs `fn` as a given Supabase role inside a rolled-back transaction. */
export async function as<T>(db: PGlite, who: 'anon' | 'user' | 'admin', fn: (q: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; affectedRows?: number }>) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    const sub = who === 'admin' ? ADMIN_ID : who === 'user' ? USER_ID : '';
    await tx.exec(`set local role ${who === 'anon' ? 'anon' : 'authenticated'};`);
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub, role: who === 'anon' ? 'anon' : 'authenticated' })]);
    try { return await fn((sql, params) => tx.query(sql, params) as never); }
    finally { await tx.rollback(); }
  });
}
