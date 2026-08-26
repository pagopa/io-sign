import { vi, describe, it, expect } from "vitest";

import {
  WebhookAlreadyExistsError,
  WebhookNotFoundError,
  createWebhook,
  generateWebhookKeyPair,
  patchWebhook,
  rotateWebhookKey,
} from "@/lib/webhooks/use-cases";

import { Webhook } from "@/lib/webhooks";
import { InstitutionDetail } from "@/lib/institutions";
import { Issuer } from "@/lib/issuers";

const mocks: {
  webhook: Webhook;
  institution: InstitutionDetail;
  issuer: Issuer;
} = vi.hoisted(() => ({
  webhook: {
    id: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
    issuerId: "01GG4NFBCN4ZH8ETCCKX3766KX",
    url: "https://webhook.example.com/notify",
    privateKeySecretName: "webhook-private-key-01GG4NFBCN4ZH8ETCCKX3766KX",
    publicKeyThumbprint: "NpeIgdOdKKMbb71BexRqqdm1mqVWx4TRTp1GBzFUTi4",
    status: "inactive",
  },
  institution: {
    id: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
    vatNumber: "101010",
    supportEmail: "support@email.it",
    taxCode: "101010",
    name: "Test Institution",
  },
  issuer: {
    externalId: "01GG4NFBCN4ZH8ETCCKX3766KX",
    institutionId: "8a6031b8-ca40-4ac1-86b6-c3bda65803d7",
    supportEmail: "support@email.it",
    id: "101010",
    type: "PA",
    status: "active",
  },
}));

const { getCosmosContainerClient } = vi.hoisted(() => ({
  getCosmosContainerClient: vi.fn().mockReturnValue({
    items: {
      create: vi.fn().mockResolvedValue({}),
    },
    item: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ resource: undefined }),
      patch: vi.fn().mockResolvedValue({}),
    }),
  }),
}));

const { upsertWebhookPrivateKey } = vi.hoisted(() => ({
  upsertWebhookPrivateKey: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/cosmos", () => ({
  getCosmosContainerClient,
}));

vi.mock("@/lib/webhooks/keyvault", () => ({
  upsertWebhookPrivateKey,
}));

vi.mock("@/lib/institutions/use-cases", () => ({
  getInstitution: vi.fn().mockResolvedValue(mocks.institution),
}));

vi.mock("@/lib/issuers/use-cases", () => ({
  getIssuerByInstitution: vi.fn().mockResolvedValue(mocks.issuer),
}));

vi.mock("@/lib/slack", () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}));

describe("generateWebhookKeyPair", () => {
  it("should return a publicKey, privateKey and publicKeyThumbprint", async () => {
    const result = await generateWebhookKeyPair();
    expect(result).toMatchObject({
      publicKey: expect.any(String),
      privateKey: expect.any(String),
      publicKeyThumbprint: expect.any(String),
    });
  });

  it("should generate a non-empty base64url-encoded public key", async () => {
    const { publicKey } = await generateWebhookKeyPair();
    expect(publicKey.length).toBeGreaterThan(0);
    // base64url: no +, /, = characters
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should generate a deterministic thumbprint length (SHA-256 → 43 chars base64url)", async () => {
    const { publicKeyThumbprint } = await generateWebhookKeyPair();
    expect(publicKeyThumbprint).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("should generate unique key pairs on each call", async () => {
    const first = await generateWebhookKeyPair();
    const second = await generateWebhookKeyPair();
    expect(first.publicKey).not.toBe(second.publicKey);
    expect(first.publicKeyThumbprint).not.toBe(second.publicKeyThumbprint);
  });
});

describe("createWebhook", () => {
  it("should throw WebhookAlreadyExistsError when a webhook already exists", async () => {
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: mocks.webhook }),
      }),
    });

    await expect(
      createWebhook({
        institutionId: mocks.institution.id,
        url: "https://webhook.example.com/notify",
      })
    ).rejects.toThrowError(WebhookAlreadyExistsError);
  });

  it("should store the private key in Key Vault on success", async () => {
    await createWebhook({
      institutionId: mocks.institution.id,
      url: "https://webhook.example.com/notify",
    });
    expect(upsertWebhookPrivateKey).toHaveBeenCalledWith(
      `webhook-private-key-${mocks.issuer.externalId}`,
      expect.any(String)
    );
  });

  it("should return id, publicKey and publicKeyThumbprint on success", async () => {
    const result = await createWebhook({
      institutionId: mocks.institution.id,
      url: "https://webhook.example.com/notify",
    });
    expect(result).toMatchObject({
      id: mocks.institution.id,
      publicKey: expect.any(String),
      publicKeyThumbprint: expect.any(String),
    });
  });

  it("should persist the webhook in Cosmos with publicKeyThumbprint", async () => {
    const cosmosCreate = vi.fn().mockResolvedValue({});

    // First call → getWebhook (item read returning no results)
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: undefined }),
      }),
    });

    // Second call → insertWebhook (create)
    getCosmosContainerClient.mockReturnValueOnce({
      items: { create: cosmosCreate },
    });

    await createWebhook({
      institutionId: mocks.institution.id,
      url: "https://webhook.example.com/notify",
    });

    expect(cosmosCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mocks.institution.id,
        issuerId: mocks.issuer.externalId,
        publicKeyThumbprint: expect.any(String),
        status: "inactive",
      })
    );
  });
});

