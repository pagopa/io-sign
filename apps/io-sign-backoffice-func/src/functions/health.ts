import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";

async function handler(
  _request: HttpRequest,
  _context: InvocationContext
): Promise<HttpResponseInit> {
  return { status: 200 };
}

app.http("health", {
  methods: ["GET"],
  handler,
});
