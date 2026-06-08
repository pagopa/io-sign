import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { Database } from "@azure/cosmos";
import { EventHubProducerClient } from "@azure/event-hubs";

import { SignerRepository } from "@io-sign/io-sign/signer";
import { NotificationService } from "@io-sign/io-sign/notification";
import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { IssuerRepository } from "../../../issuer";
import { makeSendNotification } from "../../../app/use-cases/send-notification";
import { makeGetSignatureRequest } from "../../azure/cosmos/signature-request";
import { makeUpsertSignatureRequest } from "../../azure/cosmos/signature-request";
import { NotificationToApiModel } from "../encoders/notification";
import { requireIssuer } from "../decoders/issuer";
import { requireSignatureRequestId } from "../decoders/signature-request";

type SendNotificationDependencies = {
  db: Database;
  signerRepository: SignerRepository;
  notificationService: NotificationService;
  eventHubAnalyticsClient: EventHubProducerClient;
  issuerRepository: IssuerRepository;
};

export const SendNotificationHandler = H.of((req: H.HttpRequest) =>
  pipe(
    sequenceS(RTE.ApplyPar)({
      signatureRequestId: requireSignatureRequestId(req),
      issuer: requireIssuer(req)
    }),
    RTE.chainW(
      ({ signatureRequestId, issuer }) =>
        ({ db }: SendNotificationDependencies) =>
          pipe(
            makeGetSignatureRequest(db)(signatureRequestId)(issuer.id),
            TE.chain(
              TE.fromOption(
                () =>
                  new EntityNotFoundError(
                    "The specified Signature Request does not exist."
                  )
              )
            )
          )
    ),
    RTE.chainW(
      (signatureRequest) =>
        ({
          db,
          signerRepository,
          notificationService,
          eventHubAnalyticsClient
        }: SendNotificationDependencies) => {
          const sendNotification = makeSendNotification(
            signerRepository,
            notificationService,
            makeUpsertSignatureRequest(db),
            makeCreateAndSendAnalyticsEvent(eventHubAnalyticsClient)
          );
          return sendNotification({ signatureRequest });
        }
    ),
    RTE.map(flow(NotificationToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
