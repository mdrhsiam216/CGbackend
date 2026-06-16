## Maps WebSocket API - React Native Implementation Guide

Comprehensive documentation for implementing real-time location tracking using WebSocket in React Native. The system enables caregivers to share their location with clients during active bookings, with location updates broadcast every minute.

### Conventions

- **WebSocket Namespace**: `/maps`
- **Base URL**: `ws://your-backend-url/maps` or `wss://your-backend-url/maps` (for production)
- **Authentication**: JWT token required in connection query parameter or Authorization header
- **Update Frequency**: Location updates should be sent every 60 seconds (1 minute)
- **Caching**: Last known location is cached in Redis and sent on connection/reconnection
- **Response format**: All events include structured data with error handling

### Architecture Overview

The maps system uses WebSocket for real-time bidirectional communication:

1. **Caregiver** connects and sends location updates every minute
2. **Client** connects and receives real-time location updates
3. **Server** validates permissions, caches location in Redis, and broadcasts to authorized clients
4. **Redis** stores last known location (24-hour TTL) for persistence across reconnections

### Prerequisites

Before implementing, ensure you have:

1. **Socket.IO Client** installed in your React Native project
2. **Location permissions** configured for your app
3. **JWT access token** from authentication
4. **Active booking** with status `in_progress` (caregiver must have clocked in)

---

## Installation

### Install Required Packages

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Install Location Services (React Native)

For location tracking, you'll need:

```bash
npm install @react-native-community/geolocation
# or
npm install react-native-geolocation-service
```

For iOS, also install:

```bash
cd ios && pod install
```

### Configure Permissions

#### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### iOS (`ios/YourApp/Info.plist`)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to share it with the client during service</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to share it with the client during service</string>
```

---

## WebSocket Connection

### Connection Setup

The WebSocket connection requires JWT authentication. You can pass the token in two ways:

1. **Query Parameter** (recommended for WebSocket)
2. **Authorization Header** (alternative)

```typescript
import { io, Socket } from 'socket.io-client';

