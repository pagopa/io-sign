import { HttpHandler } from "msw";
import { buildHandlers as apimHandlers } from "./apim-handlers";
import { buildHandlers as selfcareHandlers } from "./selfcare-handlers";

export const getHandlers = () => {
  const handlers: HttpHandler[] = [];

  if (process.env.MOCK_APIM_API_ENABLED === "true") {
    console.log("[MSW] Adding APIM handlers ...");
    handlers.push(...apimHandlers());
  }
  if (process.env.MOCK_SELFCARE_API_ENABLED === "true") {
    console.log("[MSW] Adding Selfcare handlers ...");
    handlers.push(...selfcareHandlers());
  }

  return handlers;
};
