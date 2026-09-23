const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to inject NotificationListenerService into AndroidManifest.xml
 */
const withNotificationListener = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (!application) {
      return config;
    }

    if (!application.service) {
      application.service = [];
    }

    const serviceName = 'expo.modules.notificationlistener.ExpenseNotificationListenerService';

    // Check if the service already exists
    const existingService = application.service.find(
      (s) => s.$ && s.$['android:name'] === serviceName
    );

    if (!existingService) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'Expense Tracker',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withNotificationListener;
