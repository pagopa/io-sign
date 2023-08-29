import { NextResponse } from "next/server";

import { getCosmosHealth } from "@/lib/cosmos";
import healthcheck from "@/lib/healthcheck";

export async function GET() {
  const health = await healthcheck([getCosmosHealth()]);
  const status = health.status === "ok" ? 200 : 500;
  return NextResponse.json(health, { status });
}
