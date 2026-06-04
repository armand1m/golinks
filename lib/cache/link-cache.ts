import { cacheLogger } from './logger';

export interface LinkCacheEntry {
  id: string;
  alias: string;
  url: string;
  isPrivate: boolean;
  createdByEmail: string | null;
  allowedEmails: string[];
  cachedAt: number;
}

interface RawLinkRow {
  id: string;
  alias: string;
  url: string;
  is_private: boolean;
  created_by_email: string | null;
  allowed_emails: string[];
}

export class LinkCache {
  private cache = new Map<string, LinkCacheEntry>();
  private aliasById = new Map<string, string>();
  private ttlMs: number;
  private refreshIntervalMs: number;
  private refreshTimer: ReturnType<typeof setInterval> | undefined;
  private warmupFn: (() => Promise<void>) | undefined;

  constructor(ttlMs: number, refreshIntervalMs: number) {
    this.ttlMs = ttlMs;
    this.refreshIntervalMs = refreshIntervalMs;
  }

  get(alias: string): LinkCacheEntry | undefined {
    const entry = this.cache.get(alias);
    if (!entry) {
      cacheLogger.debug('cache.miss', {
        alias,
        cacheSize: this.cache.size,
      });
      return undefined;
    }

    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(alias);
      this.aliasById.delete(entry.id);
      cacheLogger.debug('cache.expired', {
        alias,
        ttlMs: this.ttlMs,
      });
      return undefined;
    }

    cacheLogger.info('cache.hit', {
      alias,
      cacheSize: this.cache.size,
    });
    return entry;
  }

  set(entry: LinkCacheEntry): void {
    const existing = this.cache.get(entry.alias);
    if (existing) {
      this.aliasById.delete(existing.id);
    }

    this.cache.set(entry.alias, {
      ...entry,
      cachedAt: entry.cachedAt || Date.now(),
    });
    this.aliasById.set(entry.id, entry.alias);
  }

  deleteByAlias(alias: string): void {
    const entry = this.cache.get(alias);
    if (entry) {
      this.cache.delete(alias);
      this.aliasById.delete(entry.id);
    }
  }

  deleteById(id: string): void {
    const alias = this.aliasById.get(id);
    if (alias) {
      this.cache.delete(alias);
      this.aliasById.delete(id);
    }
  }

  has(alias: string): boolean {
    return this.get(alias) !== undefined;
  }

  clear(): void {
    this.cache.clear();
    this.aliasById.clear();
  }

  warmup(rows: RawLinkRow[]): void {
    const newCache = new Map<string, LinkCacheEntry>();
    const newAliasById = new Map<string, string>();
    const now = Date.now();

    for (const row of rows) {
      const entry: LinkCacheEntry = {
        id: row.id,
        alias: row.alias,
        url: row.url,
        isPrivate: row.is_private,
        createdByEmail: row.created_by_email,
        allowedEmails: row.allowed_emails || [],
        cachedAt: now,
      };
      newCache.set(row.alias, entry);
      newAliasById.set(row.id, row.alias);
    }

    this.cache = newCache;
    this.aliasById = newAliasById;
  }

  startBackgroundRefresh(warmupFn: () => Promise<void>): void {
    this.warmupFn = warmupFn;
    this.refreshTimer = setInterval(() => {
      this.warmupFn?.().catch(() => {});
    }, this.refreshIntervalMs);
  }

  stopBackgroundRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  canAccess(
    alias: string,
    userEmail: string | null | undefined
  ): boolean {
    const entry = this.get(alias);
    if (!entry) return false;

    if (!entry.isPrivate) return true;

    if (!userEmail) return false;

    if (entry.createdByEmail === userEmail) return true;

    return entry.allowedEmails.includes(userEmail);
  }

  get size(): number {
    return this.cache.size;
  }
}

const GLOBAL_KEY = '__golinks_link_cache__' as const;

declare global {
  // eslint-disable-next-line no-var
  var __golinks_link_cache__: LinkCache | undefined;
}

export function getLinkCache(
  ttlMs = 5 * 60 * 1000,
  refreshIntervalMs = 5 * 60 * 1000
): LinkCache {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = new LinkCache(ttlMs, refreshIntervalMs);
  }
  return globalThis[GLOBAL_KEY];
}
