import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { authenticate } from "@/lib/auth/user";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { institutionId } = await authenticate(params.id);
  redirect(`/${institutionId}`);
}
