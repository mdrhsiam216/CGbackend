# Availability Slot Module - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Entity Structure](#entity-structure)
3. [How It Works](#how-it-works)
4. [API Endpoints](#api-endpoints)
5. [Frontend Implementation](#frontend-implementation)
6. [Booking Flow](#booking-flow)
7. [Examples](#examples)
8. [Validation Rules](#validation-rules)

---

## Overview

The Availability Slot module allows caregivers to set their availability and clients to find available time slots for booking.

### Key Features

- ✅ Multiple time slots per day (e.g., mornings + evenings)
- ✅ Custom time ranges
- ✅ Day of week selection
- ✅ Pay rate expectations
- ✅ Automatic booking time slot generation

---

## Entity Structure

### AvailabilitySlot Entity

```typescript
{
  id: string;                      // UUID
  caregiverId: string;             // Foreign key to caregiver_profiles

  // Days and times
  daysOfWeek: number[];            // [0-6] Sunday to Saturday
  timeSlots: string[] | null;      // ['mornings', 'afternoons', 'evenings', 'overnight']
  startTime: string;               // HH:MM format (e.g., "06:00")
  endTime: string;                 // HH:MM format (e.g., "12:00")

  // Flexibility
  scheduleMayVary: boolean;        // Schedule variation flag

  // Pay expectations
  expectedMinRate: number | null;  // Minimum hourly rate
  expectedMaxRate: number | null;  // Maximum hourly rate

  // Status
  isActive: boolean;               // Active status

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Time Slot Enums

```typescript
enum TimeSlot {
  MORNINGS = 'mornings', // 6 AM - 12 PM
  AFTERNOONS = 'afternoons', // 12 PM - 6 PM
  EVENINGS = 'evenings', // 6 PM - 10 PM
  OVERNIGHT = 'overnight', // 10 PM - 6 AM
}

enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}
```

---

## How It Works

### Problem: Multiple Time Slots

If a caregiver selects "mornings" (6:00-12:00) AND "evenings" (18:00-22:00), we can't store this as a single record with `startTime: "06:00"` and `endTime: "22:00"` because that would include the afternoon gap (12:00-18:00) when they're NOT available.

### Solution: Multiple Database Records

Frontend sends arrays, backend creates separate records for each time slot.

### Flow Diagram

```
┌─────────────────────────────────────────┐
│         FRONTEND (Caregiver UI)         │
└─────────────────────────────────────────┘
              ↓
Caregiver selects:
- Days: Monday-Friday
- Time Slots: Mornings + Evenings
              ↓
Frontend generates:
{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "timeSlots": ["mornings", "evenings"],
  "startTime": ["06:00", "18:00"],
  "endTime": ["12:00", "22:00"]
}
              ↓
┌─────────────────────────────────────────┐
│      POST /availability-slots           │
└─────────────────────────────────────────┘
              ↓
Backend loops through arrays:
- Loop 0: Create record (06:00-12:00)
- Loop 1: Create record (18:00-22:00)
              ↓
┌─────────────────────────────────────────┐
│         DATABASE (2 Records)            │
└─────────────────────────────────────────┘

Record 1: Mon-Fri, 06:00-12:00, mornings
Record 2: Mon-Fri, 18:00-22:00, evenings
```

---

## API Endpoints

### 1. Create Availability Slots

**Endpoint:** `POST /availability-slots`

**Description:** Creates one or more availability slots. Backend automatically creates separate records for each time slot.

**Request Body:**

```json
{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "timeSlots": ["mornings", "evenings"],
  "startTime": ["06:00", "18:00"],
  "endTime": ["12:00", "22:00"],
  "scheduleMayVary": false,
  "expectedMinRate": 24,
  "expectedMaxRate": 30
}
```

**Response:**

```json
{
  "success": true,
  "message": "Availability slots created successfully",
  "data": [
    {
      "id": "550e8400-...",
      "caregiverId": "123e4567-...",
      "daysOfWeek": [1, 2, 3, 4, 5],
      "timeSlots": ["mornings"],
      "startTime": "06:00",
      "endTime": "12:00",
      "expectedMinRate": 24,
      "expectedMaxRate": 30,
      "isActive": true
    },
    {
      "id": "550e8400-...",
      "caregiverId": "123e4567-...",
      "daysOfWeek": [1, 2, 3, 4, 5],
      "timeSlots": ["evenings"],
      "startTime": "18:00",
      "endTime": "22:00",
      "expectedMinRate": 24,
      "expectedMaxRate": 30,
      "isActive": true
    }
  ]
}
```

---

### 2. Get My Availability Slots

**Endpoint:** `GET /availability-slots/my-slots`

**Description:** Get all availability slots for the authenticated caregiver.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      /* slot 1 */
    },
    {
      /* slot 2 */
    }
  ]
}
```

---

### 3. Get Caregiver's Availability Slots

**Endpoint:** `GET /availability-slots/caregiver/:caregiverId`

**Description:** Get all availability slots for a specific caregiver.

**Response:** Array of availability slots

---

### 4. Get Available Time Slots for Booking

**Endpoint:** `GET /availability-slots/caregiver/:caregiverId/available-times`

**Description:** Returns available start times for booking based on date and duration.

**Query Parameters:**

- `date` (required) - Date in YYYY-MM-DD format (e.g., "2024-02-15")
- `durationHours` (required) - Duration needed in hours (e.g., 4)

**Example Request:**

```bash
GET /availability-slots/caregiver/123e4567-e89b-12d3-a456-426614174000/available-times?date=2024-02-15&durationHours=4
```

**Response:**

```json
{
  "success": true,
  "message": "Available time slots retrieved successfully",
  "data": ["06:00", "06:30", "07:00", "07:30", "08:00", "18:00", "18:30"]
}
```

**How It Works:**

1. Converts date to day of week (e.g., Thursday = 4)
2. Finds all active slots for that day
3. Generates possible start times in 30-minute intervals
4. Returns only times that can accommodate the full duration

---

### 5. Update Availability Slot

**Endpoint:** `PATCH /availability-slots/:id`

**Description:** Update a single availability slot.

**Request Body:**

```json
{
  "startTime": ["09:00"],
  "endTime": ["17:00"],
  "expectedMinRate": 26
}
```

---

### 6. Delete Availability Slot

**Endpoint:** `DELETE /availability-slots/:id`

**Description:** Permanently delete an availability slot.

---

### 7. Deactivate Availability Slot

**Endpoint:** `PATCH /availability-slots/:id/deactivate`

**Description:** Soft delete (deactivate) an availability slot.

---

## Booking Flow

### Client Booking Process

```
┌─────────────────────────────────────────┐
│   1. Client Views Caregiver Details    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   2. Client Clicks "Book Now"           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   3. Client Selects:                    │
│      - Date: 2024-02-15 (Thursday)      │
│      - Duration: 4 hours                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   4. Frontend Calls API:                │
│   GET /caregiver/:id/available-times    │
│   ?date=2024-02-15&durationHours=4      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   5. Backend Returns Available Times:   │
│   ["06:00", "06:30", "07:00", "08:00",  │
│    "18:00", "18:30"]                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   6. Client Selects Start Time:         │
│      "06:00"                            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   7. Client Completes Booking           │
│      (Creates booking record)           │
└─────────────────────────────────────────┘
```

---

## Examples

### Example 1: Weekday Mornings + Evenings

**Request:**

```json
POST /availability-slots
{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "timeSlots": ["mornings", "evenings"],
  "startTime": ["06:00", "18:00"],
  "endTime": ["12:00", "22:00"],
  "expectedMinRate": 24,
  "expectedMaxRate": 30
}
```

**Result:** Creates 2 database records

- Record 1: Mon-Fri, 06:00-12:00, mornings
- Record 2: Mon-Fri, 18:00-22:00, evenings

**Timeline:**

```
06:00 ──────── 12:00  ✅ AVAILABLE (Record 1)
12:00 ──────── 18:00  ❌ NOT AVAILABLE (No record)
18:00 ──────── 22:00  ✅ AVAILABLE (Record 2)
```

---

### Example 2: Custom Time

**Request:**

```json
POST /availability-slots
{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "startTime": ["09:00"],
  "endTime": ["15:00"],
  "expectedMinRate": 25,
  "expectedMaxRate": 32
}
```

**Result:** Creates 1 database record

- Record 1: Mon-Fri, 09:00-15:00, no time slot label

---

### Example 3: Weekend All Day

**Request:**

```json
POST /availability-slots
{
  "daysOfWeek": [0, 6],
  "timeSlots": ["mornings", "afternoons", "evenings"],
  "startTime": ["06:00", "12:00", "18:00"],
  "endTime": ["12:00", "18:00", "22:00"],
  "expectedMinRate": 28,
  "expectedMaxRate": 40
}
```

**Result:** Creates 3 database records

- Record 1: Sat-Sun, 06:00-12:00, mornings
- Record 2: Sat-Sun, 12:00-18:00, afternoons
- Record 3: Sat-Sun, 18:00-22:00, evenings

---

### Example 4: Get Available Times for Booking

**Caregiver's Availability:**

- Monday-Friday, 06:00-12:00 (mornings)
- Monday-Friday, 18:00-22:00 (evenings)

**Client Request:**

```
GET /availability-slots/caregiver/123e4567/available-times?date=2024-02-15&durationHours=4
```

**Date:** 2024-02-15 is Thursday (day 4)

**Backend Logic:**

1. Find slots for Thursday: 06:00-12:00 and 18:00-22:00
2. Generate 30-min intervals that fit 4 hours:
   - Morning: 06:00, 06:30, 07:00, 07:30, 08:00 (08:00 + 4h = 12:00 ✅)
   - Evening: 18:00, 18:30 (18:30 + 4h = 22:30 ❌, exceeds 22:00)

**Response:**

```json
{
  "data": ["06:00", "06:30", "07:00", "07:30", "08:00", "18:00"]
}
```

---

## Validation Rules

### Time Validation

- ✅ `startTime` and `endTime` arrays must have the same length
- ✅ Each start time must be before its corresponding end time
- ✅ Times must be in HH:MM format (e.g., "09:00")
- ✅ Times must be within business hours (06:00 - 22:00)
- ✅ Minimum duration: 1 hour

### Day Selection

- ✅ At least one day must be selected
- ✅ Valid values: 0-6 (Sunday to Saturday)

### Pay Range

- ✅ Cannot be negative
- ✅ Minimum rate cannot exceed maximum rate
- ✅ Maximum rate should be reasonable (< $200/hour)

### Overlap Prevention

- ✅ System checks for overlapping availability slots
- ✅ Considers day of week overlap
- ✅ Considers time range overlap
- ✅ Only checks active slots

---

## Error Handling

### Common Errors

**1. Mismatched Array Lengths**

```json
{
  "success": false,
  "message": "startTime and endTime arrays must have the same length",
  "statusCode": 400
}
```

**2. Invalid Time Range**

```json
{
  "success": false,
  "message": "Start time must be before end time",
  "statusCode": 400
}
```

**3. Overlapping Slots**

```json
{
  "success": false,
  "message": "This availability overlaps with an existing slot on the same day(s) and time",
  "statusCode": 409
}
```

**4. No Available Times**

```json
{
  "success": true,
  "data": []
}
```

---

## Testing

### Test 1: Multiple Time Slots

```bash
curl -X POST http://localhost:3000/availability-slots \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysOfWeek": [1, 2, 3, 4, 5],
    "timeSlots": ["mornings", "evenings"],
    "startTime": ["06:00", "18:00"],
    "endTime": ["12:00", "22:00"],
    "expectedMinRate": 24,
    "expectedMaxRate": 30
  }'
```

**Expected:** Creates 2 records

---

### Test 2: Single Custom Time

```bash
curl -X POST http://localhost:3000/availability-slots \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daysOfWeek": [1, 2, 3, 4, 5],
    "startTime": ["09:00"],
    "endTime": ["15:00"],
    "expectedMinRate": 25,
    "expectedMaxRate": 32
  }'
```

**Expected:** Creates 1 record

---

### Test 3: Get Available Times

```bash
curl -X GET "http://localhost:3000/availability-slots/caregiver/123e4567-e89b-12d3-a456-426614174000/available-times?date=2024-02-15&durationHours=4" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:** Array of available start times

---

## Database Schema

```sql
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id UUID NOT NULL REFERENCES caregiver_profiles(id) ON DELETE CASCADE,

  -- Days and times
  days_of_week JSONB NOT NULL,
  time_slots JSONB,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Flexibility
  schedule_may_vary BOOLEAN DEFAULT FALSE,

  -- Pay expectations
  expected_min_rate DECIMAL(10,2),
  expected_max_rate DECIMAL(10,2),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_availability_slot_caregiver_id ON availability_slots(caregiver_id);
CREATE INDEX idx_availability_slot_start_time ON availability_slots(start_time);
CREATE INDEX idx_availability_slot_end_time ON availability_slots(end_time);
CREATE INDEX idx_availability_slot_is_active ON availability_slots(is_active);
```

---

## Summary

### Key Points

✅ **Single API Endpoint** - `POST /availability-slots` handles everything  
✅ **Frontend Sends Arrays** - `startTime: ["06:00", "18:00"]`  
✅ **Backend Loops Internally** - Creates multiple database records  
✅ **Clean Data Model** - Each time slot is a separate record  
✅ **No Gaps Stored** - Only actual availability is saved  
✅ **Easy Booking** - Simple to query and generate available times

### Benefits

1. **Clear Separation** - Each time period is a distinct record
2. **No Gaps** - Only stores actual availability
3. **Flexible Rates** - Different rates for different times possible
4. **Easy Booking** - Simple to check availability and book slots
5. **Clear Queries** - Easy to find specific time availability

---

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
