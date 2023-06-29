// This Azure Function checks if a "PDF DOCUMENT" is a valid "DOCUMENT" according
// to the business rules of io-sign.
// Unlike "ValidateDocument", this function is called, in an async job, for each upload to
// Azure Blob Storage

import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { ValidateUploadHandler } from "../../handlers/validate-upload";

export const ValidateUploadFunction = azureFunction(ValidateUploadHandler);
