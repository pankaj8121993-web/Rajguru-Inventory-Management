import 'server-only';

import { Pool, type PoolClient, type QueryResultRow } from 'pg';

/**
 * Server-side database access.
 *
 * ADR-0004: the browser never produces a stock-ledger effect. Every write goes
 * through a server action or route handler that uses this module. `server-only`
 * makes an accidental client import a build error rather than a runtime leak.
 */

declare global {
  var __rajguruPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local.');
  }

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // NFR-01: quantities must never become JavaScript floats. node-postgres parses
  // numeric as a string by default; keep it that way and convert deliberately
  // with Decimal at the point of use.
  return pool;
}

// Reuse the pool across hot reloads in development.
const pool = global.__rajguruPool ?? createPool();
if (process.env.NODE_ENV !== 'production') global.__rajguruPool = pool;

export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Runs `fn` inside a single transaction.
 *
 * Every business mutation uses this: the change and its audit event commit
 * together or not at all (NFR-14).
 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Writes an audit event. Must be called with the same client as the change it
 * describes, so that a failed audit fails the business transaction too.
 */
export async function writeAudit(
  client: PoolClient,
  event: {
    actorId: string | null;
    actorLabel: string;
    action: 'create' | 'update' | 'deactivate' | 'reactivate';
    entityTable: string;
    entityId: string | null;
    entityLabel: string | null;
    previousValue?: unknown;
    newValue?: unknown;
    reason?: string | null;
  },
): Promise<void> {
  await client.query(
    `insert into audit_events
       (actor_id, actor_label, action, entity_table, entity_id, entity_label,
        previous_value, new_value, reason)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      event.actorId,
      event.actorLabel,
      event.action,
      event.entityTable,
      event.entityId,
      event.entityLabel,
      event.previousValue === undefined ? null : JSON.stringify(event.previousValue),
      event.newValue === undefined ? null : JSON.stringify(event.newValue),
      event.reason ?? null,
    ],
  );
}

/**
 * The acting user.
 *
 * Interim: resolved from DEV_ACTOR_CODE until Supabase Auth is provisioned.
 * See docs/08-releases/KNOWN_ISSUES.md — this is not authentication.
 */
export async function currentActor(): Promise<{ id: string; label: string }> {
  const code = process.env.DEV_ACTOR_CODE ?? 'EMP001';
  const row = await queryOne<{ id: string; full_name: string }>(
    'select id, full_name from users where code = $1 and is_active',
    [code],
  );
  if (!row) return { id: '', label: `unknown (${code})` };
  return { id: row.id, label: row.full_name };
}

/**
 * Turns a database error into a message safe to show a user.
 *
 * SECURITY_MODEL.md 5: generic messages to the client, detail to the logs.
 * Constraint and trigger messages are authored by us and are safe to surface;
 * anything else is not.
 */
export function friendlyDbError(error: unknown): string {
  const e = error as { code?: string; message?: string; constraint?: string };

  // Messages raised by our own triggers (RAISE EXCEPTION) carry no internals.
  if (e?.code === 'P0001' && e.message) return e.message;

  if (e?.code === '23505') {
    if (e.constraint?.includes('code_unique_per_company')) {
      return 'That code is already used by another location in this company.';
    }
    if (e.constraint?.includes('code_unique_per_commodity')) {
      return 'That code is already used within this commodity.';
    }
    return 'That code is already in use. Codes must be unique.';
  }

  if (e?.code === '23514') {
    if (e.constraint?.includes('operational_within_approved')) {
      return 'Operational capacity cannot exceed approved capacity.';
    }
    if (e.constraint?.includes('capacity_non_negative')) {
      return 'Capacity cannot be negative.';
    }
    if (e.constraint?.includes('dimensions_non_negative')) {
      return 'Dimensions cannot be negative.';
    }
    if (e.constraint?.includes('not_blank')) {
      return 'Code and name are required.';
    }
    return 'The values entered are not valid for this record.';
  }

  if (e?.code === '23503') {
    return 'A referenced record does not exist, or is still in use elsewhere.';
  }

  console.error('Unhandled database error', error);
  return 'Something went wrong saving this record. The problem has been logged.';
}
