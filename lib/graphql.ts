import { NextApiRequest } from 'next';
import { postgraphile, PostGraphileOptions } from 'postgraphile';
import { getUserClaimsFromRequest } from './auth';
import { Config } from './config';

const commonProperties: Partial<PostGraphileOptions> = {
  subscriptions: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  ignoreIndexes: false,
  appendPlugins: [
    require('@graphile-contrib/pg-simplify-inflector'),
    require('postgraphile/plugins').TagsFilePlugin,
  ],
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
