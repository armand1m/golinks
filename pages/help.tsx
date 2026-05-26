import { GetServerSideProps } from 'next';
import { TopNavigation } from '@/components/TopNavigation';
import { InlineCode } from '@/components/InlineCode';
import { CodeBlock } from '@/components/CodeBlock';
import { SectionHeading } from '@/components/SectionHeading';
import {
  getCommonPageProps,
  CommonPageProps,
} from '@/lib/utils/get-common-server-side-props';

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
}: CommonPageProps) {
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
            <SectionHeading>Creating a Link</SectionHeading>
            <p className="text-muted-foreground">
              A link consists of a short <strong>alias</strong> and a
              destination <strong>URL</strong>. Click the{' '}
              <strong>Create</strong> button on the home page, fill in
              both fields, and save.
            </p>
            <p className="text-muted-foreground">
              For example, creating a link with alias{' '}
              <InlineCode>google</InlineCode> and URL{' '}
              <InlineCode>https://google.com</InlineCode> means
              navigating to <InlineCode>{baseUrl}/google</InlineCode>{' '}
              will redirect you there.
            </p>
          </section>

          <section
            id="editing-deleting-links"
            className="flex flex-col gap-3"
          >
            <SectionHeading>Editing & Deleting Links</SectionHeading>
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
            <SectionHeading>Dynamic Link Parameters</SectionHeading>
            <p className="text-muted-foreground">
              Links support <InlineCode>$1</InlineCode>,{' '}
              <InlineCode>$2</InlineCode>, etc. placeholders in the
              URL. Extra path segments after the alias are substituted
              into these positions.
            </p>
            <p className="text-muted-foreground">
              For example, a link with alias{' '}
              <InlineCode>gh</InlineCode> and URL{' '}
              <InlineCode>https://github.com/$1/$2</InlineCode> means:
            </p>
            <CodeBlock>
              {baseUrl}/gh/owner/repo → https://github.com/owner/repo
            </CodeBlock>
            <p className="text-muted-foreground">
              Aliases can also contain slashes for namespacing, e.g.
              alias <InlineCode>docs/api</InlineCode> with URL{' '}
              <InlineCode>https://docs.example.com/api/$1</InlineCode>
              .
            </p>

            <h3 className="text-lg font-medium pt-2">
              Using Links with Gists as Scripts
            </h3>
            <p className="text-muted-foreground">
              Create a link pointing to a GitHub gist raw URL with
              parameters, then use it as an executable script:
            </p>
            <CodeBlock>{`# Create a link with alias "gist" and URL:
# https://gist.githubusercontent.com/$1/raw/$2

# Then run it locally:
curl -sL ${baseUrl}/gist/{user}/{hash} | bash

# Or:
bash <(curl -sL ${baseUrl}/gist/{user}/{hash})`}</CodeBlock>
            <p className="text-muted-foreground">
              This works because the app performs an HTTP 302
              redirect, so any tool that follows redirects can use go
              links programmatically.
            </p>
          </section>

          <section id="browser-setup" className="flex flex-col gap-3">
            <SectionHeading>Browser Setup</SectionHeading>
            <p className="text-muted-foreground">
              You can configure your browser to treat the address bar
              as a go links launcher by adding a custom search engine.
            </p>

            <h3 className="text-lg font-medium pt-2">Chrome</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>
                Navigate to{' '}
                <InlineCode>
                  chrome://settings/searchEngines
                </InlineCode>
              </li>
              <li>Click &quot;Add&quot; next to Site Search</li>
              <li>
                Set the keyword to <InlineCode>go</InlineCode> (or any
                short keyword you prefer)
              </li>
              <li>
                Set the URL to <InlineCode>{baseUrl}/%s</InlineCode>
              </li>
            </ul>
            <p className="text-muted-foreground">
              After setup, type <InlineCode>go</InlineCode> in the
              address bar, press Tab, then type your alias to navigate
              directly.
            </p>

            <h3 className="text-lg font-medium pt-2">Firefox</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Bookmark any page from your deployment</li>
              <li>
                Edit the bookmark and set a keyword (e.g.,{' '}
                <InlineCode>go</InlineCode>)
              </li>
              <li>
                Change the URL to{' '}
                <InlineCode>{baseUrl}/%s</InlineCode>
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
            <SectionHeading>Running Locally</SectionHeading>
            <p className="text-muted-foreground">Prerequisites:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Node.js</li>
              <li>Docker (for the database)</li>
              <li>yarn</li>
            </ul>
            <CodeBlock>{`# Start PostgreSQL
docker-compose up -d db

# Run database migrations
export DATABASE_URL=postgres://dev:dev@127.0.0.1:5432/golinks?sslmode=disable
dbmate up

# Install dependencies
yarn

# Start development server
yarn dev`}</CodeBlock>
            <p className="text-muted-foreground">
              Create a <InlineCode>.env.local</InlineCode> file based
              on <InlineCode>.env.example</InlineCode>. To disable
              authentication, set{' '}
              <InlineCode>AUTH0_ENABLED=false</InlineCode>.
            </p>
          </section>

          <section id="deploying" className="flex flex-col gap-3">
            <SectionHeading>Deploying</SectionHeading>

            <h3 className="text-lg font-medium pt-2">Docker</h3>
            <CodeBlock>{`docker build . -t golinks
docker run -p 3000:3000 --env-file .env golinks`}</CodeBlock>
            <p className="text-muted-foreground">
              A pre-built image is available at{' '}
              <InlineCode>armand1m/golinks</InlineCode>.
            </p>

            <h3 className="text-lg font-medium pt-2">Fly.io</h3>
            <CodeBlock>{`fly deploy
fly secrets set DATABASE_CONNECTION_STRING=...
fly secrets set AUTH0_DOMAIN=...`}</CodeBlock>
            <p className="text-muted-foreground">
              See <InlineCode>fly.toml</InlineCode> for the deployment
              configuration.
            </p>

            <h3 className="text-lg font-medium pt-2">Kubernetes</h3>
            <p className="text-muted-foreground">
              Kubernetes manifests are available in the{' '}
              <InlineCode>./kubernetes</InlineCode> directory of the
              repository, including Cloud SQL proxy setup and secrets
              configuration.
            </p>
          </section>

          <section id="repository" className="flex flex-col gap-3">
            <SectionHeading>Repository</SectionHeading>
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

export const getServerSideProps: GetServerSideProps<
  CommonPageProps
> = async (context) => {
  const props = await getCommonPageProps(context);
  return { props };
};
