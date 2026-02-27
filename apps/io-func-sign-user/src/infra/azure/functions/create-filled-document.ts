import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";
import { CreateFilledDocumentHandler } from "../../http/handlers/create-filled-document";

import * as TE from "fp-ts/lib/TaskEither";

export type GetFilledDocumentUrl = (
  filledDocumentBlobName: string
) => TE.TaskEither<Error, string>;

export const CreateFilledDocumentFunction = httpAzureFunction(
  CreateFilledDocumentHandler
);
