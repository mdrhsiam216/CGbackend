## Caregiver Profile API

Comprehensive documentation for all caregiver profile endpoints exposed by `CaregiverProfileUserController` (`/caregiver-profiles`) and `CaregiverProfileAdminController` (`/admin/caregiver-profiles`). The system manages caregiver profiles with location-based search capabilities.

### Conventions

- **Base URL**: `/caregiver-profiles` (user endpoints) and `/admin/caregiver-profiles` (admin endpoints)
- **Protected endpoints** use JWT via either:
  - `Authorization: Bearer <accessToken>` header, or
  - `access_token` httpOnly cookie (set by server on login/refresh)
- **Location Search**: Uses Haversine formula for distance calculation (default radius: 10km)
- **Response format**: All routes include a response message via a global response wrapper/interceptor
- **Pagination**: List endpoints support pagination with `page` and `limit` query parameters

---

## User Endpoints

### POST /caregiver-profiles

Create a new caregiver profile for a user. Each user can only have one caregiver profile.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Experienced caregiver with 5 years of experience in elderly care.",
  "serviceOffered": "Elderly Care, Personal Care Assistance",
  "baseHourlyRate": 25.50,
  "serviceArea": "Downtown, Midtown",
  "address": "123 Main Street, City, State 12345",
  "verified": false,
  "homeLocation": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

**Field Validation:**

- `userId`: Required, must be a valid UUID of an existing user
- `firstName`: Required, non-empty string
- `lastName`: Required, non-empty string
- `bio`: Optional, string (caregiver's biography/credentials)
- `serviceOffered`: Optional, string (description of services offered)
- `baseHourlyRate`: Optional, number, minimum 0
- `serviceArea`: Optional, string (geographic area where services are offered)
- `address`: Optional, string (physical address)
- `verified`: Optional, boolean (defaults to `false`, only admins can set to `true`)
- `homeLocation`: Optional, object with `lat` and `lng` (numbers) for location-based search

**Response 201 Created:**

```json
{
  "success": true,
  "message": "Caregiver profile created successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "phone": "8801712345678",
      "status": "active"
    },
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Experienced caregiver with 5 years of experience in elderly care.",
    "serviceOffered": "Elderly Care, Personal Care Assistance",
    "baseHourlyRate": 25.50,
    "serviceArea": "Downtown, Midtown",
    "address": "123 Main Street, City, State 12345",
    "verified": false,
    "homeLocation": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "createdAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Invalid UUID format for `userId`
  - Missing required fields (`userId`, `firstName`, `lastName`)
  - Invalid `baseHourlyRate` (negative number)
  - Invalid `homeLocation` format
- `404 Not Found`: User not found with provided `userId`
- `409 Conflict`: Caregiver profile already exists for this user
- `500 Internal Server Error`: Server error during profile creation

**Notes:**

- Only one caregiver profile can exist per user
- `verified` field defaults to `false` and can only be changed by admins
- `homeLocation` is required for location-based search (`/caregiver-profiles/nearby`)
- Profile is automatically linked to the user account

---

### GET /caregiver-profiles

Get all caregiver profiles with optional filtering and pagination. Supports search, verification status, service type, and service area filters.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Query Parameters:**

- `search` (optional): Search term to filter profiles (searches in firstName, lastName, bio, serviceOffered)
- `verified` (optional): Filter by verification status (`true` or `false`)
- `serviceOffered` (optional): Filter by service type (partial match)
- `serviceArea` (optional): Filter by service area (partial match)
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Number of profiles per page (default: 10, minimum: 1)

**Example Request:**

```
GET /caregiver-profiles?search=elderly&verified=true&page=1&limit=20
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Caregiver profiles retrieved successfully",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john@example.com",
        "phone": "8801712345678",
        "status": "active"
      },
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Experienced caregiver with 5 years of experience in elderly care.",
      "serviceOffered": "Elderly Care, Personal Care Assistance",
      "baseHourlyRate": 25.50,
      "serviceArea": "Downtown, Midtown",
      "address": "123 Main Street, City, State 12345",
      "verified": true,
      "homeLocation": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "createdAt": "2025-11-16T14:20:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

