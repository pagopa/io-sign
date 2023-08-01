import { getCosmosClient } from "@/lib/cosmos";
import { getApimClient, getApimConfig } from "@/lib/apim";

async function getCosmosHealth(): Promise<void> {
  try {
    const cosmos = getCosmosClient();
    const { resource } = await cosmos.getDatabaseAccount();
    if (!resource) {
      throw new Error();
    }
  } catch {
    throw "cosmos-db";
  }
}

async function getApimHealth(): Promise<void> {
  try {
    const apim = getApimClient();
    const {
      apim: { resourceGroupName, serviceName, productName },
    } = getApimConfig();
    await apim.product.get(resourceGroupName, serviceName, productName);
  } catch {
    throw "apim";
  }
}

type HealthStatus = { status: "ok" } | { status: "fail"; failures: string[] };

export default async function healthcheck(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([getCosmosHealth(), getApimHealth()]);
  const failures = checks
    .filter((c): c is PromiseRejectedResult => c.status === "rejected")
    .map(({ reason }) => (typeof reason === "string" ? reason : "unknown"));
  if (failures.length > 0) {
    return { status: "fail", failures };
  }
  return { status: "ok" };
}