describe("patchWebhook", () => {
  it("should throw WebhookNotFoundError when no webhook exists for the institution", async () => {
    // default mock returns empty iterator → getWebhook returns undefined
    await expect(
      patchWebhook({
        institutionId: mocks.institution.id,
        url: "https://new-webhook.example.com/notify",
      })
    ).rejects.toThrowError(WebhookNotFoundError);
  });

  it("should call updateWebhook with the provided url field", async () => {
    const cosmosPatch = vi.fn().mockResolvedValue({});

    // First call → getWebhook (item read returning the existing webhook)
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: mocks.webhook }),
      }),
    });

    // Second call → updateWebhook (item patch)
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({ patch: cosmosPatch }),
    });

    await patchWebhook({
      institutionId: mocks.institution.id,
      url: "https://new-webhook.example.com/notify",
    });

    expect(cosmosPatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ op: "replace", path: "/url" }),
      ])
    );
  });

  it("should not call updateWebhook when no optional fields are provided", async () => {
    const cosmosPatch = vi.fn().mockResolvedValue({});

    // getWebhook returns the existing webhook
    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: mocks.webhook }),
      }),
    });

    await patchWebhook({ institutionId: mocks.institution.id });

    expect(cosmosPatch).not.toHaveBeenCalled();
  });
});

describe("rotateWebhookKey", () => {
  it("should throw WebhookNotFoundError when no webhook exists for the institution", async () => {
    await expect(
      rotateWebhookKey({ institutionId: mocks.institution.id })
    ).rejects.toThrowError(WebhookNotFoundError);
  });

  it("should call upsertWebhookPrivateKey with the correct secret name", async () => {
    const cosmosPatch = vi.fn().mockResolvedValue({});

    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: mocks.webhook }),
      }),
    });

    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({ patch: cosmosPatch }),
    });

    await rotateWebhookKey({ institutionId: mocks.institution.id });

    expect(upsertWebhookPrivateKey).toHaveBeenCalledWith(
      mocks.webhook.privateKeySecretName,
      expect.any(String)
    );
  });

  it("should return publicKey and publicKeyThumbprint", async () => {
    const cosmosPatch = vi.fn().mockResolvedValue({});

    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: mocks.webhook }),
      }),
    });

    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({ patch: cosmosPatch }),
    });

    const result = await rotateWebhookKey({ institutionId: mocks.institution.id });

    expect(result).toMatchObject({
      publicKey: expect.any(String),
      publicKeyThumbprint: expect.any(String),
    });
  });

  it("should update the webhook with the new publicKeyThumbprint in Cosmos", async () => {
    const cosmosPatch = vi.fn().mockResolvedValue({});

    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({
        read: vi.fn().mockResolvedValue({ resource: mocks.webhook }),
      }),
    });

    getCosmosContainerClient.mockReturnValueOnce({
      item: vi.fn().mockReturnValue({ patch: cosmosPatch }),
    });

    await rotateWebhookKey({ institutionId: mocks.institution.id });

    expect(cosmosPatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ op: "replace", path: "/publicKeyThumbprint" }),
      ])
    );
  });
});
