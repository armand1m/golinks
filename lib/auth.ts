import {
  NextApiHandler,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { promisify } from 'util';
import jsonwebtoken from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { initAuth0 } from '@auth0/nextjs-auth0';
import { ISession } from '@auth0/nextjs-auth0/dist/session/session';
import { ISignInWithAuth0 } from '@auth0/nextjs-auth0/dist/instance';
import { Config } from './config';
import { UserRole, UserPermission } from './permissions';

interface JwtHeader {
  kid: string;
}

interface DecodedAccessToken {
  header: JwtHeader;
}

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
  session: ISession
) => {
  if (!Config.auth0) {
    throw new Error(
      "Missing Auth0 parameters. Make sure you've passed correctly all environment variables."
    );
  }

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

  const jwksSecretClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${Config.auth0.domain}/.well-known/jwks.json`,
  });

  const signingKey = await promisify(jwksSecretClient.getSigningKey)(
    decodedAccessToken.header.kid
  );

  const token = jsonwebtoken.verify(
    session.accessToken,
    signingKey.getPublicKey(),
    {
      audience: Config.auth0.audience,
      issuer: new URL(`https://${Config.auth0.domain}`).href,
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
  request: NextApiRequest
) => {
  if (!Config.features.auth0) {
    return {
      claims: Config.anonymous,
      user: null,
    };
  }

  const auth0 = getAuth0();
  const session = await auth0.getSession(request);

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

export let auth0: ISignInWithAuth0 | undefined;

export const getAuth0 = () => {
  if (!Config.features.auth0 || !Config.auth0) {
    throw new Error(
      'Auth0 is trying to be instantiated with missing environment variables.'
    );
  }

  if (auth0) {
    return auth0;
  }

  auth0 = initAuth0({
    domain: Config.auth0.domain,
    clientId: Config.auth0.clientId,
    audience: Config.auth0.audience,
    clientSecret: Config.auth0.clientSecret,
    scope: 'openid email profile',
    redirectUri: Config.auth0.redirectUrl,
    postLogoutRedirectUri: Config.auth0.postLogoutRedirectUrl,
    session: {
      cookieSecret: Config.auth0.cookieSecret,
      cookieLifetime: 60 * 60 * 8,
      cookieDomain:
        Config.environment === 'development'
          ? 'localhost'
          : Config.auth0.cookieDomain,
      cookieSameSite: 'lax',
      storeIdToken: true,
      storeAccessToken: true,
      storeRefreshToken: true,
    },
    oidcClient: {
      httpTimeout: 2500,
      clockTolerance: 10000,
    },
  });

  return auth0;
};

export type { IClaims } from '@auth0/nextjs-auth0/dist/session/session';

export const withAuthentication = (handler: NextApiHandler) => async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
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
    res.status(error.status || 500).end(error.message);
  }
};
