"use client";

import { ApiKey } from "@/lib/api-keys";
import { ApiKeyContext } from "@/lib/api-keys/client";

export type Props = {
  value: ApiKey;
  children: React.ReactNode;
};

export default function ApiKeyProvider(props: Props) {
  return <ApiKeyContext.Provider {...props} />;
}
