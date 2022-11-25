import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

export const FilledDocumentUrl = UrlFromString;
export type FilledDocumentUrl = t.TypeOf<typeof FilledDocumentUrl>;

export const FilledDocument = t.type({
  url: FilledDocumentUrl,
});

export type FilledDocument = t.TypeOf<typeof FilledDocument>;

export type UploadFilledDocument = (
  blobName: string
) => (content: Uint8Array) => TE.TaskEither<Error, string>;
