/**
 * Discord Token Checker - Main Export File
 * 
 * A comprehensive Discord token validation and verification library
 * that provides both programmatic API and CLI interface.
 */

// Main classes
export { DiscordTokenChecker } from './token-checker';
export { FormatValidator } from './validators/format-validator';
export { ApiValidator } from './validators/api-validator';
export { TokenCheckerCLI } from './cli';

// Types and interfaces
export {
  TokenValidationResult,
  DiscordUserInfo,
  TokenCheckerConfig,
  EnvTokenOptions,
  FileTokenOptions,
  ApiValidationResponse,
  TokenSource,
  ValidationMethod,
  TokenErrorType,
  TokenValidationError,
} from './types/token.types';

// Convenience functions for quick usage
import { DiscordTokenChecker } from './token-checker';
import { TokenCheckerConfig } from './types/token.types';

export const quickFormatCheck = (token: string): boolean => {
  return DiscordTokenChecker.quickFormatCheck(token);
};

export const quickApiCheck = async (
  token: string,
  timeout?: number,
): Promise<{ valid: boolean; error?: string }> => {
  return DiscordTokenChecker.quickApiCheck(token, timeout);
};

export const extractUserId = (token: string): string | null => {
  return DiscordTokenChecker.extractUserId(token);
};

export const extractTimestamp = (token: string): Date | null => {
  return DiscordTokenChecker.extractTimestamp(token);
};

// Factory function for creating checker instances
export const createChecker = (config?: Partial<TokenCheckerConfig>): DiscordTokenChecker => {
  return DiscordTokenChecker.create(config);
};

// Default export
export default DiscordTokenChecker;
