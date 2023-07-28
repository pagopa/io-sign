import { NextResponse, NextRequest } from "next/server";
import { ApiKeyBody, createApiKey } from "./_lib/api-key";
import { getHttpError } from "@/lib/error";

const getResponseFromError = (e: Error) => {
  const { error, status } = getHttpError(e);
  return NextResponse.json({ error }, { status });
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsedBody = ApiKeyBody.parse(body);
  return createApiKey(parsedBody)
    .then((body: unknown) => NextResponse.json(body, { status: 201 }))
    .catch(getResponseFromError);
}
