#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { DiscordTokenChecker } from './token-checker';
import {
  TokenValidationResult,
  TokenValidationError,
  TokenErrorType,
} from './types/token.types';

const program = new Command();

/**
 * CLI for Discord Token Checker
 */
class TokenCheckerCLI {
  constructor() {
    this.setupCommands();
  }

  private setupCommands(): void {
    program
      .name('token-discord-checker')
      .description('Discord token validation and verification tool')
      .version('1.0.0');

    // Verify environment token command
    program
      .command('verify-env')
      .description('Verify Discord token from .env file')
      .option('-p, --path <path>', 'Path to .env file', '.env')
      .option('-v, --var <variable>', 'Environment variable name', 'DISCORD_TOKEN')
      .option('--no-api', 'Skip API validation')
      .option('--timeout <ms>', 'API request timeout in milliseconds', '10000')
      .action(async (options) => {
        await this.verifyEnvToken(options);
      });

    // Check API command
    program
      .command('check-api')
      .description('Check token with Discord API from input.txt')
      .option('-f, --file <path>', 'Token file path', 'input.txt')
      .option('--cleanup', 'Delete token file after checking')
      .option('--timeout <ms>', 'API request timeout in milliseconds', '10000')
      .option('--no-user-info', 'Skip user information retrieval')
      .action(async (options) => {
        await this.checkApiToken(options);
      });

    // Direct test command
    program
      .command('test-direct')
      .description('Test token directly (bypasses Discord.js validation)')
      .argument('<token>', 'Discord token to test')
      .option('--format-only', 'Only validate format, skip API')
      .option('--api-only', 'Only validate API, skip format')
      .option('--timeout <ms>', 'API request timeout in milliseconds', '5000')
      .action(async (token, options) => {
        await this.testDirectToken(token, options);
      });

    // Quick check command
    program
      .command('quick')
      .description('Quick token format check')
      .argument('<token>', 'Discord token to check')
      .action(async (token) => {
        await this.quickCheck(token);
      });

    // Extract info command
    program
      .command('extract')
      .description('Extract information from token')
      .argument('<token>', 'Discord token to analyze')
      .action(async (token) => {
        await this.extractTokenInfo(token);
      });
  }

