import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { getUsersByInstitutionId } from "@/lib/institutions/use-cases";
import assert from "assert";

const pathSchema = z.object({
  institution: z.string().uuid(),
});

type Params = z.infer<typeof pathSchema>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    pathSchema.parse(params);
    const host = request.headers.get("x-forwarded-host");
    assert(host === "api.io.pagopa.it");
  } catch (e) {
    return NextResponse.json(
      {
        title: "Bad request",
        status: 400,
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/problem+json",
        },
      }
    );
  }
  try {
    const users = await getUsersByInstitutionId(params.institution);
    return NextResponse.json(users);
  } catch (e) {
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
