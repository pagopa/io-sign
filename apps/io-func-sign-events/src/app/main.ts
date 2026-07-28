import { app } from "@azure/functions";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { InfoHandler } from "../infra/http/handlers/info";

// ---- HTTP TRIGGERS ----
const info = httpAzureFunction(InfoHandler)({});

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: info
});
