import express from "express";
import { randomBytes } from "crypto";

const router = express.Router();

type SignatureRequest = {
  id: string;
  created_at: string;
  status: "CREATED" | "READY" | "WAITING" | "COMPLETED" | "FAILED";
  last_error: null | { code: number; detail: string };
};

const store = new Map<
  string,
  {
    signatureRequest: SignatureRequest;
    count: number;
  }
>();

router.post("/", (_req, res) => {
  const id = randomBytes(8).toString("hex");
  const created_at = new Date().toISOString();
  const payload: SignatureRequest = {
    id,
    created_at,
    status: "CREATED",
    last_error: null,
  };

  store.set(id, { signatureRequest: payload, count: 0 });

  res.status(201).json(payload);
});

router.get("/:id", (req, res) => {
  const { id } = req.params;

  const found = store.get(id);
  if (found?.count === 0) {
    found.signatureRequest.status = "WAITING";

    store.set(id, { signatureRequest: found.signatureRequest, count: 1 });

    return res.json(found.signatureRequest);
  } else if (found?.count === 1) {
    found.signatureRequest.status = "READY";
    store.set(id, { signatureRequest: found.signatureRequest, count: 2 });

    return res.json(found.signatureRequest);
  } else if (found?.count === 2) {
    found.signatureRequest.status = "COMPLETED";

    store.delete(id);

    return res.json(found.signatureRequest);
  } else {
    return res.status(404).json({ error: "Not Found" });
  }
});

export default router;
