# Contributing

Fork it. Fix it. PR it. Keep changes focused.

## Setup

```bash
git clone https://github.com/jtalk22/slack-mcp-server.git
cd slack-mcp-server
npm install
```

**Requirements:** Node 20+, valid Slack session tokens for testing (`xoxc-` + `xoxd-`).

## Development

```bash
npm start                      # MCP server on stdio
npm run web                    # REST API + Web UI (localhost:3000)
npm run build:public-pages     # Regenerate HTML from templates
```

Edit templates in `templates/public-pages/`, not the generated files in `public/`.

## Testing

```bash
npm run smoke:browser          # Browser smoke tests (requires Playwright)
npm run verify:public-pages    # Verify generated pages match templates
npm run verify:version-parity  # Check version consistency across files
```

## Pull requests

- One concern per PR
- Run `node --check` on modified `.js` files
- Generated pages (`public/*.html`) must match templates — run `npm run build:public-pages` before committing
- PRs are validated by CI: lint, tests (Node 20 + 22), browser smoke, and attribution checks

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the codebase is structured.

Questions? [Open an issue](https://github.com/jtalk22/slack-mcp-server/issues).