**Response Fields:**

- `data`: Array of caregiver profile objects
- `total`: Total number of profiles matching the filters
- `page`: Current page number
- `limit`: Number of profiles per page

**Errors:**

- `400 Bad Request`: Invalid query parameter values
- `401 Unauthorized`: Missing or invalid access token
- `500 Internal Server Error`: Server error during profile retrieval

**Notes:**

- Results are paginated for performance
- Search is case-insensitive and matches multiple fields
- Filters can be combined (e.g., search + verified + serviceOffered)
- Only active user profiles are returned

---

### GET /caregiver-profiles/nearby

Find verified caregiver profiles within a specified radius of a given location. Uses Haversine formula for accurate distance calculation.

**Auth Required:**

- Not required (public endpoint)

**Query Parameters:**

- `lat` (required): Latitude of the search location (number)
- `lng` (required): Longitude of the search location (number)
- `radius` (optional): Search radius in kilometers (default: 10, minimum: 0)

**Example Request:**

```
GET /caregiver-profiles/nearby?lat=40.7128&lng=-74.0060&radius=15
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Nearby caregiver profiles retrieved successfully",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john@example.com",
        "phone": "8801712345678",
        "status": "active"
      },
      "firstName": "John",
      "lastName": "Doe",
      "bio": "Experienced caregiver with 5 years of experience in elderly care.",
      "serviceOffered": "Elderly Care, Personal Care Assistance",
      "baseHourlyRate": 25.50,
      "serviceArea": "Downtown, Midtown",
      "address": "123 Main Street, City, State 12345",
      "verified": true,
      "homeLocation": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "createdAt": "2025-11-16T14:20:00.000Z"
    }
  ]
}
```

**Response Fields:**

- `data`: Array of verified caregiver profiles within the specified radius

**Errors:**

- `400 Bad Request`:
  - Missing `lat` or `lng` parameters
  - Invalid `lat` or `lng` format (must be numbers)
  - Invalid `radius` value (negative number)
- `500 Internal Server Error`: Server error during search

**Notes:**

