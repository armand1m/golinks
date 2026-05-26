import type { NextRequest } from 'next/server';
import { Auth0Client } from '@auth0/nextjs-auth0/server';

const isAuth0Enabled = process.env.AUTH0_ENABLED === 'true';

let auth0Client: Auth0Client | undefined;

function getAuth0Client() {
  if (auth0Client) return auth0Client;

  auth0Client = new Auth0Client({
    secret: process.env.AUTH0_COOKIE_SECRET!,
    appBaseUrl: `${process.env.PROTO}://${process.env.APP_HOSTNAME}`,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
    authorizationParameters: {
      audience: process.env.AUTH0_AUDIENCE,
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
          process.env.NODE_ENV !== 'production'
            ? 'localhost'
            : process.env.AUTH0_COOKIE_DOMAIN,
        sameSite: 'lax',
      },
    },
    httpTimeout: 2500,
  });

  return auth0Client;
}

export async function middleware(request: NextRequest) {
  if (!isAuth0Enabled) {
    return;
  }

  return await getAuth0Client().middleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
