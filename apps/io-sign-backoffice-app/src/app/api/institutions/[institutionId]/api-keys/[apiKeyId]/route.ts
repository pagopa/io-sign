import { NextRequest, NextResponse } from "next/server";

import { ZodError } from "zod";
import { PatchBody, parseValue, patchApiKey } from "../../../_lib/api-key";

const parseBody = (body: unknown): PatchBody => {
  const parsedBody = PatchBody.parse(body);
  if ("value" in parsedBody) {
    parseValue(parsedBody.path, parsedBody.value);
  }
  return parsedBody;
};

export async function POST(
  request: NextRequest,
  {
    params: { institutionId, apiKeyId },
  }: { params: { institutionId: string; apiKeyId: string } }
) {
  try {
    const body = await request.json();
    const parsedBody = parseBody(body);
    await patchApiKey(institutionId, apiKeyId, parsedBody);
    return NextResponse.json({}, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          type: "/problem/validation-error",
          title: "Validation Error",
          detail: "Your request didn't validate",
          violations: e.issues,
        },
        {
          status: 422,
          headers: { "Content-Type": "application/problem+json" },
        }
      );
    }
    if (e instanceof Error) {
      return NextResponse.json(
        { title: "Internal Server Error", detail: e.message },
        { status: 500, headers: { "Content-Type": "application/problem+json" } }
      );
    }
    return NextResponse.json(
      { title: "Internal Server Error", detail: "Something went wrong" },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }
}
