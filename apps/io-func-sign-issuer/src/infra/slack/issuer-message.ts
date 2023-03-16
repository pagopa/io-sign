import { Issuer } from "@io-sign/io-sign/issuer";

export const createNewIssuerMessage = (issuer: Issuer) =>
  `👋🏻 A new issuer has just been onboarded to io-sign!\n\n
  Description: ${issuer.description}\n
  issuerId: \`${issuer.id}\`\n
  subscriptionId: \`${issuer.subscriptionId}\`\n
  supportEmail: \`${issuer.email}\``;
