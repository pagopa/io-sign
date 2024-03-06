import { ValidationProblem } from "@/lib/api/responses";
import {
  UnauthenticatedUserError,
  getLoggedUser,
  isAllowedInstitution,
} from "@/lib/auth/use-cases";
import { replaceSupportEmail } from "@/lib/issuers/cosmos";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

const pathSchema = z.object({
  institution: z.string().uuid(),
  issuer: z.string().min(1),
});

type Params = z.infer<typeof pathSchema>;

const bodySchema = z
  .object({
    op: z.literal("replace"),
    path: z.literal("/supportEmail"),
    value: z.string().email(),
  })
  .array()
  .length(1);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const loggedUser = await getLoggedUser();
    const parsedParams = pathSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { title: "Bad request", detail: "Malformed request" },
        { status: 400, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    const isAllowedInstitutionId = await isAllowedInstitution(
      loggedUser.id,
      params.institution
    );
    if (!isAllowedInstitutionId) {
      return NextResponse.json(
        { title: "Forbidden", detail: "The operation is forbidden" },
        { status: 403, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    const body = await request.json();
    const {
      0: { value: newSupportEmail },
    } = bodySchema.parse(body);
    await replaceSupportEmail(
      { id: params.issuer, institutionId: params.institution },
      newSupportEmail
    );
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(ValidationProblem(e), {
        status: 422,
        headers: {
          "Content-Type": "application/problem+json",
        },
      });
    } else if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized to update the issuer" },
        { status: 401, headers: { "Content-Type": "application/problem+json" } }
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
}
