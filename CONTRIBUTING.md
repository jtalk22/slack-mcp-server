# Contributing

Fork it. Fix it. PR it. Keep changes focused. Patches and ideas both welcome.

**How outside contributions land (please read):** for provenance and anti-takeover reasons, I land
external contributions on `main` under my own authorship rather than merging fork commits directly,
and credit contributors in `CONTRIBUTORS.md`. One consequence worth knowing up
front: the `attribution` CI check shows **red on fork PRs by design** — that's policy, not a defect
in your work. Your change still lands; it just lands as a commit authored by me, with credit to you.

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
