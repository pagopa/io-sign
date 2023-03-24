import { Issuer } from "@io-sign/io-sign/issuer";

export const createNewIssuerMessage = (issuer: Issuer) =>
  `👋🏻 A new issuer has just been onboarded to io-sign 🚀!\n
  Description: ${issuer.description}\n
  issuerId: \`${issuer.id}\`\n
  subscriptionId: \`${issuer.subscriptionId}\`\n
  supportEmail: \`${issuer.email}\`\n
  internalInstitutionId: \`${issuer.internalInstitutionId}\`\n
  vatNumber: \`${issuer.vatNumber}\`\n`;
