import {
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import type { IncomingMessage, ServerResponse } from 'http';
import jsonwebtoken from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { initAuth0 } from '@auth0/nextjs-auth0';
import Session from '@auth0/nextjs-auth0/dist/session/session';
import type { Auth0Server } from '@auth0/nextjs-auth0/dist/shared';
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
  /**
   * This is set by a Custom Auth0 Rule
   *
   * For some reason, the key needs to be a URI
   * otherwise Auth0 filters it out :shrug:
   **/
  'https://user/roles': string[];
}

export const getPermissionsFromSession = async (
  session: Session
) => {
  if (!Config.auth0) {
    throw new Error(
      "Missing Auth0 parameters. Make sure you've passed correctly all environment variables."
    );
  }

  const auth0Config = Config.auth0;

  if (!session.accessToken) {
    throw new Error(
      'Session is missing an access token. This is an issue with your auth provider.'
    );
  }

  const decodedAccessToken = jsonwebtoken.decode(
    session.accessToken,
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
    session.accessToken,
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
  response?: NextApiResponse | ServerResponse
) => {
  if (!Config.features.auth0) {
    return {
      claims: Config.anonymous,
      user: null,
    };
  }

  const auth0Instance = getAuth0();
  const session = response
    ? await auth0Instance.getSession(request as NextApiRequest, response as NextApiResponse)
    : await auth0Instance.getSession(request as IncomingMessage, {} as ServerResponse);

  if (!session || !session.accessToken) {
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

let auth0Instance: Omit<Auth0Server, 'withMiddlewareAuthRequired'> | undefined;

export const getAuth0 = () => {
  if (!Config.features.auth0 || !Config.auth0) {
    throw new Error(
      'Auth0 is trying to be instantiated with missing environment variables.'
    );
  }

  if (auth0Instance) {
    return auth0Instance;
  }

  auth0Instance = initAuth0({
    secret: Config.auth0.cookieSecret,
    baseURL: Config.metadata.baseUrl,
    clientID: Config.auth0.clientId,
    clientSecret: Config.auth0.clientSecret,
    issuerBaseURL: `https://${Config.auth0.domain}`,
    authorizationParams: {
      response_type: 'code',
      audience: Config.auth0.audience,
      scope: 'openid email profile',
    },
    routes: {
      callback: '/api/callback',
      postLogoutRedirect: Config.auth0.postLogoutRedirectUrl,
    },
    session: {
      rollingDuration: 60 * 60 * 8,
      storeIDToken: true,
      cookie: {
        domain:
          Config.environment === 'development'
            ? 'localhost'
            : Config.auth0.cookieDomain,
        sameSite: 'lax',
      },
    },
    httpTimeout: 2500,
    clockTolerance: 10000,
  });

  return auth0Instance;
};

export type { Claims } from '@auth0/nextjs-auth0/dist/session/session';

export const withAuthentication =
  (handler: NextApiHandler) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      if (!Config.features.auth0) {
        return res.status(501).json({
          message:
            'Authentication is disabled in this application deployment.',
        });
      }

      await handler(req, res);
    } catch (error) {
      console.error(error);
      const anyError = error as any;
      res.status(anyError.status ?? 500).end(anyError.message);
    }
  };
