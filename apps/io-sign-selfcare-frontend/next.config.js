/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

const nextConfig = {
  transpilePackages: ["@pagopa/mui-italia"],
  trailingSlash: true,
  reactStrictMode: true,
  i18n,
};

module.exports = nextConfig;
