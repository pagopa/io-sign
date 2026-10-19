import * as H from "@pagopa/handler-kit";
import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { requireSignatureRequestId } from "../decoders/signature-request";
import { ActionNotAllowedError } from "@io-sign/io-sign/error";
import {
  getSignatureRequestById,
  SignatureRequest
} from "../../../signature-request";
import { saveMessageId, sendNotification } from "../../../outcome-notification";
import { NotificationToApiModel } from "../encoders/notification";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

const checkIfAlreadySent = (request: SignatureRequest) =>
  pipe(
    request,
    RTE.fromPredicate(
      (r) =>
        !("outcomeNotification" in r) || r.outcomeNotification === undefined,
      () => new ActionNotAllowedError("Outcome notification already sent")
    )
  );

const checkIfSignedOrRejected = (request: SignatureRequest) =>
  pipe(
    request,
    RTE.fromPredicate(
      (r) => r.status === "SIGNED" || r.status === "REJECTED",
      () =>
        new ActionNotAllowedError(
          "Outcome notification can only be sent for SIGNED or REJECTED signature request"
        )
    )
  );

export const SendOutcomeNotificationHandler = H.of((req: H.HttpRequest) =>
  pipe(
    requireSignatureRequestId(req),
    RTE.chainW(getSignatureRequestById),
    RTE.chainFirstW(checkIfSignedOrRejected),
    RTE.chainFirstW(checkIfAlreadySent),
    RTE.chainW(sendNotification),
    RTE.chainFirstW(saveMessageId),
    RTE.map(({ outcomeNotification }) =>
      H.successJson(NotificationToApiModel.encode(outcomeNotification))
    ),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
