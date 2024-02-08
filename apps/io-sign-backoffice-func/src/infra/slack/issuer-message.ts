export const IssuerMessage = ({
  internalInstitutionId,
  taxCode,
  description,
}: {
  internalInstitutionId: string;
  taxCode: string;
  description: string;
}) =>
  `(_backoffice_) *${description}* (\`institutionId: ${internalInstitutionId}\`, \`taxCode: ${taxCode}\`) ha effettuato l'onboarding 🎉`;
