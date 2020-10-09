import * as Yup from 'yup';
import { UserPermission, UserRole } from './permissions';

interface Auth0Props {
  domain: string;
  audience: string;
  clientId: string;
  clientSecret: string;
  cookieDomain: string;
  cookieSecret: string;
  redirectUrl: string;
  postLogoutRedirectUrl: string;
}

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

export type ConfigInterface = Yup.InferType<typeof ConfigSchema>;

const ConfigSchema = Yup.object({
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
      createErrorMessageForRequiredEnv('HOSTNAME')
    ),
  }).required(),
  anonymous: Yup.object({
    permissions: Yup.array<UserPermission>().required(),
    roles: Yup.array<UserRole>().required(),
  }).required(),
  features: Yup.object({
    auth0: Yup.boolean().required(
      createErrorMessageForRequiredEnv('AUTH0_ENABLED')
    ),
  }).required(),
  auth0: Yup.object<Auth0Props>().when('features.auth0', {
    is: true,
    then: Yup.object({
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
        createErrorMessageForRequiredEnv(
          'AUTH0_POST_LOGOUT_REDIRECT_URL'
        )
      ),
    }).required(),
    otherwise: Yup.object().optional(),
  }),
  database: Yup.object({
    connectionString: Yup.string().required(
      createErrorMessageForRequiredEnv('DATABASE_CONNECTION_STRING')
    ),
    schema: Yup.string().required(
      createErrorMessageForRequiredEnv('DATABASE_SCHEMA')
    ),
  }).required(),
}).required();

const createConfig = () => {
  const LOGONAME = process.env.LOGONAME;
  const HOSTNAME = process.env.HOSTNAME;
  const AUTH0_ENABLED = Boolean(process.env.AUTH0_ENABLED);
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
  const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
  const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;
  const AUTH0_COOKIE_DOMAIN = process.env.AUTH0_COOKIE_DOMAIN;
  const AUTH0_COOKIE_SECRET = process.env.AUTH0_COOKIE_SECRET;
  const AUTH0_REDIRECT_URL = process.env.AUTH0_REDIRECT_URL;
  const AUTH0_POST_LOGOUT_REDIRECT_URL =
    process.env.AUTH0_POST_LOGOUT_REDIRECT_URL;

  const DATABASE_CONNECTION_STRING =
    process.env.DATABASE_CONNECTION_STRING;
  const DATABASE_SCHEMA = process.env.DATABASE_SCHEMA;
  const ENVIRONMENT =
    process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development';

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

  const config = {
    environment: ENVIRONMENT,
    metadata: {
      logoname: LOGONAME,
      hostname: HOSTNAME,
    },
    anonymous: {
      permissions: ANONYMOUS_PERMISSIONS,
      roles: ANONYMOUS_ROLES,
    },
    features: {
      auth0: AUTH0_ENABLED,
    },
    auth0: AUTH0_ENABLED
      ? {
          domain: AUTH0_DOMAIN,
          audience: AUTH0_AUDIENCE,
          clientId: AUTH0_CLIENT_ID,
          clientSecret: AUTH0_CLIENT_SECRET,
          cookieDomain: AUTH0_COOKIE_DOMAIN,
          cookieSecret: AUTH0_COOKIE_SECRET,
          redirectUrl: AUTH0_REDIRECT_URL,
          postLogoutRedirectUrl: AUTH0_POST_LOGOUT_REDIRECT_URL,
        }
      : undefined,
    database: {
      connectionString: DATABASE_CONNECTION_STRING,
      schema: DATABASE_SCHEMA,
    },
  };

  const validatedConfig = ConfigSchema.validateSync(config, {
    abortEarly: false,
  });

  return validatedConfig;
};

export const Config = createConfig();
