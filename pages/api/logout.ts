import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth0 } from '../../lib/auth';
import { Config } from '../../lib/config';

export default async function logout(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!Config.features.auth0) {
      return res.status(503).json({
        message: 'Authentication is disabled in this application.',
      });
    }

    const auth0 = getAuth0();
    await auth0.handleLogout(req, res);
  } catch (error) {
    console.error(error);
    res.status(error.status || 400).end(error.message);
  }
}
