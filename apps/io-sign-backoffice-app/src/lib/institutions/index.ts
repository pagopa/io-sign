import { z } from "zod";

const UserRole = z
  .enum(["admin", "operator"])
  .transform((role) => (role === "admin" ? "Amministratore" : "Operatore"));

export const institutionSchema = z
  .object({
    id: z.string().uuid(),
    description: z.string().nonempty(),
    taxCode: z.string().nonempty(),
    onboarding: z
      .object({
        productId: z.string(),
        status: z.string(),
        billing: z.object({
          vatNumber: z.string(),
        }),
      })
      .array()
      .min(1)
      .refine((onboarding) =>
        onboarding.some((e) => e.productId === "prod-io-sign")
      ),
    userProductRoles: z.array(UserRole).default(["operator"]),
    logo: z.string().url(),
  })
  .transform(
    ({
      id,
      description: name,
      taxCode,
      onboarding,
      userProductRoles,
      logo,
    }) => ({
      id,
      name,
      taxCode,
      vatNumber: onboarding.find((x) => x.productId === "prod-io-sign")!.billing
        .vatNumber,
      productRole: userProductRoles.at(0) ?? "Operatore",
      logo,
    })
  );

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
