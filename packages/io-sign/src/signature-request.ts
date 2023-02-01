import * as t from "io-ts";

import { IsoDateFromString } from "@pagopa/ts-commons/lib/dates";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";

import { Id } from "./id";
import { Signer } from "./signer";
import { DocumentReady } from "./document";
import { Notification } from "./notification";
import { Issuer, IssuerEnvironment } from "./issuer";

const SignatureRequest = t.type({
  id: Id,
  signerId: Signer.props.id,
  issuerId: Issuer.props.id,
  // TODO: [SFEQS-1028] issuerEmail and IssuerDescription are temp properties, waiting to implement the integration with Selfcare.
  issuerEmail: EmailString,
  issuerDescription: NonEmptyString,
  issuerEnvironment: IssuerEnvironment,
  dossierId: Id,
  createdAt: IsoDateFromString,
  updatedAt: IsoDateFromString,
  expiresAt: IsoDateFromString,
});

export const SignatureRequestId = SignatureRequest.props.id;

export const makeSignatureRequestVariant = <S extends string, A, O>(
  status: S,
  codec: t.Type<A, O>
) =>
  t.intersection([
    SignatureRequest,
    t.type({
      status: t.literal<S>(status),
    }),
    codec,
  ]);

export const SignatureRequestReady = makeSignatureRequestVariant(
  "READY",
  t.type({
    documents: t.array(DocumentReady),
  })
);

export type SignatureRequestReady = t.TypeOf<typeof SignatureRequestReady>;

export const SignatureRequestToBeSigned = makeSignatureRequestVariant(
  "WAIT_FOR_SIGNATURE",
  t.intersection([
    t.type({
      qrCodeUrl: t.string,
      documents: t.array(DocumentReady),
    }),
    t.partial({
      notification: Notification,
    }),
  ])
);

export type SignatureRequestToBeSigned = t.TypeOf<
  typeof SignatureRequestToBeSigned
>;

export const SignatureRequestWaitForQtsp = makeSignatureRequestVariant(
  "WAIT_FOR_QTSP",
  t.intersection([
    t.type({
      qrCodeUrl: t.string,
      documents: t.array(DocumentReady),
    }),
    t.partial({
      notification: Notification,
    }),
  ])
);

export type SignatureRequestWaitForQtsp = t.TypeOf<
  typeof SignatureRequestWaitForQtsp
>;

export const SignatureRequestSigned = makeSignatureRequestVariant(
  "SIGNED",
  t.intersection([
    t.type({
      signedAt: IsoDateFromString,
      documents: t.array(DocumentReady),
    }),
    t.partial({
      notification: Notification,
    }),
  ])
);

export type SignatureRequestSigned = t.TypeOf<typeof SignatureRequestSigned>;

export const SignatureRequestRejected = makeSignatureRequestVariant(
  "REJECTED",
  t.intersection([
    t.type({
      rejectedAt: IsoDateFromString,
      rejectReason: t.string,
      qrCodeUrl: t.string,
      documents: t.array(DocumentReady),
    }),
    t.partial({
      notification: Notification,
    }),
  ])
);

export type SignatureRequestRejected = t.TypeOf<
  typeof SignatureRequestRejected
>;
