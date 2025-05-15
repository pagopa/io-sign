import { DocumentValidationResult } from "../models/DocumentValidationResult";

export const validationToApiModel = (
  violations: Array<string>
): DocumentValidationResult =>
  violations.length > 0 ? { is_valid: false, violations } : { is_valid: true };
