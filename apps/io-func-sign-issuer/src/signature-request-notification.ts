import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import {
  getFiscalCodeBySignerId,
  SignerRepository
} from "@io-sign/io-sign/signer";

import {
  Notification,
  NotificationMessage,
  NotificationService,
  submitNotification
} from "@io-sign/io-sign/notification";

import { SignatureRequest } from "./signature-request";

// Sends a notification by constructing the message with buildNotificationMessage
export const sendSignatureRequestNotification =
  (
    buildNotificationMessage: (request: SignatureRequest) => NotificationMessage
  ) =>
  (
    request: SignatureRequest
  ): RTE.ReaderTaskEither<
    {
      signerRepository: SignerRepository;
      notificationService: NotificationService;
    },
    Error,
    Notification
  > =>
    pipe(
      getFiscalCodeBySignerId(request.signerId),
      RTE.chainW((fiscalCode) =>
        submitNotification(fiscalCode, buildNotificationMessage(request))
      )
    );
