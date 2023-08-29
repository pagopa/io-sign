import { createServerContext } from "react";

import { Institution } from "@/lib/selfcare/api";

// til: server side contexts sould be valued by JSON objects, so
// the type "undefined" is not allowed here as "defaultValue"
const context = createServerContext<Institution["id"] | null>(
  "institution",
  null
);

export const InstitutionProvider = context.Provider;

export default context;
