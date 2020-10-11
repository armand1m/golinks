import { getAuth0, withAuthentication } from '../../lib/auth';

export default withAuthentication(async function callback(req, res) {
  const auth0 = getAuth0();
  await auth0.handleCallback(req, res, { redirectTo: '/' });
});
