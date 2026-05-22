import type { IncomingMessage } from 'http';
import type { NextApiRequest } from 'next';
import jsonwebtoken from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { Auth0Client } from '@auth0/nextjs-auth0/server';
import type { SessionData } from '@auth0/nextjs-auth0/types';
import { Config } from './config';
import { UserRole, UserPermission } from './permissions';

interface JwtHeader {
  kid: string;
}

interface DecodedAccessToken {
  header: JwtHeader;
}

let jwksSecretClient: ReturnType<typeof jwksRsa> | null = null;

const getJwksClient = () => {
  if (!Config.auth0) {
    throw new Error(
      "Missing Auth0 parameters. Make sure you've passed correctly all environment variables."
    );
  }

  if (!jwksSecretClient) {
    jwksSecretClient = jwksRsa({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: new URL(
        '/.well-known/jwks.json',
        `https://${Config.auth0.domain}`
      ).href,
    });
  }

  return jwksSecretClient;
};

interface DecodedJwtToken {
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  permissions: string[];
  'https://user/roles': string[];
}

export const getPermissionsFromSession = async (
  session: SessionData
) => {
  if (!Config.auth0) {
    throw new Error(
      "Missing Auth0 parameters. Make sure you've passed correctly all environment variables."
    );
  }

  const auth0Config = Config.auth0;
  const accessToken = session.tokenSet.accessToken;

  if (!accessToken) {
    throw new Error(
      'Session is missing an access token. This is an issue with your auth provider.'
    );
  }

  const decodedAccessToken = jsonwebtoken.decode(
    accessToken,
    { complete: true }
  ) as DecodedAccessToken | undefined;

  if (!decodedAccessToken) {
    throw new Error('Failed to decode token.');
  }

  const client = getJwksClient();

  const signingKey = await client.getSigningKey(
    decodedAccessToken.header.kid
  );

  const token = jsonwebtoken.verify(
    accessToken,
    signingKey.getPublicKey(),
    {
      audience: auth0Config.audience,
      issuer: new URL(`https://${auth0Config.domain}`).href,
      algorithms: ['RS256'],
    }
  );

  if (typeof token === 'string') {
    throw new Error(
      'Decoded token is a string. An object with permissions is expected.'
    );
  }

  const jwtToken = token as DecodedJwtToken;

  return {
    permissions:
      (jwtToken.permissions as UserPermission[]) ||
      Config.anonymous.permissions,
    roles:
      (jwtToken['https://user/roles'] as UserRole[]) ||
      Config.anonymous.roles,
  };
};

export const getUserClaimsFromRequest = async (
  request: NextApiRequest | IncomingMessage,
) => {
  if (!Config.features.auth0) {
    return {
      claims: Config.anonymous,
      user: null,
    };
  }

  const auth0Instance = getAuth0();
  const session = await auth0Instance.getSession(request);

  if (!session || !session.tokenSet.accessToken) {
    return {
      claims: Config.anonymous,
      user: null,
    };
  }

  const claims = await getPermissionsFromSession(session);

  return {
    claims,
    user: session.user,
  };
};

let auth0Instance: Auth0Client | undefined;

export const getAuth0 = () => {
  if (!Config.features.auth0 || !Config.auth0) {
    throw new Error(
      'Auth0 is trying to be instantiated with missing environment variables.'
    );
  }

  if (auth0Instance) {
    return auth0Instance;
  }

  auth0Instance = new Auth0Client({
    secret: Config.auth0.cookieSecret,
    appBaseUrl: Config.metadata.baseUrl,
    clientId: Config.auth0.clientId,
    clientSecret: Config.auth0.clientSecret,
    domain: Config.auth0.domain,
    authorizationParameters: {
      audience: Config.auth0.audience,
      scope: 'openid email profile',
    },
    routes: {
      callback: '/api/callback',
    },
    session: {
      rolling: true,
      inactivityDuration: 60 * 60 * 8,
      cookie: {
        domain:
          Config.environment === 'development'
            ? 'localhost'
            : Config.auth0.cookieDomain,
        sameSite: 'lax',
      },
    },
    httpTimeout: 2500,
  });

  return auth0Instance;
};
