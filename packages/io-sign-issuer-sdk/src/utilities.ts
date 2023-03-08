import * as dotenv from "dotenv";
import {
  RequestContext,
  ResponseContext,
  IsomorphicFetchHttpLibrary,
} from "@io-sign/io-sign-api-client/http/http";

dotenv.config();

export type EndpointResponse = {
  status: number;
  headers: any;
  body: any;
};

function applySecurityAuthentication(
  context: RequestContext
): Promise<RequestContext> {
  context.setHeaderParam(
    "Ocp-Apim-Subscription-Key",
    process.env.SUBSCRIPTION_KEY || ""
  );
  return Promise.resolve(context);
}

export function createResponse(req: RequestContext): Promise<EndpointResponse> {
  const instance = new IsomorphicFetchHttpLibrary();
  const response: EndpointResponse = {
    status: 1,
    headers: {},
    body: {},
  };

  return new Promise<EndpointResponse>((resolve, reject) => {
    applySecurityAuthentication(req)
      .then((data: RequestContext) => {
        instance
          .send(data)
          .toPromise()
          .then((data: ResponseContext) => {
            response.status = data.httpStatusCode;
            response.headers = data.headers;
            data
              .getBodyAsAny()
              .then((body) => {
                response.body = body;
                resolve(response);
              })
              .catch((error: any) => {
                reject(error);
              });
          })
          .catch((error: any) => {
            reject(error);
          });
      })
      .catch((error: any) => {
        reject(error);
      });
  });
}

export function isNotNull(value: string) {
  if (!value) {
    return "Il valore non può essere nullo.";
  }
  return true;
}

export function isNotNumber(value: string) {
  if (!Number.isInteger(Number(value))) {
    return "Il valore deve essere un numero intero.";
  }
  return true;
}