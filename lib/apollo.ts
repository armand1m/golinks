import { IncomingMessage, ServerResponse } from 'http';
import { useMemo } from 'react';
import {
  HttpLink,
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

export type ResolverContext = {
  req?: IncomingMessage;
  res?: ServerResponse;
};

function createIsomorphicLink() {
  let uri: string;

  if (typeof window === 'undefined') {
    const { Config } = require('./config');
    uri = new URL('/api/graphql', Config.metadata.baseUrl).href;
  } else {
    uri = '/api/graphql';
  }

  return new HttpLink({
    uri,
    credentials: 'same-origin',
  });
}

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: createIsomorphicLink(),
    cache: new InMemoryCache({
      // Disable result caching on the server to prevent memory leaks
      // from the cache growing unbounded across SSR requests
      resultCaching: typeof window !== 'undefined',
    }),
  });
}

export function initializeApollo(initialState: any = null) {
  // On the server, always create a new Apollo Client to avoid memory leaks
  // from the singleton persisting across SSR requests
  const _apolloClient =
    typeof window === 'undefined' ? createApolloClient() : apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // get hydrated here
  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState: any) {
  const store = useMemo(() => initializeApollo(initialState), [
    initialState,
  ]);
  return store;
}
