import { flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { UpsertSignatureRequest, markAsReady } from "../../signature-request";

export const makeMarkRequestAsReady = (
  upsertSignatureRequest: UpsertSignatureRequest
) => flow(markAsReady, TE.fromEither, TE.chain(upsertSignatureRequest));
