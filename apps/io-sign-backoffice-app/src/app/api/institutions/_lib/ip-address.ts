import { getCosmosConfig, getCosmosContainerClient } from "@/lib/cosmos";
import { z } from "zod";

export const Cidr = z.custom<string>((val) => {
  if (typeof val !== "string") {
    return false;
  }
  const [ip, subnet] = val.split("/");
  try {
    z.string().ip({ version: "v4" }).parse(ip);
    z.enum(["8", "16", "24", "32"]).parse(subnet);
    return true;
  } catch {
    return false;
  }
}, "Invalid cidr value");

const IpAddresses = z
  .object({
    cidrs: Cidr.array().optional(),
  })
  .transform((res) => ({ cidrs: res.cidrs || [] }));

export async function listIpAddresses(apiKeyId: string, institutionId: string) {
  try {
    const { cosmosContainerName } = getCosmosConfig();
    const { resource } = await getCosmosContainerClient(cosmosContainerName)
      .item(apiKeyId, institutionId)
      .read();
    return IpAddresses.parse(resource);
  } catch (e) {
    throw new Error("unable to get the IP addresses", { cause: e });
  }
}
