import { createIOApiClient } from "@internal/io-services/client";
import { getConfigOrThrow } from "../../app/config";

const config = getConfigOrThrow();

export const ioApiClient = createIOApiClient(
  config.pagopa.ioServices.basePath,
  config.pagopa.ioServices.subscriptionKey
);