const connectToMapsWebSocket = (accessToken: string): Socket => {
  const socket = io('http://your-backend-url/maps', {
    auth: {
      token: accessToken,
    },
    // Alternative: pass token in query
    query: {
      token: accessToken,
    },
    transports: ['websocket'], // Use WebSocket transport
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return socket;
};
```

### Connection Events

The socket automatically handles connection lifecycle:

```typescript
socket.on('connect', () => {
  console.log('Connected to maps WebSocket');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from maps WebSocket:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Handle authentication errors
  if (error.message.includes('token') || error.message.includes('Unauthorized')) {
    // Refresh token and reconnect
  }
});
```

---

## WebSocket Events

### Client → Server Events

#### `joinBooking`

Join a booking room to receive location updates. Both caregivers and clients can join.

**Payload:**
```typescript
{
  bookingId: string; // UUID of the booking
}
```

**Example:**
```typescript
socket.emit('joinBooking', {
  bookingId: '550e8400-e29b-41d4-a716-446655440000',
});
```

**Response Events:**
- `joinedBooking` - Successfully joined the room
- `locationUpdate` - Last known location (if available)
- `error` - Error joining room

#### `updateLocation`

Send location update (caregivers only). Should be called every 60 seconds.

**Payload:**
```typescript
{
  bookingId: string; // UUID of the booking
  lat: number;       // Latitude (-90 to 90)
  lng: number;       // Longitude (-180 to 180)
}
```

**Example:**
```typescript
socket.emit('updateLocation', {
  bookingId: '550e8400-e29b-41d4-a716-446655440000',
  lat: 23.8103,
  lng: 90.4125,
});
```

**Response Events:**
- `locationUpdated` - Location update acknowledged
- `error` - Error updating location

**Validation:**
- User must be a caregiver
- Booking must be assigned to this caregiver
- Booking status must be `in_progress`
- Caregiver must have clocked in

#### `getLastLocation`

Request the last known location for a booking.

**Payload:**
```typescript
{
  bookingId: string; // UUID of the booking
}
```

**Example:**
```typescript
socket.emit('getLastLocation', {
  bookingId: '550e8400-e29b-41d4-a716-446655440000',
});
```

**Response Events:**
- `locationUpdate` - Last known location
- `noLocation` - No location data available
- `error` - Error getting location

### Server → Client Events

#### `locationUpdate`

Received when a new location update is available or when requesting last location.

**Payload:**
```typescript
{
  lat: number;           // Latitude
  lng: number;           // Longitude
  timestamp: string;      // ISO 8601 timestamp
  bookingId: string;     // UUID of the booking
}
```

**Example:**
```typescript
socket.on('locationUpdate', (data) => {
  console.log('Location update:', data);
  // Update map marker
  updateMapMarker(data.lat, data.lng);
});
```

#### `joinedBooking`

Confirmation that the client successfully joined a booking room.

**Payload:**
```typescript
{
  bookingId: string;
  message: string; // "Successfully joined booking room"
}
```

**Example:**
```typescript
socket.on('joinedBooking', (data) => {
  console.log('Joined booking room:', data.bookingId);
});
```

#### `locationUpdated`

Confirmation that location was successfully updated (caregivers only).

**Payload:**
```typescript
{
  success: boolean;
  message: string; // "Location updated successfully"
}
```

**Example:**
```typescript
socket.on('locationUpdated', (data) => {
  console.log('Location update confirmed:', data.message);
});
```

#### `noLocation`

Received when requesting last location but no cached location exists.

**Payload:**
```typescript
{
  bookingId: string;
  message: string; // "No location data available"
}
```

**Example:**
```typescript
socket.on('noLocation', (data) => {
  console.log('No location available for booking:', data.bookingId);
});
```

#### `error`

Error event for any operation failure.

**Payload:**
```typescript
{
  message: string; // Error message
}
```

**Example:**
```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  // Handle error (show toast, retry, etc.)
});
```

---

## React Native Implementation

### Complete Example: Maps WebSocket Hook

Create a custom hook for managing maps WebSocket connection:

```typescript
// hooks/useMapsWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Geolocation from '@react-native-community/geolocation';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
  bookingId: string;
}

interface UseMapsWebSocketOptions {
  accessToken: string;
  bookingId: string;
  isCaregiver: boolean;
  enabled?: boolean;
  updateInterval?: number; // in milliseconds, default 60000 (1 minute)
}

export const useMapsWebSocket = ({
  accessToken,
  bookingId,
  isCaregiver,
  enabled = true,
  updateInterval = 60000,
}: UseMapsWebSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled || !accessToken || !bookingId) {
      return;
    }

    const socket = io('http://your-backend-url/maps', {
      auth: {
        token: accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to maps WebSocket');
      setIsConnected(true);
      setError(null);

      // Join booking room
      socket.emit('joinBooking', { bookingId });
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    // Location update events
    socket.on('locationUpdate', (data: LocationData) => {
      console.log('Location update received:', data);
      setCurrentLocation(data);
    });

    socket.on('joinedBooking', (data) => {
      console.log('Joined booking room:', data);
    });

    socket.on('locationUpdated', (data) => {
      console.log('Location update confirmed:', data);
    });

    socket.on('noLocation', (data) => {
      console.log('No location available:', data);
    });

    socket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError(err.message);
    });

    // Cleanup on unmount
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      socket.disconnect();
    };
  }, [enabled, accessToken, bookingId]);

  // Get current location
  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }, []);

  // Start location tracking (for caregivers)
  useEffect(() => {
    if (!isCaregiver || !isConnected || !socketRef.current) {
      return;
    }

    const updateLocation = async () => {
      try {
        const { lat, lng } = await getCurrentLocation();
        socketRef.current?.emit('updateLocation', {
          bookingId,
          lat,
          lng,
        });
      } catch (err) {
        console.error('Error getting location:', err);
        setError('Failed to get current location');
      }
    };

    // Send location immediately
    updateLocation();

    // Then send every minute
    locationIntervalRef.current = setInterval(updateLocation, updateInterval);

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isCaregiver, isConnected, bookingId, updateInterval, getCurrentLocation]);

  // Request last location
  const requestLastLocation = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('getLastLocation', { bookingId });
    }
  }, [bookingId, isConnected]);

  return {
    isConnected,
    currentLocation,
    error,
    requestLastLocation,
  };
};
```

### Usage in Component (Caregiver)

```typescript
// screens/CaregiverTrackingScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useMapsWebSocket } from '../hooks/useMapsWebSocket';

