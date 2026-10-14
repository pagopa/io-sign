---
"@io-sign/io-sign": minor
---

IONotificationService now returns NotificationNotAllowedError, mapped to 403 Forbidden, when the citizen doesn't allow messages from the service (previously ActionNotAllowedError, mapped to 400 Bad Request)
