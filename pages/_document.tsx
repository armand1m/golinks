import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import { extractCritical } from 'bumbag-server';
import { getColorModeInitializationScript } from '../lib/theme';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);
    const styles = extractCritical(initialProps.html);

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            data-emotion-css={styles.ids.join(' ')}
            dangerouslySetInnerHTML={{ __html: styles.css }}
          />
        </>
      ),
    };
  }

  render() {
    return (
      <html lang="en">
        <Head />
        <body>
          <script
            key="bb-no-flash"
            dangerouslySetInnerHTML={{
              __html: getColorModeInitializationScript(),
            }}
          />
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
