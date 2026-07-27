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

  // pub_key must be a base64-encoded JWK (JSON Web Key).
  // The consumer does: base64-decode → JSON.parse → JSON.stringify → base64-encode.
  // This is a fixed EC P-256 public key in JWK format, base64-encoded.
  const mockPubKeyJwk =
    "eyJrdHkiOiJFQyIsIngiOiJialJlRkZva3dMVU5FeEFrQmZsOVJJNEVPTkg5Qm1aMkVIb3Z6Mm0tUHhVIiwieSI6InZWUnptVDBMa1RyNE1HVGFmOE1YZl8tU0kxYUtMcGU1dTZXSE00NGlOdmMiLCJjcnYiOiJQLTI1NiJ9";

  return res.status(200).json({
    assertion_ref: assertionRef,
    assertion_type: "SAML",
    lc_authentication_bearer: "mock-lc-bearer-jwt",
    pub_key: mockPubKeyJwk
  });
});

export default router;
