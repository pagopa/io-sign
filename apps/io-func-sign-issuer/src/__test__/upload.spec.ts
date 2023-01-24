import { it, describe, expect } from "@jest/globals";

import { id as newId } from "@io-sign/io-sign/id";

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/function";

import { head } from "fp-ts/lib/Array";

import { newSigner } from "@io-sign/io-sign/signer";

import { Issuer } from "@io-sign/io-sign/issuer";
import { EmailString, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { newUploadMetadata } from "../upload";
import { newSignatureRequest } from "../signature-request";
import { newDossier } from "../dossier";

describe("UploadMetadata", () => {
  describe("newUploadMetadata", () => {
    const issuer: Issuer = {
      id: newId(),
      subscriptionId: newId(),
      email: "info@enpacl-pec.it" as EmailString,
      description: "descrizione dell'ente" as NonEmptyString,
      isTesting: true,
    };

    const dossier = newDossier(issuer, "My dossier", [
      {
        title: "document #1",
        signatureFields: [],
        pdfDocumentMetadata: { pages: [], formFields: [] },
      },
      {
        title: "document #2",
        signatureFields: [],
        pdfDocumentMetadata: { pages: [], formFields: [] },
      },
    ]);

    const request = newSignatureRequest(dossier, newSigner(), issuer);

    it("should create an UploadMetadata record only if the specified document exists", () => {
      const metaForFirstDocument = pipe(
        request.documents,
        head,
        O.map((document) => document.id),
        E.fromOption(
          () =>
            new Error(
              "invariant error: request should have at least one document"
            )
        ),
        E.chain((documentId) => pipe(request, newUploadMetadata(documentId)))
      );

      expect(E.isRight(metaForFirstDocument)).toBe(true);

      const metaForNonExistingDocument = pipe(
        request,
        newUploadMetadata(newId())
      );

      expect(E.isLeft(metaForNonExistingDocument)).toBe(true);
    });
  });
});
