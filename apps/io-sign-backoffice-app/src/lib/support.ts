import { cache } from "react";

import { z } from "zod";

function getSupportContactsFromEnvironment() {
  const schema = z.object({
    SUPPORT_L1_EMAIL: z
      .string()
      .email()
      .catch("enti-firmaconio@assistenza.pagopa.it"),
    SUPPORT_L3_EMAIL: z.string().email().catch("firmaconio-tech@pagopa.it"),
  });
  return schema
    .transform(({ SUPPORT_L1_EMAIL, SUPPORT_L3_EMAIL }) => ({
      l1: SUPPORT_L1_EMAIL,
      l3: SUPPORT_L3_EMAIL,
    }))
    .parse(process.env);
}

export const getSupportContactsByPhase = cache(() => {
  const contacts = getSupportContactsFromEnvironment();
  return [
    { phase: "test", email: contacts.l3 },
    { phase: "prod", email: contacts.l1 },
  ];
});
