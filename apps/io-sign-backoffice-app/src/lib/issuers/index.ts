import { z } from "zod";
import { issuerSchema } from "@io-sign/io-sign/issuer";

export type Issuer = z.infer<typeof issuerSchema>;

export const createIssuerPayloadSchema = issuerSchema
  .pick({
    id: true,
    institutionId: true,
    supportEmail: true,
  })
  .extend({
    name: z.string().min(1),
  });

export type CreateIssuerPayload = z.infer<typeof createIssuerPayloadSchema>;

export { issuerSchema };
