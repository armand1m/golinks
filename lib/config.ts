import * as Yup from 'yup';
import { UserPermission, UserRole } from './permissions';

const createErrorMessageForRequiredEnv = (
  env: string,
  possibleValues?: string[]
) => {
  const begin = `The "${env}" environment variable is required.`;

  if (!possibleValues || possibleValues.length === 0) {
    return begin;
  }

  const valuesMsg = `Make sure it is one of the possible values: ${possibleValues.join(
    ', '
  )}`;

  return `${begin} ${valuesMsg}`;
};

const auth0Schema = Yup.object({
  domain: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_DOMAIN')
  ),
  audience: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_AUDIENCE')
  ),
  clientId: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_CLIENT_ID')
  ),
  clientSecret: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_CLIENT_SECRET')
  ),
  cookieDomain: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_COOKIE_DOMAIN')
  ),
  cookieSecret: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_COOKIE_SECRET')
  ),
  redirectUrl: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_REDIRECT_URL')
  ),
  postLogoutRedirectUrl: Yup.string().required(
    createErrorMessageForRequiredEnv('AUTH0_POST_LOGOUT_REDIRECT_URL')
  ),
});

export type Auth0Config = Yup.InferType<typeof auth0Schema>;

const BaseConfigSchema = Yup.object({
  environment: Yup.string()
    .oneOf(['production', 'development'])
    .required(
      createErrorMessageForRequiredEnv('NODE_ENV', [
        'production',
        'development',
      ])
    ),
  metadata: Yup.object({
    logoname: Yup.string().required(
      createErrorMessageForRequiredEnv('LOGONAME')
    ),
    hostname: Yup.string().required(
      createErrorMessageForRequiredEnv('APP_HOSTNAME')
    ),
    port: Yup.number().default(3000),
    proto: Yup.string()
      .oneOf(['http', 'https'])
      .required(
        createErrorMessageForRequiredEnv('PROTO', ['http', 'https'])
      ),
    baseUrl: Yup.string().required(),
  }).required(),
  anonymous: Yup.object({
    permissions: Yup.array(
      Yup.string()
        .oneOf(Object.values(UserPermission))
        .required() as Yup.Schema<UserPermission>
    ).required(),
    roles: Yup.array(
      Yup.string()
        .oneOf(Object.values(UserRole))
        .required() as Yup.Schema<UserRole>
    ).required(),
  }).required(),
  features: Yup.object({
    auth0: Yup.boolean().required(
      createErrorMessageForRequiredEnv('AUTH0_ENABLED', [
        'true',
        'false',
      ])
    ),
  }).required(),
  database: Yup.object({
    connectionString: Yup.string().required(
      createErrorMessageForRequiredEnv('DATABASE_CONNECTION_STRING')
    ),
    schema: Yup.string().required(
      createErrorMessageForRequiredEnv('DATABASE_SCHEMA')
    ),
  }).required(),
  cache: Yup.object({
    linkCacheTtlMs: Yup.number().default(5 * 60 * 1000),
    linkCacheRefreshMs: Yup.number().default(5 * 60 * 1000),
    linkCacheEnabled: Yup.boolean().default(true),
    logLevel: Yup.string()
      .oneOf(['debug', 'info', 'warn', 'error', 'silent'])
      .default(undefined),
  }).required(),
  apollo: Yup.object({
    logLevel: Yup.string()
      .oneOf(['debug', 'info', 'warn', 'error', 'silent'])
      .default(undefined),
    requestLogging: Yup.boolean().default(
      process.env.NODE_ENV === 'development'
    ),
  }).required(),
}).required();

type BaseConfig = Yup.InferType<typeof BaseConfigSchema>;

export type ConfigInterface = BaseConfig & {
  auth0?: Auth0Config;
};

const validateConfig = (config: unknown, schema: Yup.AnySchema) => {
  try {
    return schema.validateSync(config, { abortEarly: false });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      const missing = error.inner
        .filter((e) => e.type === 'required')
        .map((e) => e.path)
        .filter(Boolean);
      const invalid = error.inner
        .filter((e) => e.type !== 'required')
        .map((e) => `${e.path}: ${e.message}`);

      const parts: string[] = ['Configuration validation failed:'];
      if (missing.length > 0) {
        parts.push(
          `  Missing required env vars for: ${missing.join(', ')}`
        );
      }
      if (invalid.length > 0) {
        parts.push(...invalid.map((msg) => `  ${msg}`));
      }

      throw new Error(parts.join('\n'));
    }
    throw error;
  }
};

