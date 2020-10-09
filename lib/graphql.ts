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
  pgSettings: async (req) => {
    const { claims } = await getUserClaimsFromRequest(
      req as NextApiRequest
    );

    const settings = {
      role: 'postgraphile',
      'jwt.claims.roles': JSON.stringify(claims.roles),
      'jwt.claims.permissions': JSON.stringify(claims.permissions),
    };

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
  enableQueryBatching: true,
  exportGqlSchemaPath: './lib/type-defs.graphqls',
};

const productionProperties: PostGraphileOptions = {
  ...commonProperties,
  retryOnInitFail: true,
  extendedErrors: ['errcode'],
  graphiql: false,
  enableQueryBatching: true,
  disableQueryLog: true,
};

export const graphqlInstance = postgraphile(
  Config.database.connectionString,
  Config.database.schema,
  Config.environment === 'production'
    ? productionProperties
    : devProperties
);
