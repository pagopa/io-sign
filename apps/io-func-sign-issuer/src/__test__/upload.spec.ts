import { it, describe, expect } from "vitest";

import { id as newId } from "@internal/io-sign/id";

import { newDossier } from "../dossier";
import { newIssuer } from "../issuer";
import { newSignatureRequest, getDocument } from "../signature-request";
import { newUploadMetadata } from "../upload";

import * as E from "fp-ts/lib/Either";
import { flow, pipe } from "fp-ts/lib/function";

import { head } from "fp-ts/lib/Array";

import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { newSigner } from "@internal/io-sign/signer";
import { validate } from "@pagopa/handler-kit/lib/validation";
import { sequenceS } from "fp-ts/lib/Apply";

describe("UploadMetadata", () => {
  describe("newUploadMetadata", () => {
    const requestE = pipe(
      validate(
        NonEmptyString,
        "invalid uniqueName supplied"
      )("my-clause-unique-name"),
      E.map((uniqueName) =>
        newDossier(newIssuer("my-sub-id"), [
          {
            title: "document #1",
            signatureFields: [
              {
                clause: {
                  title: "my clause",
                  type: "UNFAIR",
                },
                attributes: {
                  uniqueName,
                },
              },
            ],
          },
        ])
      ),
      E.map((dossier) => newSignatureRequest(dossier, newSigner()))
    );

    it("should create an UploadMetadata record only if the specified document exists", () => {
      const firstDocumentId = pipe(
        requestE,
        E.map((request) => request.documents),
        E.map(head),
        E.chainW(
          E.fromOption(
            () =>
              new Error(
                "invariant error: requests should have at least one document"
              )
          )
        ),
        E.map((document) => document.id)
      );

      const metaForFirstDocument = pipe(
        sequenceS(E.Apply)({
          documentId: firstDocumentId,
          request: requestE,
        }),
        E.chain(({ documentId, request }) =>
          pipe(request, newUploadMetadata(documentId))
        )
      );

      expect(E.isRight(metaForFirstDocument)).toBe(true);

      if (E.isRight(metaForFirstDocument)) {
        const documentExists = pipe(
          requestE,
          E.map(getDocument(metaForFirstDocument.right.documentId)),
          E.chain(
            E.fromOption(
              () =>
                new Error(
                  "invariant error: metadata should be created only for existing document"
                )
            )
          ),
          E.map((document) => document.id)
        );
        expect(E.isRight(documentExists)).toBe(true);
      }

      const metaForNonExistingDocument = pipe(
        requestE,
        E.chain(flow(newUploadMetadata(newId())))
      );

      expect(E.isLeft(metaForNonExistingDocument)).toBe(true);
    });
  });
});
