# Contributing to Slack MCP Server

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/slack-mcp-server.git
   cd slack-mcp-server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- A Slack workspace for testing
- Chrome browser (for token extraction)

### Running Locally

```bash
# Start the MCP server
npm start

# Start the web server
npm run web

# Check token status
npm run tokens:status
```

## Code Style

- Use ES modules (`import`/`export`)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small
- Handle errors gracefully

## Project Structure

```
slack-mcp-server/
├── src/           # Main entry points
├── lib/           # Core library code
├── public/        # Web UI files
├── scripts/       # CLI utilities
└── docs/          # Documentation
```

## Making Changes

### For Bug Fixes
1. Create an issue describing the bug (if one doesn't exist)
2. Reference the issue in your PR
3. Include steps to reproduce and verify the fix

### For New Features
1. Open an issue to discuss the feature first
2. Wait for feedback before starting work
3. Keep changes focused on the feature
4. Update documentation as needed

## Commit Messages

Use clear, descriptive commit messages:

```
Add support for message reactions

- Implement reaction fetching in slack-client
- Add reactions to message export format
- Update documentation with new fields
```

## Pull Request Process

1. Update documentation for any new features
2. Ensure your code works with Node.js 18, 20, and 22
3. Test with at least one Claude client (Desktop, Code, or Web UI)
4. Fill out the PR template completely
5. Request review from @jtalk22

## Testing

Since this project interacts with Slack's API using browser tokens, testing requires:

1. Valid Slack tokens (run `npm run tokens:auto`)
2. Access to a Slack workspace
3. Manual verification of functionality

Before submitting:
- [ ] Verify the MCP server starts without errors
- [ ] Test the specific feature/fix you're changing
- [ ] Verify existing functionality still works

## Security

- Never commit tokens or credentials
- Don't log sensitive data
- Report security issues privately (see SECURITY.md)

## Questions?

- Open a [Discussion](https://github.com/jtalk22/slack-mcp-server/discussions) for questions
- Check existing issues before creating new ones
- Join the conversation!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
