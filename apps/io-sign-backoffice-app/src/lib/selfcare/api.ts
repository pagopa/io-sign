import { z } from "zod";
import { cache } from "react";

const Config = z
  .object({
    SELFCARE_API_URL: z.string().url(),
    SELFCARE_API_KEY: z.string().nonempty(),
  })
  .transform((e) => ({
    baseUrl: new URL(e.SELFCARE_API_URL),
    apiKey: e.SELFCARE_API_KEY,
  }));

const getConfig = () => {
  const result = Config.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing api.self-care config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};

async function retrieve(uri: string) {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`external/v2/${uri}`, baseUrl);
  const resp = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
    },
  });
  const json = await resp.json();
  return json;
}

const UserRole = z.union([z.literal("admin"), z.literal("operator")]);

const Institution = z
  .object({
    id: z.string().uuid(),
    description: z.string().nonempty(),
    userProductRoles: z.array(UserRole).default(["operator"]),
  })
  .transform(({ id, description: name, userProductRoles }) => ({
    id,
    name,
    productRole: userProductRoles.at(0) ?? "operator",
  }));

export type Institution = z.infer<typeof Institution>;

export const getInstitutions = async (userId: string) =>
  retrieve(`institutions/?userIdForAuth=${userId}`).then(
    z.array(Institution).parseAsync
  );

export const getInstitution = async (institutionId: string) =>
  retrieve(`institutions/${institutionId}`).then(Institution.parseAsync);

const Product = z
  .object({
    id: z.string().nonempty(),
    title: z.string().nonempty(),
    urlBO: z.string().url(),
  })
  .transform(({ id, title, urlBO: productUrl }) => ({
    id,
    title,
    productUrl,
    linkType: "external" as const,
  }));

export const getProducts = async (
  userId: string,
  institutionId: string | null
) => {
  if (!institutionId) {
    return [];
  }
  return retrieve(
    `institutions/${institutionId}/products?userId=${userId}`
  ).then(z.array(Product).parseAsync);
};
