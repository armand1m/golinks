import { getAuth0, withAuthentication } from '../../lib/auth';

export default withAuthentication(async function logout(req, res) {
  const auth0 = getAuth0();
  await auth0.handleLogout(req, res);
});
