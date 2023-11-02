export const IssuerMessage = ({
  internalInstitutionId,
  vatNumber,
  description,
}: {
  internalInstitutionId: string;
  vatNumber: string;
  description: string;
}) =>
  `👋🏻 A new issuer has just been onboarded to io-sign 🚀!\n
    Description: ${description}\n
    institutionId: \`${internalInstitutionId}\`\n
    vatNumber: \`${vatNumber}\`\n`;
