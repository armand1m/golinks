import { useEffect, useCallback } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import { PageContent, Heading, Text, Callout } from 'bumbag';

import { useGetLinkByAliasQuery } from '../lib/queries/getLinkByAlias.graphql';
import { useCreateLinkUsageMetricMutation } from '../lib/mutations/createLinkUsageMetric.graphql';

const RouterQuerySchema = Yup.object().shape({
  alias: Yup.string()
    .matches(/^[a-z0-9]+$/i)
    .max(24, 'Too long for an alias.')
    .required('An alias is required.'),
});

interface RedirectProps {
  alias: string;
}

const Redirect: React.FC<RedirectProps> = ({ alias }) => {
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

  return (
    <PageContent>
      <Callout>
        {loading === true && <Heading>Loading..</Heading>}

        {loading === false && data?.linkByAlias === null && (
          <>
            <Heading>Nope.</Heading>
            <Text>This link is a dead end.</Text>
          </>
        )}

        {loading === false && data?.linkByAlias && (
          <>
            <Heading>Hang in there..</Heading>
            <Text>We're redirecting you.</Text>
          </>
        )}
      </Callout>
    </PageContent>
  );
};

const Alias = () => {
  const router = useRouter();

  if (!RouterQuerySchema.isValidSync(router.query)) {
    return (
      <PageContent>
        <Callout>
          <Heading>Don't.</Heading>
          <Text>Just don't.</Text>
        </Callout>
      </PageContent>
    );
  }

  return <Redirect alias={String(router.query.alias)} />;
};

export default Alias;
