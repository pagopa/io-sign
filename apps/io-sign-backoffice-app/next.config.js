const { version } = require("./package.json");
const withNextIntl = require("next-intl/plugin")("./src/i18n/index.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: { unoptimized: true },
  experimental: {
    // Ensure that server modules are resolved correctly
    serverComponentsExternalPackages: ["msw"],
  },
  env: {
    APP_VERSION: version,
  },
};

module.exports = withNextIntl(nextConfig);
