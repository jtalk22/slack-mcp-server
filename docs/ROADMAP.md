# Roadmap

The local package helps an agent read Slack, find the thread behind a decision,
and finish an approved conversation. The next improvements build on that job.
The [latest release](https://github.com/jtalk22/slack-mcp-server/releases/latest)
and [changelog](../CHANGELOG.md) describe what is available now.

## Available now

- Nineteen local tools across Slack reads, writes, workflow profiles, and catch-up.
- Source-linked catch-up evidence gathered locally for your calling agent.
- Six-tool `essentials` and twelve-tool `read` profiles for a smaller tool schema.
- Automatic macOS Chrome extraction, isolated workspace profiles, and selectable
  credential storage; manual credentials on Windows and Linux.
- stdio and self-hosted HTTP with shared handlers and protocol conformance tests.

## Next improvements

| Improvement | User benefit | Delivery requirement |
|---|---|---|
| Cursor support across history, threads, search, and listings | Continue a long conversation without starting over or losing the next page | Return continuation information, keep reads bounded, and test multi-page fixtures |
| Edit and delete your own messages | Correct an agent-written reply from the same conversation | Verify session-token behavior, preserve destructive annotations, and test refused writes |
| File upload using Slack's current upload flow | Send the report or artifact alongside the explanation | Use the external-upload API and test partial-upload recovery |

These are candidates, not release promises. Specific requests and reproducible
examples belong in [GitHub issues](https://github.com/jtalk22/slack-mcp-server/issues).

## Recurring workflows

The optional [hosted service](https://mcp.revasserlabs.com/workflows) provides
managed OAuth, read-only Shadow Reports, scheduled briefs, shared profiles,
and signed delivery. The local package works independently of that service.
