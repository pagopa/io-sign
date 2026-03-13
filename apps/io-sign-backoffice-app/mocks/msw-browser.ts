import { setupWorker } from "msw/browser";
import { getHandlers } from "./handlers";

const worker = setupWorker(...getHandlers());

export const startMSWWorker = async () => {
  await worker.start({ onUnhandledRequest: "bypass" });
  console.log("[MSW] Worker interceptor active.");
};
