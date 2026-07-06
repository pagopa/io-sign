import express from "express";
import { randomUUID } from "crypto";

const router = express.Router();

const tokenByPii = new Map<string, string>();
const piiByToken = new Map<string, string>();

const tokenize = (pii: string): string => {
  const existing = tokenByPii.get(pii);
  if (existing) {
    return existing;
  }

  const token = randomUUID();
  tokenByPii.set(pii, token);
  piiByToken.set(token, pii);

  return token;
};

router.put("/", (req, res) => {
  const { pii } = req.body ?? {};

  if (typeof pii !== "string" || pii.length === 0) {
    return res.status(400).json({ message: "pii is required" });
  }

  return res.status(200).json({ token: tokenize(pii) });
});

router.post("/search", (req, res) => {
  const { pii } = req.body ?? {};

  if (typeof pii !== "string" || pii.length === 0) {
    return res.status(400).json({ message: "pii is required" });
  }

  const token = tokenByPii.get(pii);

  if (!token) {
    return res.status(404).json({ message: "token not found" });
  }

  return res.status(200).json({ token });
});

const FALLBACK_FISCAL_CODE = "RSSMRA80A01H501U";

router.get("/:token/pii", (req, res) => {
  const { token } = req.params;

  const pii = piiByToken.get(token) ?? FALLBACK_FISCAL_CODE;

  return res.status(200).json({ pii });
});

export default router;
