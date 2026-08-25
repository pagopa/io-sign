import {
  defineRoute,
  ProblemJson,
  type RouteContract
} from "@pagopa/hexagonal-core/adapters";
import { InfoResponseSchema } from "../../application/use-cases/info.use-case.js";

export const infoContract: RouteContract<
  object,
  { 200: typeof InfoResponseSchema; 500: typeof ProblemJson; 503: typeof ProblemJson }
> = defineRoute({
  method: "get",
  path: "/info",
  request: {},
  response: {
    200: InfoResponseSchema,
    500: ProblemJson,
    503: ProblemJson
  }
});
