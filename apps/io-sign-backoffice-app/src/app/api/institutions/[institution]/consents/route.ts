import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { getLoggedUser } from "@/lib/auth/use-cases";
import { insertTOSAcceptance } from "@/lib/consents/cosmos";

const pathSchema = z.object({
  institution: z.string().uuid(),
});

type Params = z.infer<typeof pathSchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    pathSchema.parse(params);
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
    const loggedUser = await getLoggedUser();
    await insertTOSAcceptance(loggedUser.id, params.institution);
    return new Response(null, { status: 204 });
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
