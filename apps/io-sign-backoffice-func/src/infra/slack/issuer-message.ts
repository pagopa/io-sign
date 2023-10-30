export const IssuerMessage = ({
  internalInstitutionId,
  vatNumber,
  email,
  description,
}: {
  internalInstitutionId: string;
  vatNumber: string;
  email: string;
  description: string;
}) =>
  `👋🏻 A new issuer has just been onboarded to io-sign 🚀!\n
    Description: ${description}\n
    institutionId: \`${internalInstitutionId}\`\n
    supportEmail: \`${email}\`\n
    vatNumber: \`${vatNumber}\`\n`;
