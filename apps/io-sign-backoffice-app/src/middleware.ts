import createIntlMiddleware from "next-intl/middleware";

export default createIntlMiddleware({
  locales: ["it"],
  defaultLocale: "it",
});

export const config = {
  matcher: ["/((?!auth|api|_next|.*\\..*).*)"],
};
