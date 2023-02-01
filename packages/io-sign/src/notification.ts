import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";
import { Id } from "./id";

export const NotificationId = Id;

export const Notification = t.type({
  ioMessageId: NotificationId,
});
export type Notification = t.TypeOf<typeof Notification>;

export const NotificationMessage = t.type({
  content: t.type({
    subject: t.string,
    markdown: t.string,
  }),
});
export type NotificationMessage = t.TypeOf<typeof NotificationMessage>;

export type SubmitNotificationForUser = (
  fiscalCode: FiscalCode
) => (message: NotificationMessage) => TE.TaskEither<Error, Notification>;
