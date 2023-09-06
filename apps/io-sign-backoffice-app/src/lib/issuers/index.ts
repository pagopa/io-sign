import { z } from "zod";

export const issuerSchema = z.object({
  id: z.string().ulid(),
  type: z.enum(["PA"]),
  institutionId: z.string().uuid(),
  supportEmail: z.string().email(),
});

export type Issuer = z.infer<typeof issuerSchema>;
