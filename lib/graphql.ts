import { postgraphile, PostGraphileOptions } from 'postgraphile';

const devProperties: PostGraphileOptions = {
  subscriptions: true,
  watchPg: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  ignoreIndexes: false,
  showErrorStack: "json",
  extendedErrors: ["hint", "detail", "errcode"],
  appendPlugins: [require("@graphile-contrib/pg-simplify-inflector")],
  graphqlRoute: "/api/graphql",
  graphiql: true,
  graphiqlRoute: "/api/graphiql",
  enhanceGraphiql: true,
  allowExplain(_req) {
    return true;
  },
  enableQueryBatching: true,
  legacyRelations: "omit",
  exportGqlSchemaPath: "./lib/type-defs.graphqls"
}

const productionProperties: PostGraphileOptions = {
  subscriptions: true,
  retryOnInitFail: true,
  dynamicJson: true,
  setofFunctionsContainNulls: false,
  ignoreRBAC: false,
  ignoreIndexes: false,
  extendedErrors: ["errcode"],
  appendPlugins: [require("@graphile-contrib/pg-simplify-inflector")],
  graphqlRoute: "/api/graphql",
  graphiql: false,
  graphiqlRoute: "/api/graphiql",
  enableQueryBatching: true,
  disableQueryLog: true,
  legacyRelations: "omit"
};

export const graphqlInstance = postgraphile(
  process.env.DATABASE_CONNECTION_STRING || "postgres://dev:dev@localhost:5432/golinks",
  process.env.DATABASE_SCHEMA || "app_public",
  process.env.NODE_ENV === "production" ? productionProperties : devProperties,
)