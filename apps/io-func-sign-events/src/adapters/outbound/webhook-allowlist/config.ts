// Same format as the backoffice app: "[id1,id2]" or "*" to enable all institutions.
export const parseWebhookAllowlist = (raw: string | undefined) => {
  const ids = (raw ?? "")
    .trim()
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (institutionId: string): boolean =>
    ids.includes("*") || ids.includes(institutionId);
};

export const getWebhookAllowlistFromEnvironment = () =>
  parseWebhookAllowlist(process.env.WEBHOOK_ENABLED_INSTITUTION_IDS);
