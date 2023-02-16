import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/Array";

import { differenceInDays } from "date-fns";

import { GetDocumentContent } from "@io-sign/io-sign/document-content";
import { Document } from "@io-sign/io-sign/document";
import { EntityNotFoundError } from "@io-sign/io-sign/error";
import { SignatureRequestSigned } from "@io-sign/io-sign/signature-request";
import { validate } from "@io-sign/io-sign/validation";

import { SignatureRequest } from "../../signature-request";

export const signedNoMoreThan90DaysAgo = (
  signatureRequest: SignatureRequest
): E.Either<Error, SignatureRequestSigned> =>
  pipe(
    signatureRequest,
    validate(
      SignatureRequestSigned,
      "The signature request must be in SIGNED status."
    ),
    E.chain((signatureRequest) =>
      pipe(
        differenceInDays(new Date(), signatureRequest.signedAt),
        (difference) =>
          difference < 90
            ? E.right(signatureRequest)
            : E.left(
                new EntityNotFoundError(
                  "More than 90 days have passed since signing."
                )
              )
      )
    )
  );

export const makeGetSignedDocumentContent =
  (getDocumentContent: GetDocumentContent) =>
  (signatureRequest: SignatureRequest, documentId: Document["id"]) =>
    pipe(
      signatureRequest,
      signedNoMoreThan90DaysAgo,
      TE.fromEither,
      TE.chain((signatureRequest) =>
        pipe(
          signatureRequest.documents,
          A.filter((document) => document.id === documentId),
          A.head,
          TE.fromOption(
            () =>
              new EntityNotFoundError(
                "The specified documentID does not exists."
              )
          ),
          TE.chain(getDocumentContent)
        )
      )
    );
