import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";
import { Id } from "@io-sign/io-sign/id";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const FilledDocumentUrl = UrlFromString;
export type FilledDocumentUrl = t.TypeOf<typeof FilledDocumentUrl>;

export const FilledDocument = t.type({
  url: FilledDocumentUrl,
});

export type FilledDocument = t.TypeOf<typeof FilledDocument>;

export const DocumentToFillNotification = t.type({
  signer: Id,
  email: EmailString,
  familyName: NonEmptyString,
  name: NonEmptyString,
  filledDocumentFileName: t.string,
  documentUrl: NonEmptyString,
});

export type DocumentToFillNotification = t.TypeOf<
  typeof DocumentToFillNotification
>;

export type NotifySignatureReadyEvent = (
  documentToFillNotification: DocumentToFillNotification
) => TE.TaskEither<Error, string>;
