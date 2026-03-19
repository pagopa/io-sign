const { version } = require("./package.json");
const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/index.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: { unoptimized: true },
  // Ensure that server modules are resolved correctly
  serverExternalPackages: ["msw"],
  env: {
    APP_VERSION: version,
  },
};

module.exports = withNextIntl(nextConfig);
