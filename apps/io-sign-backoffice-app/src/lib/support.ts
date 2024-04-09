import { cache } from "react";

import { z } from "zod";

function getSupportContactsFromEnvironment() {
  const schema = z.object({
    SUPPORT_L3_EMAIL: z.string().email().catch("firmaconio-tech@pagopa.it"),
  });
  return schema
    .transform(({ SUPPORT_L3_EMAIL }) => ({
      l3: SUPPORT_L3_EMAIL,
    }))
    .parse(process.env);
}

export const getSupportContact = cache(() => {
  const contacts = getSupportContactsFromEnvironment();
  return { email: contacts.l3 };
});
