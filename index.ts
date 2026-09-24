// Register background sync headless task at top-level before React tree mounts
import './src/services/backgroundSyncService';

// expo-router/entry automatically configures and registers the root component for Expo Router
import 'expo-router/entry';
