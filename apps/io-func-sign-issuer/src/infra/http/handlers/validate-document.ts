import * as H from "@pagopa/handler-kit";

import { pipe } from "fp-ts/lib/function";

import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as RT from "fp-ts/lib/ReaderTask";

import { logErrorAndReturnResponse } from "@io-sign/io-sign/infra/http/utils";
import { requireIssuer } from "../decoders/issuer";

import { requireFilesForValidation } from "../decoders/document-validation";

import { validateDocument } from "../../../app/use-cases/validate-upload";

import { validationToApiModel } from "../encoders/document-validation";

const requireFileFromValidationRTE = RTE.fromTaskEitherK(
  requireFilesForValidation
);

export const validateDocumentHandler = H.of((req: H.HttpRequest) =>
  pipe(
    RTE.right(req),
    RTE.chainFirstW(requireIssuer),
    RTE.chainW(requireFileFromValidationRTE),
    RTE.chainReaderTaskKW(({ documentToValidate, signatureFields }) =>
      pipe(
        validateDocument(documentToValidate, signatureFields),
        RTE.fold(
          // the error message contains the list of violations
          (e) => RT.of(e.message.split("\n")),
          // the validation went good so there are no violations (empty array)
          () => RT.of([])
        ),
        RT.map(validationToApiModel)
      )
    ),
    RTE.map(H.successJson),
    RTE.orElseW(logErrorAndReturnResponse)
  )
);
