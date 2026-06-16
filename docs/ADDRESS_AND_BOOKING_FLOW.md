# Address and Booking Flow Documentation

## Overview

This document describes the simplified address and booking flow for the caregiver platform. The system now requires addresses to be created separately before creating bookings.

## System Flow

### 1. User Creates/Manages Addresses (Using Address API)

First, users must create one or more addresses using the Address API. Each address includes:
- Street address, city, state, postal code, country
- Coordinates (latitude, longitude) - typically from a map picker
- Label (e.g., "Home", "Office", "Parent's House")
- Default flag (one address can be marked as default)

### 2. User Creates Booking (Using Booking API)

When creating a booking, the user selects an existing `addressId` from their saved addresses. The booking system will:
- Verify the address exists and belongs to the user
- Use the address coordinates for location-based features
- Link the booking to the address

---

## API Endpoints

### Address Management

#### 1. Create Address
```http
POST /addresses
Authorization: Bearer {token}
Content-Type: application/json

{
  "streetAddress": "123 Main St",
  "apartment": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "coordinates": {
    "lat": 40.7128,
    "lng": -74.006
  },
  "isDefault": false,
  "label": "Home"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "streetAddress": "123 Main St",
  "apartment": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "coordinates": {
    "lat": 40.7128,
    "lng": -74.006
  },
  "isDefault": false,
  "label": "Home",
  "userId": "user-uuid",
  "createdAt": "2026-02-04T10:00:00.000Z",
  "updatedAt": "2026-02-04T10:00:00.000Z"
}
```

#### 2. Get All User Addresses
```http
GET /addresses
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "streetAddress": "123 Main St",
    "apartment": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.006
    },
    "isDefault": true,
    "label": "Home",
    "userId": "user-uuid",
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:00:00.000Z"
  },
  {
    "id": "456e7890-e89b-12d3-a456-426614174111",
    "streetAddress": "456 Office Blvd",
    "city": "New York",
    "state": "NY",
    "postalCode": "10002",
    "country": "USA",
    "coordinates": {
      "lat": 40.7589,
      "lng": -73.9851
    },
    "isDefault": false,
    "label": "Office",
    "userId": "user-uuid",
    "createdAt": "2026-02-04T11:00:00.000Z",
    "updatedAt": "2026-02-04T11:00:00.000Z"
  }
]
```

#### 3. Get Default Address
```http
GET /addresses/default
Authorization: Bearer {token}
```

#### 4. Get Single Address
```http
GET /addresses/{addressId}
Authorization: Bearer {token}
```

#### 5. Update Address
```http
PATCH /addresses/{addressId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Work",
  "apartment": "Suite 200"
}
```

#### 6. Set Default Address
```http
PATCH /addresses/{addressId}/set-default
Authorization: Bearer {token}
```

#### 7. Delete Address
```http
DELETE /addresses/{addressId}
Authorization: Bearer {token}
```

---

### Booking Management

#### Create Booking
```http
POST /bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceType": "Elderly Care",
  "date": "2026-02-10",
  "startTime": "09:00",
  "duration": 4,
  "addressId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "specialInstructions": "Please bring your own lunch.",
  "emergencyContacts": {
    "primary": {
      "name": "John Doe",
      "phone": "+1234567890",
      "relationship": "Father"
    },
    "secondary": {
      "name": "Jane Doe",
      "phone": "+0987654321",
      "relationship": "Mother"
    }
  },
  "caregiverId": "caregiver-uuid",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "booking": {
    "id": "booking-uuid",
    "serviceType": "Elderly Care",
    "date": "2026-02-10",
    "startTime": "09:00",
    "duration": 4,
    "address": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "streetAddress": "123 Main St",
      "apartment": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "coordinates": {
        "lat": 40.7128,
        "lng": -74.006
      },
      "label": "Home"
    },
    "email": "user@example.com",
    "specialInstructions": "Please bring your own lunch.",
    "status": "pending",
    "userId": "user-uuid",
    "caregiverId": "caregiver-uuid",
    "emergencyContacts": {
      "primary": {
        "name": "John Doe",
        "phone": "+1234567890",
        "relationship": "Father"
      }
    },
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:00:00.000Z"
  },
  "paymentUrl": "https://payment-gateway.com/...",
  "PlatformFee": 5.00
}
```

---

## Frontend Implementation Guide

### Recommended User Flow

1. **Address Management Screen**
   - Show list of user's addresses (GET /addresses)
   - Allow creating new addresses with map picker for coordinates
   - Allow editing/deleting addresses
   - Allow setting default address
   - Show visual indicator for default address

2. **Create Booking Screen**
   - Load user's addresses (GET /addresses)
   - Display address selector (dropdown or cards)
   - Pre-select default address if available
   - Show "Add New Address" button that opens address creation form
   - Show selected address details (street, city, label) in booking form
   - Submit booking with selected `addressId`

### Sample React/Vue Component Flow

