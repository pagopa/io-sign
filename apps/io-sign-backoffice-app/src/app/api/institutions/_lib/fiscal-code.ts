import { getCosmosConfig, getCosmosContainerClient } from "@/lib/cosmos";
import { z } from "zod";

export const fiscalCodeRegex = new RegExp(
  "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$"
);

const FiscalCodes = z
  .object({
    test_fiscal_codes: z.string().regex(fiscalCodeRegex).array().optional(),
  })
  .transform((res) => ({ fiscalCodes: res.test_fiscal_codes || [] }));

export async function listFiscalCodes(apiKeyId: string, institutionId: string) {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainerClient(cosmosContainerName)
      .item(apiKeyId, institutionId)
      .read();
    return FiscalCodes.parse(resource);
  } catch (e) {
    throw new Error("unable to get the fiscal codes", { cause: e });
  }
}
