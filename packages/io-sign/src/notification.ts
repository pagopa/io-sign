import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import { FiscalCode } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";

export const NotificationId = Id;

export const Notification = t.type({
  ioMessageId: NotificationId,
});
export type Notification = t.TypeOf<typeof Notification>;

export const NotificationContent = t.type({
  subject: t.string,
  markdown: t.string,
});

export type NotificationContent = t.TypeOf<typeof NotificationContent>;

export const NotificationContentWithAttachments = t.intersection([
  NotificationContent,
  t.type({
    signatureRequestId: Id,
  }),
]);

export type NotificationContentWithAttachments = t.TypeOf<
  typeof NotificationContentWithAttachments
>;

export type NotificationMessage =
  | NotificationContent
  | NotificationContentWithAttachments;

/** @deprecated use "submitNotification" instead */
export type SubmitNotificationForUser = (
  fiscalCode: FiscalCode
) => (message: NotificationMessage) => TE.TaskEither<Error, Notification>;

export type NotificationService = {
  submit: (
    fiscalCode: FiscalCode,
    message: NotificationMessage
  ) => TE.TaskEither<Error, Notification>;
};

export const submitNotification =
  (fiscalCode: FiscalCode, message: NotificationMessage) =>
  (r: { notificationService: NotificationService }) =>
    r.notificationService.submit(fiscalCode, message);
