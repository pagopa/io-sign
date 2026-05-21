import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/function";

import { Issuer } from "@io-sign/io-sign/issuer";

import { makeFetchWithTimeout } from "@io-sign/io-sign/infra/http/fetch-timeout";
import {
  defaultHeader,
  isSuccessful,
  responseToJson
} from "@io-sign/io-sign/infra/client-utils";
import {
  ApiKey,
  getIssuerEnvironment,
  IssuerRepository
} from "../../issuer";

class IssuerModel {
  #basePath: string;
  #apiKey: string;

  constructor(basePath: string, apiKey: string) {
    this.#basePath = basePath;
    this.#apiKey = apiKey;
  }

  findBySubscriptionId(
    subscriptionId: Issuer["subscriptionId"]
  ): TE.TaskEither<Error, O.Option<Issuer>> {
    return pipe(
      TE.tryCatch(
        () =>
          makeFetchWithTimeout()(
            `${this.#basePath}/api-keys/${subscriptionId}?include=institution`,
            {
              method: "GET",
              headers: {
                ...defaultHeader,
                "Ocp-Apim-Subscription-Key": this.#apiKey
              }
            }
          ),
        E.toError
      ),
      TE.filterOrElse(
        isSuccessful,
        () => new Error("The attempt to get issuer from back office failed.")
      ),
      TE.chain(responseToJson(ApiKey, "Invalid format for institution")),
      TE.map(
        ({
          id,
          institutionId,
          environment,
          institution: { name, vatNumber },
          issuer: { externalId: issuerId, supportEmail }
        }) =>
          pipe(
            {
              id: issuerId,
              subscriptionId: id,
              email: supportEmail,
              description: name,
              internalInstitutionId: institutionId,
              environment: getIssuerEnvironment(environment, institutionId),
              vatNumber,
              department: "",
              status: "ACTIVE" as const
            },
            O.some
          )
      )
    );
  }
}

export class BackOfficeIssuerRepository implements IssuerRepository {
  #issuerModel: IssuerModel;

  constructor(basePath: string, apiKey: string) {
    this.#issuerModel = new IssuerModel(basePath, apiKey);
  }

  getByVatNumber(_vatNumber: Issuer["vatNumber"]) {
    return TE.left(new Error("non implemented"));
  }

  getBySubscriptionId(subscriptionId: Issuer["subscriptionId"]) {
    return pipe(this.#issuerModel.findBySubscriptionId(subscriptionId));
  }
}

