import { pipe, flow } from "fp-ts/lib/function";

import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import {
  HttpBadRequestError,
  HttpNotFoundError,
} from "@io-sign/io-sign/infra/http/errors";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { LollipopAssertionRef } from "../http/models/LollipopAssertionRef";
import { LollipopJWTAuthorization } from "../http/models/LollipopJWTAuthorization";
import { LollipopApiClient } from "./client";
import { LollipopAuthBearer } from "./models/LollipopAuthBearer";
import { AssertionType, AssertionTypeEnum } from "./models/AssertionType";
import { LCUserInfo } from "./models/LCUserInfo";
import { SamlUserInfo } from "./models/SamlUserInfo";

export type GetSamlAssertion = (
  assertionRef: LollipopAssertionRef,
  jwtAuthorization: LollipopJWTAuthorization,
  assertionType: AssertionType
) => TE.TaskEither<Error, NonEmptyString>;

export const isAssertionSaml =
  (type: AssertionType) =>
  (assertion: LCUserInfo): assertion is SamlUserInfo =>
    type === AssertionTypeEnum.SAML && SamlUserInfo.is(assertion);

export const makeGetSamlAssertion =
  (lollipopClient: LollipopApiClient): GetSamlAssertion =>
  (
    assertionRef: LollipopAssertionRef,
    jwtAuthorization: LollipopJWTAuthorization,
    assertionType: AssertionType
  ) =>
    pipe(
      TE.tryCatch(
        () =>
          lollipopClient.client.getAssertion({
            assertion_ref: assertionRef,
            "x-pagopa-lollipop-auth":
              `Bearer ${jwtAuthorization}` as LollipopAuthBearer,
          }),
        E.toError
      ),
      TE.chainEitherK(
        flow(
          E.mapLeft(
            () =>
              new Error("Unable to retrieve the assertion from lollipop api.")
          ),
          E.chainW((response) => {
            switch (response.status) {
              case 200:
                return E.right(response.value);
              case 404:
                return E.left(
                  new HttpNotFoundError(`Lollipop user assertion not found.`)
                );
              default:
                return E.left(
                  new HttpBadRequestError(
                    `The attempt to get lollipop user assertion failed.`
                  )
                );
            }
          })
        )
      ),
      TE.chain((assertion) =>
        isAssertionSaml(assertionType)(assertion)
          ? TE.of(assertion.response_xml)
          : TE.left(new HttpBadRequestError(`OIDC Claims not supported yet.`))
      )
    );
