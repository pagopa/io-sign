/**
 * Normalization helpers for record-replay cassettes.
 * Removes or replaces unstable values to keep cassettes deterministic.
 */

export interface NormalizationRules {
  removedHeaders: string[];
  replacedFields: Record<string, string>;
  sortedArrays: string[];
}

export const DEFAULT_RULES: NormalizationRules = {
  removedHeaders: [
    "date",
    "x-ms-request-id",
    "x-ms-activity-id",
    "x-ms-session-token",
    "etag",
    "x-ms-gatewayversion",
    "x-request-id",
    "traceparent"
  ],
  replacedFields: {
    _etag: "<REDACTED>",
    _rid: "<REDACTED>",
    _self: "<REDACTED>",
    _ts: "<REDACTED>",
    createdAt: "<TIMESTAMP>",
    updatedAt: "<TIMESTAMP>",
    expiresAt: "<TIMESTAMP>"
  },
  sortedArrays: ["documents"]
};

export function normalizeDocument(
  doc: Record<string, unknown>,
  rules: NormalizationRules = DEFAULT_RULES
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key in rules.replacedFields) {
      result[key] = rules.replacedFields[key];
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = normalizeDocument(value as Record<string, unknown>, rules);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function normalizeHeaders(
  headers: Record<string, string>,
  rules: NormalizationRules = DEFAULT_RULES
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!rules.removedHeaders.includes(key.toLowerCase())) {
      result[key.toLowerCase()] = value;
    }
  }
  return result;
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove SAS tokens and query params that change every run
    parsed.search = "";
    // Replace host:port with placeholder
    return parsed.pathname;
  } catch {
    return url;
  }
}

export function redactSecrets(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = [
    "authorization",
    "x-functions-key",
    "code",
    "sig",
    "accountkey",
    "sharedaccesskey"
  ];

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (sensitiveKeys.some((k) => lower.includes(k))) {
      result[key] = "<REDACTED>";
    } else if (typeof value === "object" && value !== null) {
      result[key] = Array.isArray(value)
        ? value.map((item) =>
            typeof item === "object" && item !== null
              ? redactSecrets(item as Record<string, unknown>)
              : item
          )
        : redactSecrets(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
