import { NextResponse, NextRequest } from "next/server";

import {
  createApiKeyPayloadSchema,
  createApiKey,
  ApiKeyAlreadyExistsError,
} from "@/lib/api-keys";

import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedBody = createApiKeyPayloadSchema.parse(body);
    const res = await createApiKey(parsedBody);
    return NextResponse.json(res, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          type: "/problem/validation-error",
          title: "Validation Error",
          detail: "Your request didn't validate",
          violations: e.issues,
        },
        {
          status: 422,
          headers: { "Content-Type": "application/problem+json" },
        }
      );
    }
    if (e instanceof ApiKeyAlreadyExistsError) {
      return NextResponse.json(
        { title: "Conflict Error", detail: e.message },
        { status: 409, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    return NextResponse.json(
      {
        title: "Internal Server Error",
        detail: e instanceof Error ? e.message : "Something went wrong",
      },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }
}
