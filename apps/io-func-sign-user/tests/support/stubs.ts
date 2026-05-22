import {
  createServer,
  IncomingMessage,
  Server,
  ServerResponse
} from "node:http";
import { AddressInfo } from "node:net";

export interface CapturedRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

export type StubHandler = (
  req: IncomingMessage,
  body: string
) => { status: number; body: unknown; headers?: Record<string, string> };

/**
 * A minimal HTTP stub server that captures requests and returns configurable responses.
 * Used to stub external APIs: Namirial, PDV Tokenizer, Lollipop, IO Services.
 */
export interface StubServer {
  server: Server;
  baseUrl: string;
  port: number;
  requests: CapturedRequest[];
  setHandler: (handler: StubHandler) => void;
  stop: () => Promise<void>;
}

const defaultHandler: StubHandler = () => ({
  status: 200,
  body: { status: "ok" }
});

/**
 * Composite stub that routes requests by URL prefix to different handlers.
 */
export function createRoutingHandler(
  routes: Record<string, StubHandler>
): StubHandler {
  return (req, body) => {
    const url = req.url ?? "/";
    for (const [prefix, handler] of Object.entries(routes)) {
      if (url.startsWith(prefix)) {
        return handler(req, body);
      }
    }
    return { status: 404, body: { error: "not found" } };
  };
}

export async function startStubServer(
  handler?: StubHandler
): Promise<StubServer> {
  const requests: CapturedRequest[] = [];
  let currentHandler = handler ?? defaultHandler;

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf-8");
      requests.push({
        method: req.method ?? "GET",
        url: req.url ?? "/",
        headers: req.headers,
        body
      });

      const response = currentHandler(req, body);
      const responseBody = JSON.stringify(response.body);
      res.writeHead(response.status, {
        "Content-Type": "application/json",
        ...response.headers
      });
      res.end(responseBody);
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    server,
    baseUrl,
    port,
    requests,
    setHandler: (h) => {
      currentHandler = h;
    },
    stop: () => new Promise((resolve) => server.close(() => resolve()))
  };
}
