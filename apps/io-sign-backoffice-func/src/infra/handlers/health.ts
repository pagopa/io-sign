import { HttpResponseInit } from "@azure/functions";

export async function healthHandler(): Promise<HttpResponseInit> {
  return { status: 200 };
}
