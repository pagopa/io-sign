import express from "express";
import bodyParser from "body-parser";
import assertionsRouter from "./routes/assertions";

const app = express();
app.use(bodyParser.json());

// Log incoming requests for easier debugging
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[mock-lollipop] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.log("[mock-lollipop] headers:", JSON.stringify(req.headers));
  next();
});

app.use("/lollipop/api/v1/assertions", assertionsRouter);

app.head("/", (_req, res) => {
  res.sendStatus(200);
});

const port = process.env.PORT || process.env.MOCK_LOLLIPOP_PORT || 3012;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock Lollipop listening on port ${port}`);
});

export default app;
