import * as RTE from "fp-ts/ReaderTaskEither";
import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { pipe } from "fp-ts/lib/function";
import { split } from "fp-ts/lib/string";

import { DocumentReady } from "../../../document";
import { downloadContentFromBlob, getBlobClient } from "./blob";

export const getDocumentContent = (document: DocumentReady) =>
  pipe(
    document.url,
    split("/"),
    last,
    getBlobClient,
    RTE.chainTaskEitherK(downloadContentFromBlob)
  );
