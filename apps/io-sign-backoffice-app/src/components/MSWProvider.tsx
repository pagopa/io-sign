"use client";

import { useEffect, useState } from "react";

/**
 * Ensures MSW is fully initialized before the application renders.
 * This prevents hydration mismatches between server-rendered HTML
 * and client-side execution in Next.js.
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (
        process.env.NEXT_PUBLIC_MOCK_MSW_ENABLED === "true" &&
        process.env.NODE_ENV === "development"
      ) {
        const { startMSWWorker } = await import("../../mocks/msw-browser");
        await startMSWWorker();
      }
      setIsReady(true);
    };

    init();
  }, []);

  // production should never use MSW
  if (process.env.NODE_ENV === "production") {
    return <>{children}</>;
  }

  // Otherwise, if MSW is enabled, wait until it is ready.
  // (null here only to "freeze" the client until the mocks are ready.)
  if (process.env.NEXT_PUBLIC_MOCK_MSW_ENABLED === "true" && !isReady) {
    return null;
  }

  return <>{children}</>;
}