const CaregiverTrackingScreen = ({ route }) => {
  const { bookingId, accessToken } = route.params;

  const { isConnected, currentLocation, error } = useMapsWebSocket({
    accessToken,
    bookingId,
    isCaregiver: true,
    enabled: true,
  });

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.lat || 23.8103,
          longitude: currentLocation?.lng || 90.4125,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            title="Your Location"
            description={`Updated: ${new Date(currentLocation.timestamp).toLocaleTimeString()}`}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
  },
  map: {
    flex: 1,
  },
});

export default CaregiverTrackingScreen;
```

### Usage in Component (Client)

```typescript
// screens/ClientTrackingScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useMapsWebSocket } from '../hooks/useMapsWebSocket';

const ClientTrackingScreen = ({ route }) => {
  const { bookingId, accessToken } = route.params;
  const [locationHistory, setLocationHistory] = useState<Array<{ lat: number; lng: number }>>([]);

  const { isConnected, currentLocation, error, requestLastLocation } = useMapsWebSocket({
    accessToken,
    bookingId,
    isCaregiver: false,
    enabled: true,
  });

  // Request last location on mount
  useEffect(() => {
    requestLastLocation();
  }, [requestLastLocation]);

  // Track location history for polyline
  useEffect(() => {
    if (currentLocation) {
      setLocationHistory((prev) => [
        ...prev,
        { lat: currentLocation.lat, lng: currentLocation.lng },
      ]);
    }
  }, [currentLocation]);

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Caregiver Status: {isConnected ? 'Online' : 'Offline'}
        </Text>
        {currentLocation && (
          <Text style={styles.timeText}>
            Last update: {new Date(currentLocation.timestamp).toLocaleTimeString()}
          </Text>
        )}
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.lat || 23.8103,
          longitude: currentLocation?.lng || 90.4125,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        region={
          currentLocation
            ? {
                latitude: currentLocation.lat,
                longitude: currentLocation.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
      >
        {locationHistory.length > 1 && (
          <Polyline
            coordinates={locationHistory}
            strokeColor="#007AFF"
            strokeWidth={3}
          />
        )}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
            }}
            title="Caregiver Location"
            description={`Last updated: ${new Date(currentLocation.timestamp).toLocaleTimeString()}`}
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
  },
  map: {
    flex: 1,
  },
});

export default ClientTrackingScreen;
```

---

## Error Handling

### Common Errors and Solutions

#### Authentication Errors

**Error:** `Unauthorized` or `Invalid token`

**Solution:**
```typescript
socket.on('connect_error', (error) => {
  if (error.message.includes('Unauthorized') || error.message.includes('token')) {
    // Refresh access token
    refreshAccessToken()
      .then((newToken) => {
        // Reconnect with new token
        socket.auth.token = newToken;
        socket.connect();
      })
      .catch((err) => {
        // Redirect to login
        navigation.navigate('Login');
      });
  }
});
```

#### Permission Errors

**Error:** `Only caregivers can update location`

**Solution:**
- Ensure user has caregiver role
- Verify booking assignment
- Check booking status is `in_progress`

#### Location Permission Errors

**Error:** Location permission denied

**Solution:**
```typescript
import { PermissionsAndroid, Platform, Alert } from 'react-native';

