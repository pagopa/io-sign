import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createWebhookPayloadSchema,
} from "@/lib/webhooks";
import {
  WebhookAlreadyExistsError,
  createWebhook,
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
    const parsedBody = createWebhookPayloadSchema.parse(body);
    const isAllowedInstitutionId = await isAllowedInstitution(
      loggedUser.id,
      parsedBody.institutionId
    );
    if (!isAllowedInstitutionId) {
      return NextResponse.json(
        { title: "Forbidden", detail: "The operation is forbidden" },
        { status: 403, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    const createdWebhook = await createWebhook(parsedBody);
    return NextResponse.json(createdWebhook, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized to create the webhook" },
        { status: 401, headers: { "Content-Type": "application/problem+json" } }
      );
    } else if (e instanceof ZodError) {
      return NextResponse.json(ValidationProblem(e), {
        status: 422,
        headers: { "Content-Type": "application/problem+json" },
      });
    } else if (e instanceof WebhookAlreadyExistsError) {
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