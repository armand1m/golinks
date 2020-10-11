import { GetServerSideProps } from 'next';
import {
  PageContent,
  Stack,
  Flex,
  Table,
  Link,
  Heading,
} from 'bumbag';

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
import { NotFoundAnimation } from '../components/NotFoundAnimation';

interface Props {
  hostname: string;
  similarLinks: SearchLinksQuery['searchLinks']['nodes'];
}

const LinkNotFound: React.FC<Props> = ({
  hostname,
  similarLinks,
}) => (
  <PageContent>
    <Flex
      flexDirection="column"
      textAlign="center"
      justifyContent="center"
      alignItems="center">
      <Stack>
        <Heading>Nothing here.</Heading>

        <NotFoundAnimation />

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
                          href={new URL(link.alias, hostname).href}
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
  </PageContent>
);

export default LinkNotFound;

export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  const { Config } = await import('../lib/config');
  const { initializeApollo } = await import('../lib/apollo');
  const alias = (context.query.alias as string[]).join('/');
  const apolloClient = initializeApollo();

  const queryResult = await apolloClient.query<
    GetLinkByAliasQuery,
    GetLinkByAliasQueryVariables
  >({
    query: GetLinkByAliasDocument,
    variables: {
      alias,
    },
  });

  if (!queryResult.data.linkByAlias) {
    const searchResults = await apolloClient.query<
      SearchLinksQuery,
      SearchLinksQueryVariables
    >({
      query: SearchLinksDocument,
      variables: {
        search: alias,
      },
    });

    return {
      props: {
        hostname: Config.metadata.hostname,
        similarLinks: searchResults.data.searchLinks.nodes,
      },
    };
  }

  /**
   * Trigger metric update and forget it.
   */
  apolloClient.mutate<
    CreateLinkUsageMetricMutation,
    CreateLinkUsageMetricMutationVariables
  >({
    mutation: CreateLinkUsageMetricDocument,
    variables: {
      linkId: queryResult.data.linkByAlias.id,
    },
  });

  const response = context.res;

  response.writeHead(302, {
    Location: queryResult.data.linkByAlias.url,
  });

  response.end();

  /**
   * This line doesn't do anything actually.
   * The request is already ended at this point.
   **/
  return {
    props: {
      hostname: Config.metadata.hostname,
      similarLinks: [],
    },
  };
};
