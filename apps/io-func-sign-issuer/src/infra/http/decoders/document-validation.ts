import * as t from "io-ts";

import { pipe } from "fp-ts/lib/function";
import { sequenceS } from "fp-ts/lib/Apply";
import * as E from "fp-ts/lib/Either";
import * as J from "fp-ts/lib/Json";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";

import * as H from "@pagopa/handler-kit";

import { getPdfMetadata } from "@io-sign/io-sign/infra/pdf";
import {
  DocumentMetadata,
  PdfDocumentMetadata,
} from "@io-sign/io-sign/document";

import { SignatureField as SignatureFieldApiModel } from "../models/SignatureField";

import { SignatureFieldFromApiModel } from "./document";

const BufferC = new t.Type<Buffer, Buffer>(
  "Buffer",
  Buffer.isBuffer,
  (i, ctx) => (Buffer.isBuffer(i) ? t.success(i) : t.failure(i, ctx)),
  t.identity
);

const PdfFileC = t.type({
  type: t.string,
  data: BufferC,
});

type PdfFile = t.TypeOf<typeof PdfFileC>;

const JsonFileC = t.type({
  type: t.string,
  data: BufferC,
});

type JsonFile = t.TypeOf<typeof JsonFileC>;

const FilesFromBodyC = t.union([
  t.tuple([PdfFileC, JsonFileC]),
  t.tuple([JsonFileC, PdfFileC]),
  t.tuple([PdfFileC]),
]);

type FilesFromBody = t.TypeOf<typeof FilesFromBodyC>;

const parseSignatureFieldsFromBuffer = (b: Buffer) =>
  pipe(
    b.toString(),
    J.parse,
    E.mapLeft(
      () =>
        new H.HttpBadRequestError(
          "unable to get the signature fields: the given file is not a valid json file"
        )
    ),
    E.chainW(
      H.parse(t.array(SignatureFieldApiModel.pipe(SignatureFieldFromApiModel)))
    )
  );

const requireSignatureFields = (
  files: FilesFromBody
): E.Either<Error, DocumentMetadata["signatureFields"]> =>
  pipe(
    files,
    A.filter((file): file is JsonFile => file.type === "application/json"),
    A.head,
    O.fold(
      () => E.right([]),
      (file) => parseSignatureFieldsFromBuffer(file.data)
    ),
    E.chainW(H.parse(DocumentMetadata.props.signatureFields))
  );

const requirePdfDocumentMetadata = (files: FilesFromBody) =>
  pipe(
    files,
    A.filter((file): file is PdfFile => file.type === "application/pdf"),
    A.head,
    E.fromOption(
      () => new H.HttpBadRequestError("missing the pdf document to validate")
    ),
    E.map((file) => file.data),
    TE.fromEither,
    TE.chain(getPdfMetadata)
  );

export const requireFilesForValidation = (
  req: H.HttpRequest
): TE.TaskEither<
  Error,
  {
    signatureFields: DocumentMetadata["signatureFields"];
    documentToValidate: PdfDocumentMetadata;
  }
> =>
  pipe(
    H.parseMultipart(req),
    E.chainW(H.parse(FilesFromBodyC)),
    E.mapLeft(
      () =>
        new H.HttpBadRequestError(
          "missing files: the pdf document to be validated and a json document containing the signature fields"
        )
    ),
    TE.fromEither,
    TE.chainW((files) =>
      sequenceS(TE.ApplyPar)({
        signatureFields: pipe(requireSignatureFields(files), TE.fromEither),
        documentToValidate: requirePdfDocumentMetadata(files),
      })
    )
  );
