import { ZodError } from "zod";

export const ValidationProblem = (e: ZodError, details?: string) => ({
  type: "/problems/validation",
  title: "Validation Error",
  details,
  violations: e.issues,
  status: 422,
});
