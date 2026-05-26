import { GetServerSideProps } from 'next';
import { NextApiRequest } from 'next';
import { TopNavigation } from '@/components/TopNavigation';

interface Props {
  logoname: string;
  baseUrl: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
}

const sections = [
  { id: 'creating-a-link', title: 'Creating a Link' },
  { id: 'editing-deleting-links', title: 'Editing & Deleting Links' },
  { id: 'dynamic-link-parameters', title: 'Dynamic Link Parameters' },
  { id: 'browser-setup', title: 'Browser Setup' },
  { id: 'running-locally', title: 'Running Locally' },
  { id: 'deploying', title: 'Deploying' },
  { id: 'repository', title: 'Repository' },
];

export default function Help({
  logoname,
  baseUrl,
  isAuthEnabled,
  isAuthenticated,
}: Props) {
  return (
    <div className="min-h-screen">
      <TopNavigation
        logoname={logoname}
        baseUrl={baseUrl}
        isAuthEnabled={isAuthEnabled}
        isAuthenticated={isAuthenticated}
      />
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex flex-col gap-8">
          <h1 className="text-3xl font-bold">Help</h1>

          <nav>
            <ul className="list-disc pl-6 space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-primary underline hover:no-underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section
            id="creating-a-link"
            className="flex flex-col gap-3"
          >
            <h2 className="text-xl font-semibold border-b pb-2">
              Creating a Link
            </h2>
            <p className="text-muted-foreground">
              A link consists of a short <strong>alias</strong> and a
              destination <strong>URL</strong>. Click the{' '}
              <strong>Create</strong> button on the home page, fill in
              both fields, and save.
            </p>
            <p className="text-muted-foreground">
              For example, creating a link with alias{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                google
              </code>{' '}
              and URL{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                https://google.com
              </code>{' '}
              means navigating to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                {baseUrl}/google
              </code>{' '}
              will redirect you there.
            </p>
          </section>

          <section
            id="editing-deleting-links"
            className="flex flex-col gap-3"
          >
            <h2 className="text-xl font-semibold border-b pb-2">
              Editing & Deleting Links
            </h2>
            <p className="text-muted-foreground">
              Each link in the table has action buttons on the right
              side. Click the pencil icon to edit the alias or URL.
              Use the delete option in the same menu to remove a link.
            </p>
          </section>

          <section
            id="dynamic-link-parameters"
            className="flex flex-col gap-3"
          >
            <h2 className="text-xl font-semibold border-b pb-2">
              Dynamic Link Parameters
            </h2>
            <p className="text-muted-foreground">
              Links support{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                $1
              </code>
              ,{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                $2
              </code>
              , etc. placeholders in the URL. Extra path segments
              after the alias are substituted into these positions.
            </p>
            <p className="text-muted-foreground">
              For example, a link with alias{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                gh
              </code>{' '}
              and URL{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                https://github.com/$1/$2
              </code>{' '}
              means:
            </p>
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
              <code>
                {baseUrl}/gh/owner/repo →
                https://github.com/owner/repo
              </code>
            </pre>
            <p className="text-muted-foreground">
              Aliases can also contain slashes for namespacing, e.g.
              alias{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                docs/api
              </code>{' '}
              with URL{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                https://docs.example.com/api/$1
              </code>
              .
            </p>

            <h3 className="text-lg font-medium pt-2">
              Using Links with Gists as Scripts
            </h3>
            <p className="text-muted-foreground">
              Create a link pointing to a GitHub gist raw URL with
              parameters, then use it as an executable script:
            </p>
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
              <code>{`# Create a link with alias "gist" and URL:
# https://gist.githubusercontent.com/$1/raw/$2

# Then run it locally:
curl -sL ${baseUrl}/gist/{user}/{hash} | bash

# Or:
bash <(curl -sL ${baseUrl}/gist/{user}/{hash})`}</code>
            </pre>
            <p className="text-muted-foreground">
              This works because the app performs an HTTP 302
              redirect, so any tool that follows redirects can use go
              links programmatically.
            </p>
          </section>

          <section id="browser-setup" className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold border-b pb-2">
              Browser Setup
            </h2>
            <p className="text-muted-foreground">
              You can configure your browser to treat the address bar
              as a go links launcher by adding a custom search engine.
            </p>

            <h3 className="text-lg font-medium pt-2">Chrome</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>
                Navigate to{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  chrome://settings/searchEngines
                </code>
              </li>
              <li>Click &quot;Add&quot; next to Site Search</li>
              <li>
                Set the keyword to{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  go
                </code>{' '}
                (or any short keyword you prefer)
              </li>
              <li>
                Set the URL to{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  {baseUrl}/%s
                </code>
              </li>
            </ul>
            <p className="text-muted-foreground">
              After setup, type{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                go
              </code>{' '}
              in the address bar, press Tab, then type your alias to
              navigate directly.
            </p>

            <h3 className="text-lg font-medium pt-2">Firefox</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Bookmark any page from your deployment</li>
              <li>
                Edit the bookmark and set a keyword (e.g.,{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  go
                </code>
                )
              </li>
              <li>
                Change the URL to{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                  {baseUrl}/%s
                </code>
              </li>
            </ul>
            <p className="text-muted-foreground">
              Type your keyword in the address bar followed by the
              alias to navigate directly.
            </p>
          </section>

          <section
            id="running-locally"
            className="flex flex-col gap-3"
          >
            <h2 className="text-xl font-semibold border-b pb-2">
              Running Locally
            </h2>
            <p className="text-muted-foreground">Prerequisites:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Node.js</li>
              <li>Docker (for the database)</li>
              <li>yarn</li>
            </ul>
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
              <code>{`# Start PostgreSQL
docker-compose up -d db

# Run database migrations
export DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable
dbmate up

# Install dependencies
yarn

# Start development server
yarn dev`}</code>
            </pre>
            <p className="text-muted-foreground">
              Create a{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                .env.local
              </code>{' '}
              file based on{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                .env.example
              </code>
              . To disable authentication, set{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                AUTH0_ENABLED=false
              </code>
              .
            </p>
          </section>

          <section id="deploying" className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold border-b pb-2">
              Deploying
            </h2>

            <h3 className="text-lg font-medium pt-2">Docker</h3>
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
              <code>{`docker build . -t golinks
docker run -p 3000:3000 --env-file .env golinks`}</code>
            </pre>
            <p className="text-muted-foreground">
              A pre-built image is available at{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                armand1m/golinks
              </code>
              .
            </p>

            <h3 className="text-lg font-medium pt-2">Fly.io</h3>
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
              <code>{`fly deploy
fly secrets set DATABASE_CONNECTION_STRING=...
fly secrets set AUTH0_DOMAIN=...`}</code>
            </pre>
            <p className="text-muted-foreground">
              See{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                fly.toml
              </code>{' '}
              for the deployment configuration.
            </p>

            <h3 className="text-lg font-medium pt-2">Kubernetes</h3>
            <p className="text-muted-foreground">
              Kubernetes manifests are available in the{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
                ./kubernetes
              </code>{' '}
              directory of the repository, including Cloud SQL proxy
              setup and secrets configuration.
            </p>
          </section>

          <section id="repository" className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold border-b pb-2">
              Repository
            </h2>
            <p className="text-muted-foreground">
              The source code is available at{' '}
              <a
                href="https://github.com/armand1m/golinks"
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/armand1m/golinks
              </a>
              . The project is licensed under MIT. Contributions, bug
              reports, and feature requests are welcome via issues and
              pull requests.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { getUserClaimsFromRequest } = await import('../lib/auth');
  const { Config } = await import('../lib/config');
  const request = context?.req as NextApiRequest;
  const { user } = await getUserClaimsFromRequest(request);
  const logoname = Config.metadata.logoname;
  const baseUrl = Config.metadata.baseUrl;
  const isAuthEnabled = Config.features.auth0;
  const isAuthenticated = user !== null;

  return {
    props: {
      logoname,
      baseUrl,
      isAuthEnabled,
      isAuthenticated,
    },
  };
};
