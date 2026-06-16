/**
 * JWT Payload Interface - Structure of access token payload
 */
export interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Refresh Token Payload Interface - Structure of refresh token payload
 */
export interface RefreshTokenPayload {
  sub: string; // user id
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Token Pair Interface - Access and refresh tokens together
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticated User Interface - User data after successful authentication
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  phone?: string;
  roles: string[];
}

/**
 * JWT User Interface - User data extracted from JWT token by guards
 */
export interface JwtUser {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * Login Credentials Interface - User input for authentication
 * Supports login with either email or phone number
 * Requires roleId to validate user is logging in with correct role
 */
export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
  roleId: string;
}

/**
 * Login Response Interface - Complete response after successful login
 */
export interface LoginResponse {
  user: {
    userId: string;
    email: string;
    phone?: string;
    roles: string[];
    message: string;
    caregiverProfile?: any;
    clientProfile?: any;
  };
  tokens: TokenPair;
  sessionId: string;
}

/**
 * Device Information Interface - Client device metadata
 */
export interface DeviceInfo {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

/**
 * Auth Session Interface - Database session record structure
 */
export interface AuthSession {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cookie Options Interface - HTTP cookie configuration
 */
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

/**
 * Auth Configuration Interface - Authentication system settings
 */
export interface AuthConfig {
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  cookieSettings: {
    accessToken: CookieOptions;
    refreshToken: CookieOptions;
    sessionId: CookieOptions;
  };
}

/**
 * Auth Service Interface - Contract for authentication service
 */
export interface IAuthService {
  validateUser(
    emailOrPhone: string,
    password: string,
  ): Promise<AuthenticatedUser | null>;
  login(
    credentials: LoginCredentials,
    deviceInfo: DeviceInfo,
  ): Promise<LoginResponse>;
  refreshTokens(refreshToken: string): Promise<TokenPair>;
  logout(refreshToken: string): Promise<void>;
  logoutAllDevices(userId: string): Promise<void>;
  getActiveSessions(userId: string): Promise<AuthSession[]>;
}

/**
 * JWT Token Service Interface - Contract for JWT token operations
 */
export interface IJwtTokenService {
  generateAccessToken(payload: JwtPayload): string;
  generateRefreshToken(userId: string): string;
  generateTokenPair(user: AuthenticatedUser): TokenPair;
  verifyAccessToken(token: string): JwtPayload;
  verifyRefreshToken(token: string): RefreshTokenPayload;
  getRefreshTokenExpiry(): Date;
  extractTokenFromHeader(authHeader: string): string | null;
}

/**
 * Auth Sessions Repository Interface - Contract for database operations on auth sessions
 */
export interface IAuthSessionsRepository {
  createSession(sessionData: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
  }): Promise<AuthSession>;

  findSessionByToken(refreshToken: string): Promise<AuthSession | null>;

  findSessionsByUserId(
    userId: string,
    includeInactive?: boolean,
  ): Promise<AuthSession[]>;

  updateSessionLastUsed(sessionId: string): Promise<void>;

  deactivateSession(refreshToken: string): Promise<void>;

  deactivateAllUserSessions(userId: string): Promise<void>;

  removeExpiredSessions(): Promise<number>;

  findSessionById(sessionId: string): Promise<AuthSession | null>;
}
