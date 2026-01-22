# Security Policy

## Important Security Notes

This project uses Slack browser session tokens (`xoxc-` and `xoxd-`) which provide full access to your Slack workspace. Please understand the security implications:

### Token Security

- **Never share your tokens** - They provide the same access as your Slack login
- **Tokens are stored locally** with restricted permissions (`chmod 600`)
- **macOS Keychain** provides encrypted storage when available
- **Tokens expire** every 1-2 weeks, limiting exposure window

### Local Security

- The web server binds to `localhost` only by default
- API keys are required for web server access
- Never expose the web server to the public internet

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email the details to the maintainer privately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in the security advisory (if desired)

## Security Best Practices

When using this project:

1. **Keep tokens private** - Never commit them to version control
2. **Use token auto-refresh** - Limits exposure of stale tokens
3. **Monitor access** - Check Slack's "Access Logs" periodically
4. **Limit scope** - Only use in trusted environments
5. **Keep updated** - Install security updates promptly

## Disclosure Policy

We follow responsible disclosure:

1. Reporter notifies maintainer privately
2. Maintainer confirms and assesses severity
3. Fix is developed and tested
4. Security advisory is published with fix
5. Reporter is credited (if desired)

## Known Limitations

- This project uses unofficial Slack APIs
- Tokens may be invalidated by Slack at any time
- Not officially supported by Slack
- Use at your own risk
