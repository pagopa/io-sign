import { CosmosErrors } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

class CosmosDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmosDatabaseError";
  }
}

export const toCosmosDatabaseError = (e: CosmosErrors) => {
  switch (e.kind) {
    case "COSMOS_ERROR_RESPONSE":
      return new CosmosDatabaseError(e.error.message);
    case "COSMOS_EMPTY_RESPONSE":
      return new CosmosDatabaseError("Empty response.");
    case "COSMOS_DECODING_ERROR":
      // TODO: show details about validation
      return new CosmosDatabaseError("Decoding error.");
  }
};
