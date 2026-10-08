# Contributing

Fork it. Fix it. PR it. Keep changes focused. Patches and ideas both welcome.

**How outside contributions land (please read):** for provenance and anti-takeover reasons, I land
external contributions on `main` under my own authorship rather than merging fork commits directly,
and credit contributors at the end of this file. One consequence worth knowing up
front: the `attribution` CI check shows **red on fork PRs by design** — that's policy, not a defect
in your work. Your change still lands; it just lands as a commit authored by me, with credit to you.

## Setup

```bash
git clone https://github.com/jtalk22/slack-mcp-server.git
cd slack-mcp-server
npm install
```

**Requirements:** Node 20+. Unit tests use fixtures and need no Slack credentials.
Live Slack integration checks require your own session tokens (`xoxc-` + `xoxd-`).

## Development

```bash
npm start                      # MCP server on stdio
npm run web                    # REST API + Web UI (localhost:3000)
npm run build:public-pages     # Regenerate HTML from templates
```

Edit templates in `templates/public-pages/`, not the generated files in `public/`.

## Testing

```bash
npm test                       # Unit tests; no Slack credentials needed
npm run smoke:browser          # Browser smoke tests (requires Playwright)
npm run verify:public-pages    # Verify generated pages match templates
npm run verify:version-parity  # Check version consistency across files
```

## Pull requests

- One concern per PR
- Run `node --check` on modified `.js` files
- Generated pages (`public/*.html`) must match templates — run `npm run build:public-pages` before committing
- PRs are validated by CI: lint, Linux tests (Node 20, 22, 24, and 26), Windows tests (Node 24), browser smoke, and attribution checks

## Architecture

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for how the codebase is structured.

Questions? [Open an issue](https://github.com/jtalk22/slack-mcp-server/issues).

## Contributors

- **[@anupamme](https://github.com/anupamme)** — identifying unbounded JSON request
  bodies in the standalone Worker and proposing a request-size limit
  ([#244](https://github.com/jtalk22/slack-mcp-server/pull/244)).

- **[@ChocoTonic](https://github.com/ChocoTonic)** — resolving user IDs to direct-message
  conversations before sending with browser-session credentials
  ([#233](https://github.com/jtalk22/slack-mcp-server/pull/233)).

- **[@rvandam](https://github.com/rvandam)** — rich Slack message fields: surfacing the
  `attachments`, `blocks`, `metadata`, `files`, and `reactions` that Slack stores outside the
  plain message `text` ([#143](https://github.com/jtalk22/slack-mcp-server/pull/143)).
