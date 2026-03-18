/**
 * Next.js instrumentation hook — runs once when the server starts.
 * This is the correct place to initialize server-side singletons such as MSW.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (
    process.env.NEXT_PUBLIC_MOCK_MSW_ENABLED === "true" &&
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { startMSWServer } = await import("../mocks/msw-node");
    startMSWServer();
  }
}
