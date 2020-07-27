import { AppProps } from 'next/app'
import { ThemeProvider } from 'fannypack';
import { ApolloProvider } from '@apollo/react-hooks'
import { useApollo } from '../lib/apollo'

export default function App({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState)

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </ApolloProvider>
  )
}