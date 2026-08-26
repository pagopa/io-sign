import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { z } from "zod";

import {
  createWebhookPayloadSchema,
  patchWebhookPayloadSchema,
} from "@/lib/webhooks";
import {
  WebhookAlreadyExistsError,
  WebhookNotFoundError,
  createWebhook,
  deleteWebhookForInstitution,
  patchWebhook,
} from "@/lib/webhooks/use-cases";
import { ValidationProblem } from "@/lib/api/responses";
import {
  UnauthenticatedUserError,
  getLoggedUser,
  isAllowedInstitution,
  isInstitutionAllowedForWebhook,
  isInstitutionAllowedForWebhookDelete,
} from "@/lib/auth/use-cases";

async function resolvePermission(loggedUser: { id: string }, institutionId: string) {
  if (!isInstitutionAllowedForWebhook(institutionId)) {
    return NextResponse.json(
      { title: "Forbidden", detail: "The operation is forbidden" },
      { status: 403, headers: { "Content-Type": "application/problem+json" } }
    );
  }
  const allowed = await isAllowedInstitution(loggedUser.id, institutionId);
  if (!allowed) {
    return NextResponse.json(
      { title: "Forbidden", detail: "The operation is forbidden" },
      { status: 403, headers: { "Content-Type": "application/problem+json" } }
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const loggedUser = await getLoggedUser();
    const body = await request.json();
    const parsedBody = createWebhookPayloadSchema.parse(body);
    const forbidden = await resolvePermission(loggedUser, parsedBody.institutionId);
    if (forbidden) return forbidden;
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

export async function PATCH(request: NextRequest) {
  try {
    const loggedUser = await getLoggedUser();
    const body = await request.json();
    const parsedBody = patchWebhookPayloadSchema.parse(body);
    const forbidden = await resolvePermission(loggedUser, parsedBody.institutionId);
    if (forbidden) return forbidden;
    await patchWebhook(parsedBody);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized to update the webhook" },
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

const deleteQuerySchema = z.object({ institutionId: z.string().uuid() });

export async function DELETE(request: NextRequest) {
  try {
    const loggedUser = await getLoggedUser();
    const { institutionId } = deleteQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    if (!isInstitutionAllowedForWebhookDelete(institutionId)) {
      return NextResponse.json(
        { title: "Forbidden", detail: "The operation is forbidden" },
        { status: 403, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    const allowed = await isAllowedInstitution(loggedUser.id, institutionId);
    if (!allowed) {
      return NextResponse.json(
        { title: "Forbidden", detail: "The operation is forbidden" },
        { status: 403, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    await deleteWebhookForInstitution(institutionId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized to delete the webhook" },
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
