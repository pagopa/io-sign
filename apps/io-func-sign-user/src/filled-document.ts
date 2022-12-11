import { UrlFromString } from "@pagopa/ts-commons/lib/url";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Signer } from "@io-sign/io-sign/signer";

export const FilledDocumentUrl = UrlFromString;
export type FilledDocumentUrl = t.TypeOf<typeof FilledDocumentUrl>;

export const FilledDocument = t.type({
  url: FilledDocumentUrl,
});

export type FilledDocument = t.TypeOf<typeof FilledDocument>;

export const CreateFilledDocumentPayload = t.type({
  signer: Signer,
  documentUrl: NonEmptyString,
  email: EmailString,
  familyName: NonEmptyString,
  name: NonEmptyString,
});

export type CreateFilledDocumentPayload = t.TypeOf<
  typeof CreateFilledDocumentPayload
>;

export const FillDocumentPayload = t.intersection([
  CreateFilledDocumentPayload,
  t.type({
    filledDocumentFileName: NonEmptyString,
  }),
]);

export type FillDocumentPayload = t.TypeOf<typeof FillDocumentPayload>;

export type NotifyDocumentToFillEvent = (
  documentToFillNotification: FillDocumentPayload
) => TE.TaskEither<Error, string>;
