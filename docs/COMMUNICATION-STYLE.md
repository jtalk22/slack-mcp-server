# Communication Style Guide

Use this guide for release notes, issue replies, and changelog entries.

## Rules

1. Keep text technical, concise, and factual.
2. Do not include model/tool credit lines.
3. Do not include co-author trailers from tooling.
4. State exact versions and commands when relevant.
5. Avoid speculative claims.
6. Release titles use `vX.Y.Z — <concrete operational outcome>`.

## Issue Reply Template

```md
Thanks for reporting this.

Status: fixed in `<version>`.

Included:
- `<fix 1>`
- `<fix 2>`

Verify:
- `npx -y @jtalk22/slack-mcp --version`
- `npx -y @jtalk22/slack-mcp --status`

Install/update:
- `npx -y @jtalk22/slack-mcp`
- `npm i -g @jtalk22/slack-mcp@<version>`

If it still reproduces, reply with OS, Node version, runtime mode (`stdio|web|http|worker`), and exact error output.
```

## Release Notes Template

````md
## <version> — <short title>

### Improved
- <item>
- <item>

### Compatibility
- No API/tool schema changes.

### Verify
```bash
npx -y @jtalk22/slack-mcp --version
npx -y @jtalk22/slack-mcp --setup
npx -y @jtalk22/slack-mcp --status
```
````

## Changelog Entry Template

```md
## [<version>] - YYYY-MM-DD

### Fixed
- <item>

### Changed
- <item>
```
