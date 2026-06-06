import Head from 'next/head';
import { AppProps } from 'next/app';
import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../lib/apollo';
import { NextPageContext } from 'next';
import { ThemeModeController } from '../components/ThemeModeController';
import { ThemeMode, readThemeModeCookie } from '../lib/theme';

type ThemeAppProps = AppProps & {
  initialThemeMode: ThemeMode;
};

export default function App({
  Component,
  pageProps,
  initialThemeMode,
}: ThemeAppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);

  return (
    <>
      <Head>
        <title>Go Links</title>
        <meta property="og:title" content="Go Links" key="title" />
      </Head>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme={initialThemeMode}>
          <ThemeModeController initialThemeMode={initialThemeMode} />
          <Toaster />
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
  const rawCookie =
    ctx.req?.headers.cookie ||
    (typeof document !== 'undefined' ? document.cookie : undefined);
  const initialThemeMode = readThemeModeCookie(rawCookie);

  if (Component.getInitialProps) {
    pageProps = await Component.getInitialProps(ctx);
  }

  return { pageProps, initialThemeMode };
};
