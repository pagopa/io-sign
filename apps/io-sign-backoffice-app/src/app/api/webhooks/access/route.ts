import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  UnauthenticatedUserError,
  getLoggedUser,
  isAllowedInstitution,
  isInstitutionAllowedForWebhook,
} from "@/lib/auth/use-cases";

const querySchema = z.object({
  institutionId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const loggedUser = await getLoggedUser();
    const { institutionId } = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const allowed =
      isInstitutionAllowedForWebhook(institutionId) &&
      (await isAllowedInstitution(loggedUser.id, institutionId));
    return NextResponse.json({ allowed });
  } catch (e) {
    if (e instanceof UnauthenticatedUserError) {
      return NextResponse.json(
        { title: "Unauthorized", detail: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    return NextResponse.json({ allowed: false });
  }
}
