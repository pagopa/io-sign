import * as E from "io-ts/lib/Encoder";

import { Webhook } from "@/webhook";
import { WebhookStatusEnum } from "../models/WebhookStatus";
import {
  WebhookView as WebhookViewModel,
  type WebhookView as WebhookViewModelType
} from "../models/WebhookView";

export const WebhookToApiModel: E.Encoder<WebhookViewModelType, Webhook> = {
  encode: (webhook) =>
    WebhookViewModel.encode({
      url: webhook.url,
      privateKeySecretName:
        webhook.privateKeySecretName as WebhookViewModelType["privateKeySecretName"],
      publicKeyThumbprint:
        webhook.publicKeyThumbprint as WebhookViewModelType["publicKeyThumbprint"],
      issuerId: webhook.issuerId as WebhookViewModelType["issuerId"],
      status: webhook.status as WebhookStatusEnum
    })
};
