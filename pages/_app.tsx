import Head from 'next/head';
import { AppProps } from 'next/app';
import {
  Provider as ThemeProvider,
  ToastManager,
  ThemeConfig,
  css,
} from 'bumbag';
import {
  faEdit,
  faShare,
  faTrashAlt,
  faChartBar,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { ApolloProvider } from '@apollo/react-hooks';
import { useApollo } from '../lib/apollo';
import { NextPageContext } from 'next';

const theme: ThemeConfig = {
  modes: {
    useSystemColorMode: false,
  },
  global: {
    styles: {
      base: css``,
    },
  },
  Icon: {
    iconSets: [
      {
        icons: [
          faEdit,
          faShare,
          faTrashAlt,
          faChartBar,
          faSignOutAlt,
        ],
        prefix: 'solid-',
        type: 'font-awesome',
      },
    ],
  },
};

export default function App({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);

  return (
    <>
      <Head>
        <title>Go Links</title>
        <meta property="og:title" content="Go Links" key="title" />
      </Head>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider colorMode="light" theme={theme}>
          <ToastManager />
          <Component {...pageProps} />
        </ThemeProvider>
      </ApolloProvider>
    </>
  );
}

type InitialPropsArgs = AppProps & {
  ctx: NextPageContext;
};

/**
 * This is only to opt out of Automatic Static Optimization.
 *
 * This application validates env vars when using them and
 * Docker Builds are not aware of those until the runtime.
 *
 * Automatic Static Optimization attempts to use these and
 * assumes they're present when building the docker image.
 */
App.getInitialProps = async ({
  Component,
  ctx,
}: InitialPropsArgs) => {
  let pageProps = {};

  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  return { pageProps };
};
