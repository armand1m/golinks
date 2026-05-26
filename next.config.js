/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  output: 'standalone',
  webpack: (config) => {
    config.ignoreWarnings = [
      // jose v6 uses CompressionStream/DecompressionStream (Web Streams API)
      // which ARE Edge-compatible — webpack's check is a false positive
      { module: /node_modules\/jose/ },
      // @auth0/nextjs-auth0 v4 barrel-exports with-page-auth-required
      // which imports Next.js ESM client navigation, triggering useContext warnings
      { module: /node_modules\/@auth0\/nextjs-auth0/ },
    ];

    return config;
  },
}
