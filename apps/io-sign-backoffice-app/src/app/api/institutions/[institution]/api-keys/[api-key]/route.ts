import { NextRequest, NextResponse } from "next/server";

import { z, ZodError } from "zod";

import { cidrSchema, fiscalCodeSchema } from "@/lib/api-keys";
import {
  getApiKeyWithSecret,
  revokeApiKey,
  upsertApiKeyField,
} from "@/lib/api-keys/use-cases";
import { ValidationProblem } from "@/lib/api/responses";

const pathSchema = z.object({
  institution: z.string().uuid(),
  "api-key": z.string().min(1),
});

type Params = z.infer<typeof pathSchema>;

const bodySchema = z
  .array(
    z.intersection(
      z.object({
        op: z.literal("replace"),
      }),
      z.union([
        z.object({ path: z.literal("/cidrs"), value: z.array(cidrSchema) }),
        z.object({
          path: z.literal("/testers"),
          value: z.array(fiscalCodeSchema),
        }),
        z.object({ path: z.literal("/status"), value: z.literal("revoked") }),
      ])
    )
  )
  .length(1)
  .transform(
    (
      operations
    ): {
      field: "cidrs" | "testers" | "status";
      newValue: string[] | "revoked";
    } => ({
      // here we get the field to update, from the JSON patch operation
      field:
        operations[0].path === "/cidrs"
          ? "cidrs"
          : operations[0].path === "/testers"
          ? "testers"
          : "status",
      newValue: operations[0].value,
    })
  );

export async function PATCH(
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
    const body = await request.json();
    const { field, newValue } = bodySchema.parse(body);
    if (field === "status" && newValue === "revoked") {
      await revokeApiKey(params["api-key"], params.institution);
    } else {
      await upsertApiKeyField(
        params["api-key"],
        params.institution,
        field,
        newValue
      );
    }
    return new Response(null, { status: 204 });
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
        detail: e instanceof Error ? e.message : "Something went wrong.",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/problem+json" },
      }
    );
  }
}

export async function GET(
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
    const apiKeys = await getApiKeyWithSecret(
      params["api-key"],
      params["institution"]
    );
    if (!apiKeys) {
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
    return NextResponse.json(apiKeys, { status: 200 });
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
