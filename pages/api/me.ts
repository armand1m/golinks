import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth0 } from '../../lib/auth';
import { Config } from '../../lib/config';

export default async function me(
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
    await auth0.handleProfile(req, res);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  }
}
