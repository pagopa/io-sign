import { describe, it, expect } from "vitest";

import { identity, pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import {
  DocumentMetadata,
  newDocument,
  startValidation,
  markAsReady,
  markAsRejected,
} from "../document";

const metadata: DocumentMetadata = {
  title: "my test document",
  signatureFields: [],
};

describe("Document", () => {
  describe("newDocument", () => {
    it('should create a new document with "WAIT_FOR_UPLOAD" status', () => {
      const document = newDocument(metadata);
      expect(document.status).toBe("WAIT_FOR_UPLOAD");
    });
  });
  describe("startValidation", () => {
    it('should not start validation on document when is already in "WAIT_FOR_VALIDATION" status', () => {
      const document = newDocument(metadata);
      const maybeWaitForValidationDocument = startValidation(document);
      expect(
        pipe(
          maybeWaitForValidationDocument,
          E.map((doc) => doc.status),
          E.getOrElse((e) => e.message)
        )
      ).toBe("WAIT_FOR_VALIDATION");
      expect(
        pipe(
          maybeWaitForValidationDocument,
          E.chain(startValidation),
          E.getOrElseW(identity)
        )
      ).toBeInstanceOf(Error);
    });
  });
  describe("markAsReady", () => {
    it('should not mark as "READY" a document in "WAIT_FOR_UPLOAD" or "REJECTED" status', () => {
      const document = newDocument(metadata);
      expect(
        pipe(
          document,
          markAsReady("https://my.document.url"),
          E.getOrElseW(identity)
        )
      ).toBeInstanceOf(Error);
      const rejectedDocument = pipe(
        document,
        startValidation,
        E.chain(
          markAsRejected(
            "the document must be rejected for the purpose of this unit test"
          )
        )
      );
      expect(
        pipe(
          rejectedDocument,
          E.chain(markAsReady("https://my.document.url")),
          E.getOrElseW(identity)
        )
      ).toBeInstanceOf(Error);
    });
  });
});
