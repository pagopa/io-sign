import { NextRequest, NextResponse } from "next/server";

import { ZodError } from "zod";
import { ValidationProblem } from "@/lib/api/responses";

import {
  createIssuer,
  createIssuerPayloadSchema,
} from "@/lib/issuers/use-cases";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = createIssuerPayloadSchema.parse(body);
    const issuer = await createIssuer(payload);
    return NextResponse.json(issuer, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
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
