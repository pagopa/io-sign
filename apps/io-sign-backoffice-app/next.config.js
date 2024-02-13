const withNextIntl = require("next-intl/plugin")("./src/i18n/index.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  images: { unoptimized: true },
};

module.exports = withNextIntl(nextConfig);
