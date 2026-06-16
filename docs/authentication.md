## Authentication API

Comprehensive documentation for all authentication endpoints exposed by `AuthController` (`/auth`). The system uses SMS-based verification via `bulksmsbd.net` and supports dual login (email or phone number).

### Conventions

- **Base URL**: `/auth`
- **Protected endpoints** use JWT via either:
  - `Authorization: Bearer <accessToken>` header, or
  - `access_token` httpOnly cookie (set by server on login/refresh)
- **Server sets cookies**: `refresh_token` and `session_id` httpOnly cookies for session management
- **SMS Verification**: All OTPs are sent via SMS to user's phone number
- **Dual Login**: Users can login with either email or phone number
- **Response format**: Some routes include a response message via a global response wrapper/interceptor

### Cookies Set by Server

- **`access_token`** (httpOnly)
  - Max-Age: 15 minutes
  - Used for authorizing protected endpoints; also accepted via `Authorization` header
- **`refresh_token`** (httpOnly)
  - Max-Age: 7 days
  - Used only by the refresh endpoint to rotate tokens
- **`session_id`** (httpOnly)
  - Max-Age: 7 days
  - Used for session tracking and security
- All cookies use `SameSite=strict`, `Path=/`, and `Secure=true` in production

---

## Endpoints

### POST /auth/register

Register a new user account. Creates user with `pending` status and sends a verification OTP via SMS to the provided phone number.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd",
  "fullName": "John Doe",
  "phone": "8801712345678",
  "roleIds": ["uuid-role-id-1", "uuid-role-id-2"] // optional
}
```

**Field Validation:**

- `email`: Required, must be valid email format
- `password`: Required, minimum 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number or special character
- `fullName`: Required, letters and spaces only
- `phone`: Required, valid phone number format (supports international formats)
- `roleIds`: Optional, array of valid UUID role IDs

**Response 201 Created:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify with the OTP sent to your phone.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": "8801712345678",
    "message": "Registration successful. Please check your phone for the verification OTP."
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Validation errors (invalid email/phone/password format)
  - Email or phone already exists
  - Invalid role IDs
- `500 Internal Server Error`: Server error during user creation or SMS sending

**Notes:**

- User account is created with `status: "pending"`
- SMS OTP is automatically sent to the provided phone number
- OTP expires in 10 minutes (configurable via `OTP_EXPIRY_MINUTES`)
- User must verify phone number before account becomes active

---

### POST /auth/verify-otp

Verify phone number using OTP sent during registration. Activates the user account upon successful verification.

**Request Body:**

```json
{
  "phone": "8801712345678",
  "otp": "123456"
}
```

**Field Validation:**

- `phone`: Required, valid phone number format
- `otp`: Required, exactly 6 digits

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "message": "Phone verified successfully. Your account is now active."
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Invalid or expired OTP
  - OTP format invalid (must be 6 digits)
  - Phone number format invalid
- `404 Not Found`: User not found with provided phone number
- `400 Bad Request`: Account already verified (if user is already active)

**Notes:**

- OTP can only be used once
- OTP expires after 10 minutes
- Upon successful verification:
  - User's `phoneVerified` field is set to `true`
  - User's `status` is changed from `pending` to `active`
  - User can now login

---

### POST /auth/resend-otp

Resend verification OTP to a registered phone number. Useful when OTP expires or is not received.

**Request Body:**

```json
{
  "phone": "8801712345678"
}
```

**Field Validation:**

- `phone`: Required, valid phone number format

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Verification OTP sent successfully",
  "data": {
    "message": "Verification OTP sent to your phone successfully"
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Phone number format invalid
  - OTP resend cooldown active (2 minutes between resends)
- `401 Unauthorized`: User not found with provided phone number

**Notes:**

- Rate limiting: Minimum 2 minutes between OTP resend requests (configurable via `OTP_RESEND_COOLDOWN_MINUTES`)
- Previous unused OTPs are invalidated when a new one is sent
- New OTP expires in 10 minutes

---

### POST /auth/login

Authenticate user using either email or phone number along with password. Sets httpOnly cookies and returns user info plus an access token.

**Headers (Optional):**

- `X-Device-Name`: Friendly device name (e.g., "iPhone 14 Pro", "Chrome on Windows")

**Request Body (Login with Email):**

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd"
}
```

