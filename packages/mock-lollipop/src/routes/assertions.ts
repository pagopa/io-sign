import express from "express";

const router = express.Router();

router.get("/:assertionRef", (req, res) => {
  const { assertionRef } = req.params;

  const responseXml = `<?xml version="1.0" encoding="UTF-8"?><Response xmlns="urn:oasis:names:tc:SAML:2.0:protocol" InResponseTo="${assertionRef}"><Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion"><Subject><NameID>mock-signer</NameID></Subject><AttributeStatement><Attribute Name="fiscalNumber"><AttributeValue>TINIT-MOCKFISCALCODE00</AttributeValue></Attribute></AttributeStatement></Assertion></Response>`;

  return res.status(200).json({ response_xml: responseXml });
});

export default router;