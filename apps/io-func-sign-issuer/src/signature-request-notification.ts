import { constFalse, constTrue, pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

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

export const makeSendRequestToSignNotification =
  (
    signerRepository: SignerRepository,
    notificationService: NotificationService,
    buildNotificationMessage: (req: SignatureRequest) => NotificationMessage
  ) =>
  (req: SignatureRequest): TE.TaskEither<Error, Notification> =>
    pipe(
      signerRepository.getFiscalCodeBySignerId(req.signerId),
      TE.chain((fiscalCode) =>
        notificationService.submit(fiscalCode, buildNotificationMessage(req))
      )
    );

// Sends a notification by constructing the message with buildNotificationMessage
export const sendSignatureRequestNotification =
  (
    buildNotificationMessage: (request: SignatureRequest) => NotificationMessage
  ) =>
  (request: SignatureRequest) =>
    pipe(
      getFiscalCodeBySignerId(request.signerId),
      RTE.chainW((fiscalCode) =>
        submitNotification(fiscalCode, buildNotificationMessage(request))
      ),
      RTE.bimap(constFalse, constTrue),
      RTE.toUnion
    );
