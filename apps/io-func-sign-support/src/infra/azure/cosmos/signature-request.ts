import * as cosmos from "@azure/cosmos";
import { toCosmosDatabaseError } from "@io-sign/io-sign/infra/azure/cosmos/errors";
import { Issuer } from "@io-sign/io-sign/issuer";
import { SignatureRequestId } from "@io-sign/io-sign/signature-request";
import { Signer } from "@io-sign/io-sign/signer";
import {
  BaseModel,
  CosmosResource,
  CosmosdbModel
} from "@pagopa/io-functions-commons/dist/src/utils/cosmosdb_model";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import * as t from "io-ts";

import {
  SignatureRequest,
  SignatureRequestRepository
} from "../../../signature-request";

const NewSignatureRequest = t.intersection([SignatureRequest, BaseModel]);
type NewSignatureRequest = t.TypeOf<typeof NewSignatureRequest>;

const RetrievedSignatureRequest = t.intersection([
  SignatureRequest,
  CosmosResource
]);

type RetrievedSignatureRequest = t.TypeOf<typeof RetrievedSignatureRequest>;

class SignatureRequestFromIssuerModel extends CosmosdbModel<
  SignatureRequest,
  NewSignatureRequest,
  RetrievedSignatureRequest,
  "issuerId"
> {
  constructor(db: cosmos.Database) {
    super(
      db.container("signature-requests"),
      NewSignatureRequest,
      RetrievedSignatureRequest
    );
  }
}

class SignatureRequestFromSignerModel extends CosmosdbModel<
  SignatureRequest,
  NewSignatureRequest,
  RetrievedSignatureRequest,
  "signerId"
> {
  constructor(db: cosmos.Database) {
    super(
      db.container("signature-requests"),
      NewSignatureRequest,
      RetrievedSignatureRequest
    );
  }
}

export class CosmosDbSignatureRequestRepository
  implements SignatureRequestRepository
{
  #signer: SignatureRequestFromSignerModel;
  #issuer: SignatureRequestFromIssuerModel;

  constructor(users: cosmos.Database, issuers: cosmos.Database) {
    this.#signer = new SignatureRequestFromSignerModel(users);
    this.#issuer = new SignatureRequestFromIssuerModel(issuers);
  }

  getByIssuerId(id: SignatureRequestId, issuerId: Issuer["id"]) {
    return pipe(
      this.#issuer.find([id, issuerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );
  }

  getBySignerId(id: SignatureRequestId, signerId: Signer["id"]) {
    return pipe(
      this.#signer.find([id, signerId]),
      TE.mapLeft(toCosmosDatabaseError)
    );
  }
}
