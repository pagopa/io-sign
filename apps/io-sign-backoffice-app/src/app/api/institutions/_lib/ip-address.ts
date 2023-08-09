import { getCosmosConfig, getCosmosContainerClient } from "@/lib/cosmos";
import { z } from "zod";

export const CIDR = z.custom<string>((val) => {
  if (typeof val !== "string") {
    return false;
  }
  const [ip, subnet] = val.split("/");
  const checks = [
    z.string().ip({ version: "v4" }).safeParse(ip),
    z.enum(["8", "16", "24", "32"]).safeParse(subnet),
  ]
    .map((result) => result.success)
    .every(Boolean);

  return checks;
}, "Invalid CIDR value");

const CidrsFromCosmosDb = z
  .object({
    cidrs: CIDR.array().optional(),
  })
  .transform((res) => ({ cidrs: res.cidrs || [] }));

export async function listIpAddresses(apiKeyId: string, institutionId: string) {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainerClient(cosmosContainerName)
      .item(apiKeyId, institutionId)
      .read();
    return CidrsFromCosmosDb.parse(resource);
  } catch (e) {
    throw new Error("unable to get the IP addresses", { cause: e });
  }
}
