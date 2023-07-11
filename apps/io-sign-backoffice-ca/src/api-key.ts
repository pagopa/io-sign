import { z } from "zod";

const EnvironmentEnum = z.enum(["TEST", "DEFAULT", "INTERNAL"]);

export const apiKeyBody = z.object({
  institutionId: z.string().nonempty(),
  displayName: z.string().nonempty(),
  environment: EnvironmentEnum,
  resourceId: z.string().nonempty(),
});

export type ApiKeyBody = z.infer<typeof apiKeyBody>;

const apiKey = z.object({
  id: z.string().nonempty(),
  institutionId: z.string().nonempty(),
  resourceId: z.string().nonempty(),
  displayName: z.string(),
  environment: EnvironmentEnum,
  status: z.enum(["ACTIVE", "INACTIVE"]),
  testers: z.string().array().optional(),
  cidrs: z.string().array().optional(),
});

export type ApiKey = z.infer<typeof apiKey>;

export const newApiKey = (apiKey: ApiKeyBody): ApiKey => ({
  ...apiKey,
  id: "12345", // newId()
  status: "ACTIVE",
});

export async function insertApiKey(apiKey: ApiKey) {
  return apiKey;
}

// da cambiare questo file e la DR (sono cambiati i campi di api key). e resourceId ci deve essere nei campi di input per creare la chiave
