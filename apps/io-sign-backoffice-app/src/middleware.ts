import createIntlMiddleware from "next-intl/middleware";

export default createIntlMiddleware({
  locales: ["it"],
  defaultLocale: "it",
  localePrefix: "as-needed",
});

export const config = {
  matcher: ["/((?!info|auth|api|_next|.*\\..*).*)"],
};
