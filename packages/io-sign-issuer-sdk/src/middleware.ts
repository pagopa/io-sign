import {
  Middleware,
  ResponseContext,
  FetchParams,
} from "@io-sign/io-sign-api-client";

export class APIMiddleware implements Middleware {
  pre(context: ResponseContext): Promise<FetchParams | void> {
    return Promise.resolve({ url: context.url, init: context.init });
  }

    post(context: ResponseContext): Promise<Response | void> {
        return Promise.resolve(context.response);
    }
}
