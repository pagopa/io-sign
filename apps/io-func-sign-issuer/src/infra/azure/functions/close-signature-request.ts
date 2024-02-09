// This Azure Function, triggered by a queue, closes a Signature Request, marking
// it as SIGNED or REJECTED. It also notifies the citizen and send analytics, billing
// and telemetry events.

import { azureFunction } from "@pagopa/handler-kit-azure-func";

import { CloseSignatureRequestHandler } from "../../handlers/close-signature-request";

export const CloseSignatureRequestFunction = azureFunction(
  CloseSignatureRequestHandler
);