const buildBaseUrl = (
  proto: string,
  hostname: string,
  port: string | undefined,
  environment: string
): string => {
  if (environment === 'production') {
    return `${proto}://${hostname}`;
  }
  return `${proto}://${hostname}${port ? `:${port}` : ''}`;
};

const createConfig = (): ConfigInterface => {
  const {
    PROTO,
    LOGONAME,
    APP_HOSTNAME,
    PORT,
    AUTH0_DOMAIN,
    AUTH0_AUDIENCE,
    AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET,
    AUTH0_COOKIE_DOMAIN,
    AUTH0_COOKIE_SECRET,
    AUTH0_REDIRECT_URL,
    AUTH0_POST_LOGOUT_REDIRECT_URL,
    DATABASE_CONNECTION_STRING,
    DATABASE_SCHEMA,
    NODE_ENV,
  } = process.env;

  const AUTH0_ENABLED = process.env.AUTH0_ENABLED === 'true';
  const ENVIRONMENT =
    NODE_ENV === 'production' ? 'production' : 'development';

  const ANONYMOUS_PERMISSIONS = AUTH0_ENABLED
    ? [UserPermission.ReadLink]
    : [
        UserPermission.CreateLink,
        UserPermission.ReadLink,
        UserPermission.DeleteLink,
        UserPermission.UpdateLink,
      ];

  const ANONYMOUS_ROLES = AUTH0_ENABLED
    ? [UserRole.Viewer]
    : [UserRole.Viewer, UserRole.Editor];

  const baseConfig: BaseConfig = validateConfig(
    {
      environment: ENVIRONMENT,
      metadata: {
        logoname: LOGONAME,
        hostname: APP_HOSTNAME,
        port: PORT ? parseInt(PORT, 10) : undefined,
        proto: PROTO,
        baseUrl: buildBaseUrl(
          PROTO!,
          APP_HOSTNAME!,
          PORT,
          ENVIRONMENT
        ),
      },
      anonymous: {
        permissions: ANONYMOUS_PERMISSIONS,
        roles: ANONYMOUS_ROLES,
      },
      features: {
        auth0: AUTH0_ENABLED,
      },
      database: {
        connectionString: DATABASE_CONNECTION_STRING,
        schema: DATABASE_SCHEMA,
      },
      cache: {
        linkCacheTtlMs: process.env.LINK_CACHE_TTL_MS
          ? parseInt(process.env.LINK_CACHE_TTL_MS, 10)
          : undefined,
        linkCacheRefreshMs: process.env.LINK_CACHE_REFRESH_MS
          ? parseInt(process.env.LINK_CACHE_REFRESH_MS, 10)
          : undefined,
        linkCacheEnabled: process.env.LINK_CACHE_ENABLED !== 'false',
        logLevel: process.env.CACHE_LOG_LEVEL || undefined,
      },
      apollo: {
        logLevel: process.env.APOLLO_LOG_LEVEL || undefined,
        requestLogging: process.env.APOLLO_REQUEST_LOGGING === 'true',
      },
    },
    BaseConfigSchema
  );

  let auth0: Auth0Config | undefined;
  if (AUTH0_ENABLED) {
    auth0 = validateConfig(
      {
        domain: AUTH0_DOMAIN,
        audience: AUTH0_AUDIENCE,
        clientId: AUTH0_CLIENT_ID,
        clientSecret: AUTH0_CLIENT_SECRET,
        cookieDomain: AUTH0_COOKIE_DOMAIN,
        cookieSecret: AUTH0_COOKIE_SECRET,
        redirectUrl: AUTH0_REDIRECT_URL,
        postLogoutRedirectUrl: AUTH0_POST_LOGOUT_REDIRECT_URL,
      },
      auth0Schema
    );
  }

  return { ...baseConfig, auth0 };
};

export const Config = createConfig();
