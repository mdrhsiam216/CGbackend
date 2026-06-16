# Firebase Push Notifications - React Native Integration Guide

This guide explains how to integrate Firebase Cloud Messaging (FCM) push notifications in your React Native mobile app with the caregiver platform backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Android Setup](#android-setup)
4. [iOS Setup](#ios-setup)
5. [React Native Implementation](#react-native-implementation)
6. [Backend API Reference](#backend-api-reference)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- React Native 0.60+ (with auto-linking support)
- Firebase project created at [Firebase Console](https://console.firebase.google.com)
- Android Studio (for Android development)
- Xcode (for iOS development)
- Apple Developer Account (for iOS push notifications)

---

## Installation

### 1. Install Required Packages

```bash
# Install React Native Firebase core module
npm install @react-native-firebase/app

# Install Firebase Cloud Messaging module
npm install @react-native-firebase/messaging

# For iOS, install pods
cd ios && pod install && cd ..
```

### 2. Download Firebase Configuration Files

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project settings
4. Under "Your apps", add Android and iOS apps if not already added
5. Download:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS

---

## Android Setup

### 1. Place Configuration File

Copy `google-services.json` to:

```
android/app/google-services.json
```

### 2. Update Project-Level build.gradle

```gradle
// android/build.gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 3. Update App-Level build.gradle

```gradle
// android/app/build.gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // Add this line

android {
    // ...
}

dependencies {
    // Firebase BoM (Bill of Materials)
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### 4. Update AndroidManifest.xml

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- For Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application>
        <!-- Default notification channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="default" />

        <!-- Default notification icon -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />

        <!-- Default notification color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorAccent" />
    </application>
</manifest>
```

### 5. Create Notification Channel (Android 8+)

Create a file `android/app/src/main/java/com/yourapp/NotificationService.java`:

```java
package com.yourapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

public class NotificationService {
    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "default",
                "Default Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Default notification channel");
            channel.enableVibration(true);
            channel.enableLights(true);

            NotificationManager manager = context.getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
}
```

Call this in your `MainApplication.java`:

```java
@Override
public void onCreate() {
    super.onCreate();
    NotificationService.createNotificationChannel(this);
    // ... rest of onCreate
}
```

---

## iOS Setup

### 1. Place Configuration File

Copy `GoogleService-Info.plist` to:

```
ios/YourAppName/GoogleService-Info.plist
```

Add it to your Xcode project by:

1. Open Xcode
2. Right-click on your app folder
3. Select "Add Files to [YourAppName]"
4. Select `GoogleService-Info.plist`
5. Ensure "Copy items if needed" is checked

### 2. Update AppDelegate.m (or AppDelegate.mm)

```objective-c
// ios/YourAppName/AppDelegate.m
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>
#import <RNFirebaseMessaging.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    // Configure Firebase
    [FIRApp configure];

    // Request notification permissions
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;

    // Register for remote notifications
    [application registerForRemoteNotifications];

    // ... rest of your code
    return YES;
}

// Handle device token registration
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
    [FIRMessaging messaging].APNSToken = deviceToken;
}

// Handle notification when app is in foreground
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
    completionHandler(UNNotificationPresentationOptionAlert |
                      UNNotificationPresentationOptionBadge |
                      UNNotificationPresentationOptionSound);
}

// Handle notification tap
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
    NSDictionary *userInfo = response.notification.request.content.userInfo;
    // Handle notification data
    completionHandler();
}

@end
```

### 3. Enable Push Notification Capabilities in Xcode

1. Open your project in Xcode
2. Select your project in the navigator
3. Select your app target
4. Go to "Signing & Capabilities" tab
5. Click "+ Capability" and add:
   - **Push Notifications**
   - **Background Modes** (check "Remote notifications")

### 4. Configure APNs (Apple Push Notification service)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to Certificates, Identifiers & Profiles
3. Under Keys, create a new key with APNs enabled
4. Download the `.p8` key file
5. In Firebase Console → Project Settings → Cloud Messaging:
   - Upload the APNs Auth Key (.p8 file)
   - Enter Key ID and Team ID

---

## React Native Implementation

### 1. Create Notification Service

Create a file `src/services/NotificationService.ts`:

```typescript
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'YOUR_BACKEND_URL';

interface NotificationData {
  [key: string]: string;
}

class NotificationService {
  private authToken: string | null = null;

  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      // For Android 13+ (API 33+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permission denied');
          return false;
        }
      }

      // Request Firebase messaging permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted:', authStatus);
        return true;
      }

      console.log('Notification permission denied');
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token and register with backend
   */
  async registerDevice(): Promise<string | null> {
    try {
      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // Register with backend
      await this.registerTokenWithBackend(token);

      // Store token locally
      await AsyncStorage.setItem('fcmToken', token);

      return token;
    } catch (error) {
      console.error('Error registering device:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  private async registerTokenWithBackend(deviceToken: string): Promise<void> {
    if (!this.authToken) {
      console.warn('No auth token set. Cannot register device.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/register-device`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({
            deviceToken,
            deviceType: Platform.OS, // 'ios' or 'android'
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to register device: ${response.status}`);
      }

      console.log('Device registered with backend successfully');
    } catch (error) {
      console.error('Error registering device with backend:', error);
      throw error;
    }
  }

  /**
   * Unregister device from backend
   */
  async unregisterDevice(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('fcmToken');
      if (!token || !this.authToken) return;

      await fetch(
        `${API_BASE_URL}/notifications/unregister-device?deviceToken=${token}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        },
      );

      await AsyncStorage.removeItem('fcmToken');
      console.log('Device unregistered successfully');
    } catch (error) {
      console.error('Error unregistering device:', error);
    }
  }

  /**
   * Subscribe to a topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      // Subscribe via Firebase
      await messaging().subscribeToTopic(topic);

      // Also notify backend
      if (this.authToken) {
        await fetch(`${API_BASE_URL}/notifications/subscribe-topic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ topic }),
        });
      }

      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);

      if (this.authToken) {
        await fetch(`${API_BASE_URL}/notifications/unsubscribe-topic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify({ topic }),
        });
      }

      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(
    onForegroundMessage: (
      message: FirebaseMessagingTypes.RemoteMessage,
    ) => void,
    onNotificationOpened: (
      message: FirebaseMessagingTypes.RemoteMessage,
    ) => void,
    onBackgroundMessage?: (
      message: FirebaseMessagingTypes.RemoteMessage,
    ) => Promise<void>,
  ): () => void {
    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage) => {
        console.log('Foreground notification received:', remoteMessage);
        onForegroundMessage(remoteMessage);
      },
    );

    // Notification opened app from background state
    const unsubscribeBackground = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log('Notification opened app from background:', remoteMessage);
        onNotificationOpened(remoteMessage);
      },
    );

    // Background message handler (must be set outside of component)
    if (onBackgroundMessage) {
      messaging().setBackgroundMessageHandler(onBackgroundMessage);
    }

    // Return cleanup function
    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }

  /**
   * Check if app was opened from a notification (quit state)
   */
  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log(
        'App opened from quit state by notification:',
        initialNotification,
      );
    }
    return initialNotification;
  }

  /**
   * Listen for token refresh
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      await this.registerTokenWithBackend(token);
      callback(token);
    });
  }

  /**
   * Get badge count (iOS only)
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      // Implement using a library like react-native-push-notification
      return 0;
    }
    return 0;
  }

  /**
   * Set badge count (iOS only)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      // Implement using a library like react-native-push-notification
    }
  }
}

export default new NotificationService();
```

### 2. Initialize in App Entry Point

In your `App.tsx` or main entry file:

```typescript
import React, { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import NotificationService from './services/NotificationService';

// Register background handler (must be outside component)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message handled:', remoteMessage);
  // Handle the background message
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Initialize notifications after authentication
    if (isAuthenticated && authToken) {
      initializeNotifications();
    }
  }, [isAuthenticated, authToken]);

  const initializeNotifications = async () => {
    // Set auth token for API calls
    NotificationService.setAuthToken(authToken!);

    // Request permission
    const hasPermission = await NotificationService.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    // Register device
    await NotificationService.registerDevice();

    // Check if app was opened from notification (quit state)
    const initialNotification =
      await NotificationService.getInitialNotification();
    if (initialNotification) {
      handleNotificationNavigation(initialNotification.data);
    }

    // Set up notification listeners
    const unsubscribe = NotificationService.setupNotificationListeners(
      // Foreground handler
      (message) => {
        // Show local notification or alert
        Alert.alert(
          message.notification?.title || 'Notification',
          message.notification?.body || '',
          [
            { text: 'Dismiss', style: 'cancel' },
            {
              text: 'View',
              onPress: () => handleNotificationNavigation(message.data),
            },
          ],
        );
      },
      // Background/Quit opened handler
      (message) => {
        handleNotificationNavigation(message.data);
      },
    );

    // Listen for token refresh
    const unsubscribeTokenRefresh = NotificationService.onTokenRefresh(
      (token) => {
        console.log('Token refreshed:', token);
      },
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
      unsubscribeTokenRefresh();
    };
  };

  const handleNotificationNavigation = (data: any) => {
    // Handle navigation based on notification data
    if (data?.type === 'booking') {
      // Navigate to booking screen
      // navigation.navigate('Booking', { bookingId: data.bookingId });
    } else if (data?.type === 'message') {
      // Navigate to chat screen
      // navigation.navigate('Chat', { conversationId: data.conversationId });
    }
    // Add more navigation cases as needed
  };

  // ... rest of your app
}

export default App;
```

### 3. Displaying Local Notifications (Foreground)

For showing notifications when app is in foreground, you can use `@notifee/react-native`:

```bash
npm install @notifee/react-native
cd ios && pod install
```

```typescript
import notifee, { AndroidImportance } from '@notifee/react-native';

async function displayLocalNotification(
  title: string,
  body: string,
  data?: object,
) {
  // Create channel (Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  // Display notification
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_launcher', // Your app icon
    },
    ios: {
      sound: 'default',
    },
  });
}
```

---

## Backend API Reference

### Register Device

```http
POST /notifications/register-device
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceToken": "fcm_device_token_here",
  "deviceType": "android" | "ios"
}
```

### Unregister Device

```http
DELETE /notifications/unregister-device?deviceToken=<token>
Authorization: Bearer <token>
```

### Get User Devices

```http
GET /notifications/devices
Authorization: Bearer <token>
```

### Send Notification to User

```http
POST /notifications/send-to-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "title": "Notification Title",
  "body": "Notification body text",
  "data": {
    "type": "booking",
    "bookingId": "booking-uuid"
  }
}
```

### Send to Multiple Users

```http
POST /notifications/send-multiple
Authorization: Bearer <token>
Content-Type: application/json

{
  "userIds": ["user-uuid-1", "user-uuid-2"],
  "title": "Notification Title",
  "body": "Notification body text",
  "data": {}
}
```

### Send to Topic

```http
POST /notifications/send-topic
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "promotions",
  "title": "New Promotion!",
  "body": "Check out our latest offers",
  "data": {}
}
```

### Subscribe to Topic

```http
POST /notifications/subscribe-topic
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "promotions"
}
```

### Unsubscribe from Topic

```http
POST /notifications/unsubscribe-topic
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "promotions"
}
```

### Get Notification History

```http
GET /notifications/history?limit=20&offset=0
Authorization: Bearer <token>
```

### Check Service Status

```http
GET /notifications/status
Authorization: Bearer <token>
```

---

## Troubleshooting

### Common Issues

#### 1. FCM Token not generated

- Ensure Firebase is properly configured
- Check that `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is correctly placed
- Verify internet connectivity

#### 2. Notifications not received on Android

- Check that notification channel is created (Android 8+)
- Verify `POST_NOTIFICATIONS` permission is granted (Android 13+)
- Check battery optimization settings
- Ensure app is not in "Restricted" mode

#### 3. Notifications not received on iOS

- Verify APNs key is uploaded to Firebase
- Check Push Notification capability is enabled in Xcode
- Ensure `registerForRemoteNotifications` is called
- Test on physical device (simulator doesn't support push)

#### 4. Background notifications not working

- Verify `setBackgroundMessageHandler` is registered outside components
- Check Background Modes capability includes "Remote notifications" (iOS)
- Ensure notification has `data` payload for background handling

#### 5. Token refresh issues

- Implement `onTokenRefresh` listener
- Re-register token with backend on refresh
- Handle token invalidation gracefully

### Debug Tips

```typescript
// Enable debug logging
messaging().setLogLevel('debug');

// Check current token
const token = await messaging().getToken();
console.log('Current FCM token:', token);

// Check permission status
const authStatus = await messaging().hasPermission();
console.log('Permission status:', authStatus);

// Check if auto-init is enabled
const isAutoInitEnabled = messaging().isAutoInitEnabled;
console.log('Auto-init enabled:', isAutoInitEnabled);
```

### Testing Notifications

1. **Using Firebase Console:**
   - Go to Firebase Console → Cloud Messaging
   - Click "Send your first message"
   - Enter title and body
   - Target specific devices using FCM token

2. **Using cURL:**

```bash
curl -X POST \
  'YOUR_BACKEND_URL/notifications/send-to-user' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "target-user-id",
    "title": "Test Notification",
    "body": "This is a test message",
    "data": {"type": "test"}
  }'
```

---

## Environment Configuration

This project uses environment variables both on **React Native (mobile app)** and on the **backend**.

### React Native Environment (.env)

For React Native, you typically use a library like `react-native-config` (or your own env management) to inject environment values at build time.

Create a `.env` file in your React Native project root:

```env
# API base URL for backend
API_BASE_URL=https://api.your-domain.com

# Optional: environment flags
APP_ENV=development        # development | staging | production
ENABLE_PUSH_DEBUG_LOGS=true
```

**Usage in React Native code:**

If you use `react-native-config`:

```typescript
import Config from 'react-native-config';

const API_BASE_URL = Config.API_BASE_URL;
```

Then update `NotificationService.ts` to use the env value instead of a hard‑coded string:

```typescript
// Before:
// const API_BASE_URL = 'YOUR_BACKEND_URL';

// After:
import Config from 'react-native-config';
const API_BASE_URL = Config.API_BASE_URL;
```

This ensures you can easily switch between development, staging, and production backends without code changes.

### Backend Environment (.env / .env.local)

The backend loads environment variables from `.env.local` (first) and `.env` (fallback), based on:

```typescript
// src/app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
  cache: true,
});
```

#### Firebase Admin SDK Configuration

These names are already correctly used in `FirebaseService`:

```typescript
// src/shared/push-notification/services/firebase.service.ts
const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
```

So your backend `.env` / `.env.local` **must** use exactly these keys:

```env
# Firebase Admin SDK Configuration (BACKEND)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# IMPORTANT: keep \n escaped exactly like this; code will convert them to real newlines
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

#### How to obtain these values

1. Go to Firebase Console → Project Settings → **Service Accounts**
2. Click **"Generate new private key"**
3. Open the downloaded JSON file
4. Extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (make sure to escape newlines as `\n`)

#### `.env.example` recommendation

Currently there is no `.env.example` file in `codes/backend`. To help other developers, create one with the same keys but placeholder values, for example:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

You can also include database, JWT, and other configuration keys in that example file as needed.

---

## Best Practices

1. **Always request permissions before registering device**
2. **Handle token refresh** - FCM tokens can change
3. **Implement proper error handling** for network failures
4. **Test on real devices** - simulators have limitations
5. **Use topics for broadcast notifications** instead of looping through users
6. **Store notification history** for user reference
7. **Implement deep linking** for notification actions
8. **Handle notification badge counts** appropriately
9. **Respect user preferences** - allow notification opt-out
10. **Monitor delivery rates** in Firebase Console
