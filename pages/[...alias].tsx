import React from 'react';
import { GetServerSideProps, NextApiRequest } from 'next';
import {
  Stack,
  Flex,
  Table,
  Link,
  Heading,
  PageWithHeader,
  Container,
} from 'bumbag';

import { NotFoundAnimation } from '../components/NotFoundAnimation';
import { TopNavigation } from '../components/TopNavigation';
import {
  GetLinkByAliasDocument,
  GetLinkByAliasQuery,
  GetLinkByAliasQueryVariables,
} from '../lib/queries/getLinkByAlias.graphql';
import {
  CreateLinkUsageMetricDocument,
  CreateLinkUsageMetricMutation,
  CreateLinkUsageMetricMutationVariables,
} from '../lib/mutations/createLinkUsageMetric.graphql';
import {
  SearchLinksDocument,
  SearchLinksQuery,
  SearchLinksQueryVariables,
} from '../lib/queries/searchLinks.graphql';

interface Props {
  alias: string;
  baseUrl: string;
  logoname: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
  isMobile: boolean;
  similarLinks: SearchLinksQuery['searchLinks']['nodes'];
}

const LinkNotFound: React.FC<Props> = ({
  alias,
  baseUrl,
  logoname,
  isMobile,
  isAuthEnabled,
  isAuthenticated,
  similarLinks,
}) => (
  <PageWithHeader
    header={
      <TopNavigation
        logoname={logoname}
        baseUrl={baseUrl}
        isAuthEnabled={isAuthEnabled}
        isAuthenticated={isAuthenticated}
      />
    }>
    <Container padding="major-3">
      <Flex
        flexDirection="column"
        textAlign="center"
        justifyContent="center"
        alignItems="center">
        <Stack>
          <Heading>No link found at go/{alias}</Heading>

          <NotFoundAnimation isMobile={isMobile} />

          {similarLinks.length !== 0 && (
            <>
              <Heading use="h3">But there are other options:</Heading>

              <Table isResponsive responsiveBreakpoint="tablet">
                <Table.Head>
                  <Table.Row>
                    <Table.HeadCell>Alias</Table.HeadCell>
                    <Table.HeadCell>Destination</Table.HeadCell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  <>
                    {similarLinks.map((link) => (
                      <Table.Row key={link.id}>
                        <Table.Cell>
                          <Link
                            href={new URL(link.alias, baseUrl).href}
                            style={{
                              display: 'block',
                              maxWidth: '350px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                            {link.alias}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          <Link
                            href={link.url}
                            style={{
                              display: 'block',
                              maxWidth: '350px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                            {link.url}
                          </Link>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </>
                </Table.Body>
              </Table>
            </>
          )}
        </Stack>
      </Flex>
    </Container>
  </PageWithHeader>
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

  const alias = (context.query.alias as string[]).join('/');
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

  const queryResult = await apolloClient.query<
    GetLinkByAliasQuery,
    GetLinkByAliasQueryVariables
  >({
    query: GetLinkByAliasDocument,
    variables: {
      alias,
    },
  });

  const link = queryResult.data.linkByAlias;

  if (!link) {
    const searchResults = await apolloClient.query<
      SearchLinksQuery,
      SearchLinksQueryVariables
    >({
      query: SearchLinksDocument,
      variables: {
        search: alias,
      },
    });

    const similarLinks = searchResults.data.searchLinks.nodes;

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
   * Trigger metric update and forget about it.
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
    Location: link.url,
  });

  response.end();

  /**
   * This return doesn't do anything actually.
   * The request is already ended at this point.
   **/
  return {
    props: {
      alias,
      baseUrl,
      logoname,
      isMobile,
      isAuthEnabled,
      isAuthenticated,
      similarLinks: [],
    },
  };
};
