import * as TE from "fp-ts/lib/TaskEither";

import { DocumentReady } from "./document";

export type GetDocumentContent = (
  document: DocumentReady
) => TE.TaskEither<Error, Buffer>;
