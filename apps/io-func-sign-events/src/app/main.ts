import { app } from "@azure/functions";

import { httpAzureFunction } from "@pagopa/handler-kit-azure-func";

import { InfoHandler } from "../infra/http/handlers/info";
import { getConfigFromEnvironment } from "./config";
import { initAppInsights } from "@pagopa/ts-commons/lib/appinsights";

const config = getConfigFromEnvironment();

initAppInsights(config.appinsights.applicationInsightsConnectionString, {
  samplingPercentage: config.appinsights.applicationInsightsSamplingPercentage
});

// ---- HTTP TRIGGERS ----
const info = httpAzureFunction(InfoHandler)({});

app.http("info", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "info",
  handler: info
});
