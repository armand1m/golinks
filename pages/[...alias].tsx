import React from 'react';
import { GetServerSideProps } from 'next';

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
  findLinkInCache,
} from '../lib/features/link-parameters';
import {
  getCommonPageProps,
  CommonPageProps,
} from '../lib/utils/get-common-server-side-props';
import { isMobileDevice } from '../lib/utils/user-agent';
import { getLinkCache } from '../lib/cache/link-cache';
import { Config } from '../lib/config';

interface Props extends CommonPageProps {
  alias: string;
  isMobile: boolean;
  similarLinks: NonNullable<
    NonNullable<SearchLinksQuery['searchLinks']>['nodes']
  >;
}

const linkClassName =
  'block max-w-[350px] truncate text-primary underline';

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
                            className={linkClassName}
                          >
                            {link.alias}
                          </a>
                        </TableCell>
                        <TableCell>
                          <a
                            href={link.url}
                            className={linkClassName}
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

function fireUsageMetric(
  apolloClient: import('@apollo/client').ApolloClient<
    import('@apollo/client').NormalizedCacheObject
  >,
  linkId: string,
  linkAlias: string
) {
  apolloClient
    .mutate<
      CreateLinkUsageMetricMutation,
      CreateLinkUsageMetricMutationVariables
    >({
      mutation: CreateLinkUsageMetricDocument,
      variables: { linkId },
    })
    .then(() => {
      console.log(
        `[info:metric]: Added metric to link with alias "${linkAlias}"`
      );
    })
    .catch((err: Error) => {
      console.error(
        `[error:metric]: Failed to add metric for link with alias "${linkAlias}"`
      );
      console.error(err);
    });
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { initializeApollo } = await import('../lib/apollo');
  const common = await getCommonPageProps(context);
  const apolloClient = initializeApollo();

  const userAgent = context.req.headers['user-agent'] ?? '';
  const mobile = isMobileDevice(userAgent);

  const contextAlias = context.query.alias as string[];
  const cacheEnabled = Config.cache.linkCacheEnabled;

  if (cacheEnabled) {
    const cachedLink = findLinkInCache(contextAlias);

    if (cachedLink) {
      const cache = getLinkCache();
      const canAccess = cache.canAccess(
        cachedLink.alias,
        common.userEmail
      );

      if (canAccess) {
        fireUsageMetric(
          apolloClient,
          cachedLink.id,
          cachedLink.alias
        );

        const response = context.res;
        response.writeHead(302, {
          Location: createRedirectUrl({
            linkUrl: cachedLink.url,
            linkAlias: cachedLink.alias,
            contextAlias,
          }),
        });
        response.end();

        return {
          props: {
            alias: cachedLink.alias,
            ...common,
            isMobile: mobile,
            similarLinks: [],
          },
        };
      }
    }
  }

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
      variables: { search: alias },
    });

    return {
      props: {
        alias,
        ...common,
        isMobile: mobile,
        similarLinks: searchResults.data.searchLinks?.nodes ?? [],
      },
    };
  }

  fireUsageMetric(apolloClient, link.id, link.alias);

  const response = context.res;
  response.writeHead(302, {
    Location: createRedirectUrl({
      linkUrl: link.url,
      linkAlias: link.alias,
      contextAlias,
    }),
  });
  response.end();

  return {
    props: {
      alias: link.alias,
      ...common,
      isMobile: mobile,
      similarLinks: [],
    },
  };
};
