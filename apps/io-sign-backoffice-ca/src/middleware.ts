import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["it"],
  defaultLocale: "it",
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
