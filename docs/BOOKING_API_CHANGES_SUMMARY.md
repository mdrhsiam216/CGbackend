# Booking API Changes Summary

## What Changed

The booking system has been simplified to use a single `addressId` field instead of accepting nested address objects.

## Old Request Format (❌ No longer supported)

```json
{
  "serviceType": "Elderly Care",
  "date": "2026-01-28",
  "startTime": "09:00",
  "duration": 4,
  "addressId": "123e4567-e89b-12d3-a456-426614174000",
  "address": {
    "streetAddress": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "coordinates": { "lat": 40.7128, "lng": -74.006 }
  },
  "email": "user@example.com",
  "caregiverId": "...",
  "userId": "..."
}
```

## New Request Format (✅ Current)

```json
{
  "serviceType": "Elderly Care",
  "date": "2026-01-28",
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
    }
  },
  "caregiverId": "...",
  "userId": "..."
}
```

## Required Frontend Changes

### 1. Create Address First (Before Booking)

```javascript
// Step 1: Create or select an address
const address = await fetch('/addresses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    streetAddress: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
    coordinates: { lat: 40.7128, lng: -74.006 },
    label: 'Home'
  })
});

const addressData = await address.json();
const addressId = addressData.id;
```

### 2. Use Address ID in Booking

```javascript
// Step 2: Create booking with addressId
const booking = await fetch('/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    serviceType: 'Elderly Care',
    date: '2026-02-10',
    startTime: '09:00',
    duration: 4,
    addressId: addressId, // Use the address ID from step 1
    email: 'user@example.com',
    emergencyContacts: { /* ... */ },
    caregiverId: 'caregiver-uuid',
    userId: 'user-uuid'
  })
});
```

### 3. Load Existing Addresses

```javascript
// Get all user addresses for selection
const addresses = await fetch('/addresses', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const addressList = await addresses.json();
// Display in dropdown/selector
```

## Benefits

1. ✅ **Reusable Addresses**: Users can save and reuse addresses
2. ✅ **Simpler API**: Single `addressId` field instead of nested object
3. ✅ **Better Data Management**: Addresses managed separately from bookings
4. ✅ **Improved UX**: Users don't re-enter address for every booking
5. ✅ **Location Features**: Addresses with coordinates enable distance-based search

## Validation

- `addressId` is **required** and must be a valid UUID
- The address must exist and belong to the authenticated user
- If address is invalid, you'll get a 404 error

## Error Handling

```javascript
if (error.statusCode === 404 && error.message.includes('Address not found')) {
  // Address was deleted or doesn't exist
  // Prompt user to select a different address
}
```

## See Also

- [Full Documentation](./ADDRESS_AND_BOOKING_FLOW.md)
- Address API: `GET /addresses`, `POST /addresses`, `PATCH /addresses/:id`, etc.
- Booking API: `POST /bookings`, `POST /bookings/rebook`
