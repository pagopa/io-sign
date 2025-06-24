import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { split } from "fp-ts/lib/string";

import { pipe } from "fp-ts/lib/function";

import * as RTE from "fp-ts/ReaderTaskEither";
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
