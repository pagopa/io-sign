import { z } from "zod";

export const issuerSchema = z.object({
  id: z.string().nonempty(),
  type: z.enum(["PA"]),
  externalId: z.string().nonempty(),
  institutionId: z.string().uuid(),
  supportEmail: z.string().email(),
  state: z.enum(["active", "inactive"]),
});

export type Issuer = z.infer<typeof issuerSchema>;

export const createIssuerPayloadSchema = issuerSchema.pick({
  id: true,
  institutionId: true,
  supportEmail: true,
});

export type CreateIssuerPayload = z.infer<typeof createIssuerPayloadSchema>;