**Request Body (Login with Phone):**

```json
{
  "phone": "8801712345678",
  "password": "StrongP@ssw0rd"
}
```

**Field Validation:**

- Either `email` OR `phone` is required (not both, not neither)
- `email`: If provided, must be valid email format
- `phone`: If provided, must be valid phone number format
- `password`: Required, string

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "roles": ["user", "admin"],
    "message": "Login successful",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Set-Cookie (httpOnly):**

- `access_token=<jwt>; Max-Age=900; Path=/; SameSite=Strict; Secure` (in prod)
- `refresh_token=<jwt>; Max-Age=604800; Path=/; SameSite=Strict; Secure` (in prod)
- `session_id=<uuid>; Max-Age=604800; Path=/; SameSite=Strict; Secure` (in prod)

**Errors:**

- `400 Bad Request`:
  - Neither email nor phone provided
  - Both email and phone provided (only one allowed)
  - Invalid email/phone format
- `401 Unauthorized`:
  - Invalid credentials (wrong password)
  - User not found
  - Account not active (status is not "active")
- `500 Internal Server Error`: Server error during authentication

**Notes:**

- System automatically detects if login identifier is email (contains `@`) or phone number
- Account must be active (`status: "active"`) to login
- Session is created and tracked for security
- Access token expires in 15 minutes
- Refresh token expires in 7 days

---

### POST /auth/forgot-password

Request password reset OTP. Sends an SMS OTP to the user's verified phone number.

**Request Body:**

```json
{
  "phone": "8801712345678"
}
```

**Field Validation:**

- `phone`: Required, valid phone number format

**Response 200 OK:**

```json
{
  "success": true,
  "message": "If the user exists, a password reset OTP has been sent",
  "data": {
    "message": "If a user with that phone number exists, a password reset OTP has been sent via SMS."
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Phone number format invalid
  - Account not active
  - Phone number not verified
  - OTP resend cooldown active (2 minutes between resends)
- `401 Unauthorized`: User not found (silent failure for security)

**Notes:**

- For security, response is the same whether user exists or not
- Only works for active accounts with verified phone numbers
- OTP expires in 10 minutes
- Rate limiting: Minimum 2 minutes between password reset requests
- Previous unused password reset OTPs are invalidated

---

### POST /auth/reset-password

Reset password using OTP verification. Verifies the OTP sent via SMS and updates the user's password.

**Request Body:**

```json
{
  "phone": "8801712345678",
  "otp": "123456",
  "newPassword": "NewStrongP@ssw0rd"
}
```

**Field Validation:**

- `phone`: Required, valid phone number format
- `otp`: Required, exactly 6 digits
- `newPassword`: Required, minimum 8 characters, must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number or special character

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Errors:**

- `400 Bad Request`:
  - Invalid or expired OTP
  - OTP format invalid (must be 6 digits)
  - Phone number format invalid
  - New password doesn't meet requirements
  - Account not active
  - Phone number not verified
- `404 Not Found`: User not found with provided phone number
- `500 Internal Server Error`: Server error during password update

**Notes:**

- OTP can only be used once
- OTP expires after 10 minutes
- Password is hashed using bcrypt before storage
- User must have an active account with verified phone number
- After successful reset, user can login with new password immediately

---

### POST /auth/refresh

Rotate access and refresh tokens using the `refresh_token` httpOnly cookie. Returns success message and sets new cookies.

**Cookies Required:**

- `refresh_token`: Must be present in httpOnly cookie; otherwise returns 401

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "message": "Tokens refreshed successfully"
  }
}
```

**Set-Cookie (httpOnly):**

- `access_token` and `refresh_token` updated with new tokens (same attributes as login)

**Errors:**

- `401 Unauthorized`:
  - Missing refresh token cookie
  - Invalid refresh token
  - Expired refresh token
  - Refresh token not found in database
  - User not found

**Notes:**

