/**
 * Token validation result interface
 */
export interface TokenValidationResult {
  /**
   * Whether the token is valid
   */
  isValid: boolean;

  /**
   * Token format validation details
   */
  format: {
    hasCorrectParts: boolean;
    hasCorrectLength: boolean;
    hasNoSpaces: boolean;
    hasNoQuotes: boolean;
    isNotBotToken: boolean;
  };

  /**
   * API validation details (if performed)
   */
  api?: {
    isActive: boolean;
    userInfo?: DiscordUserInfo;
    error?: string;
  };

  /**
   * Validation errors
   */
  errors: string[];

  /**
   * Validation warnings
   */
  warnings: string[];

  /**
   * Token metadata
   */
  metadata: {
    length: number;
    parts: number;
    source: 'env' | 'file' | 'direct';
  };
}

/**
 * Discord user information from API
 */
export interface DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  verified?: boolean;
  mfaEnabled?: boolean;
  premium?: boolean;
  premiumType?: number;
  avatar?: string;
  banner?: string;
  accentColor?: number;
}

/**
 * Token checker configuration
 */
export interface TokenCheckerConfig {
  /**
   * Whether to perform API validation
   */
  checkApi: boolean;

  /**
   * Request timeout in milliseconds
   */
  timeout: number;

  /**
   * Whether to include user info in API response
   */
  includeUserInfo: boolean;

  /**
   * Whether to validate token format
   */
  validateFormat: boolean;

  /**
   * Custom user agent for API requests
   */
  userAgent?: string;
}

/**
 * Environment token validation options
 */
export interface EnvTokenOptions {
  /**
   * Path to .env file
   */
  envPath?: string;

  /**
   * Environment variable name
   */
  tokenVar?: string;
}

/**
 * File token validation options
 */
export interface FileTokenOptions {
  /**
   * Path to token file
   */
  filePath: string;

  /**
   * Whether to clean up file after reading
   */
  cleanup?: boolean;
}

/**
 * API validation response
 */
export interface ApiValidationResponse {
  success: boolean;
  userInfo?: DiscordUserInfo;
  error?: string;
  statusCode?: number;
  rateLimited?: boolean;
}

/**
 * Token source types
 */
export type TokenSource = 'env' | 'file' | 'direct';

/**
 * Validation method types
 */
export type ValidationMethod = 'format' | 'api' | 'both';

/**
 * Token checker error types
 */
export enum TokenErrorType {
  INVALID_FORMAT = 'INVALID_FORMAT',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_CONFIG = 'INVALID_CONFIG',
}

/**
 * Custom error class for token validation
 */
export class TokenValidationError extends Error {
  constructor(
    message: string,
    public type: TokenErrorType,
    public details?: any,
  ) {
    super(message);
    this.name = 'TokenValidationError';
  }
}
