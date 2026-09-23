package expo.modules.notificationlistener

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationListenerModule : Module() {

    companion object {
        @Volatile
        private var activeInstance: NotificationListenerModule? = null

        fun dispatchNotificationEvent(
            packageName: String,
            title: String,
            body: String,
            timestamp: Long
        ) {
            val module = activeInstance ?: return
            try {
                module.sendEvent(
                    "onNotificationReceived",
                    mapOf(
                        "packageName" to packageName,
                        "title" to title,
                        "body" to body,
                        "timestamp" to timestamp.toDouble()
                    )
                )
            } catch (e: Exception) {
                // Ignore if JS side is not ready or listener is detached
            }
        }
    }

    override fun definition() = ModuleDefinition {
        Name("NotificationListener")

        Events("onNotificationReceived")

        OnCreate {
            activeInstance = this@NotificationListenerModule
        }

        OnDestroy {
            if (activeInstance === this@NotificationListenerModule) {
                activeInstance = null
            }
        }

        Function("isPermissionGranted") {
            val context = appContext.reactContext ?: return@Function false
            try {
                val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(context)
                enabledPackages.contains(context.packageName)
            } catch (e: Exception) {
                false
            }
        }

        Function("openNotificationSettings") {
            val context = appContext.reactContext ?: return@Function false
            try {
                val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                true
            } catch (e: Exception) {
                try {
                    val fallbackIntent = Intent(Settings.ACTION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(fallbackIntent)
                    true
                } catch (err: Exception) {
                    false
                }
            }
        }
    }
}
