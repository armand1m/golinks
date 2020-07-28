import { postgraphile, PostGraphileOptions } from 'postgraphile';

const commonProperties: Partial<PostGraphileOptions> = {
  subscriptions: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  ignoreIndexes: false,
  appendPlugins: [require('@graphile-contrib/pg-simplify-inflector')],
  graphqlRoute: '/api/graphql',
  graphiqlRoute: '/api/graphiql',
  legacyRelations: 'omit',
  // jwtSecret: process.env.JWT_SECRET || "dev-secret",
  // jwtPgTypeIdentifier: "public.jwt_token",
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
  process.env.DATABASE_CONNECTION_STRING ||
    'postgres://dev:dev@localhost:5432/golinks',
  process.env.DATABASE_SCHEMA || 'public',
  process.env.NODE_ENV === 'production'
    ? productionProperties
    : devProperties
);
