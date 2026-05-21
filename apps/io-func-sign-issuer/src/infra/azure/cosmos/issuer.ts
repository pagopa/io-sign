import * as t from "io-ts";

import { CosmosResource } from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";

import { Issuer } from "@io-sign/io-sign/issuer";

export const RetrievedIssuer = t.intersection([Issuer, CosmosResource]);
export type RetrievedIssuer = t.TypeOf<typeof RetrievedIssuer>;
