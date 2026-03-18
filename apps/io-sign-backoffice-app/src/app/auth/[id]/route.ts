import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { authenticate } from "@/lib/auth/use-cases";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const { institutionId } = await authenticate(id);
  redirect(`/${institutionId}`);
}
