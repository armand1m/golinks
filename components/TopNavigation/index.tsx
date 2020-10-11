import { TopNav, Heading, Button } from 'bumbag';

interface Props {
  baseUrl: string;
  logoname: string;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
}

export const TopNavigation: React.FC<Props> = ({
  baseUrl,
  logoname,
  isAuthenticated,
  isAuthEnabled,
}) => {
  return (
    <TopNav>
      <TopNav.Section>
        <TopNav.Item href={baseUrl} fontWeight="semibold">
          <Heading use="h3">{logoname}</Heading>
        </TopNav.Item>
      </TopNav.Section>
      {isAuthEnabled && (
        <TopNav.Section>
          <TopNav.Item>
            {isAuthenticated ? (
              <Button
                iconBefore="solid-sign-out-alt"
                variant="link"
                onClick={() =>
                  window.location.replace('/api/logout')
                }>
                Logout
              </Button>
            ) : (
              <Button
                iconBefore="solid-sign-out-alt"
                variant="link"
                onClick={() => window.location.replace('/api/login')}>
                Login
              </Button>
            )}
          </TopNav.Item>
        </TopNav.Section>
      )}
    </TopNav>
  );
};
