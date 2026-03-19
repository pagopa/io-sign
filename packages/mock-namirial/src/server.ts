import express from "express";
import bodyParser from "body-parser";
import tokenRouter from "./routes/token";
import clausesRouter from "./routes/clauses";

const app = express();
app.use(bodyParser.json());

// Log incoming requests for easier debugging
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[mock-namirial] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.log("[mock-namirial] headers:", JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    // eslint-disable-next-line no-console
    console.log("[mock-namirial] body:", JSON.stringify(req.body));
  }
  next();
});

// Mount routes under /api to match Namirial paths used by the client
app.use("/api/token", tokenRouter);
app.use("/api/tos", clausesRouter);
import requestsRouter from "./routes/requests";
app.use("/api/requests", requestsRouter);

// Expose the document and policy endpoints referenced in the clauses metadata
app.get("/documents/privacy.pdf", (_req, res) => {
  // Return a small PDF-like payload; it's sufficient for tests that only need an HTTP response
  res.type("application/pdf");
  res.send(Buffer.from("%PDF-1.4\n%Mock PDF content\n"));
});

app.get("/privacy", (_req, res) => {
  res.type("text/html");
  res.send("<html><body><h1>Informativa Privacy (mock)</h1><p>Test content</p></body></html>");
});

app.get("/terms", (_req, res) => {
  res.type("text/html");
  res.send("<html><body><h1>Terms and Conditions (mock)</h1><p>Test content</p></body></html>");
});

const port = process.env.PORT || 3010;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock Namirial listening on port ${port}`);
});

export default app;
