import { GetServerSideProps } from 'next';
import { useEffect, useCallback } from 'react';
import { PageContent, Heading, Text, Flex, Spinner } from 'bumbag';

import {
  useGetLinkByAliasQuery,
  GetLinkByAliasDocument,
} from '../lib/queries/getLinkByAlias.graphql';
import {
  useCreateLinkUsageMetricMutation,
  CreateLinkUsageMetricDocument,
} from '../lib/mutations/createLinkUsageMetric.graphql';

interface RedirectProps {
  alias: string;
}

const LinkNotFound: React.FC = () => {
  return (
    <Flex
      flexDirection="column"
      textAlign="center"
      justifyContent="center"
      alignItems="center">
      <Heading>Nope :(</Heading>
      <Text>This link is a dead end.</Text>
    </Flex>
  );
};

const Loader: React.FC = () => {
  return (
    <Flex alignX="center">
      <Spinner size="medium" />
    </Flex>
  );
};

const LinkRedirecting: React.FC = () => {
  return (
    <Flex
      flexDirection="column"
      textAlign="center"
      justifyContent="center"
      alignItems="center">
      <Heading>Yay! Hang in there..</Heading>
      <Text>You'll be redirected in a moment.</Text>
    </Flex>
  );
};

const useLinkRedirect = ({ alias }: RedirectProps) => {
  const [createLinkMetric] = useCreateLinkUsageMetricMutation();
  const { data, loading } = useGetLinkByAliasQuery({
    variables: {
      alias,
    },
  });

  const updateAndRedirect = useCallback(async () => {
    if (data?.linkByAlias) {
      await createLinkMetric({
        variables: {
          linkId: data.linkByAlias.id,
        },
      });

      window.location.replace(data.linkByAlias.url);
    }
  }, [data]);

  useEffect(() => {
    updateAndRedirect();
  }, [data]);

  const notFound = loading === false && data?.linkByAlias === null;
  const found = loading === false && data?.linkByAlias;

  return {
    loading,
    notFound,
    found,
  };
};

const Redirect: React.FC<RedirectProps> = ({ alias }) => {
  const { loading, notFound, found } = useLinkRedirect({ alias });

  return (
    <PageContent>
      {loading && <Loader />}
      {notFound && <LinkNotFound />}
      {found && <LinkRedirecting />}
    </PageContent>
  );
};

export default Redirect;

export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  const { initializeApollo } = await import('../lib/apollo');
  const alias = (context.query.alias as string[]).join('/');
  const apolloClient = initializeApollo(undefined);

  const queryResult = await apolloClient.query({
    query: GetLinkByAliasDocument,
    variables: {
      alias,
    },
  });

  console.log(queryResult);

  if (queryResult.data.linkByAlias) {
    const mutationResult = await apolloClient.mutate({
      mutation: CreateLinkUsageMetricDocument,
      variables: {
        linkId: queryResult.data.linkByAlias.id,
      },
    });
    console.log(mutationResult);
  }

  return {
    props: {
      alias,
    },
  };
};
