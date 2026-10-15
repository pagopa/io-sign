import { parseWebhookAllowlist } from "@io-sign/io-sign/utility";

export const getWebhookAllowlistFromEnvironment = () => {
  const ids = parseWebhookAllowlist(
    process.env.WEBHOOK_ENABLED_INSTITUTION_IDS ?? ""
  );
  return (institutionId: string): boolean =>
    ids.includes("*") || ids.includes(institutionId);
};
