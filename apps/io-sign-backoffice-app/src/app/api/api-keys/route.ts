import { NextResponse, NextRequest } from "next/server";
import { ZodError } from "zod";

import { createApiKeyPayloadSchema } from "@/lib/api-keys";
import {
  createApiKey,
  ApiKeyAlreadyExistsError,
} from "@/lib/api-keys/use-cases";
import { ValidationProblem } from "@/lib/api/responses";
import { UnauthenticatedUserError, getLoggedUser } from "@/lib/auth/use-cases";

export async function POST(request: NextRequest) {
  try {
    await getLoggedUser();
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        {
          title: "Unauthorized",
          detail: e.message,
        },
        {
          status: 401,
          headers: { "Content-Type": "application/problem+json" },
        }
      );
    }
    return NextResponse.json(
      {
        title: "Internal Server Error",
        detail: e instanceof Error ? e.message : "Something went wrong.",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      }
    );
  }
  try {
    const body = await request.json();
    const parsedBody = createApiKeyPayloadSchema.parse(body);
    const apiKeyId = await createApiKey(parsedBody);
    return NextResponse.json({ id: apiKeyId }, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(ValidationProblem(e), {
        status: 422,
        headers: { "Content-Type": "application/problem+json" },
      });
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
