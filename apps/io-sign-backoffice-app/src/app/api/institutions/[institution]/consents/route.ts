import { ZodError, z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import {
  UnauthenticatedUserError,
  getLoggedUser,
  isAllowedInstitution,
} from "@/lib/auth/use-cases";
import { insertTOSAcceptance } from "@/lib/consents/cosmos";
import { ValidationProblem } from "@/lib/api/responses";

const pathSchema = z.object({
  institution: z.string().uuid(),
});

type Params = z.infer<typeof pathSchema>;

export async function POST(
  _request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const loggedUser = await getLoggedUser();
    pathSchema.parse(params);
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
    await insertTOSAcceptance(loggedUser.id, params.institution);
    return new Response(null, { status: 204 });
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized to update the consent" },
        { status: 401, headers: { "Content-Type": "application/problem+json" } }
      );
    } else if (e instanceof ZodError) {
      return NextResponse.json(ValidationProblem(e), {
        status: 422,
        headers: { "Content-Type": "application/problem+json" },
      });
    }
    return NextResponse.json(
      {
        title: "Internal Server Error",
        detail: e instanceof Error ? e.message : "Something went wrong.",
      },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }
}
