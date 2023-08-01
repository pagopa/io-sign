import { NextResponse } from "next/server";
import healthcheck from "./_lib/healthcheck";

export async function GET() {
  const health = await healthcheck();
  const status = health.status === "ok" ? 200 : 500;
  return NextResponse.json(health, { status });
}
