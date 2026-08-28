import { app as azureApp } from "@azure/functions";
import type { HttpRequest, HttpResponseInit, HttpMethod, InvocationContext } from "@azure/functions";
import {
  mapErrorToHttpResponse,
  type HttpRequestPayload,
  type RouteContract,
  type RouteRequestSchemas,
  type ResponseMap
} from "@pagopa/hexagonal-core/adapters";
import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { Logger, UseCase } from "@pagopa/hexagonal-core/domain/ports";
import { ZodError } from "zod";
import { makeInvocationContextLogger } from "./invocation-context-logger.js";

export type ErrorResponderConfig = Parameters<typeof mapErrorToHttpResponse>[0];

// Derives the 2xx status code from the response map at runtime.
const successStatusFrom = (response: ResponseMap): number =>
  Number(Object.keys(response).find((k) => Number(k) >= 200 && Number(k) < 300) ?? 200);

const extractPayload = async (req: HttpRequest): Promise<HttpRequestPayload> => {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // body-less request (GET, HEAD, …) — leave as empty object
  }
  return {
    body,
    headers: Object.fromEntries(req.headers),
    path: req.params,
    query: Object.fromEntries(req.query)
  };
};

// Converts a route path to a valid Azure Functions function name.
const functionNameFrom = (path: string): string =>
  path.replace(/^\//, "").replace(/\//g, "-").replace(/[{}*]/g, "") || "root";

/**
 * Registers an Azure Functions HTTP trigger from a hexagonal route contract.
 *
 * NOTE: this is a simulation of a future @pagopa/hexagonal-azure-functions
 * package. Type-level constraints (EnsureErrorResponsePayloads, etc.) are
 * intentionally omitted and will be added when the real library ships.
 */
export const mountAzureFunctionsRoute = <
  Req extends RouteRequestSchemas,
  Resp extends ResponseMap,
  Input extends object,
  O,
  Body extends object,
  E extends BaseError
>(
  spec: {
    contract: RouteContract<Req, Resp>;
    inputMapper: (payload: HttpRequestPayload) => Input;
    outputMapper: (output: O) => Body;
    useCaseFactory: (logger: Logger) => UseCase<Input, O, E>;
    authLevel?: "anonymous" | "function" | "admin";
  },
  config?: ErrorResponderConfig
): void => {
  const { contract, inputMapper, outputMapper, useCaseFactory } = spec;
  const successStatus = successStatusFrom(contract.response);

  azureApp.http(functionNameFrom(contract.path), {
    methods: [contract.method.toUpperCase() as HttpMethod],
    authLevel: spec.authLevel ?? "anonymous",
    route: contract.path.replace(/^\//, ""),
    handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
      const logger = makeInvocationContextLogger(context);
      const useCase = useCaseFactory(logger);
      const payload = await extractPayload(req);
      let input: Input;
      try {
        input = inputMapper(payload);
      } catch (e) {
        const detail = e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : "Invalid request";
        return { status: 400, jsonBody: { status: 400, title: "Bad Request", detail } };
      }
      const result = await useCase(input);
      return result.match(
        (output: any) => ({ status: successStatus, jsonBody: outputMapper(output) }),
        (error: any) => {
          const { status, headers, jsonBody } = mapErrorToHttpResponse(config)(error);
          return {
            status,
            headers: headers as Record<string, string>,
            body: JSON.stringify(jsonBody)
          };
        }
      );
    }
  });
};
