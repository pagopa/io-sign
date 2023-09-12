import { NextRequest, NextResponse } from "next/server";

import { ZodError, z } from "zod";

import { insertTOSAcceptance } from "@/lib/consents/use-cases";
import { ValidationProblem } from "@/lib/api/responses";

export const schema = z.object({
  institutionId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { institutionId, userId } = z
      .object({
        institutionId: z.string().uuid(),
        userId: z.string().uuid(),
      })
      .parse(body);
    await insertTOSAcceptance(userId, institutionId);
    return new Response(null, {
      status: 204,
    });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(ValidationProblem(e), {
        status: 422,
        headers: {
          "Content-Type": "application/problem+json",
        },
      });
    }
    return NextResponse.json(
      {
        title: "Internal Server Error",
        status: 500,
        details: e instanceof Error ? e.message : "Something went wrong",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/problem+json",
        },
      }
    );
  }
}
