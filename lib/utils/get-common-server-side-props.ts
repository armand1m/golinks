import { GetServerSidePropsContext } from 'next';
import { NextApiRequest } from 'next';

export interface CommonPageProps {
  logoname: string;
  baseUrl: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
}

export async function getCommonPageProps(
  context: GetServerSidePropsContext
): Promise<CommonPageProps> {
  const { getUserClaimsFromRequest } = await import('../auth');
  const { Config } = await import('../config');
  const { user } = await getUserClaimsFromRequest(
    context.req as NextApiRequest
  );

  return {
    logoname: Config.metadata.logoname,
    baseUrl: Config.metadata.baseUrl,
    isAuthEnabled: Config.features.auth0,
    isAuthenticated: user !== null,
  };
}