  private async verifyEnvToken(options: any): Promise<void> {
    console.log(chalk.blue('🔍 Discord Token Environment Checker\n'));

    try {
      const checker = new DiscordTokenChecker({
        checkApi: options.api !== false,
        timeout: parseInt(options.timeout, 10),
        includeUserInfo: true,
      });

      const result = await checker.validateFromEnv({
        envPath: options.path,
        tokenVar: options.var,
      });

      this.displayResult(result);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async checkApiToken(options: any): Promise<void> {
    console.log(chalk.blue('🌐 Discord Token API Checker\n'));

    try {
      const checker = new DiscordTokenChecker({
        checkApi: true,
        timeout: parseInt(options.timeout, 10),
        includeUserInfo: options.userInfo !== false,
      });

      const result = await checker.validateFromFile({
        filePath: options.file,
        cleanup: options.cleanup,
      });

      this.displayResult(result);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async testDirectToken(token: string, options: any): Promise<void> {
    console.log(chalk.blue('⚡ Direct Token Test\n'));

    try {
      let method: 'format' | 'api' | 'both' = 'both';
      
      if (options.formatOnly) {
        method = 'format';
      } else if (options.apiOnly) {
        method = 'api';
      }

      const checker = new DiscordTokenChecker({
        checkApi: method !== 'format',
        timeout: parseInt(options.timeout, 10),
        includeUserInfo: true,
      });

      const result = await checker.validateDirect(token, method);
      this.displayResult(result);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async quickCheck(token: string): Promise<void> {
    console.log(chalk.blue('⚡ Quick Format Check\n'));

    try {
      const isValid = DiscordTokenChecker.quickFormatCheck(token);
      
      if (isValid) {
        console.log(chalk.green('✅ Token format appears valid'));
      } else {
        console.log(chalk.red('❌ Token format is invalid'));
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private async extractTokenInfo(token: string): Promise<void> {
    console.log(chalk.blue('🔍 Token Information Extractor\n'));

    try {
      const userId = DiscordTokenChecker.extractUserId(token);
      const timestamp = DiscordTokenChecker.extractTimestamp(token);

      console.log(chalk.cyan('📊 Token Analysis:'));
      console.log(`📏 Length: ${token.length} characters`);
      console.log(`🔢 Parts: ${token.split('.').length}`);
      
      if (userId) {
        console.log(chalk.green(`👤 User ID: ${userId}`));
      } else {
        console.log(chalk.yellow('👤 User ID: Could not extract'));
      }

      if (timestamp) {
        console.log(chalk.green(`⏰ Created: ${timestamp.toISOString()}`));
        console.log(chalk.green(`📅 Age: ${this.getTokenAge(timestamp)}`));
      } else {
        console.log(chalk.yellow('⏰ Timestamp: Could not extract'));
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private displayResult(result: TokenValidationResult): void {
    console.log(chalk.cyan('📊 Validation Results:\n'));

    // Overall status
    if (result.isValid) {
      console.log(chalk.green('✅ Token is VALID and ACTIVE'));
    } else {
      console.log(chalk.red('❌ Token is INVALID'));
    }

    // Metadata
    console.log(chalk.cyan('\n📏 Token Metadata:'));
    console.log(`   Length: ${result.metadata.length} characters`);
    console.log(`   Parts: ${result.metadata.parts}`);
    console.log(`   Source: ${result.metadata.source}`);

    // Format validation
    console.log(chalk.cyan('\n🔍 Format Validation:'));
    this.displayFormatResult(result.format);

    // API validation
    if (result.api) {
      console.log(chalk.cyan('\n🌐 API Validation:'));
      this.displayApiResult(result.api);
    }

    // Errors
    if (result.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      result.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }
  }

  private displayFormatResult(format: any): void {
    const checks = [
      { name: 'Correct parts (3)', value: format.hasCorrectParts },
      { name: 'Correct length', value: format.hasCorrectLength },
      { name: 'No spaces', value: format.hasNoSpaces },
      { name: 'No quotes', value: format.hasNoQuotes },
      { name: 'Not bot token', value: format.isNotBotToken },
    ];

    checks.forEach(check => {
      const icon = check.value ? '✅' : '❌';
      const color = check.value ? chalk.green : chalk.red;
      console.log(color(`   ${icon} ${check.name}`));
    });
  }

  private displayApiResult(api: any): void {
    if (api.isActive) {
      console.log(chalk.green('   ✅ Token is active'));
      
      if (api.userInfo) {
        console.log(chalk.cyan('\n👤 User Information:'));
        console.log(`   Username: ${api.userInfo.username}#${api.userInfo.discriminator}`);
        console.log(`   User ID: ${api.userInfo.id}`);
        
        if (api.userInfo.email) {
          console.log(`   Email: ${api.userInfo.email}`);
        }
        
        if (api.userInfo.verified !== undefined) {
          const verifiedIcon = api.userInfo.verified ? '✅' : '❌';
          console.log(`   Verified: ${verifiedIcon}`);
        }
        
        if (api.userInfo.mfaEnabled !== undefined) {
          const mfaIcon = api.userInfo.mfaEnabled ? '🔒' : '🔓';
          console.log(`   MFA: ${mfaIcon}`);
        }
        
        if (api.userInfo.premium) {
          console.log(chalk.magenta('   💎 Premium: Yes'));
        }
      }
    } else {
      console.log(chalk.red('   ❌ Token is not active'));
      if (api.error) {
        console.log(chalk.red(`   Error: ${api.error}`));
      }
    }
  }

  private handleError(error: any): void {
    if (error instanceof TokenValidationError) {
      console.log(chalk.red(`❌ ${error.message}`));
      
      if (error.type === TokenErrorType.FILE_NOT_FOUND) {
        console.log(chalk.yellow('\n💡 Suggestions:'));
        console.log(chalk.yellow('   • Check the file path'));
        console.log(chalk.yellow('   • Ensure the file exists'));
        console.log(chalk.yellow('   • Check file permissions'));
      } else if (error.type === TokenErrorType.TOKEN_NOT_FOUND) {
        console.log(chalk.yellow('\n💡 Suggestions:'));
        console.log(chalk.yellow('   • Add your Discord token to the file'));
        console.log(chalk.yellow('   • Check the environment variable name'));
        console.log(chalk.yellow('   • Ensure the token is not empty'));
      }
    } else {
      console.log(chalk.red(`❌ Unexpected error: ${error.message || error}`));
    }
    
    process.exit(1);
  }

  private getTokenAge(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return `${diffHours} hours`;
    } else if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} months`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} years`;
    }
  }

  run(): void {
    program.parse();
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new TokenCheckerCLI();
  cli.run();
}

export { TokenCheckerCLI };
