import React from 'react';
import { GetServerSideProps, NextApiRequest } from 'next';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { NotFoundAnimation } from '../components/NotFoundAnimation';
import { TopNavigation } from '../components/TopNavigation';
import {
  CreateLinkUsageMetricDocument,
  CreateLinkUsageMetricMutation,
  CreateLinkUsageMetricMutationVariables,
  SearchLinksDocument,
  SearchLinksQuery,
  SearchLinksQueryVariables,
} from '../lib/__generated__/graphql';
import {
  createRedirectUrl,
  findLinkRecursive,
} from '../lib/features/link-parameters';

interface Props {
  alias: string;
  baseUrl: string;
  logoname: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
  isMobile: boolean;
  similarLinks: NonNullable<
    NonNullable<SearchLinksQuery['searchLinks']>['nodes']
  >;
}

const LinkNotFound = ({
  alias,
  baseUrl,
  logoname,
  isMobile,
  isAuthEnabled,
  isAuthenticated,
  similarLinks,
}: Props) => (
  <div className="min-h-screen">
    <TopNavigation
      logoname={logoname}
      baseUrl={baseUrl}
      isAuthEnabled={isAuthEnabled}
      isAuthenticated={isAuthenticated}
    />
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            No link found at go/{alias}
          </h2>

          <NotFoundAnimation isMobile={isMobile} />

          {similarLinks.length !== 0 && (
            <>
              <h3 className="text-xl font-semibold">
                But there are other options:
              </h3>

              <div className="w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alias</TableHead>
                      <TableHead>Destination</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {similarLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <a
                            href={new URL(link.alias, baseUrl).href}
                            className="block max-w-[350px] truncate text-primary underline"
                          >
                            {link.alias}
                          </a>
                        </TableCell>
                        <TableCell>
                          <a
                            href={link.url}
                            className="block max-w-[350px] truncate text-primary underline"
                          >
                            {link.url}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default LinkNotFound;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { Config } = await import('../lib/config');
  const { getUserClaimsFromRequest } = await import('../lib/auth');
  const { initializeApollo } = await import('../lib/apollo');
  const { user } = await getUserClaimsFromRequest(
    context?.req as NextApiRequest
  );
  const apolloClient = initializeApollo();
  const logoname = Config.metadata.logoname;
  const baseUrl = Config.metadata.baseUrl;
  const isAuthEnabled = Config.features.auth0;
  const isAuthenticated = user !== null;
  const userAgent = context.req.headers['user-agent'];
  const isMobile = userAgent
    ? Boolean(
        userAgent.match(
          /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i
        )
      )
    : false;

  const contextAlias = context.query.alias as string[];
  const link = await findLinkRecursive({
    contextAlias,
    apolloClient,
  });

  if (!link) {
    const alias = contextAlias.join('/');
    const searchResults = await apolloClient.query<
      SearchLinksQuery,
      SearchLinksQueryVariables
    >({
      query: SearchLinksDocument,
      variables: {
        search: alias,
      },
    });

    const similarLinks = searchResults.data.searchLinks?.nodes ?? [];

    return {
      props: {
        alias,
        baseUrl,
        logoname,
        isMobile,
        isAuthEnabled,
        isAuthenticated,
        similarLinks,
      },
    };
  }

  /**
   * Trigger metric update in the background.
   */
  apolloClient
    .mutate<
      CreateLinkUsageMetricMutation,
      CreateLinkUsageMetricMutationVariables
    >({
      mutation: CreateLinkUsageMetricDocument,
      variables: {
        linkId: link.id,
      },
    })
    .then(() => {
      console.log(
        `[info:metric]: Added metric to link with alias "${link.alias}"`
      );
    })
    .catch((err) => {
      console.error(
        `[error:metric]: Failed to add metric for link with alias "${link.alias}"`
      );
      console.error(err);
    });

  const response = context.res;

  response.writeHead(302, {
    Location: createRedirectUrl({
      linkUrl: link.url,
      linkAlias: link.alias,
      contextAlias,
    }),
  });

  response.end();

  /**
   * This return doesn't do anything actually.
   * The request is already ended at this point.
   **/
  return {
    props: {
      alias: link.alias,
      baseUrl,
      logoname,
      isMobile,
      isAuthEnabled,
      isAuthenticated,
      similarLinks: [],
    },
  };
};
