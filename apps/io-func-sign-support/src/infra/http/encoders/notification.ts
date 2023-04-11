import { Notification } from "@io-sign/io-sign/notification";
import { Notification as NotificationApiModel } from "../models/Notification";

export const notificationToApiModel = (
  notification?: Notification
): NotificationApiModel | undefined =>
  notification !== undefined
    ? { io_message_id: notification.ioMessageId }
    : undefined;