const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need your location to share it with the client',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }
  return true; // iOS handles permissions automatically
};
```

---

## Best Practices

### 1. Connection Management

- **Connect only when needed**: Connect to WebSocket only when viewing tracking screen
- **Disconnect on unmount**: Always disconnect when component unmounts
- **Handle reconnection**: Let Socket.IO handle automatic reconnection
- **Monitor connection state**: Show connection status to users

### 2. Location Updates

- **Update frequency**: Send location every 60 seconds (1 minute) as specified
- **High accuracy**: Use `enableHighAccuracy: true` for better location data
- **Error handling**: Handle location errors gracefully
- **Battery optimization**: Consider reducing update frequency if battery is low

### 3. State Management

- **Cache last location**: Store last known location locally for offline viewing
- **Location history**: Optionally store location history for route visualization
- **Error states**: Display clear error messages to users

### 4. Performance

- **Debounce updates**: Avoid sending updates too frequently
- **Optimize map rendering**: Use `react-native-maps` efficiently
- **Memory management**: Clear location history periodically

### 5. Security

- **Token storage**: Store JWT tokens securely (use secure storage)
- **Token refresh**: Implement token refresh mechanism
- **Validate permissions**: Always verify user has access to booking

---

## Testing

### Test Connection

```typescript
// Test WebSocket connection
const testConnection = async () => {
  const socket = connectToMapsWebSocket(accessToken);
  
  socket.on('connect', () => {
    console.log('✅ Connected successfully');
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection failed:', error);
  });
  
  // Test join booking
  socket.emit('joinBooking', { bookingId: 'test-booking-id' });
  
  socket.on('joinedBooking', () => {
    console.log('✅ Joined booking room successfully');
  });
  
  socket.on('error', (error) => {
    console.error('❌ Error:', error);
  });
};
```

### Test Location Updates

```typescript
// Test location update (caregiver only)
const testLocationUpdate = async () => {
  const socket = connectToMapsWebSocket(accessToken);
  
  socket.on('connect', () => {
    socket.emit('updateLocation', {
      bookingId: 'test-booking-id',
      lat: 23.8103,
      lng: 90.4125,
    });
  });
  
  socket.on('locationUpdated', (data) => {
    console.log('✅ Location updated:', data);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Error:', error);
  });
};
```

---

## Troubleshooting

### Connection Issues

1. **Check backend URL**: Ensure WebSocket URL is correct
2. **Verify token**: Ensure JWT token is valid and not expired
3. **Check network**: Ensure device has internet connection
4. **Firewall**: Check if firewall is blocking WebSocket connections

### Location Issues

1. **Permissions**: Ensure location permissions are granted
2. **GPS**: Ensure GPS is enabled on device
3. **Accuracy**: Check location accuracy settings
4. **Background**: For background tracking, configure background location permissions

### Performance Issues

1. **Reduce update frequency**: If battery drains, reduce update interval
2. **Optimize map**: Reduce map complexity and markers
3. **Memory**: Clear location history periodically

---

## API Reference Summary

### Events Table

| Event | Direction | When | Payload |
|-------|-----------|------|---------|
| `joinBooking` | Client → Server | Join booking room | `{ bookingId: string }` |
| `updateLocation` | Client → Server | Send location (caregiver) | `{ bookingId, lat, lng }` |
| `getLastLocation` | Client → Server | Request cached location | `{ bookingId: string }` |
| `locationUpdate` | Server → Client | New location received | `{ lat, lng, timestamp, bookingId }` |
| `joinedBooking` | Server → Client | Room joined successfully | `{ bookingId, message }` |
| `locationUpdated` | Server → Client | Location update confirmed | `{ success, message }` |
| `noLocation` | Server → Client | No cached location | `{ bookingId, message }` |
| `error` | Server → Client | Error occurred | `{ message: string }` |

### Connection Options

```typescript
{
  auth: {
    token: string; // JWT access token
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
}
```

---

## Support

For issues or questions:
- Check error messages in WebSocket events
- Verify booking status and permissions
- Ensure caregiver has clocked in
- Check backend logs for detailed error information
