import * as t from "io-ts";

import { Id } from "./id";

export const NotificationId = Id;

export const Notification = t.type({
  ioMessageId: NotificationId,
});

export type Notification = t.TypeOf<typeof Notification>;
