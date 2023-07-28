import { NextResponse, NextRequest } from "next/server";
import {
  ApiKeyAlreadyExistsError,
  ApiKeyBody,
  createApiKey,
} from "./_lib/api-key";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = ApiKeyBody.parse(body);
    const res = await createApiKey(parsedBody);
    return NextResponse.json(res, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "error parsing the request body" },
        { status: 422 }
      );
    }
    if (e instanceof ApiKeyAlreadyExistsError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
