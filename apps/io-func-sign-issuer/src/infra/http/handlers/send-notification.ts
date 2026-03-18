import * as H from "@pagopa/handler-kit";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";

import { flow, pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";

import { Database } from "@azure/cosmos";
import { EventHubProducerClient } from "@azure/event-hubs";
import { Ulid } from "@pagopa/ts-commons/lib/strings";

import { PdvTokenizerClientWithApiKey } from "@io-sign/io-sign/infra/pdv-tokenizer/client";
import { makeGetFiscalCodeBySignerId } from "@io-sign/io-sign/infra/pdv-tokenizer/signer";
import { IOApiClient } from "@io-sign/io-sign/infra/io-services/client";
import { makeSubmitMessageForUser } from "@io-sign/io-sign/infra/io-services/message";
import { makeCreateAndSendAnalyticsEvent } from "@io-sign/io-sign/infra/azure/event-hubs/event";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";

import { IssuerRepository } from "../../../issuer";
import { makeSendNotification } from "../../../app/use-cases/send-notification";
import { makeGetSignatureRequest } from "../../azure/cosmos/signature-request";
import { makeUpsertSignatureRequest } from "../../azure/cosmos/signature-request";
import { makeGetDossier } from "../../azure/cosmos/dossier";
import { NotificationToApiModel } from "../encoders/notification";
import { requireIssuer } from "../decoders/issuer";
import { requireSignatureRequestId } from "../decoders/signature-request";

type SendNotificationDependencies = {
  db: Database;
  pdvTokenizerClient: PdvTokenizerClientWithApiKey;
  ioApiClient: IOApiClient;
  configurationId: Ulid;
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
          pdvTokenizerClient,
          ioApiClient,
          configurationId,
          eventHubAnalyticsClient
        }: SendNotificationDependencies) => {
          const sendNotification = makeSendNotification(
            makeSubmitMessageForUser(ioApiClient, configurationId),
            makeGetFiscalCodeBySignerId(pdvTokenizerClient),
            makeUpsertSignatureRequest(db),
            makeGetDossier(db),
            makeCreateAndSendAnalyticsEvent(eventHubAnalyticsClient)
          );
          return sendNotification({ signatureRequest });
        }
    ),
    RTE.map(flow(NotificationToApiModel.encode, H.successJson)),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
