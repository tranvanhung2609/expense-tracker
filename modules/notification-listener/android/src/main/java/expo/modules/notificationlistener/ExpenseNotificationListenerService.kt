package expo.modules.notificationlistener

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class ExpenseNotificationListenerService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        try {
            val packageName = sbn.packageName ?: return
            val notification = sbn.notification ?: return
            val extras = notification.extras ?: return

            val title = extras.getString(Notification.EXTRA_TITLE) 
                ?: extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() 
                ?: ""

            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
            val body = if (bigText.isNotBlank()) bigText else text

            if (title.isBlank() && body.isBlank()) return

            Log.d("ExpenseNotification", "Notification received from $packageName: $title - $body")

            NotificationListenerModule.dispatchNotificationEvent(
                packageName = packageName,
                title = title,
                body = body,
                timestamp = sbn.postTime
            )
        } catch (e: Exception) {
            Log.e("ExpenseNotification", "Error processing notification: ${e.message}", e)
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d("ExpenseNotification", "ExpenseNotificationListenerService connected successfully!")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d("ExpenseNotification", "ExpenseNotificationListenerService disconnected.")
    }
}
