import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { pipe, flow } from "fp-ts/lib/function";

import { split } from "fp-ts/lib/string";
import { last } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { UploadMetadata } from "../../../upload";

import { validateUpload } from "../../../app/use-cases/validate-upload";

const extractFileNameFromURI = flow(split("/"), last);

const requireUploadMetadataId = flow(
  extractFileNameFromURI,
  H.parse(UploadMetadata.types[0].props.id, "invalid blob uri")
);

export const ValidateUploadHandler = H.of((blob: { uri: string }) =>
  pipe(
    requireUploadMetadataId(blob.uri),
    RTE.fromEither,
    RTE.chainW(validateUpload)
  )
);
