# 📚 API Documentation

## Main Classes

### `DiscordTokenChecker`

Main class for token validation.

```typescript
const checker = new DiscordTokenChecker({
  checkApi: true,           // Perform API validation
  timeout: 10000,          // Request timeout in ms
  includeUserInfo: true,   // Include user info in results
  validateFormat: true,    // Validate token format
  userAgent: 'Custom/1.0', // Custom user agent
});
```

#### Methods
- `validateFromEnv(options)` - Validate token from environment
- `validateFromFile(options)` - Validate token from file
- `validateDirect(token, method)` - Validate token directly
- `updateConfig(config)` - Update configuration
- `getConfig()` - Get current configuration

#### Static Methods
- `quickFormatCheck(token)` - Quick format validation
- `quickApiCheck(token, timeout)` - Quick API validation
- `extractUserId(token)` - Extract user ID from token
- `extractTimestamp(token)` - Extract creation timestamp
- `create(config)` - Create new instance

## Types

### Validation Results
```typescript
interface TokenValidationResult {
  isValid: boolean;
  format: {
    hasCorrectParts: boolean;
    hasCorrectLength: boolean;
    hasNoSpaces: boolean;
    hasNoQuotes: boolean;
    isNotBotToken: boolean;
  };
  api?: {
    isActive: boolean;
    userInfo?: DiscordUserInfo;
    error?: string;
  };
  errors: string[];
  warnings: string[];
  metadata: {
    length: number;
    parts: number;
    source: 'env' | 'file' | 'direct';
  };
}
```

### User Information
```typescript
interface DiscordUserInfo {
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
```

## CLI Commands

### `verify-env`
Verify Discord token from .env file.

```bash
discord-token-checker verify-env [options]

Options:
  -p, --path <path>     Path to .env file (default: ".env")
  -v, --var <variable>  Environment variable name (default: "DISCORD_TOKEN")
  --no-api             Skip API validation
  --timeout <ms>       API request timeout (default: "10000")
```

### `check-api`
Check token with Discord API from file.

```bash
discord-token-checker check-api [options]

Options:
  -f, --file <path>    Token file path (default: "input.txt")
  --cleanup           Delete token file after checking
  --timeout <ms>      API request timeout (default: "10000")
  --no-user-info      Skip user information retrieval
```

### `test-direct`
Test token directly.

```bash
discord-token-checker test-direct <token> [options]

Options:
  --format-only       Only validate format, skip API
  --api-only         Only validate API, skip format
  --timeout <ms>     API request timeout (default: "5000")
```

### `quick`
Quick token format check.

```bash
discord-token-checker quick <token>
```

### `extract`
Extract information from token.

```bash
discord-token-checker extract <token>
```
