import express from "express";

const router = express.Router();

// Returns a clauses metadata object matching ClausesMetadata codec used by the client
router.get("/", (req, res) => {
  const proto = req.protocol || "http";
  const host = req.get("host") || `localhost:${process.env.PORT || 3010}`;
  const base = `${proto}://${host}`;

  const sample = {
    privacy_text: "Informativa sulla privacy di esempio.",
    document_link: `${base}/documents/privacy.pdf`,
    privacy_link: `${base}/privacy`,
    terms_and_conditions_link: `${base}/terms`,
    clauses: [
      { text: "Accetto la privacy" },
      { text: "Accetto i termini di servizio" }
    ],
    nonce: "nonce-sample"
  };

  res.json(sample);
});

export default router;
