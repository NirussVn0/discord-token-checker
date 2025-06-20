import {
  TokenValidationResult,
  TokenErrorType,
  TokenValidationError,
} from '../types/token.types';

/**
 * Discord token format validator
 * Validates token structure and format without making API calls
 */
export class FormatValidator {
  /**
   * Validate token format
   * @param token - The Discord token to validate
   * @returns Validation result with format details
   */
  static validateFormat(token: string): TokenValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic null/undefined check
    if (!token) {
      throw new TokenValidationError(
        'Token is null or undefined',
        TokenErrorType.TOKEN_NOT_FOUND,
      );
    }

    // Trim whitespace
    const trimmedToken = token.trim();

    // Check for empty token
    if (trimmedToken.length === 0) {
      throw new TokenValidationError(
        'Token is empty',
        TokenErrorType.TOKEN_NOT_FOUND,
      );
    }

    // Check for placeholder tokens
    const placeholders = [
      'your_discord_token_here',
      'your_discord_user_token_here',
      'your_token_here',
      'TOKEN_HERE',
      'DISCORD_TOKEN',
    ];

    if (placeholders.includes(trimmedToken)) {
      errors.push('Token is still using placeholder value');
    }

    // Validate token parts (should be 3 parts separated by dots)
    const tokenParts = trimmedToken.split('.');
    const hasCorrectParts = tokenParts.length === 3;

    if (!hasCorrectParts) {
      errors.push(
        `Token should have 3 parts separated by dots, found ${tokenParts.length}`,
      );
    }

    // Validate token length (Discord tokens are typically 70+ characters)
    const hasCorrectLength = trimmedToken.length >= 50;

    if (!hasCorrectLength) {
      if (trimmedToken.length < 30) {
        errors.push(
          `Token is too short (${trimmedToken.length} characters). Discord tokens are typically 70+ characters`,
        );
      } else {
        warnings.push(
          `Token might be too short (${trimmedToken.length} characters). Discord tokens are typically 70+ characters`,
        );
      }
    }

    // Check for spaces
    const hasNoSpaces = !trimmedToken.includes(' ');
    if (!hasNoSpaces) {
      errors.push('Token contains spaces - remove all spaces');
    }

    // Check for quotes
    const hasNoQuotes =
      !trimmedToken.startsWith('"') &&
      !trimmedToken.endsWith('"') &&
      !trimmedToken.startsWith("'") &&
      !trimmedToken.endsWith("'");

    if (!hasNoQuotes) {
      errors.push('Token has quotes - remove all quotes');
    }

    // Check if it's a bot token
    const isNotBotToken = !trimmedToken.startsWith('Bot ');
    if (!isNotBotToken) {
      errors.push(
        'This appears to be a BOT token. Self-bots require USER tokens',
      );
    }

    // Additional format validations
    this.validateTokenStructure(tokenParts, errors, warnings);

    const isValid = errors.length === 0;

    return {
      isValid,
      format: {
        hasCorrectParts,
        hasCorrectLength,
        hasNoSpaces,
        hasNoQuotes,
        isNotBotToken,
      },
      errors,
      warnings,
      metadata: {
        length: trimmedToken.length,
        parts: tokenParts.length,
        source: 'direct',
      },
    };
  }

  /**
   * Validate individual token parts structure
   * @param parts - Token parts array
   * @param errors - Errors array to append to
   * @param warnings - Warnings array to append to
   */
  private static validateTokenStructure(
    parts: string[],
    _errors: string[],
    warnings: string[],
  ): void {
    if (parts.length !== 3) {
      return; // Already handled in main validation
    }

    const [userPart, timestampPart, signaturePart] = parts;

    // Validate user ID part (should be base64-encoded user ID)
    if (userPart.length < 10) {
      warnings.push('First part (user ID) seems too short');
    }

    // Validate timestamp part
    if (timestampPart.length < 6) {
      warnings.push('Second part (timestamp) seems too short');
    }

    // Validate signature part
    if (signaturePart.length < 20) {
      warnings.push('Third part (signature) seems too short');
    }

    // Check for valid base64-like characters
    const base64Regex = /^[A-Za-z0-9+/=_-]+$/;

    if (!base64Regex.test(userPart)) {
      warnings.push('First part contains invalid characters for base64');
    }

    if (!base64Regex.test(timestampPart)) {
      warnings.push('Second part contains invalid characters for base64');
    }

    if (!base64Regex.test(signaturePart)) {
      warnings.push('Third part contains invalid characters for base64');
    }
  }

  /**
   * Extract user ID from token (if possible)
   * @param token - The Discord token
   * @returns User ID or null if extraction fails
   */
  static extractUserId(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the first part (user ID)
      const userIdPart = parts[0];
      const decoded = Buffer.from(userIdPart, 'base64').toString('utf-8');
      
      // User ID should be a numeric string
      if (/^\d+$/.test(decoded)) {
        return decoded;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token creation timestamp (if possible)
   * @param token - The Discord token
   * @returns Timestamp or null if extraction fails
   */
  static extractTimestamp(token: string): Date | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode the second part (timestamp)
      const timestampPart = parts[1];
      const decoded = Buffer.from(timestampPart, 'base64').toString('utf-8');
      
      // Convert to timestamp
      const timestamp = parseInt(decoded, 10);
      if (isNaN(timestamp)) {
        return null;
      }

      return new Date(timestamp * 1000);
    } catch (error) {
      return null;
    }
  }
}
