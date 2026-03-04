import express from "express";
import { randomBytes } from "crypto";

const router = express.Router();

router.post("/", (req, res) => {
  const access = randomBytes(16).toString("hex");

  return res.json({ access, refresh: "refresh_token" });
});

export default router;
