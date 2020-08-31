import { AppProps } from 'next/app';
import {
  Provider as ThemeProvider,
  ToastManager,
  ThemeConfig,
} from 'bumbag';
import { ApolloProvider } from '@apollo/react-hooks';
import { useApollo } from '../lib/apollo';
import {
  faEdit,
  faShare,
  faTrashAlt,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons';

const theme: ThemeConfig = {
  Icon: {
    iconSets: [
      {
        icons: [faEdit, faShare, faTrashAlt, faChartBar],
        prefix: 'solid-',
        type: 'font-awesome',
      },
    ],
  },
};

export default function App({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <ToastManager />
        <Component {...pageProps} />
      </ThemeProvider>
    </ApolloProvider>
  );
}
