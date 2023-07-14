import { z } from "zod";
import { id as newId } from "@io-sign/io-sign/id";
import { ParsingError } from "./error";

const ApiKeyBody = z.object({
  institutionId: z.string().nonempty(),
  displayName: z.string().nonempty(),
  environment: z.enum(["TEST", "DEFAULT", "INTERNAL"]),
  resourceId: z.string().nonempty(),
});

export type ApiKeyBody = z.infer<typeof ApiKeyBody>;

export type ApiKey = ApiKeyBody & {
  id: string;
  status: "ACTIVE" | "INACTIVE";
};

export const newApiKey = (apiKey: ApiKeyBody): ApiKey => ({
  id: newId(),
  ...apiKey,
  status: "ACTIVE",
});

export const parseApiKeyBody = (x: unknown): ApiKeyBody => {
  try {
    return ApiKeyBody.parse(x);
  } catch {
    throw new ParsingError("Failed to parse request body");
  }
};

export class ApiKeyAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiKeyAlreadyExistsError";
  }
}
