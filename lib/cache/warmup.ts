import { Pool } from 'pg';
import { getLinkCache } from './link-cache';
import { cacheLogger } from './logger';

let pool: Pool | undefined;

function getPool(connectionString: string): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function fetchAllLinksForCache(
  connectionString: string
): Promise<
  {
    id: string;
    alias: string;
    url: string;
    is_private: boolean;
    created_by_email: string | null;
    allowed_emails: string[];
  }[]
> {
  const client = getPool(connectionString);
  const result = await client.query(
    `SELECT l.id::text,
            l.alias,
            l.url,
            l.is_private,
            l.created_by_email,
            COALESCE(
              json_agg(lae.email) FILTER (WHERE lae.email IS NOT NULL),
              '[]'
            ) AS allowed_emails
     FROM links l
     LEFT JOIN link_allowed_emails lae ON lae.link_id = l.id
     GROUP BY l.id, l.alias, l.url, l.is_private, l.created_by_email`
  );
  return result.rows;
}

export async function fetchAllowedEmailsForLink(
  connectionString: string,
  linkId: string
): Promise<string[]> {
  const client = getPool(connectionString);
  const result = await client.query(
    `SELECT COALESCE(
       json_agg(lae.email) FILTER (WHERE lae.email IS NOT NULL),
       '[]'
     ) AS allowed_emails
     FROM link_allowed_emails lae
     WHERE lae.link_id = $1`,
    [linkId]
  );
  return result.rows[0]?.allowed_emails || [];
}

export async function warmupLinkCache(
  connectionString: string
): Promise<void> {
  const rows = await fetchAllLinksForCache(connectionString);
  const cache = getLinkCache();
  cache.warmup(rows);
  cacheLogger.info('cache.warmup', { count: rows.length });
}

export function startCacheRefreshLoop(
  connectionString: string,
  _refreshIntervalMs?: number
): void {
  const cache = getLinkCache();
  cache.startBackgroundRefresh(async () => {
    try {
      await warmupLinkCache(connectionString);
    } catch (err) {
      cacheLogger.error('cache.refresh.failed', {
        error: String(err),
      });
    }
  });
}
