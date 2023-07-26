import { destroySessionCookie } from "../_lib/session";

import { redirect } from "next/navigation";

import { getConfig } from "@/config";

export async function GET() {
  const config = getConfig();
  destroySessionCookie();
  redirect(config.selfCare.portal.logoutUrl.href);
}
