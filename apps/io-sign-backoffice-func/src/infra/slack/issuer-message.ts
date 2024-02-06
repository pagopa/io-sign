export const IssuerMessage = ({
  internalInstitutionId,
  vatNumber,
  description,
}: {
  internalInstitutionId: string;
  vatNumber: string;
  description: string;
}) =>
  `(_backoffice_) *${description}* (institutionId: \`${internalInstitutionId}\`, vatNumber: \`${vatNumber}\`) ha effettuato l'onboarding 🎉`;
