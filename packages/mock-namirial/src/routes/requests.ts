import express from "express";
import { randomBytes } from "crypto";

const router = express.Router();

type SignatureRequest = {
  id: string;
  created_at: string;
  status: "CREATED" | "READY" | "WAITING" | "COMPLETED" | "FAILED";
  last_error: null | { code: number; detail: string };
};

const store = new Map<string, SignatureRequest>();

router.post("/", (req, res) => {
  const id = randomBytes(8).toString("hex");
  const created_at = new Date().toISOString();
  const payload: SignatureRequest = {
    id,
    created_at,
    status: "CREATED",
    last_error: null
  };

  store.set(id, payload);

  res.status(201).json(payload);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;

  const found = store.get(id);
  if (found) {
    found.status = "COMPLETED";

    store.delete(id);

    return res.json(found);
  } else {
    const signatureRequest = {
      id: id,
      created_at: new Date().toISOString(),
      status: "WAITING" as const,
      last_error: null,
    };

    store.set(id, signatureRequest);

    return res.json(signatureRequest);
  }
});

export default router;
