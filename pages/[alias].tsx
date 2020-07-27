import { useEffect, useCallback } from 'react';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import {
  Page,
  Heading,
  Text,
  Callout,
} from 'fannypack'

import { useGetLinkByAliasQuery } from '../lib/queries/getLinkByAlias.graphql'
import { useUpdateLinkUsageMutation } from '../lib/mutations/updateLinkUsage.graphql';

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
  const [updateLinkUsage] = useUpdateLinkUsageMutation();
  const { data, loading } = useGetLinkByAliasQuery({
    variables: {
      alias,
    }
  });

  const updateAndRedirect = useCallback(async () => {
    if (data?.linkByAlias) {
      await updateLinkUsage({
        variables: {
          alias: data.linkByAlias.alias,
          usage: data.linkByAlias.usage + 1
        }
      });

      window.location.replace(data.linkByAlias.url);
    }
  }, [data]);

  useEffect(() => {
    updateAndRedirect();
  }, [data]);
  
  return (
    <Page.Content>
      <Callout>
        {loading === true && (
          <Heading>Loading..</Heading>
        )}

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
    </Page.Content>
  );
}

const Alias = () => {
  const router = useRouter();

  if (!RouterQuerySchema.isValidSync(router.query)) {
    return (
      <Page.Content>
        <Callout>
          <Heading>Don't.</Heading>
          <Text>Just don't.</Text>
        </Callout>
      </Page.Content>
    )
  }

  return (
    <Redirect alias={String(router.query.alias)} />
  )
}

export default Alias
