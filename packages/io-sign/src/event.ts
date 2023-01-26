import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import * as t from "io-ts";
import * as TE from "fp-ts/lib/TaskEither";

import { Id, newId } from "./id";
import { Issuer, IssuerEnvironment } from "./issuer";
import {
  SignatureRequestId,
  SignatureRequestSigned,
} from "./signature-request";

export const EventId = Id;

const BaseEvent = t.type({
  id: EventId,
  signatureRequestId: SignatureRequestId,
  issuerId: Issuer.props.id,
  createdAt: IsoDateFromString,
  issuerEnvironment: IssuerEnvironment,
});

type BaseEvent = t.TypeOf<typeof BaseEvent>;

export const BillingEvent = t.intersection([
  BaseEvent,
  t.type({ name: t.literal("io.sign.signature_request.signed") }),
]);

export type BillingEvent = t.TypeOf<typeof BillingEvent>;

export type SendBillingEvent = (
  event: BillingEvent
) => TE.TaskEither<Error, BillingEvent>;

export const createBillingEvent = (
  signatureRequest: SignatureRequestSigned,
  issuer: Issuer
): BillingEvent => ({
  id: newId(),
  name: "io.sign.signature_request.signed",
  signatureRequestId: signatureRequest.id,
  issuerId: issuer.id,
  createdAt: new Date(),
  issuerEnvironment: issuer.environment,
});
