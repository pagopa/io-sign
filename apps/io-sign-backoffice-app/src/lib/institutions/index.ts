import { z } from "zod";

const UserRole = z
  .enum(["admin", "operator"])
  .transform((role) => (role === "admin" ? "Amministratore" : "Operatore"));

export const institutionSchema = z
  .object({
    id: z.string().uuid(),
    description: z.string().min(1),
    taxCode: z.string().min(1),
    userProductRoles: z.array(UserRole).default(["operator"]),
    logo: z.string().url(),
    supportEmail: z.string().email().optional(),
  })
  .transform(({ id, description: name, taxCode, userProductRoles, logo }) => ({
    id,
    name,
    taxCode,
    vatNumber: taxCode,
    productRole: userProductRoles.at(0) ?? "Operatore",
    logo,
  }));

export type Institution = z.infer<typeof institutionSchema>;

const onboardingSchema = z.object({
  productId: z.string().min(1),
  status: z.string().min(1),
  billing: z.object({
    vatNumber: z.string().min(1),
  }),
});

type Onboarding = z.infer<typeof onboardingSchema>;

export const getIOSignOnboarding = (list: Onboarding[]) =>
  list.filter((p) => p.productId === "prod-io-sign").at(0);

export const institutionDetailSchema = z
  .object({
    id: z.string().uuid(),
    taxCode: z.string().min(1),
    supportEmail: z.string().email(),
    description: z.string().min(1),
    onboarding: z.array(onboardingSchema),
  })
  .transform(({ description: name, onboarding, ...fields }) => ({
    ...fields,
    name,
    vatNumber:
      getIOSignOnboarding(onboarding)?.billing.vatNumber ?? fields.taxCode,
  }));

export type InstitutionDetail = z.infer<typeof institutionDetailSchema>;

export const productSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    urlBO: z.string().url(),
  })
  .transform(({ id, title, urlBO: productUrl }) => ({
    id,
    title,
    productUrl,
    linkType: "external" as const,
  }));

export type Product = z.infer<typeof productSchema>;
