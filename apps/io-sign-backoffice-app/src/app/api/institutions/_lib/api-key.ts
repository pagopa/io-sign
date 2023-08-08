import { getCosmosConfig, getCosmosContainerClient } from "@/lib/cosmos";
import { z } from "zod";
import { ipAddressRegex } from "./ip-address";
import { fiscalCodeRegex } from "./fiscal-code";

const Path = z.enum(["/test_fiscal_codes", "/cidrs"]);

type Path = z.infer<typeof Path>;

const AddPatchBody = z.object({
  op: z.literal("add"),
  path: Path,
  value: z.string().array(),
});

const RemovePatchBody = z.object({
  op: z.literal("remove"),
  path: Path,
});

type AddPatchBody = z.infer<typeof AddPatchBody>;

export const parseValue = (path: Path, value: AddPatchBody["value"]) => {
  if (path === "/test_fiscal_codes") {
    z.string().regex(fiscalCodeRegex).array().parse(value);
  } else if (path === "/cidrs") {
    z.string().regex(ipAddressRegex).array().parse(value);
  }
};

export const PatchBody = z.discriminatedUnion("op", [
  AddPatchBody,
  RemovePatchBody,
]);

export type PatchBody = z.infer<typeof PatchBody>;

export async function patchApiKey(
  institutionId: string,
  apiKeyId: string,
  patchBody: PatchBody
) {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    await getCosmosContainerClient(cosmosContainerName)
      .item(apiKeyId, institutionId)
      .patch([patchBody]);
  } catch (e) {
    throw new Error("unable to update the API key", { cause: e });
  }
}
