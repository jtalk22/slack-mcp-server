# Architecture

How this package is put together, verified against `src/` and `lib/` rather
than described from memory. Tool names and counts come from `lib/tools.js`;
the protocol behaviour comes from `lib/mcp-server.js` and the two transport
entry points.

## Two ways into Slack

### Self-hosted: your own browser session

The package reads the Slack session Chrome already holds (`xoxc-` token plus
the `xoxd-` cookie) and calls Slack's Web API as you. Access matches your
account exactly: a conversation you cannot open in Slack is a conversation the
server cannot read either, and nothing is granted that you do not already have.

Because the calls carry your identity and your token, your workspace sees the
same API activity from your account that it would see from any other client
signed in as you. There is no separate app identity, and no claim is made here
about what a workspace does or does not record — that is set by the workspace's
own plan and settings, not by this package.

Session credentials rotate. Slack invalidates them on a timescale of roughly
one to two weeks, and sooner on password change or sign-out. On macOS the
server re-extracts from Chrome automatically; elsewhere you re-run setup.

### Hosted: a managed endpoint

`mcp.revasserlabs.com` is a separate, running service, not a plan for one. It
answers on its root and on `/health`, `POST /mcp` requires a tenant bearer
token, and `GET /mcp` returns `405` — the same stateless shape the HTTP entry
in this repo uses. It identifies itself as `slack-mcp-hosted` with its own
version line, so it is a distinct deployment rather than this package behind a
URL. It exists for work that has to keep running without a person present:
permanent OAuth instead of a rotating browser session, scheduled delivery, and
continuity across workspaces. This package stays MIT-licensed and complete on
its own; the hosted tier is not a gate on any tool here.

## One server factory, two transports

`lib/mcp-server.js` builds the protocol server. Both entry points call the same
factory, so the advertised tool list, the prompts, the resources, and the
dispatch path cannot drift apart between them. The factory also registers three
prompts (`search-recent`, `summarize-channel`, `find-messages-from`) and two
resources (`slack://workspace/info`, `slack://conversations/list`).

| | `src/server.js` | `src/server-http.js` |
|---|---|---|
| Transport | stdio | Streamable HTTP |
| Entry call | `serveStdio` | `createMcpHandler` + `toNodeHandler` |
| Lifetime | one server pinned per connection | a fresh server per request |
| Session | none to mint | none; `GET`/`DELETE` answer `405` |
| Era | negotiated from the client's opening message | selected per request |

Both speak MCP `2026-07-28` and every 2025 revision from the same code. On the
2026-07-28 era, `tools/list` carries a cache hint (`ttlMs: 60000`,
`cacheScope: "public"`) because the advertised surface is fixed for the life of
the process. 2025-era responses are unchanged.

The HTTP entry guards the request path before the protocol layer sees it: a
bearer token is required on `/mcp` (missing configuration answers `503`, a
wrong token answers `401` with a `WWW-Authenticate` challenge), and a
browser-originated request whose `Origin` is outside
`SLACK_MCP_HTTP_ALLOWED_ORIGINS` is refused with `403`. `SLACK_MCP_HTTP_INSECURE=1`
removes both checks and is for local testing only. The whole request path is
wrapped, because an escaped rejection would be an unhandled promise rejection
and would take the process down.

`workers/mcp-worker.js` is a separate standalone Worker surface. It bounds
streamed request bodies to 1 MiB, JSON nesting to 64 levels, and batches to 100
requests, cancelling oversized streams before parsing.

## Tool surface

20 tools: 13 read-only, 4 write-path, and 3 local workflow tools. Every tool
advertised does its work on your machine; there are no placeholder tools that
return an upgrade payload. The four write-path tools carry the MCP
`destructive` annotation.

`SLACK_MCP_TOOLS` (or `--tools=`) narrows what is advertised to `all` (19),
`read` (12), `essentials` (6), or an explicit comma-separated list, which cuts
the schema cost the client pays every turn. Handlers stay fully wired whatever
is advertised, and the active profile is printed at startup so a narrowed
surface is never a silent surprise. The read list is explicit in `lib/tools.js`
and is deliberately not derived from the `readOnlyHint` annotation.

`docs/API.md` is generated from the live schemas; `npm run verify:api-docs`
fails when it drifts.