```javascript
// 1. Fetch addresses when component mounts
const [addresses, setAddresses] = useState([]);
const [selectedAddressId, setSelectedAddressId] = useState(null);

useEffect(() => {
  fetchAddresses();
}, []);

async function fetchAddresses() {
  const response = await fetch('/addresses', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setAddresses(data);
  
  // Pre-select default address
  const defaultAddress = data.find(addr => addr.isDefault);
  if (defaultAddress) {
    setSelectedAddressId(defaultAddress.id);
  }
}

// 2. Handle address creation
async function createAddress(addressData) {
  const response = await fetch('/addresses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(addressData)
  });
  const newAddress = await response.json();
  
  // Refresh addresses list
  await fetchAddresses();
  
  // Select the newly created address
  setSelectedAddressId(newAddress.id);
}

// 3. Handle booking creation
async function createBooking(bookingData) {
  const response = await fetch('/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...bookingData,
      addressId: selectedAddressId, // Use the selected address ID
    })
  });
  
  const result = await response.json();
  
  // Redirect to payment URL
  if (result.paymentUrl) {
    window.location.href = result.paymentUrl;
  }
}
```

### Map Integration for Address Creation

When creating a new address, use a map picker (Google Maps, Mapbox, etc.) to:

1. Allow user to search for their address
2. Let user drag a pin to exact location
3. Capture latitude and longitude from the selected point
4. Auto-fill street address, city, state, postal code from geocoding
5. Let user add custom label (Home, Office, etc.)

Example with Google Maps:

```javascript
function AddressMapPicker({ onAddressSelected }) {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    // Update marker position
    marker.setPosition({ lat, lng });
    
    // Reverse geocode to get address details
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addressComponents = parseGoogleAddressComponents(results[0]);
        
        onAddressSelected({
          streetAddress: addressComponents.streetAddress,
          city: addressComponents.city,
          state: addressComponents.state,
          postalCode: addressComponents.postalCode,
          country: addressComponents.country,
          coordinates: { lat, lng }
        });
      }
    });
  };

  return (
    <GoogleMap
      onLoad={setMap}
      onClick={handleMapClick}
      center={{ lat: 40.7128, lng: -74.006 }}
      zoom={12}
    >
      <Marker
        position={marker?.position}
        draggable={true}
      />
    </GoogleMap>
  );
}
```

---

## Validation Rules

### Address Validation
- `streetAddress`: Required, string
- `city`: Required, string
- `state`: Required, string
- `postalCode`: Required, string
- `country`: Required, string
- `coordinates`: Optional, but recommended for location features
  - `lat`: Number, between -90 and 90
  - `lng`: Number, between -180 and 180
- `label`: Optional, string (e.g., "Home", "Office")
- `isDefault`: Optional, boolean (defaults to false)

### Booking Validation
- `addressId`: Required, must be a valid UUID of an address that belongs to the user
- All other booking fields follow existing validation rules

---

## Error Handling

### Common Error Responses

#### Address Not Found
```json
{
  "statusCode": 404,
  "message": "Address not found or does not belong to user",
  "error": "Not Found"
}
```

#### Invalid Address ID
```json
{
  "statusCode": 400,
  "message": "addressId must be a UUID",
  "error": "Bad Request"
}
```

### Frontend Error Handling

```javascript
async function createBooking(bookingData) {
  try {
    const response = await fetch('/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      if (error.statusCode === 404 && error.message.includes('Address not found')) {
        // Address was deleted or doesn't exist
        alert('The selected address is no longer available. Please select a different address.');
        // Refresh addresses list
        await fetchAddresses();
        return;
      }
      
      throw new Error(error.message);
    }
    
    const result = await response.json();
    // Handle success...
    
  } catch (error) {
    console.error('Failed to create booking:', error);
    // Show error to user
  }
}
```

---

## Database Schema

### addresses Table
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streetAddress VARCHAR(255) NOT NULL,
  apartment VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postalCode VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  coordinates JSONB, -- { lat: number, lng: number }
  isDefault BOOLEAN DEFAULT false,
  label VARCHAR(50),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### bookings Table (address-related fields)
```sql
-- Booking now references address table
addressId UUID REFERENCES addresses(id) ON DELETE SET NULL
```

---

## Benefits of This Approach

1. **Reusability**: Users can save multiple addresses and reuse them for different bookings
2. **Better UX**: Users don't have to re-enter address details for each booking
3. **Data Integrity**: Address data is centralized and easier to maintain
4. **Location Features**: Addresses with coordinates enable distance-based caregiver search
5. **Flexibility**: Users can manage addresses independently of bookings
6. **Performance**: Reduces data duplication and improves query performance

---

## Migration Notes

Existing data has been migrated from:
- `caregiver_profiles.address` → `addresses` table
- `caregiver_profiles.homeLocation` → `addresses.coordinates`
- `bookings.location` → `addresses` table

All relationships have been updated to use `addressId` foreign keys.