- Old refresh token is invalidated when new tokens are issued
- New session is created with updated tokens
- Access token expires in 15 minutes
- Refresh token expires in 7 days
- Session information (IP, user agent, device name) is preserved

---

### POST /auth/logout

Invalidate current session and clear all authentication cookies.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "Logout successful"
  }
}
```

**Effects:**

- Current session is deactivated in database
- Clears `access_token`, `refresh_token`, and `session_id` cookies

**Errors:**

- `401 Unauthorized`: Missing or invalid access token

**Notes:**

- Only the current session is invalidated
- To logout from all devices, use `/auth/logout-all`
- Cookies are cleared even if session invalidation fails

---

### POST /auth/logout-all

Logout from all devices (deactivate all sessions) and clear current cookies.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": {
    "message": "Logged out from all devices successfully"
  }
}
```

**Effects:**

- All active sessions for the user are deactivated
- Clears `access_token`, `refresh_token`, and `session_id` cookies for current session

**Errors:**

- `401 Unauthorized`: Missing or invalid access token

**Notes:**

- This action cannot be undone
- User will need to login again on all devices
- Useful for security incidents or when user suspects account compromise

---

### GET /auth/profile

Get current user profile information extracted from JWT token.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "roles": ["user", "admin"]
  }
}
```

**Errors:**

- `401 Unauthorized`: Missing or invalid access token

**Notes:**

- Information is extracted from JWT payload, not from database query
- Returns user ID, email, and roles
- Fast endpoint as it doesn't require database access

---

### GET /auth/sessions

List all active sessions for the current authenticated user.

**Auth Required:**

- Provide access token via `Authorization: Bearer <token>` or `access_token` cookie

**Request Body:**

None required

**Response 200 OK:**

```json
{
  "success": true,
  "message": "Active sessions retrieved",
  "data": [
    {
      "id": "session-uuid-1",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "refreshToken": "<hashed>",
      "expiresAt": "2025-11-23T14:30:00.000Z",
      "ipAddress": "203.0.113.42",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "deviceName": "Chrome on Windows",
      "isActive": true,
      "lastUsedAt": "2025-11-16T14:24:00.000Z",
      "createdAt": "2025-11-16T14:20:00.000Z",
      "updatedAt": "2025-11-16T14:24:00.000Z"
    },
    {
      "id": "session-uuid-2",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "refreshToken": "<hashed>",
      "expiresAt": "2025-11-23T14:25:00.000Z",
      "ipAddress": "198.51.100.10",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      "deviceName": "iPhone 14 Pro",
      "isActive": true,
      "lastUsedAt": "2025-11-16T14:15:00.000Z",
      "createdAt": "2025-11-16T14:10:00.000Z",
      "updatedAt": "2025-11-16T14:15:00.000Z"
    }
  ]
}
```

**Errors:**

- `401 Unauthorized`: Missing or invalid access token

**Notes:**

- Only returns active sessions (not expired or deactivated)
- Includes device information for each session
- Useful for users to review and manage their active sessions
- Can help identify suspicious activity

---

## Validation Rules

### Email

- Must be valid email format
- Example: `user@example.com`

### Password

- Minimum 8 characters
- Must contain:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9) OR special character
- Examples:
  - ✅ Valid: `StrongP@ssw0rd`, `MyPass123`, `Secure#Pass`
  - ❌ Invalid: `password` (no uppercase/number), `PASSWORD123` (no lowercase), `Pass123` (too short)

### Full Name

- Letters and spaces only
- Example: `John Doe`, `Mary Jane Watson`

### Phone Number

- Supports international formats
- Accepts formats like:
  - `+8801712345678`
  - `8801712345678`
  - `01712345678`
  - `+1 555 123 4567`
- Regex pattern: `/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/`

### OTP

- Exactly 6 digits
- Numeric only
- Example: `123456`, `000000`

---

## Authentication Flow

### Registration Flow

1. User submits registration form with email, password, fullName, and phone
2. System creates user account with `status: "pending"`
3. System sends SMS OTP to provided phone number
4. User receives OTP via SMS
5. User submits phone number and OTP to `/auth/verify-otp`
6. System verifies OTP and activates account (`status: "active"`, `phoneVerified: true`)
7. User can now login

