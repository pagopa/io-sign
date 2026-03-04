import express from "express";
import { randomBytes } from "crypto";

const router = express.Router();

// POST /api/messages
router.post("/", (req, res) => {
  const message = req.body && req.body.message ? req.body.message : req.body;

  // Minimal validation
  if (!message || !message.fiscal_code) {
    return res.status(400).json({ error: "Missing fiscal_code in message" });
  }

  const id = randomBytes(8).toString("hex");

  return res.status(201).json({ id });
});

export default router;