## Token persistence

Credentials are looked up in order, first hit wins:

```
1. Environment variables (SLACK_TOKEN, SLACK_COOKIE)
2. Token file (~/.slack-mcp-tokens.json, chmod 600)
3. macOS Keychain
4. Chrome auto-extraction (macOS only)
```

Three storage backends decide where a persist actually lands:

- **`auto`** (default) — token file plus Keychain.
- **`keychain-only`** — Keychain exclusively, no plaintext file. Writes are
  verified by reading back; a legacy token file is migrated in and then
  removed, and a removal that fails throws `plaintext_removal_failed` rather
  than reporting success. Non-secret bookkeeping goes to
  `~/.slack-mcp-meta.json`.
- **`file`** — the Keychain is never touched.

`--setup` asks and records the choice; `SLACK_MCP_TOKEN_STORAGE` overrides it.
An unrecognized value from either source fails at startup instead of guessing.

## Reliability

- **Atomic writes.** Write to a temp file, `chmod 600`, rename over the target,
  so a process killed mid-write cannot leave truncated JSON.
- **Cross-process locking.** Sidecar writes serialize through an `O_EXCL` lock
  file with stale takeover, so two processes cannot interleave a read-modify-write.
- **Fresh tokens survive a failed persist.** If writing fails, newly extracted
  credentials are kept in memory (`storage.unpersisted_fresh_tokens`) so the
  auth-retry path never falls back to the stale pair on disk.
- **Extraction mutex.** A single in-flight guard prevents concurrent Chrome
  extractions.
- **Request pacing.** Every outbound Slack call goes through a process-wide
  pacer that caps concurrency and spaces request starts. Retries recurse back
  through it and are paced again.
- **Retry with backoff.** Network errors retry with exponential backoff plus
  jitter.
- **User cache.** Names resolve through an LRU cache with a one-hour TTL, and
  concurrent messages from the same author share one lookup.
- **Explicit shutdown.** `unref()` on the background health timer is not
  enough on its own: the stdio transport holds the event loop open after the
  client disconnects. Handlers for `SIGTERM`, `SIGINT`, `SIGHUP`, stdin `end`,
  and stdin `error` each exit the process. This is what closed the orphaned-process
  pileup described under 4.1.2 in the changelog.
- **Session death is routed, not thrown.** `lib/lifeboat.js` turns a dead
  session token into recovery guidance; other failures return a structured
  `tool_call_failed` with a `next_action`.

## Structure

```text
src/
  server.js        MCP server over stdio (era-negotiated via serveStdio)
  server-http.js   Streamable HTTP entry, stateless per request
  web-server.js    REST API + web UI
  cli.js           setup, token, and template commands
lib/
  mcp-server.js    shared protocol-server factory both transports build from
  tools.js         tool definitions, profiles, and safety annotations
  handlers.js      tool implementations
  slack-client.js  Slack API client, pacer, retry, LRU cache
  token-store.js   token persistence, storage backends, atomic writes
  workflow-store.js  saved workflow profiles (~/.slack-mcp-workflows.json)
  catch-up.js      local catch-up evidence gathering
  lifeboat.js      dead-session recovery guidance
  rich-message-fields.js  attachments, blocks, metadata, files, reactions
  public-metadata.js      single source for the release version
  public-pages.js         generator for the published pages
workers/
  mcp-worker.js    standalone Worker surface (version-parity gated)
  browser-ops/     deployed Worker, consumed cross-repo
templates/
  public-pages/    sources for index.html and public/*.html
  workflow-profiles/  packaged profile templates
```

`index.html` and `public/*.html` are generated. Edit the templates and
`lib/public-pages.js`, then run `node scripts/generate-public-pages.js`.

## Platform support

| Feature | macOS | Linux | Windows |
|---------|-------|-------|---------|
| MCP server (stdio) | Yes | Yes | Yes |
| MCP server (HTTP) | Yes | Yes | Yes |
| Token file | Yes | Yes | Yes |
| Auto-refresh from Chrome | Yes | No | No |
| Keychain storage | Yes | No | No |
| Web UI | Yes | Yes | Yes |

Tests run on Node 20, 22, 24, and 26 on Linux and Windows.
