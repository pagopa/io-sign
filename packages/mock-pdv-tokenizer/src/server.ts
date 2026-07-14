import express from "express";
import bodyParser from "body-parser";
import tokensRouter from "./routes/tokens";

const app = express();
app.use(bodyParser.json());

// The real PDV Tokenizer API tolerates duplicate slashes (its basePath
// includes a trailing slash), but Express route matching does not.
app.use((req, _res, next) => {
  req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// Log incoming requests for easier debugging
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[mock-pdv-tokenizer] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.log("[mock-pdv-tokenizer] headers:", JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    // eslint-disable-next-line no-console
    console.log("[mock-pdv-tokenizer] body:", JSON.stringify(req.body));
  }
  next();
});

app.use("/tokenizer/v1/tokens", tokensRouter);

app.head("/", (_req, res) => {
  res.sendStatus(200);
});

const port = process.env.PORT || process.env.MOCK_PDV_TOKENIZER_PORT || 3013;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock PDV Tokenizer listening on port ${port}`);
});

export default app;