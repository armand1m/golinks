import { NextApiRequest } from 'next';
import { postgraphile, PostGraphileOptions } from 'postgraphile';
import { getUserClaimsFromRequest } from './auth';
import { Config } from './config';
import { cacheLogger } from './cache/logger';
import { warmupLinkCache, startCacheRefreshLoop } from './cache/warmup';
import { getLinkCache } from './cache/link-cache';
import { CacheInvalidationPlugin } from './cache/invalidate-plugin';
import pgSimplifyInflector from '@graphile-contrib/pg-simplify-inflector';
import { TagsFilePlugin } from 'postgraphile/plugins';

const cacheEnabled =
  Config.cache.linkCacheEnabled && typeof window === 'undefined';

if (cacheEnabled) {
  warmupLinkCache(Config.database.connectionString)
    .then(() => {
      getLinkCache(
        Config.cache.linkCacheTtlMs,
        Config.cache.linkCacheRefreshMs
      );

      startCacheRefreshLoop(
        Config.database.connectionString,
        Config.cache.linkCacheRefreshMs
      );
      cacheLogger.info('cache.refresh.started', {
        intervalMs: Config.cache.linkCacheRefreshMs,
      });
    })
    .catch((err: Error) => {
      cacheLogger.error('cache.warmup.failed', {
        error: err.message,
      });
    });
}

const appendPlugins = [
  pgSimplifyInflector,
  TagsFilePlugin,
];

if (cacheEnabled) {
  appendPlugins.push(CacheInvalidationPlugin);
}

const commonProperties: Partial<PostGraphileOptions> = {
  subscriptions: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  ignoreIndexes: false,
  appendPlugins,
  graphqlRoute: '/api/graphql',
  graphiqlRoute: '/api/graphiql',
  legacyRelations: 'omit',
  enableQueryBatching: true,
  pgSettings: async (req) => {
    const { claims, user } = await getUserClaimsFromRequest(
      req as NextApiRequest
    );

    const settings: Record<string, string> = {
      role: 'postgraphile',
      'jwt.claims.roles': JSON.stringify(claims.roles),
      'jwt.claims.permissions': JSON.stringify(claims.permissions),
    };

    if (user?.email) {
      settings['jwt.claims.email'] = user.email;
    }

    return settings;
  },
};

const devProperties: PostGraphileOptions = {
  ...commonProperties,
  watchPg: true,
  showErrorStack: 'json',
  extendedErrors: ['hint', 'detail', 'errcode'],
  graphiql: true,
  enhanceGraphiql: true,
  allowExplain(_req) {
    return true;
  },
  exportGqlSchemaPath: './lib/type-defs.graphqls',
};

const productionProperties: PostGraphileOptions = {
  ...commonProperties,
  retryOnInitFail: true,
  extendedErrors: ['errcode'],
  graphiql: false,
  disableQueryLog: true,
};

export const graphqlInstance = postgraphile(
  Config.database.connectionString,
  Config.database.schema,
  Config.environment === 'production'
    ? productionProperties
    : devProperties
);
