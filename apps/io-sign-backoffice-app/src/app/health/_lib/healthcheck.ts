type HealthStatus = { status: "ok" } | { status: "fail"; failures: string[] };

export default async function healthcheck(
  checks: Array<Promise<unknown>>
): Promise<HealthStatus> {
  const results = await Promise.allSettled(checks);
  const failures = results
    .filter((c): c is PromiseRejectedResult => c.status === "rejected")
    .map(({ reason }) => (typeof reason === "string" ? reason : "unknown"));
  if (failures.length > 0) {
    return { status: "fail", failures };
  }
  return { status: "ok" };
}
