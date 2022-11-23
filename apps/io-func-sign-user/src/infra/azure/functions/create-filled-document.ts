import { createHandler } from "@pagopa/handler-kit";
import * as azure from "@pagopa/handler-kit/lib/azure";

import { created, error } from "@internal/io-sign/infra/http/response";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import { pipe, flow } from "fp-ts/lib/function";
import { HttpRequest } from "@pagopa/handler-kit/lib/http";

import { sequenceS } from "fp-ts/lib/Apply";
import { validate } from "@internal/io-sign/validation";
import { CreateFilledDocumentPayload } from "../../../app/use-cases/create-filled-document";
import { makeRequireSigner } from "../../http/decoder/signer";
import { CreateFilledDocumentBody } from "../../http/models/CreateFilledDocumentBody";
import { FilledDocumentToApiModel } from "../../http/encoder/filled-document";
import { FilledDocumentDetailView } from "../../http/models/FilledDocumentDetailView";
import { FilledDocumentUrl } from "../../../filled-document";

const makeInfoHandler = () => {
  const requireCreateFilledDocumentBody = flow(
    (req: HttpRequest) => req.body,
    validate(CreateFilledDocumentBody),
    E.map((body) => ({
      documentUrl: body.document_url,
      email: body.email,
      familyName: body.family_name,
      name: body.name,
    }))
  );

  const requireCreateFilledDocumentPayload: RTE.ReaderTaskEither<
    HttpRequest,
    Error,
    CreateFilledDocumentPayload
  > = sequenceS(RTE.ApplyPar)({
    signer: RTE.fromReaderEither(makeRequireSigner),
    body: RTE.fromReaderEither(requireCreateFilledDocumentBody),
  });

  const decodeHttpRequest = flow(
    azure.fromHttpRequest,
    TE.fromEither,
    TE.chain(requireCreateFilledDocumentPayload)
  );

  const encodeHttpSuccessResponse = flow(
    FilledDocumentToApiModel.encode,
    created(FilledDocumentDetailView)
  );

  return createHandler(
    decodeHttpRequest,
    ({ signer }) =>
      pipe(
        "http://mockfilleddocument/" + signer.id,
        validate(FilledDocumentUrl, "Invalid filled document url"),
        E.map((url) => ({
          url,
        })),
        TE.fromEither
      ),
    error,
    encodeHttpSuccessResponse
  );
};
export const run = pipe(makeInfoHandler(), azure.unsafeRun);
