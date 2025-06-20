# 🔍 Discord Token Checker

A simple, fast Discord token validation tool for Node.js and CLI.

## 🚀 Features & Security
- **Format & API Validation**: Checks structure, length, and verifies with Discord API
- **User Info Extraction**: Get user details from valid tokens
- **No Token Logging**: No storage, secure HTTPS requests
- **TypeScript Support**: Full type definitions
- **Rate Limit Handling**: Automatic retry logic
- **Error Handling**: Detailed errors, rate limit & network detection
- **Privacy**: Local validation, no third-party services

## 📦 Install

```bash
npm install discord-token-checker # as a package
npm install -g discord-token-checker # as a CLI
```

## ⚡ Quick Usage

### Node.js
```js
const { DiscordTokenChecker, createChecker } = require('discord-token-checker');

// Quick format check
DiscordTokenChecker.quickFormatCheck('your_token_here');

// Quick API check (async)
await DiscordTokenChecker.quickApiCheck('your_token_here');

// Full validation
const checker = createChecker();
const result = await checker.validateDirect('your_token_here');
console.log(result.isValid);
```

### CLI
```bash
discord-token-checker quick "your_token_here"
discord-token-checker test-direct "your_token_here"
discord-token-checker verify-env
```

For more, see [API Documentation](docs/API.md).

## 🛠️ Development

```bash
git clone https://github.com/NirussVn0/discord-token-checker.git
cd discord-token-checker
npm install
npm run build
```

## 🧪 Testing

```bash
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

# 🤝 Contribute
Contributions are welcome! Please:
- **Fork this repo on GitHub:** [Fork via GitHub](https://github.com/NirussVn0/discord-token-checker/fork)
- **Repository URL:** [https://github.com/NirussVn0/discord-token-checker](https://github.com/NirussVn0/discord-token-checker)
- **Create a feature branch, add tests, and submit a pull request!**

# 📞 Support

- **Author:** NirussVn0
- **Discord:** [hikariisan.vn](https://discord.gg/5Naa9X9W7f)
- **Email:** [niruss.dev](mailto:work.niruss.dev@gmail.com)

---
**🔒 Use responsibly and for educational purposes only!**