import { NextResponse, NextRequest } from "next/server";
import { createApiKey } from "./_lib/api-key";
import { getHttpError } from "@/lib/error";

const getResponseFromError = (e: Error) => {
  const { error, status } = getHttpError(e);
  return NextResponse.json({ error }, { status });
};

export async function POST(request: NextRequest) {
  return createApiKey(request)
    .then((body: unknown) => NextResponse.json(body, { status: 201 }))
    .catch(getResponseFromError);
}
