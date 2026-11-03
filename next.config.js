const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.chesscomfiles.com',
        port: '',
        pathname: '/uploads/v1/user/**',
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = withSentryConfig(nextConfig, {
  org: 'luis-cruz',
  project: 'portfolio-site',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Proxies browser events through Next to get past ad blockers
  tunnelRoute: '/monitoring',
  disableLogger: true,
});
