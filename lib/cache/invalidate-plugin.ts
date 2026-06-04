import { makeWrapResolversPlugin } from 'graphile-utils';
import { getLinkCache } from './link-cache';
import { fetchAllowedEmailsForLink } from './warmup';
import { Config } from '../config';
import { cacheLogger } from './logger';

function getConnectionString(): string {
  return Config.database.connectionString;
}

export const CacheInvalidationPlugin = makeWrapResolversPlugin({
  Mutation: {
    createLink: {
      async resolve(resolve: () => Promise<any>) {
        const result = await resolve();

        try {
          const cache = getLinkCache();
          const link = result?.data?.link;
          if (link) {
            const allowedEmails = await fetchAllowedEmailsForLink(
              getConnectionString(),
              link.id
            );
            cache.set({
              id: link.id,
              alias: link.alias,
              url: link.url,
              isPrivate: link.isPrivate ?? false,
              createdByEmail: link.createdByEmail ?? null,
              allowedEmails,
              cachedAt: Date.now(),
            });
            cacheLogger.info('cache.create', {
              alias: link.alias,
              id: link.id,
            });
          }
        } catch (err) {
          cacheLogger.warn('cache.create.failed', {
            error: String(err),
          });
        }

        return result;
      },
    },
    updateLink: {
      async resolve(
        resolve: () => Promise<any>,
        _source: any,
        args: any
      ) {
        const cache = getLinkCache();
        const linkId = args?.input?.id;

        cache.deleteById(linkId);

        const result = await resolve();

        try {
          const link = result?.data?.link;
          if (link) {
            const allowedEmails = await fetchAllowedEmailsForLink(
              getConnectionString(),
              link.id
            );
            cache.set({
              id: link.id,
              alias: link.alias,
              url: link.url,
              isPrivate: link.isPrivate ?? false,
              createdByEmail: link.createdByEmail ?? null,
              allowedEmails,
              cachedAt: Date.now(),
            });
            cacheLogger.info('cache.update', {
              alias: link.alias,
              id: link.id,
            });
          }
        } catch (err) {
          cacheLogger.warn('cache.update.failed', {
            error: String(err),
          });
        }

        return result;
      },
    },
    deleteLink: {
      async resolve(
        resolve: () => Promise<any>,
        _source: any,
        args: any
      ) {
        const cache = getLinkCache();
        const linkId = args?.input?.id;

        cache.deleteById(linkId);
        cacheLogger.info('cache.delete', { id: linkId });

        return resolve();
      },
    },
  },
});
