import { getApiKeyById } from "@/lib/api-keys/cosmos";
import { getInstitution } from "@/lib/institutions/use-cases";
import { getIssuerByInstitution } from "@/lib/issuers/use-cases";
import assert from "assert";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const pathSchema = z.object({
  "api-key": z.string().min(1),
});

type Params = z.infer<typeof pathSchema>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    pathSchema.parse(params);
    const host = request.headers.get("host");
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
    const apiKey = await getApiKeyById(params["api-key"]);
    if (!apiKey) {
      return NextResponse.json(
        {
          title: "Not Found",
          status: 404,
        },
        {
          status: 404,
          headers: {
            "Content-Type": "application/problem+json",
          },
        }
      );
    }
    if (request.nextUrl.searchParams.get("include") === "institution") {
      const institution = await getInstitution(apiKey.institutionId);
      if (!institution) {
        throw new Error("Institution not found");
      }
      const issuer = await getIssuerByInstitution(institution);
      return NextResponse.json(
        {
          ...apiKey,
          institution,
          issuer,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(apiKey, { status: 200 });
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
