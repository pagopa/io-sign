import express from "express";
import bodyParser from "body-parser";
import profilesRouter from "./routes/profiles";

const app = express();
app.use(bodyParser.json());

app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[mock-io-profile] ${req.method} ${req.originalUrl}`);
  // eslint-disable-next-line no-console
  console.log("[mock-io-profile] headers:", JSON.stringify(req.headers));
  next();
});

app.use(["/api/profiles", "/api/v1/profiles"], profilesRouter);

app.head(["/", "/api", "/api/v1"], (_req, res) => {
  res.sendStatus(200);
});

const port = process.env.PORT || process.env.MOCK_IO_PROFILE_PORT || 3013;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock IO Profile listening on port ${port}`);
});

export default app;
