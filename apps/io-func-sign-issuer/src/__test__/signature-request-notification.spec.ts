import { describe, it, expect } from "@jest/globals";

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import {
  GetFiscalCodeBySignerId,
  newSigner,
  Signer,
} from "@io-sign/io-sign/signer";
import { newId } from "@io-sign/io-sign/id";
import { Issuer } from "@io-sign/io-sign/issuer";
import { Notification } from "@io-sign/io-sign/notification";
import {
  EmailString,
  FiscalCode,
  NonEmptyString,
} from "@pagopa/ts-commons/lib/strings";
import {
  NotificationMessage,
  SubmitNotificationForUser,
} from "@io-sign/io-sign/notification";
import { validate } from "@io-sign/io-sign/validation";
import { DocumentMetadata } from "@io-sign/io-sign/document";
import { Dossier, GetDossier, newDossier } from "../dossier";
import { newSignatureRequest, SignatureRequest } from "../signature-request";
import {
  MakeMessageContent,
  makeSendSignatureRequestNotification,
} from "../signature-request-notification";

const issuer: Issuer = {
  id: newId(),
  subscriptionId: newId(),
  email: "info@enpacl-pec.it" as EmailString,
  description: "descrizione dell'ente" as NonEmptyString,
  environment: "TEST",
};

const dossier = newDossier(issuer, "My dossier", [
  {
    title: "document #1",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] },
  },
  {
    title: "document #2",
    signatureFields: [] as unknown as DocumentMetadata["signatureFields"],
    pdfDocumentMetadata: { pages: [], formFields: [] },
  },
]);

const mockSubmitNotification: SubmitNotificationForUser =
  (_fiscalCode: FiscalCode) => (_message: NotificationMessage) =>
    pipe(
      { ioMessageId: "0000" },
      validate(Notification, "Invalid notification message"),
      TE.fromEither
    );

const mockGetFiscalCodeBySignerId: GetFiscalCodeBySignerId = (
  _id: Signer["id"]
) =>
  TE.right(
    pipe(
      "AAABBB00A00B000A",
      validate(FiscalCode, "Fiscal code is not valid"),
      O.fromEither
    )
  );

const mockGetDossier: GetDossier =
  (_dossierId: Dossier["id"]) => (_issuerId: Issuer["id"]) =>
    TE.right(
      pipe(dossier, validate(Dossier, "Dossier is not valid"), O.fromEither)
    );

const mockMakeMessageContent: MakeMessageContent =
  (_dossier: Dossier) => (_signatureRequest: SignatureRequest) => ({
    subject: `Richiesta di Firma`,
    markdown: `Message content`,
  });

describe("SignatureRequestNotification", () => {
  describe("newSignatureRequestNotification", () => {
    it("should create and send signature request notification", () => {
      const request = newSignatureRequest(dossier, newSigner(), issuer);

      const makeSendSignatureRequest = makeSendSignatureRequestNotification(
        mockSubmitNotification,
        mockGetFiscalCodeBySignerId,
        mockGetDossier,
        mockMakeMessageContent
      );

      const makeRequest = makeSendSignatureRequest(request)();
      return makeRequest.then((data) => {
        expect(pipe(data, E.isRight)).toBe(true);
        expect(
          pipe(
            data,
            E.fold(
              (error) => error.message,
              (message) => message.ioMessageId
            )
          )
        ).toBe("0000");
      });
    });

    it("should not send a signature request notification with invalid submission", () => {
      const request = newSignatureRequest(dossier, newSigner(), issuer);

      const mockInvalidSubmitNotification: SubmitNotificationForUser =
        (_fiscalCode: FiscalCode) => (_message: NotificationMessage) =>
          pipe(
            {},
            validate(Notification, "Invalid notification message"),
            TE.fromEither
          );

      const makeSendSignatureRequest = makeSendSignatureRequestNotification(
        mockInvalidSubmitNotification,
        mockGetFiscalCodeBySignerId,
        mockGetDossier,
        mockMakeMessageContent
      );

      const makeRequest = makeSendSignatureRequest(request)();
      return makeRequest.then((data) =>
        expect(pipe(data, E.isRight)).toBe(false)
      );
    });

    it("should not send a signature request notification with invalid fiscalCode", () => {
      const request = newSignatureRequest(dossier, newSigner(), issuer);

      const mockGetInvalidFiscalCodeBySignerId: GetFiscalCodeBySignerId = (
        _id: Signer["id"]
      ) =>
        TE.right(
          pipe(
            "AA",
            validate(FiscalCode, "Fiscal code is not valid"),
            O.fromEither
          )
        );

      const makeSendSignatureRequest = makeSendSignatureRequestNotification(
        mockSubmitNotification,
        mockGetInvalidFiscalCodeBySignerId,
        mockGetDossier,
        mockMakeMessageContent
      );

      const makeRequest = makeSendSignatureRequest(request)();
      return makeRequest.then((data) =>
        expect(pipe(data, E.isRight)).toBe(false)
      );
    });
  });
});