- Only returns verified profiles (`verified: true`)
- Only profiles with `homeLocation` are included in results
- Distance is calculated using Haversine formula (accurate for Earth's surface)
- Default radius is 10 kilometers if not specified
- Results are ordered by distance (closest first)
- This endpoint is public and does not require authentication

---

### GET /caregiver-profiles/user/:userId

Get caregiver profile by user ID. Useful for retrieving a user's own profile or viewing another user's profile.

**Auth Required:**

- Not required (public endpoint)

**Path Parameters:**

- `userId`: User UUID

**Example Request:**

```
GET /caregiver-profiles/user/550e8400-e29b-41d4-a716-446655440000
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Caregiver profile retrieved successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "phone": "8801712345678",
      "status": "active"
    },
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Experienced caregiver with 5 years of experience in elderly care.",
    "serviceOffered": "Elderly Care, Personal Care Assistance",
    "baseHourlyRate": 25.50,
    "serviceArea": "Downtown, Midtown",
    "address": "123 Main Street, City, State 12345",
    "verified": true,
    "homeLocation": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "createdAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Errors:**

- `400 Bad Request`: Invalid UUID format
- `404 Not Found`: Caregiver profile not found for the specified user
- `500 Internal Server Error`: Server error during profile retrieval

**Notes:**

- Returns profile if it exists for the user
- This endpoint is public and does not require authentication
- Useful for displaying user's own profile or viewing public profiles

---

### GET /caregiver-profiles/:id

Get a specific caregiver profile by its ID.

**Auth Required:**

- Not required (public endpoint)

**Path Parameters:**

- `id`: Caregiver profile UUID

**Example Request:**

```
GET /caregiver-profiles/660e8400-e29b-41d4-a716-446655440000
```

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Caregiver profile retrieved successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "phone": "8801712345678",
      "status": "status": "active"
    },
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Experienced caregiver with 5 years of experience in elderly care.",
    "serviceOffered": "Elderly Care, Personal Care Assistance",
    "baseHourlyRate": 25.50,
    "serviceArea": "Downtown, Midtown",
    "address": "123 Main Street, City, State 12345",
    "verified": true,
    "homeLocation": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "createdAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Errors:**

- `400 Bad Request`: Invalid UUID format
- `404 Not Found`: Caregiver profile not found
- `500 Internal Server Error`: Server error during profile retrieval

**Notes:**

- This endpoint is public and does not require authentication
- Returns full profile details including user information

---

### PATCH /caregiver-profiles/:id

Update an existing caregiver profile. Only the profile owner or admin can update a profile.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Path Parameters:**

- `id`: Caregiver profile UUID

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Updated bio with new experience and certifications.",
  "serviceOffered": "Elderly Care, Personal Care Assistance, Medical Support",
  "baseHourlyRate": 30.00,
  "serviceArea": "Downtown, Midtown, Uptown",
  "address": "456 Oak Avenue, City, State 12345",
  "homeLocation": {
    "lat": 40.7580,
    "lng": -73.9855
  }
}
```

**Field Validation:**

- `firstName`: Optional, non-empty string
- `lastName`: Optional, non-empty string
- `bio`: Optional, string
- `serviceOffered`: Optional, string
- `baseHourlyRate`: Optional, number, minimum 0
- `serviceArea`: Optional, string
- `address`: Optional, string
- `homeLocation`: Optional, object with `lat` and `lng` (numbers)
- Note: `userId` and `verified` cannot be updated via this endpoint (use admin endpoint for verification)

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Caregiver profile updated successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "phone": "8801712345678",
      "status": "active"
    },
    "firstName": "Jane",
    "lastName": "Smith",
    "bio": "Updated bio with new experience and certifications.",
    "serviceOffered": "Elderly Care, Personal Care Assistance, Medical Support",
    "baseHourlyRate": 30.00,
    "serviceArea": "Downtown, Midtown, Uptown",
    "address": "456 Oak Avenue, City, State 12345",
    "verified": true,
    "homeLocation": {
      "lat": 40.7580,
      "lng": -73.9855
    },
    "createdAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Invalid UUID format
  - Invalid field values (e.g., negative `baseHourlyRate`)
  - Invalid `homeLocation` format
- `401 Unauthorized`: Missing or invalid access token
- `404 Not Found`: Caregiver profile not found
- `500 Internal Server Error`: Server error during profile update

**Notes:**

- Only provided fields are updated (partial update)
- `userId` cannot be changed after profile creation
- `verified` status can only be changed by admins via admin endpoint
- All string fields are automatically trimmed

---

## Admin Endpoints

### GET /admin/caregiver-profiles

Get all caregiver profiles with optional filtering and pagination. Admin version of the user endpoint with same functionality.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie
- Admin role required

**Query Parameters:**

- `search` (optional): Search term to filter profiles
- `verified` (optional): Filter by verification status (`true` or `false`)
- `serviceOffered` (optional): Filter by service type
- `serviceArea` (optional): Filter by service area
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Number of profiles per page (default: 10, minimum: 1)

**Response 200 OK:**

Same format as user endpoint `GET /caregiver-profiles`

**Errors:**

- `400 Bad Request`: Invalid query parameter values
- `401 Unauthorized`: Missing or invalid access token
- `403 Forbidden`: Insufficient permissions (admin role required)
- `500 Internal Server Error`: Server error during profile retrieval

**Notes:**

- Same functionality as user endpoint but requires admin authentication
- Useful for admin dashboard and management interfaces

---

### GET /admin/caregiver-profiles/:id

Get a specific caregiver profile by its ID. Admin version of the user endpoint.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie
- Admin role required

**Path Parameters:**

- `id`: Caregiver profile UUID

**Response 200 OK:**

Same format as user endpoint `GET /caregiver-profiles/:id`

**Errors:**

- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid access token
- `403 Forbidden`: Insufficient permissions (admin role required)
- `404 Not Found`: Caregiver profile not found
- `500 Internal Server Error`: Server error during profile retrieval

---

### PATCH /admin/caregiver-profiles/:id/verification

Update the verification status of a caregiver profile. Only admins can verify/unverify profiles.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie
- Admin role required

**Path Parameters:**

- `id`: Caregiver profile UUID

**Request Body:**

```json
{
  "verified": true
}
```

**Field Validation:**

- `verified`: Required, boolean (`true` or `false`)

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Caregiver profile verification status updated successfully",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "phone": "8801712345678",
      "status": "active"
    },
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Experienced caregiver with 5 years of experience in elderly care.",
    "serviceOffered": "Elderly Care, Personal Care Assistance",
    "baseHourlyRate": 25.50,
    "serviceArea": "Downtown, Midtown",
    "address": "123 Main Street, City, State 12345",
    "verified": true,
    "homeLocation": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "createdAt": "2025-11-16T14:20:00.000Z"
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Invalid UUID format
  - Missing or invalid `verified` field (must be boolean)
- `401 Unauthorized`: Missing or invalid access token
- `403 Forbidden`: Insufficient permissions (admin role required)
- `404 Not Found`: Caregiver profile not found
- `500 Internal Server Error`: Server error during update

**Notes:**

- Only verified profiles appear in `/caregiver-profiles/nearby` search results
- Verification is typically done after reviewing caregiver credentials and background checks
- Setting `verified: false` will remove the profile from nearby search results

---

### DELETE /admin/caregiver-profiles/:id

Delete a caregiver profile. This action is permanent and cannot be undone.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie
- Admin role required

**Path Parameters:**

