import { IncomingMessage, ServerResponse } from 'http';
import { useMemo } from 'react';
import {
  HttpLink,
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  ApolloLink,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { apolloLogger } from './apollo-logger';

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

export type ResolverContext = {
  req?: IncomingMessage;
  res?: ServerResponse;
};

function sanitizeVariables(
  variables: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!variables) return undefined;

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(variables)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[redacted]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function createErrorLink() {
  return onError(({ graphQLErrors, networkError, operation }) => {
    const operationName = operation.operationName || 'unknown';

    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        apolloLogger.error('graphql.error', {
          operationName,
          message: err.message,
          path: err.path?.join('.'),
          errcode: (err.extensions?.errcode as string) ?? null,
          hint: (err.extensions?.hint as string) ?? null,
          detail: (err.extensions?.detail as string) ?? null,
        });
      }
    }

    if (networkError) {
      apolloLogger.error('network.error', {
        operationName,
        message: networkError.message,
        statusCode:
          'statusCode' in networkError
            ? (networkError as { statusCode: number }).statusCode
            : null,
      });
    }
  });
}

function createRequestLoggingLink() {
  return new ApolloLink((operation, forward) => {
    const startTime = Date.now();

    return forward(operation).map((result) => {
      const durationMs = (Date.now() - startTime).toFixed(1);
      const operationName = operation.operationName || 'unknown';
      const variables = sanitizeVariables(
        operation.variables as Record<string, unknown>
      );

      apolloLogger.debug('request.completed', {
        operationName,
        variables,
        durationMs,
      });

      return result;
    });
  });
}

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
  let requestLoggingEnabled = false;

  if (typeof window === 'undefined') {
    const { Config } = require('./config');
    requestLoggingEnabled = Config.apollo.requestLogging;
  }

  const errorLink = createErrorLink();
  const httpLink = createIsomorphicLink();

  const retryLink = new RetryLink({
    delay: {
      initial: 100,
      max: 2000,
      jitter: true,
    },
    attempts: {
      max: 3,
      retryIf: (error, _operation) => {
        const isConnectionReset =
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('fetch failed');
        return !!isConnectionReset;
      },
    },
  });

  const links: ApolloLink[] = [errorLink, retryLink];
  if (requestLoggingEnabled) {
    links.push(createRequestLoggingLink());
  }
  links.push(httpLink);

  const link = ApolloLink.from(links);

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link,
    cache: new InMemoryCache({
      resultCaching: typeof window !== 'undefined',
    }),
  });
}

export function initializeApollo(initialState: any = null) {
  const _apolloClient =
    typeof window === 'undefined'
      ? createApolloClient()
      : (apolloClient ?? createApolloClient());

  if (initialState) {
    _apolloClient.cache.restore(initialState);
  }
  if (typeof window === 'undefined') return _apolloClient;
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState: any) {
  const store = useMemo(
    () => initializeApollo(initialState),
    [initialState]
  );
  return store;
}
