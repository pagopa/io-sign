import express from "express";

const router = express.Router();

// GET /api/profiles/:fiscalCode
router.get("/:fiscalCode", (req, res) => {
  const { fiscalCode } = req.params;

  // Basic mock profile: sender_allowed true for demo, false if fiscalCode starts with 'X'
  const sender_allowed = !(fiscalCode && fiscalCode.startsWith("X"));

  return res.json({
    fiscal_code: fiscalCode,
    sender_allowed
  });
});

export default router;
