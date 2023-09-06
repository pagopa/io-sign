"use client";

// ApiKeyProvider is a Client Context Provider
// that provides API Key objects to its consumer

// The "ApiKeyContext.Provider" component it's
// wrapped here to make it composable with RSCs.

import { ApiKey } from "@/lib/api-keys";
import { ApiKeyContext } from "@/lib/api-keys/client";

export type Props = {
  value: ApiKey;
  children: React.ReactNode;
};

export default function ApiKeyProvider(props: Props) {
  return <ApiKeyContext.Provider {...props} />;
}
