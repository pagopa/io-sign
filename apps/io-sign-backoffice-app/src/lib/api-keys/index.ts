import { z } from "zod";

export const cidrSchema = z.custom<string>((val) => {
  if (typeof val !== "string") {
    return false;
  }
  const [ip, subnet] = val.split("/");
  const result = z
    .object({
      ip: z.string().ip({ version: "v4" }),
      subnet: z.enum(["8", "16", "24", "32"]),
    })
    .safeParse({ ip, subnet });
  return result.success;
}, "Invalid CIDR value");

export const fiscalCodeSchema = z
  .string()
  .regex(
    new RegExp(
      "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"
    )
  );

export type CIDR = z.infer<typeof cidrSchema>;

export const apiKeySchema = z.object({
  id: z.string().ulid(),
  institutionId: z.string().uuid(),
  displayName: z.string().min(3).max(40),
  environment: z.enum(["test", "prod"]),
  cidrs: z.array(cidrSchema).default([]),
  testers: z.array(fiscalCodeSchema).default([]),
  status: z.enum(["active", "revoked"]),
  createdAt: z.string().pipe(z.coerce.date()),
});

export type ApiKey = z.infer<typeof apiKeySchema>;

export const apiKeyWithSecretSchema = apiKeySchema.extend({
  secret: z.string().nonempty(),
});

export type ApiKeyWithSecret = z.infer<typeof apiKeyWithSecretSchema>;

export const createApiKeyPayloadSchema = apiKeySchema.pick({
  institutionId: true,
  displayName: true,
  environment: true,
  cidrs: true,
  testers: true,
});

export type CreateApiKeyPayload = z.infer<typeof createApiKeyPayloadSchema>;
