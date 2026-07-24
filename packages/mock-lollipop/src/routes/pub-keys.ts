import express from "express";

const router = express.Router();

/**
 * POST /api/v1/pubKeys/:assertionRef/generate
 *
 * Lollipop Internal API — equivalent to `generateLCParams` called by
 * io-backend's `expressLollipopMiddleware`. Returns the LC params needed
 * by io-func-sign-user to obtain the SAML assertion.
 */
router.post("/:assertionRef/generate", (req, res) => {
  const { assertionRef } = req.params;
  const { operation_id } = req.body ?? {};

  // eslint-disable-next-line no-console
  console.log(
    `[mock-lollipop][internal] generateLCParams assertionRef=${assertionRef} operation_id=${operation_id}`
  );

  return res.status(200).json({
    assertion_ref: assertionRef,
    assertion_type: "SAML",
    lc_authentication_bearer: "mock-lc-bearer-jwt",
    pub_key: "mock-public-key"
  });
});

export default router;
