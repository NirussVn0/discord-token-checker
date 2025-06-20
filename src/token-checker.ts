import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { FormatValidator } from './validators/format-validator';
import { ApiValidator } from './validators/api-validator';
import {
  TokenValidationResult,
  TokenCheckerConfig,
  EnvTokenOptions,
  FileTokenOptions,
  ValidationMethod,
  TokenSource,
  TokenErrorType,
  TokenValidationError,
  DiscordUserInfo,
} from './types/token.types';

/**
 * Main Discord Token Checker class
 * Provides comprehensive token validation functionality
 */
export class DiscordTokenChecker {
  private config: TokenCheckerConfig;

  constructor(config: Partial<TokenCheckerConfig> = {}) {
    const DEFAULT_USER_AGENT = 'DiscordTokenChecker/1.0.0';
    this.config = {
      checkApi: config.checkApi ?? true,
      timeout: config.timeout ?? 10000,
      includeUserInfo: config.includeUserInfo ?? true,
      validateFormat: config.validateFormat ?? true,
      userAgent: config.userAgent ?? DEFAULT_USER_AGENT,
    };
  }

  /**
   * Validate token from environment variable
   * @param options - Environment validation options
   * @returns Validation result
   */
  async validateFromEnv(
    options: EnvTokenOptions = {},
  ): Promise<TokenValidationResult> {
    const envPath = options.envPath || path.join(process.cwd(), '.env');
    const tokenVar = options.tokenVar || 'DISCORD_TOKEN';

    // Load environment variables
    config({ path: envPath });

    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      throw new TokenValidationError(
        `.env file not found at ${envPath}`,
        TokenErrorType.FILE_NOT_FOUND,
      );
    }

    // Get token from environment
    const token = process.env[tokenVar];

    if (!token) {
      throw new TokenValidationError(
        `${tokenVar} not found in environment variables`,
        TokenErrorType.TOKEN_NOT_FOUND,
      );
    }

    // Validate the token
    const result = await this.validateToken(token, 'env');
    return result;
  }

  /**
   * Validate token from file
   * @param options - File validation options
   * @returns Validation result
   */
  async validateFromFile(
    options: FileTokenOptions,
  ): Promise<TokenValidationResult> {
    const { filePath, cleanup = false } = options;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new TokenValidationError(
        `Token file not found at ${filePath}`,
        TokenErrorType.FILE_NOT_FOUND,
      );
    }

    try {
      // Read token from file
      const token = fs.readFileSync(filePath, 'utf8').trim();

      if (!token) {
        throw new TokenValidationError(
          'Token file is empty',
          TokenErrorType.TOKEN_NOT_FOUND,
        );
      }

      // Validate the token
      const result = await this.validateToken(token, 'file');

      // Clean up file if requested
      if (cleanup) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          // Add warning about cleanup failure
          result.warnings.push(`Failed to clean up file: ${cleanupError}`);
        }
      }

      return result;
    } catch (error) {
      if (error instanceof TokenValidationError) {
        throw error;
      }

      throw new TokenValidationError(
        `Failed to read token file: ${error}`,
        TokenErrorType.FILE_NOT_FOUND,
        { originalError: error },
      );
    }
  }

  /**
   * Validate token directly
   * @param token - The token to validate
   * @param method - Validation method to use
   * @returns Validation result
   */
  async validateDirect(
    token: string,
    method: ValidationMethod = 'both',
  ): Promise<TokenValidationResult> {
    return this.validateToken(token, 'direct', method);
  }

  /**
   * Internal token validation method
   * @param token - The token to validate
   * @param source - Token source
   * @param method - Validation method
   * @returns Validation result
   */
  private async validateToken(
    token: string,
    source: TokenSource,
    method: ValidationMethod = 'both',
  ): Promise<TokenValidationResult> {
    let result: TokenValidationResult;

    // Start with format validation
    if (method === 'format' || method === 'both') {
      result = FormatValidator.validateFormat(token);
      result.metadata.source = source;

      // If format validation fails and we're only doing format validation, return early
      if (!result.isValid && method === 'format') {
        return result;
      }
    } else {
      // Create minimal result for API-only validation
      result = {
        isValid: true,
        format: {
          hasCorrectParts: true,
          hasCorrectLength: true,
          hasNoSpaces: true,
          hasNoQuotes: true,
          isNotBotToken: true,
        },
        errors: [],
        warnings: [],
        metadata: {
          length: token.length,
          parts: token.split('.').length,
          source,
        },
      };
    }

    // Perform API validation if requested
    if ((method === 'api' || method === 'both') && this.config.checkApi) {
      try {
        const apiResult = await ApiValidator.validateWithApi(token, this.config);

        const apiInfo: { isActive: boolean; userInfo?: DiscordUserInfo; error?: string } = {
          isActive: apiResult.success,
        };

        if (apiResult.userInfo) {
          apiInfo.userInfo = apiResult.userInfo;
        }

        if (apiResult.error) {
          apiInfo.error = apiResult.error;
        }

        result.api = apiInfo;

        // If API validation fails, mark overall result as invalid
        if (!apiResult.success) {
          result.isValid = false;
          if (apiResult.error) {
            result.errors.push(`API validation failed: ${apiResult.error}`);
          }
        }
      } catch (error) {
        result.api = {
          isActive: false,
          error: error instanceof Error ? error.message : 'Unknown API error',
        };

        result.isValid = false;
        result.errors.push(`API validation error: ${result.api.error}`);
      }
    }

    return result;
  }

  /**
   * Quick token test (format only)
   * @param token - The token to test
   * @returns Simple boolean result
   */
  static quickFormatCheck(token: string): boolean {
    try {
      const result = FormatValidator.validateFormat(token);
      return result.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Quick API test
   * @param token - The token to test
   * @param timeout - Request timeout
   * @returns Simple validation result
   */
  static async quickApiCheck(
    token: string,
    timeout: number = 5000,
  ): Promise<{ valid: boolean; error?: string }> {
    return ApiValidator.quickTest(token, timeout);
  }

  /**
   * Extract user ID from token
   * @param token - The token
   * @returns User ID or null
   */
  static extractUserId(token: string): string | null {
    return FormatValidator.extractUserId(token);
  }

  /**
   * Extract timestamp from token
   * @param token - The token
   * @returns Timestamp or null
   */
  static extractTimestamp(token: string): Date | null {
    return FormatValidator.extractTimestamp(token);
  }

  /**
   * Create a new token checker instance with custom config
   * @param config - Custom configuration
   * @returns New token checker instance
   */
  static create(config: Partial<TokenCheckerConfig> = {}): DiscordTokenChecker {
    return new DiscordTokenChecker(config);
  }

  /**
   * Update checker configuration
   * @param config - New configuration options
   */
  updateConfig(config: Partial<TokenCheckerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): TokenCheckerConfig {
    return { ...this.config };
  }
}
