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
npm install token-discord-checker # as a package
npm install -g token-discord-checker # as a CLI
```

## ⚡ Quick Usage

### Node.js

```js
const { DiscordTokenChecker, createChecker } = require("token-discord-checker");

// Quick format check
DiscordTokenChecker.quickFormatCheck("your_token_here");

// Quick API check (async)
await DiscordTokenChecker.quickApiCheck("your_token_here");

// Full validation
const checker = createChecker();
const result = await checker.validateDirect("your_token_here");
console.log(result.isValid);
```

### CLI

```
token-discord-checker quick "your_token_here"
token-discord-checker test-direct "your_token_here"
token-discord-checker verify-env
```

For more, see [API Documentation](docs/API.md).

## 🛠️ Development

```bash
git clone https://github.com/NirussVn0/token-discord-checker.git
cd token-discord-checker
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

- **Fork this repo on GitHub:** [Fork via GitHub](https://github.com/NirussVn0/token-discord-checker/fork)
- **Repository URL:** [https://github.com/NirussVn0/token-discord-checker](https://github.com/NirussVn0/token-discord-checker)
- **Create a feature branch, add tests, and submit a pull request!**

# 📞 Support

- **Author:** NirussVn0
- **Discord:** [hikariisan.vn](https://discord.gg/5Naa9X9W7f)
- **Email:** [niruss.dev](mailto:work.niruss.dev@gmail.com)

---

**🔒 Use responsibly and for educational purposes only!**
