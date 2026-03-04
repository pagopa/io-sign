import express from "express";
import bodyParser from "body-parser";
import profilesRouter from "./routes/profiles";
import messagesRouter from "./routes/messages";

const app = express();
app.use(bodyParser.json());

// Log incoming requests for easier debugging
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[mock-io-services] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.log("[mock-io-services] headers:", JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    // eslint-disable-next-line no-console
    console.log("[mock-io-services] body:", JSON.stringify(req.body));
  }
  next();
});

// Mount routes under /api and /api/v1 to match client expectations
app.use(["/api/profiles", "/api/v1/profiles"], profilesRouter);
app.use(["/api/messages", "/api/v1/messages"], messagesRouter);

// Health check endpoints for base API paths
app.head(["/", "/api", "/api/v1"], (_req, res) => {
  res.sendStatus(200);
});

// Health check: respond to HEAD on base URL
app.head("/", (_req, res) => {
  res.sendStatus(200);
});

const port = process.env.PORT || process.env.MOCK_IO_SERVICES_PORT || 3011;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock IO services listening on port ${port}`);
});

export default app;
