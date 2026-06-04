import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  GetLinkByAliasDocument,
  GetLinkByAliasQuery,
  GetLinkByAliasQueryVariables,
} from '../../__generated__/graphql';
import { getLinkCache } from '../../cache/link-cache';
import { cacheLogger } from '../../cache/logger';

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
      const parameter = parameters[index] ?? '';
      return acc.replace(urlParam, parameter);
    }, linkUrl);

    return finalUrl;
  }

  return linkUrl;
};

export interface ResolvedLink {
  id: string;
  url: string;
  alias: string;
}

export function findLinkInCache(
  contextAlias: string[]
): ResolvedLink | undefined {
  if (contextAlias.length === 0) return undefined;

  const cache = getLinkCache();
  const candidates: string[] = [];

  for (let i = contextAlias.length; i >= 1; i--) {
    const candidate = contextAlias.slice(0, i).join('/');
    candidates.push(candidate);
    const cached = cache.get(candidate);
    if (cached) {
      cacheLogger.debug('cache.lookup', {
        candidates,
        matchedAlias: cached.alias,
      });
      return { id: cached.id, url: cached.url, alias: cached.alias };
    }
  }

  cacheLogger.debug('cache.lookup', {
    candidates,
    matchedAlias: null,
  });
  return undefined;
}

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
