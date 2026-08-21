import {
  type ErrorResponderConfig,
  mountAzureFunctionsRoute
} from "@io-sign/hexagonal-azure-functions";
import { infoContract } from "../contracts/info.js";
import type { InfoUseCase } from "../../application/use-cases/info.use-case.js";

export const mountInfoAdapter = (
  useCase: InfoUseCase,
  config?: ErrorResponderConfig
): void => {
  mountAzureFunctionsRoute(
    {
      contract: infoContract,
      inputMapper: () => ({ query: "" }),
      outputMapper: (output) => output,
      useCase
    },
    config
  );
};
