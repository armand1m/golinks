import { promisify } from 'util';
import jsonwebtoken from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { initAuth0 } from '@auth0/nextjs-auth0';
import { ISession } from '@auth0/nextjs-auth0/dist/session/session';

const ANONYMOUS_PERMISSIONS = ['read:golinks'];
const ANONYMOUS_ROLES = ['viewer'];

const DOMAIN = String(process.env.AUTH0_DOMAIN);
const AUDIENCE = String(process.env.AUTH0_AUDIENCE);
const CLIENT_ID = String(process.env.AUTH0_CLIENT_ID);
const CLIENT_SECRET = String(process.env.AUTH0_CLIENT_SECRET);
const COOKIE_DOMAIN = String(process.env.AUTH0_COOKIE_DOMAIN);
const COOKIE_SECRET = String(process.env.AUTH0_COOKIE_SECRET);
const REDIRECT_URL = String(process.env.AUTH0_REDIRECT_URL);
const POST_LOGOUT_REDIRECT_URL = String(
  process.env.AUTH0_POST_LOGOUT_REDIRECT_URL
);

const jwksSecretClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${DOMAIN}/.well-known/jwks.json`,
});

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
  session?: ISession | null
) => {
  if (!session || !session.accessToken) {
    return {
      permissions: ANONYMOUS_PERMISSIONS,
      roles: ANONYMOUS_ROLES,
    };
  }

  const decodedAccessToken = jsonwebtoken.decode(
    session.accessToken,
    { complete: true }
  ) as DecodedAccessToken | undefined;

  if (!decodedAccessToken) {
    throw new Error('Failed to decode token.');
  }

  const signingKey = await promisify(jwksSecretClient.getSigningKey)(
    decodedAccessToken.header.kid
  );

  const token = jsonwebtoken.verify(
    session.accessToken,
    signingKey.getPublicKey(),
    {
      audience: AUDIENCE,
      issuer: new URL(`https://${DOMAIN}`).href,
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
    permissions: jwtToken.permissions || ANONYMOUS_PERMISSIONS,
    roles: jwtToken['https://user/roles'] || ANONYMOUS_ROLES,
  };
};

export const auth0 = initAuth0({
  domain: DOMAIN,
  clientId: CLIENT_ID,
  audience: AUDIENCE,
  clientSecret: CLIENT_SECRET,
  scope: 'openid email profile',
  redirectUri: REDIRECT_URL,
  postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URL,
  session: {
    cookieSecret: COOKIE_SECRET,
    cookieLifetime: 60 * 60 * 8,
    cookieDomain:
      process.env.NODE_ENV === 'development'
        ? 'localhost'
        : COOKIE_DOMAIN,
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

export type { IClaims } from '@auth0/nextjs-auth0/dist/session/session';
