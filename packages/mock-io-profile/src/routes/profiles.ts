import express from "express";

const router = express.Router();

// GET /api/v1/profiles/:fiscalCode
// Returns a mock ExtendedProfile with a validated email.
// If the fiscal code starts with 'X', the email is not validated (useful for testing the rejected path).
router.get("/:fiscalCode", (req, res) => {
  const { fiscalCode } = req.params;

  const isEmailValidated = !(fiscalCode && fiscalCode.startsWith("X"));

  return res.json({
    fiscal_code: fiscalCode,
    email: `${fiscalCode.toLowerCase()}@mock.io.pagopa.it`,
    is_email_enabled: true,
    is_email_validated: isEmailValidated,
    is_email_already_taken: false,
    is_inbox_enabled: true,
    is_webhook_enabled: false,
    service_preferences_settings: {
      mode: "AUTO"
    },
    version: 0
  });
});

export default router;
