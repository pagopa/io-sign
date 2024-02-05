import * as TE from "fp-ts/lib/TaskEither";

import { DocumentReady } from "./document";

export type GetDocumentUrl = (
  document: DocumentReady,
) => TE.TaskEither<Error, string>;
