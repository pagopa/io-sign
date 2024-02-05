// This Azure Function checks if a "PDF DOCUMENT" is a valid "DOCUMENT" according
// to the business rules of io-sign.
// To simplify it's use by issues it's implemented as non-RESTFUL endpoint

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { validateDocumentHandler } from "../../http/handlers/validate-document";

export const validateDocumentFunction = httpAzureFunction(
  validateDocumentHandler
);
