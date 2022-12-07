import { it, describe, expect } from "@jest/globals";

import { id as newId } from "@io-sign/io-sign/id";

import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/function";

import { head } from "fp-ts/lib/Array";

import { newSigner } from "@io-sign/io-sign/signer";

import { newUploadMetadata } from "../upload";
import { newSignatureRequest } from "../signature-request";
import { newDossier } from "../dossier";
import { Issuer } from "../issuer";

describe("UploadMetadata", () => {
  describe("newUploadMetadata", () => {
    const issuer: Issuer = {
      id: newId(),
      subscriptionId: newId(),
      externalId: "ext_id",
      version: "10",
      email: "info@enpacl-pec.it",
      address: "Viale Del Caravaggio, 78 - 00147 Roma (RM)",
      description: "descrizione dell'ente",
      taxCode: "80119170589",
      vatNumber: "80119170589",
    };

    const dossier = newDossier(issuer, "My dossier", [
      {
        title: "document #1",
        signatureFields: [],
      },
      {
        title: "document #2",
        signatureFields: [],
      },
    ]);

    const request = newSignatureRequest(dossier, newSigner());

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
