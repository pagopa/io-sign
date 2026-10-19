import { describe, it, expect, vi } from "vitest";

import * as E from "fp-ts/lib/Either";
import { FiscalCode, NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { Ulid } from "@pagopa/ts-commons/lib/strings";

import { IONotificationService } from "../message";
import { IOApiClient } from "../client";
import { NotificationNotAllowedError } from "../../../error";

const fiscalCode = "RSSMRA82M01H501X" as FiscalCode;
const configurationId = "01HXYZ0000000000000000000A" as Ulid;
const message = {
  subject: "Ecco i documenti firmati",
  markdown: "I documenti che hai firmato sono pronti!"
};

const makeIOApiClient = (senderAllowed: boolean) => {
  const getProfile = vi.fn(() =>
    Promise.resolve(
      E.right({ status: 200, value: { sender_allowed: senderAllowed } })
    )
  );
  const submitMessageforUserWithFiscalCodeInBody = vi.fn(() =>
    Promise.resolve(E.right({ status: 201, value: { id: "message-id" } }))
  );
  const ioApiClient = {
    client: { getProfile, submitMessageforUserWithFiscalCodeInBody },
    baseUrl: "https://io.message.test/api/v1" as NonEmptyString
  } as unknown as IOApiClient;
  return { ioApiClient, submitMessageforUserWithFiscalCodeInBody };
};

describe("IONotificationService", () => {
  describe("submit", () => {
    it("should fail with NotificationNotAllowedError when the citizen is not enabled to receive messages", async () => {
      const { ioApiClient, submitMessageforUserWithFiscalCodeInBody } =
        makeIOApiClient(false);
      const service = new IONotificationService(ioApiClient, configurationId);

      const result = await service.submit(fiscalCode, message)();

      expect(result).toEqual(
        E.left(expect.any(NotificationNotAllowedError))
      );
      expect(submitMessageforUserWithFiscalCodeInBody).not.toHaveBeenCalled();
    });

    it("should keep the message used by the monitoring alerts", async () => {
      const { ioApiClient } = makeIOApiClient(false);
      const service = new IONotificationService(ioApiClient, configurationId);

      const result = await service.submit(fiscalCode, message)();

      expect(E.isLeft(result) && result.left.message).toContain(
        "It is not allowed to send a message to this user"
      );
    });

    it("should send the message when the citizen is enabled to receive messages", async () => {
      const { ioApiClient, submitMessageforUserWithFiscalCodeInBody } =
        makeIOApiClient(true);
      const service = new IONotificationService(ioApiClient, configurationId);

      const result = await service.submit(fiscalCode, message)();

      expect(result).toEqual(E.right({ ioMessageId: "message-id" }));
      expect(submitMessageforUserWithFiscalCodeInBody).toHaveBeenCalledOnce();
    });
  });
});
