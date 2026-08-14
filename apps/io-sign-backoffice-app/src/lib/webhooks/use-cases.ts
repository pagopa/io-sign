import { generateKeyPairSync } from "node:crypto";

import { calculateJwkThumbprint } from "jose";

import { getInstitution } from "@/lib/institutions/use-cases";
import { getIssuerByInstitution } from "@/lib/issuers/use-cases";
import { upsertWebhookPrivateKey } from "./keyvault";
import { sendMessage } from "@/lib/slack";

import {
  type CreateWebhookPayload,
  webhookSchema,
  type Webhook,
} from "./index";
import { getWebhook, insertWebhook } from "./cosmos";

export async function getWebhookForInstitution(
  institutionId: string
): Promise<Webhook | undefined> {
  const institution = await getInstitution(institutionId);
  if (!institution) return undefined;
  const issuer = await getIssuerByInstitution(institution);
  if (!issuer) return undefined;
  return getWebhook(institutionId, issuer.externalId);
}

export async function generateWebhookKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");

  // .export({ format: "jwk" }) returns a plain object but TS types it as
  // JsonWebKey which lacks the index signature that jose's JWK requires.
  // The runtime is fully compatible (Ed25519 → OKP crv); the cast is safe.
  const publicJwk = publicKey.export({ format: "jwk" }) as Record<string, string>;
  const privateJwk = privateKey.export({ format: "jwk" }) as Record<string, string>;

  const publicKeyThumbprint = await calculateJwkThumbprint(publicJwk, "sha256");

  return {
    publicKey: Buffer.from(JSON.stringify(publicJwk)).toString("base64url"),
    privateKey: Buffer.from(JSON.stringify(privateJwk)).toString("base64url"),
    publicKeyThumbprint,
  };
}

function buildWebhook(
  payload: CreateWebhookPayload,
  issuerId: string,
  publicKeyThumbprint: string
): Webhook {
  return webhookSchema.parse({
    id: payload.institutionId,
    issuerId,
    url: payload.url,
    privateKeySecretName: `webhook-private-key-${issuerId}`,
    publicKeyThumbprint,
    status: "inactive" as const,
  });
}

export class WebhookAlreadyExistsError extends Error {
  constructor(cause = {}) {
    super("the webhook already exists");
    this.name = "WebhookAlreadyExistsError";
    this.cause = cause;
  }
}

export async function createWebhook(payload: CreateWebhookPayload) {
  try {
    const institution = await getInstitution(payload.institutionId);
    if (!institution) {
      throw new Error("institution does not exists");
    }

    const issuer = await getIssuerByInstitution(institution);
    if (issuer === undefined) {
      throw new Error("issuer not found for the institution");
    }

    const existingWebhook = await getWebhook(institution.id, issuer.externalId);
    if (existingWebhook) {
      throw new WebhookAlreadyExistsError("a webhook already exists for the institution");
    }

    const generatedKeyPair = await generateWebhookKeyPair();
    const webhook = buildWebhook(
      payload,
      issuer.externalId,
      generatedKeyPair.publicKeyThumbprint
    );
    await upsertWebhookPrivateKey(
      webhook.privateKeySecretName,
      generatedKeyPair.privateKey
    );

    await insertWebhook(webhook);
    await sendMessage(
      `(_backoffice_) *${institution.name}* (\`${issuer?.externalId}\`) ha creato un nuovo webhook.`
    );
    return {
      id: webhook.id,
      publicKey: generatedKeyPair.publicKey,
      publicKeyThumbprint: generatedKeyPair.publicKeyThumbprint,
    };
  } catch (cause) {
    throw cause instanceof WebhookAlreadyExistsError
      ? cause
      : new Error("unable to create the webhook", { cause });
  }
}