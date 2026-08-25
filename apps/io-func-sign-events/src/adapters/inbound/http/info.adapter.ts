import {
  type ErrorResponderConfig,
  mountAzureFunctionsRoute
} from "@io-sign/hexagonal-azure-functions";
import { infoContract } from "../../contracts/info.js";
import type { Logger } from "@pagopa/hexagonal-core/domain/ports";
import type { InfoUseCase } from "../../../application/use-cases/info.use-case.js";

export const mountInfoAdapterHttp = (
  useCaseFactory: (logger: Logger) => InfoUseCase,
  config?: ErrorResponderConfig
): void => {
  mountAzureFunctionsRoute(
    {
      contract: infoContract,
      inputMapper: () => ({ query: "" }),
      outputMapper: (output) => output,
      useCaseFactory
    },
    config
  );
};
