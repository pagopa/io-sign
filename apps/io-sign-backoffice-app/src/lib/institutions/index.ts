import { z } from "zod";

const UserRole = z.enum(["admin", "operator"]);

export const institutionSchema = z
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

export type Institution = z.infer<typeof institutionSchema>;

export const productSchema = z
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
