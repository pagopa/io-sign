import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { rotateWebhookKeyPayloadSchema } from "@/lib/webhooks";
import {
  WebhookNotFoundError,
  rotateWebhookKey,
} from "@/lib/webhooks/use-cases";
import { ValidationProblem } from "@/lib/api/responses";
import {
  UnauthenticatedUserError,
  getLoggedUser,
  isAllowedInstitution,
} from "@/lib/auth/use-cases";

export async function POST(request: NextRequest) {
  try {
    const loggedUser = await getLoggedUser();
    const body = await request.json();
    const parsedBody = rotateWebhookKeyPayloadSchema.parse(body);
    const allowed = await isAllowedInstitution(
      loggedUser.id,
      parsedBody.institutionId
    );
    if (!allowed) {
      return NextResponse.json(
        { title: "Forbidden", detail: "The operation is forbidden" },
        { status: 403, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    const result = await rotateWebhookKey(parsedBody);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized to rotate the webhook key" },
        { status: 401, headers: { "Content-Type": "application/problem+json" } }
      );
    } else if (e instanceof ZodError) {
      return NextResponse.json(ValidationProblem(e), {
        status: 422,
        headers: { "Content-Type": "application/problem+json" },
      });
    } else if (e instanceof WebhookNotFoundError) {
      return NextResponse.json(
        { title: "Not Found", detail: e.message },
        { status: 404, headers: { "Content-Type": "application/problem+json" } }
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
