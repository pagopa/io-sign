import { z } from "zod";

export const issuerSchema = z.object({
  id: z.string().nonempty(),
  type: z.enum(["PA"]),
  externalId: z.string().ulid(),
  institutionId: z.string().uuid(),
  supportEmail: z.string().email(),
});

export type Issuer = z.infer<typeof issuerSchema>;

export const createIssuerPayloadSchema = issuerSchema.pick({
  id: true,
  institutionId: true,
  supportEmail: true,
});

export type CreateIssuerPayload = z.infer<typeof createIssuerPayloadSchema>;
