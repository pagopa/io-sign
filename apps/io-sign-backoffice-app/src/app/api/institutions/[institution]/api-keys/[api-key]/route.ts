import { NextRequest, NextResponse } from "next/server";

import { z, ZodError } from "zod";

import { cidrSchema, fiscalCodeSchema } from "@/lib/api-keys";
import { upsertApiKeyField } from "@/lib/api-keys/use-cases";

const pathSchema = z.object({
  institution: z.string().uuid(),
  "api-key": z.string().ulid(),
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
      ])
    )
  )
  .length(1)
  .transform(
    (operations): { field: "cidrs" | "testers"; newValue: string[] } => ({
      // here we get the field to update, from the JSON patch operation
      field: operations[0].path === "/cidrs" ? "cidrs" : "testers",
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
    await upsertApiKeyField(
      params["api-key"],
      params.institution,
      field,
      newValue
    );
    throw new Error("...");
    return new Response(null, { status: 204 });
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
          headers: {
            "Content-Type": "application/problem+json",
          },
        }
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
