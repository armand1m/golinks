import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  GetLinkByAliasDocument,
  GetLinkByAliasQuery,
  GetLinkByAliasQueryVariables,
} from '../../queries/getLinkByAlias.graphql';

interface CreateRedirectUrlProps {
  linkUrl: string;
  linkAlias: string;
  contextAlias: string[];
}

export const createRedirectUrl = ({
  linkUrl,
  linkAlias,
  contextAlias,
}: CreateRedirectUrlProps) => {
  const urlParameters = linkUrl.match(/\$(\d+)/g);

  if (urlParameters?.length) {
    const parameters = contextAlias.filter(
      (param) => param !== linkAlias && !linkAlias.includes(param)
    );

    const finalUrl = urlParameters.reduce((acc, urlParam, index) => {
      return acc.replace(urlParam, parameters[index]);
    }, linkUrl);

    return finalUrl;
  }

  return linkUrl;
};

interface FindLinkRecursiveProps {
  contextAlias: string[];
  apolloClient: ApolloClient<NormalizedCacheObject>;
}

export const findLinkRecursive = async ({
  contextAlias,
  apolloClient,
}: FindLinkRecursiveProps): Promise<
  GetLinkByAliasQuery['linkByAlias']
> => {
  if (contextAlias.length === 0) {
    return undefined;
  }

  const alias = contextAlias.join('/');

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
    const $contextAlias = contextAlias.slice(0, -1);
    return findLinkRecursive({
      contextAlias: $contextAlias,
      apolloClient,
    });
  }

  return link;
};
