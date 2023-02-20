import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";

export const NotificationId = Id;

export const Notification = t.type({
  ioMessageId: NotificationId,
});
export type Notification = t.TypeOf<typeof Notification>;

const NotificationContent = t.intersection([
  t.type({
    subject: t.string,
    markdown: t.string,
  }),
  t.partial({
    third_party_data: t.type({
      id: NonEmptyString,
      has_attachments: t.boolean,
    }),
  }),
]);

export const NotificationMessage = t.type({
  content: NotificationContent,
});

export type NotificationMessage = t.TypeOf<typeof NotificationMessage>;

export type SubmitNotificationForUser = (
  fiscalCode: FiscalCode
) => (message: NotificationMessage) => TE.TaskEither<Error, Notification>;
