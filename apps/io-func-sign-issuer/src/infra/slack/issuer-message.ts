import { Issuer } from "@io-sign/io-sign/issuer";

export const createNewIssuerMessage = (issuer: Issuer) =>
  `👋🏻 A new issuer has just been onboarded to io-sign!\n\nIssuer description: ${issuer.description}\nissuerId: \`${issuer.id}\`\nsubscriptionId: \`${issuer.subscriptionId}\``;
