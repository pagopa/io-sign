import express from "express";
import { randomBytes } from "crypto";

const router = express.Router();

router.post("/", (req, res) => {
//   const { grant_type } = req.body || req.query || {};

//   // Basic support for client_credentials and password
//   if (grant_type !== "client_credentials" && grant_type !== "password") {
//     return res.status(400).json({ error: "unsupported_grant_type" });
//   }

  const access = randomBytes(16).toString("hex");
  const expires_in = 3600;
  const token_type = "Bearer";

  return res.json({ access, refresh: "refresh_token" });
});

export default router;
