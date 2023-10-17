import { app, HttpResponseInit } from "@azure/functions";

async function handler(): Promise<HttpResponseInit> {
  return { status: 200 };
}

app.http("health", {
  methods: ["GET"],
  handler,
});
