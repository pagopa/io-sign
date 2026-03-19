import { setupServer } from "msw/node";
import { getHandlers } from "./handlers";

const server = setupServer(...getHandlers());

export const startMSWServer = () => {
  server.listen({ onUnhandledRequest: "bypass" });
  console.log("[MSW] Server interceptor active.");
};
