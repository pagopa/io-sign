const withNextIntl = require("next-intl/plugin")("./src/i18n.tsx");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  modularizeImports: {
    "@mui/icons-material": {
      transform: "@mui/icons-material/{{member}}",
    },
  },
  experimental: {
    logging: "verbose",
  },
  output: "standalone",
};

module.exports = withNextIntl(nextConfig);