### Login Flow

1. User submits login credentials (email OR phone + password)
2. System validates credentials and checks account status
3. System generates JWT access and refresh tokens
4. System creates session record in database
5. System sets httpOnly cookies (access_token, refresh_token, session_id)
6. System returns user info and access token in response
7. User can now make authenticated requests

### Password Reset Flow

1. User submits phone number to `/auth/forgot-password`
2. System validates phone number and account status
3. System sends SMS OTP to verified phone number
4. User receives OTP via SMS
5. User submits phone number, OTP, and new password to `/auth/reset-password`
6. System verifies OTP and updates password
7. User can now login with new password

### Token Refresh Flow

1. Access token expires (after 15 minutes)
2. Client automatically calls `/auth/refresh` with refresh token cookie
3. System validates refresh token
4. System generates new access and refresh tokens
5. System creates new session and invalidates old one
6. System sets new httpOnly cookies
7. Client continues with new access token

---

## Integration Notes

### Frontend Integration

1. **After successful login:**
   - Store `accessToken` from response in memory (not localStorage for security)
   - Rely on httpOnly cookies for automatic token management
   - Store user info (userId, email, roles) in application state

2. **Making authenticated requests:**
   - Option 1: Send `Authorization: Bearer <accessToken>` header
   - Option 2: Let browser automatically send `access_token` cookie
   - Prefer cookies for same-origin requests (more secure)

3. **Token refresh:**
   - Monitor access token expiration (15 minutes)
   - Automatically call `/auth/refresh` before token expires
   - Handle refresh failures by redirecting to login

4. **Error handling:**
   - `401 Unauthorized`: Redirect to login page
   - `403 Forbidden`: Show access denied message
   - `400 Bad Request`: Display validation errors to user

### SMS OTP Handling

- OTPs expire in 10 minutes
- OTPs can only be used once
- Rate limiting: 2 minutes between OTP requests
- Display countdown timer for OTP expiration
- Provide "Resend OTP" option after cooldown period
- Handle SMS delivery failures gracefully

### Security Best Practices

1. **Never store tokens in localStorage or sessionStorage**
   - Use httpOnly cookies (handled by server)
   - Store access token in memory only if needed

2. **Always use HTTPS in production**
   - Cookies with `Secure` flag require HTTPS
   - Protects tokens in transit

3. **Implement proper error handling**
   - Don't expose sensitive information in error messages
   - Log errors server-side for debugging

4. **Handle token expiration gracefully**
   - Implement automatic token refresh
   - Show appropriate messages to users

5. **Session management**
   - Allow users to view active sessions
   - Provide option to logout from all devices
   - Monitor for suspicious activity

---

## Environment Variables

Required environment variables for authentication system:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_RESEND_COOLDOWN_MINUTES=2

# SMS Configuration (bulksmsbd.net)
BULKSMSBD_API_KEY=your_api_key
BULKSMSBD_SENDER_ID=your_sender_id
BULKSMSBD_API_URL=http://bulksmsbd.net/api/smsapi
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
  "path": "/auth/login",
  "statusCode": 400
}
```

Common HTTP status codes:

- `400 Bad Request`: Validation errors, invalid input
- `401 Unauthorized`: Authentication required, invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (e.g., email/phone already registered)
- `500 Internal Server Error`: Server error

---

## Rate Limiting

The following rate limits apply:

- **OTP Resend**: Minimum 2 minutes between requests (configurable)
- **Password Reset**: Minimum 2 minutes between requests (configurable)
- **Login Attempts**: Consider implementing rate limiting for failed login attempts (not currently implemented)

---

## Testing

### Test Credentials

For development/testing, you can use:

```json
{
  "email": "test@example.com",
  "phone": "8801712345678",
  "password": "Test1234@",
  "fullName": "Test User"
}
```

### Postman Collection

A Postman collection is available at `sms-verification.postman_collection.json` for testing all endpoints.

---

## Support

For issues or questions:

1. Check error messages in response
2. Verify environment variables are set correctly
3. Check SMS service configuration (API key, sender ID)
4. Review server logs for detailed error information
