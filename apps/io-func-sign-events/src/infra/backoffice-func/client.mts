import fetch from "node-fetch";
import { ServiceUnavailableError } from "@pagopa/hexagonal-core/domain/errors";
import { err, ok } from "neverthrow";
import type { BackofficeFunc } from "../../application/ports/backoffice-func.js";
import type { BackofficeFuncConfig } from "./config.js";

export const makeBackofficeFunc = (
  config: BackofficeFuncConfig
): BackofficeFunc => ({
  checkHealth: async () => {
    try {
      const baseUrl = config.baseUrl.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/info`, {
        headers: { "x-functions-key": config.apiKey },
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) {
        return err(
          new ServiceUnavailableError(
            `backoffice-func returned ${response.status}`
          )
        );
      }
      return ok(undefined);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      return err(
        new ServiceUnavailableError(`backoffice-func unreachable: ${detail}`)
      );
    }
  }
});
