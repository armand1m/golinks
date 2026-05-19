import React from 'react';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document';
import { getColorModeInitializationScript } from '../lib/theme';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <script
            key="theme-init"
            dangerouslySetInnerHTML={{
              __html: getColorModeInitializationScript(),
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
