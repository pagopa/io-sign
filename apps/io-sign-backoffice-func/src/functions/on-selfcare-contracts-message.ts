import { app, InvocationContext } from "@azure/functions";

async function handler(
  message: unknown,
  context: InvocationContext,
): Promise<void> {
  context.log("Event hub function processed message:", message);
}

app.eventHub("onSelfcareContractsMessage", {
  connection: "SelfCareEventHubConnectionString",
  eventHubName: "sc-contracts",
  cardinality: "many",
  handler,
});
