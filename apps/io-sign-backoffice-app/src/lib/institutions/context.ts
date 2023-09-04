import { createServerContext } from "react";
import { Institution } from "./index";

// til: server side contexts sould be valued by JSON objects, so
// the type "undefined" is not allowed here as "defaultValue"
export default createServerContext<Institution["id"] | null>(
  "institution",
  null
);
