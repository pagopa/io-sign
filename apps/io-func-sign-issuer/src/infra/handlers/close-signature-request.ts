import * as H from "@pagopa/handler-kit";

import { closeSignatureRequest } from "../../app/use-cases/close-signature-request";

export const CloseSignatureRequestHandler = H.of(closeSignatureRequest);
