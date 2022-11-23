import * as E from "io-ts/lib/Encoder";

import { Notification } from "@internal/io-sign/notification";
import { NotificationDetailView as NotificationApiModel } from "../models/NotificationDetailView";

export const NotificationToApiModel: E.Encoder<
  NotificationApiModel,
  Notification
> = {
  encode: ({ ioMessageId: io_message_id }) => ({
    io_message_id,
  }),
};
