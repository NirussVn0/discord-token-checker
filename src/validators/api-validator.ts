import https from 'https';
import {
  ApiValidationResponse,
  DiscordUserInfo,
  TokenErrorType,
  TokenValidationError,
  TokenCheckerConfig,
} from '../types/token.types';

/**
 * Discord API token validator
 * Validates tokens by making requests to Discord's API
 */
export class ApiValidator {
  private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private static readonly DEFAULT_USER_AGENT = 'DiscordTokenChecker/1.0.0';

  /**
   * Validate token with Discord API
   * @param token - The Discord token to validate
   * @param config - Validation configuration
   * @returns API validation response
   */
  static async validateWithApi(
    token: string,
    config: Partial<TokenCheckerConfig> = {},
  ): Promise<ApiValidationResponse> {
    const finalConfig: TokenCheckerConfig = {
      checkApi: true,
      timeout: config.timeout || this.DEFAULT_TIMEOUT,
      includeUserInfo: config.includeUserInfo ?? true,
      validateFormat: config.validateFormat ?? false,
      userAgent: config.userAgent || this.DEFAULT_USER_AGENT,
    };

    try {
      // Make request to Discord API
      const userInfo = await this.makeApiRequest(token, finalConfig);
      
      const response: ApiValidationResponse = {
        success: true,
      };

      if (finalConfig.includeUserInfo) {
        response.userInfo = userInfo;
      }

      return response;
    } catch (error) {
      if (error instanceof TokenValidationError) {
        return {
          success: false,
          error: error.message,
          statusCode: error.details?.statusCode,
          rateLimited: error.type === TokenErrorType.RATE_LIMITED,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Make HTTP request to Discord API
   * @param token - The Discord token
   * @param config - Request configuration
   * @returns Discord user information
   */
  private static async makeApiRequest(
    token: string,
    config: TokenCheckerConfig,
  ): Promise<DiscordUserInfo> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'discord.com',
        port: 443,
        path: '/api/v10/users/@me',
        method: 'GET',
        headers: {
          'Authorization': token,
          'User-Agent': config.userAgent,
          'Content-Type': 'application/json',
        },
        timeout: config.timeout,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            // Handle different response status codes
            switch (res.statusCode) {
              case 200:
                // Success - token is valid
                resolve(this.parseUserInfo(response));
                break;

              case 401:
                // Unauthorized - invalid token
                reject(
                  new TokenValidationError(
                    'Token is invalid or expired',
                    TokenErrorType.UNAUTHORIZED,
                    { statusCode: 401, response },
                  ),
                );
                break;

              case 429:
                // Rate limited
                const retryAfter = res.headers['retry-after'];
                reject(
                  new TokenValidationError(
                    `Rate limited. Retry after ${retryAfter} seconds`,
                    TokenErrorType.RATE_LIMITED,
                    { statusCode: 429, retryAfter, response },
                  ),
                );
                break;

              case 403:
                // Forbidden
                reject(
                  new TokenValidationError(
                    'Access forbidden. Token may be valid but lacks permissions',
                    TokenErrorType.API_ERROR,
                    { statusCode: 403, response },
                  ),
                );
                break;

              default:
                // Other errors
                reject(
                  new TokenValidationError(
                    `API request failed with status ${res.statusCode}`,
                    TokenErrorType.API_ERROR,
                    { statusCode: res.statusCode, response },
                  ),
                );
            }
          } catch (parseError) {
            reject(
              new TokenValidationError(
                'Failed to parse API response',
                TokenErrorType.API_ERROR,
                { parseError, rawData: data },
              ),
            );
          }
        });
      });

      req.on('error', (error) => {
        reject(
          new TokenValidationError(
            `Network error: ${error.message}`,
            TokenErrorType.NETWORK_ERROR,
            { originalError: error },
          ),
        );
      });

      req.on('timeout', () => {
        req.destroy();
        reject(
          new TokenValidationError(
            `Request timeout after ${config.timeout}ms`,
            TokenErrorType.NETWORK_ERROR,
            { timeout: config.timeout },
          ),
        );
      });

      req.end();
    });
  }

  /**
   * Parse Discord user information from API response
   * @param response - Raw API response
   * @returns Parsed user information
   */
  private static parseUserInfo(response: any): DiscordUserInfo {
    return {
      id: response.id,
      username: response.username,
      discriminator: response.discriminator || '0',
      email: response.email,
      verified: response.verified,
      mfaEnabled: response.mfa_enabled,
      premium: response.premium_type > 0,
      premiumType: response.premium_type,
      avatar: response.avatar,
      banner: response.banner,
      accentColor: response.accent_color,
    };
  }

  /**
   * Test token with minimal API call
   * @param token - The Discord token to test
   * @param timeout - Request timeout in milliseconds
   * @returns Simple validation result
   */
  static async quickTest(
    token: string,
    timeout: number = this.DEFAULT_TIMEOUT,
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const result = await this.validateWithApi(token, {
        timeout,
        includeUserInfo: false,
      });
      
      const response: { valid: boolean; error?: string } = { valid: result.success };
      if (result.error) {
        response.error = result.error;
      }
      return response;
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if error indicates rate limiting
   * @param error - The error to check
   * @returns True if error is rate limiting
   */
  static isRateLimited(error: any): boolean {
    return (
      error instanceof TokenValidationError &&
      error.type === TokenErrorType.RATE_LIMITED
    );
  }

  /**
   * Get retry delay from rate limit error
   * @param error - The rate limit error
   * @returns Retry delay in seconds
   */
  static getRetryDelay(error: any): number {
    if (this.isRateLimited(error) && error.details?.retryAfter) {
      return parseInt(error.details.retryAfter, 10);
    }
    return 60; // Default 1 minute
  }
}
