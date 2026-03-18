import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import { TooManyRequestsError } from "../../../error";

class CosmosDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmosDatabaseError";
  }
}

export const toCosmosDatabaseError = (e: CosmosErrors) => {
  switch (e.kind) {
<<<<<<< chores/upgrade-linter-azure-functions
=======
    case "COSMOS_ERROR_RESPONSE":
      // eslint-disable-next-line no-console
      console.error(
        `Cosmos DB error [code=${e.error.code}]: ${e.error.message}`
      );
      if (e.error.code === 429) {
        return new TooManyRequestsError("Too many requests.");
      }
      return new CosmosDatabaseError("A database error has occurred.");
>>>>>>> main
    case "COSMOS_CONFLICT_RESPONSE":
      return new CosmosDatabaseError("Conflict.");
    case "COSMOS_DECODING_ERROR":
      // TODO: show details about validation
      return new CosmosDatabaseError("Decoding error.");
<<<<<<< chores/upgrade-linter-azure-functions
    case "COSMOS_EMPTY_RESPONSE":
      return new CosmosDatabaseError("Empty response.");
    case "COSMOS_ERROR_RESPONSE":
      return new CosmosDatabaseError(e.error.message);
=======
    default:
      // eslint-disable-next-line no-console
      console.error("Cosmos DB unexpected error", JSON.stringify(e));
      return new CosmosDatabaseError("Generic error.");
>>>>>>> main
  }
};
