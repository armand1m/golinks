import { getAuth0, withAuthentication } from '../../lib/auth';

export default withAuthentication(async function me(req, res) {
  const auth0 = getAuth0();
  await auth0.handleProfile(req, res);
});