- `id`: Caregiver profile UUID

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Caregiver profile deleted successfully",
  "data": {
    "message": "Caregiver profile deleted successfully"
  }
}
```

**Errors:**

- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid access token
- `403 Forbidden`: Insufficient permissions (admin role required)
- `404 Not Found`: Caregiver profile not found
- `500 Internal Server Error`: Server error during deletion

**Notes:**

- This action is permanent and cannot be undone
- Associated user account is not deleted (only the caregiver profile)
- All related data (bookings, availability slots) may be affected
- Use with caution

---

## Frontend Integration Guide

### 1. Create a Caregiver Profile

When a user wants to become a caregiver, create their profile:

```typescript
const createProfile = async (profileData: {
  userId: string;
  firstName: string;
  lastName: string;
  bio?: string;
  serviceOffered?: string;
  baseHourlyRate?: number;
  serviceArea?: string;
  address?: string;
  homeLocation?: { lat: number; lng: number };
}) => {
  const response = await fetch('/caregiver-profiles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

### 2. Get All Profiles with Filters

Search and filter caregiver profiles:

```typescript
const getProfiles = async (filters: {
  search?: string;
  verified?: boolean;
  serviceOffered?: string;
  serviceArea?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.verified !== undefined) queryParams.append('verified', String(filters.verified));
  if (filters.serviceOffered) queryParams.append('serviceOffered', filters.serviceOffered);
  if (filters.serviceArea) queryParams.append('serviceArea', filters.serviceArea);
  if (filters.page) queryParams.append('page', String(filters.page));
  if (filters.limit) queryParams.append('limit', String(filters.limit));

  const response = await fetch(`/caregiver-profiles?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.json();
};
```

### 3. Find Nearby Caregivers

Search for caregivers near a location:

```typescript
const findNearbyCaregivers = async (lat: number, lng: number, radiusKm?: number) => {
  const queryParams = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  if (radiusKm) queryParams.append('radius', String(radiusKm));

  const response = await fetch(`/caregiver-profiles/nearby?${queryParams.toString()}`);

  return response.json();
};

// Example: Find caregivers within 15km of a location
const nearby = await findNearbyCaregivers(40.7128, -74.0060, 15);
```

### 4. Get Profile by User ID

Retrieve a user's caregiver profile:

```typescript
const getProfileByUserId = async (userId: string) => {
  const response = await fetch(`/caregiver-profiles/user/${userId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Profile doesn't exist
    }
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};
```

### 5. Get Profile by ID

Get a specific profile:

```typescript
const getProfile = async (profileId: string) => {
  const response = await fetch(`/caregiver-profiles/${profileId}`);

  if (!response.ok) {
    throw new Error('Profile not found');
  }

  return response.json();
};
```

### 6. Update Profile

Update an existing profile:

```typescript
const updateProfile = async (
  profileId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    serviceOffered?: string;
    baseHourlyRate?: number;
    serviceArea?: string;
    address?: string;
    homeLocation?: { lat: number; lng: number };
  }
) => {
  const response = await fetch(`/caregiver-profiles/${profileId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

### 7. Admin: Update Verification Status

Admin-only endpoint to verify/unverify profiles:

```typescript
const updateVerificationStatus = async (profileId: string, verified: boolean) => {
  const response = await fetch(`/admin/caregiver-profiles/${profileId}/verification`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ verified }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

### 8. Admin: Delete Profile

Admin-only endpoint to delete profiles:

```typescript
const deleteProfile = async (profileId: string) => {
  const response = await fetch(`/admin/caregiver-profiles/${profileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminAccessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

### 9. Get User's Own Profile

Get the current user's caregiver profile:

```typescript
const getMyProfile = async (userId: string) => {
  const response = await fetch(`/caregiver-profiles/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null; // User doesn't have a caregiver profile yet
  }

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};
```

### 10. Location-Based Search with Map Integration

Example integration with a map component:

```typescript
import { useEffect, useState } from 'react';

function CaregiverMap({ centerLat, centerLng }: { centerLat: number; centerLng: number }) {
  const [caregivers, setCaregivers] = useState([]);
  const [radius, setRadius] = useState(10);

  useEffect(() => {
    const fetchNearby = async () => {
      const response = await fetch(
        `/caregiver-profiles/nearby?lat=${centerLat}&lng=${centerLng}&radius=${radius}`
      );
      const { data } = await response.json();
      setCaregivers(data);
    };

    fetchNearby();
  }, [centerLat, centerLng, radius]);

  return (
    <div>
      <input
        type="range"
        min="1"
        max="50"
        value={radius}
        onChange={(e) => setRadius(Number(e.target.value))}
      />
      <span>Radius: {radius} km</span>
      {/* Render map with caregiver markers */}
    </div>
  );
}
```

---

## Complete Frontend Example

Here's a complete example of a caregiver profile management component:

```typescript
import { useEffect, useState } from 'react';

interface CaregiverProfile {
  id: string;
  user: {
    id: string;
    email: string;
    phone: string;
    status: string;
  };
  firstName: string;
  lastName: string;
  bio?: string;
  serviceOffered?: string;
  baseHourlyRate?: number;
  serviceArea?: string;
  address?: string;
  verified: boolean;
  homeLocation?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
}

export function CaregiverProfileComponent({
  userId,
  accessToken
}: {
  userId: string;
  accessToken: string;
}) {
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/caregiver-profiles/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 404) {
        setProfile(null);
      } else if (response.ok) {
        const { data } = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: any) => {
    const response = await fetch('/caregiver-profiles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...profileData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { data } = await response.json();
    setProfile(data);
    setEditing(false);
  };

  const updateProfile = async (updates: any) => {
    if (!profile) return;

    const response = await fetch(`/caregiver-profiles/${profile.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { data } = await response.json();
    setProfile(data);
    setEditing(false);
  };

  if (loading) return <div>Loading...</div>;

  if (!profile) {
    return (
      <div>
        <h2>Create Caregiver Profile</h2>
        {/* Profile creation form */}
      </div>
    );
  }

  return (
    <div>
      <h2>
        {profile.firstName} {profile.lastName}
        {profile.verified && <span>✓ Verified</span>}
      </h2>
      <p>{profile.bio}</p>
      <p>Services: {profile.serviceOffered}</p>
      <p>Rate: ${profile.baseHourlyRate}/hour</p>
      <p>Service Area: {profile.serviceArea}</p>
      <p>Address: {profile.address}</p>
      {profile.homeLocation && (
        <p>
          Location: {profile.homeLocation.lat}, {profile.homeLocation.lng}
        </p>
      )}
      <button onClick={() => setEditing(!editing)}>
        {editing ? 'Cancel' : 'Edit Profile'}
      </button>
      {editing && (
        <div>
          {/* Profile edit form */}
        </div>
      )}
    </div>
  );
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": {
    "name": "ErrorType",
    "stack": "Error stack trace (development only)"
  },
  "timestamp": "2025-11-16T14:24:50.456Z",
  "path": "/caregiver-profiles",
  "statusCode": 400
}
```

Common HTTP status codes:

- `400 Bad Request`: Validation errors, invalid input
- `401 Unauthorized`: Authentication required, invalid credentials
- `403 Forbidden`: Insufficient permissions (admin role required)
- `404 Not Found`: Resource not found (profile, user)
- `409 Conflict`: Resource already exists (profile already exists for user)
- `500 Internal Server Error`: Server error

---

## Location Search Details

### Haversine Formula

The system uses the Haversine formula to calculate distances between two geographic coordinates. This provides accurate distance calculations on Earth's surface.

**Formula:**
- Earth's radius: 6,371 km
- Distance is calculated in kilometers
- Returns profiles within the specified radius

**Example:**
- Search location: `lat: 40.7128, lng: -74.0060` (New York City)
- Profile location: `lat: 40.7580, lng: -73.9855` (Times Square)
- Distance: ~5.5 km
- If radius is 10 km, this profile will be included

**Best Practices:**
- Always provide `homeLocation` when creating/updating profiles for location-based search
- Use appropriate radius values (default 10km, can be adjusted based on service area)
- Only verified profiles appear in nearby search results

---

## Best Practices

### Profile Creation

1. **Complete Information**
   - Provide all relevant fields for better searchability
   - Include `homeLocation` for location-based search
   - Write a clear and detailed `bio`

2. **Service Information**
   - Be specific in `serviceOffered` field
   - List all services the caregiver can provide
   - Update `serviceArea` to reflect actual coverage area

3. **Pricing**
   - Set realistic `baseHourlyRate`
   - Consider market rates in the area

### Search and Discovery

1. **Filtering**
   - Use multiple filters together for better results
   - Combine search term with verification status
   - Filter by service type for specific needs

2. **Location Search**
   - Use appropriate radius for the use case
   - Consider service area when setting radius
   - Display distance to user when showing results

3. **Pagination**
   - Implement infinite scroll or pagination controls
   - Use appropriate page size (10-50 items)
   - Show total count for better UX

### Profile Management

1. **Updates**
   - Keep profile information current
   - Update location if caregiver moves
   - Refresh service offerings regularly

2. **Verification**
   - Only verified profiles appear in nearby search
   - Admins should verify profiles after credential checks
   - Display verification badge in UI

---

## Limitations and Considerations

1. **Location Search**
   - Only verified profiles with `homeLocation` appear in nearby search
   - Distance calculation is approximate (Haversine formula)
   - Large radius values may return many results

2. **Profile Uniqueness**
   - Only one profile per user
   - Cannot change `userId` after creation
   - Delete and recreate if needed (admin only)

3. **Verification**
   - Verification status can only be changed by admins
   - Unverified profiles won't appear in nearby search
   - Consider verification workflow in admin panel

4. **Data Relationships**
   - Profile is linked to user account
   - Deleting profile doesn't delete user account
   - Related bookings and availability slots may be affected

---

## Support

For issues or questions:

1. Check error messages in response
2. Verify UUID formats are correct
3. Ensure required fields are provided
4. Check authentication tokens are valid
5. Review server logs for detailed error information
6. Verify user exists before creating profile
7. Check for existing profile before creation (409 Conflict)

