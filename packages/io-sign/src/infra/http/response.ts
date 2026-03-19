import * as H from "@pagopa/handler-kit";
import { pipe } from "fp-ts/lib/function";

export const bufferResponse = (contentType: string) => (buffer: Buffer) =>
  pipe(
    H.success(buffer as unknown as string),
    H.withHeader("Content-Type", contentType),
    H.withHeader("Content-Length", buffer.length.toString())
  );
