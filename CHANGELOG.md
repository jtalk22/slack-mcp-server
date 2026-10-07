# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Corrections to this record

Notes below this heading are dated corrections to the entries above it.
Historical lines are never rewritten, so a reader who acted on a claim once can
still find the claim they acted on. Each note says what the entry asserted, what
is true instead, and what the evidence is.

### 2026-10-07 — gaps in the release record

Checked against `git for-each-ref refs/tags`, `git log`, the npm registry's
publish times, and the MCP Registry, all read on 2026-10-07. Nothing below is
fixed by rewriting an entry; the two items that are safely derivable are fixed
in the same change as this note, and the rest are recorded for a decision.

**Five entries are dated 2025 and the work is in 2026.** `## [1.0.0]`,
`## [1.0.5]`, `## [1.0.6]`, `## [1.1.0]` and `## [1.1.1]` carry 2025 dates.
Every other entry in the file carries 2026 and matches its tag. The repository
contains no commit dated earlier than 2026-01-03 17:23:26 +0000, which is the
initial commit, subject "Initial release: Slack MCP Server v1.0.0";
`git log --all --until=2025-12-31` returns nothing. Tag `v1.0.0` was created
2026-01-03. The npm registry, an independent record, gives 1.0.0 as published
2026-01-03T20:26:39Z, 1.0.6 as 2026-01-08T12:38:38Z, 1.1.0 as
2026-01-08T13:01:11Z and 1.1.1 as 2026-01-08T13:04:05Z.

For 1.0.6, 1.1.0 and 1.1.1 the month and day already match the publish record
exactly and only the year is wrong, so those three are year typos with
independent proof. 1.0.0 differs in both year and day: the entry says 01-06
where the tag and the publish both say 01-03. 1.1.1 is also dated before
`## [1.1.2] - 2026-01-08` while both were published within three minutes of
each other on the same day, so as written the file claims a year passed between
them. 1.0.5 was never tagged and never published — npm goes 1.0.4 to 1.0.6 —
so there is nothing independent to date it against.

Recommended correction, for the maintainer to apply or decline: set those five
years to 2026, and 1.0.0's day to 01-03. That edits five historical lines, so
it is not done here.

**Eight compare links point at tags that do not exist.** `[1.0.5]`, `[1.0.6]`,
`[1.1.0]`, `[1.1.1]`, `[1.1.2]`, `[4.1.1]`, `[4.1.2]` and `[4.2.0]` reference
one or both of `v1.0.5`, `v1.0.6`, `v1.1.0`, `v1.1.1`, `v4.1.1`, `v4.1.2`, none
of which was ever created. They resolve to a 404. They are left as they are,
because repointing a link at a different pair of tags would change what the
record says those releases contained.

**Fourteen compare links were missing and are added here.** 4.4.0 through 5.0.1
and Unreleased had none; the block stopped at 4.3.0. Every endpoint used is a
tag that exists, so these are derived, not asserted. The whole block is now in
descending order, which it was not — it ran 1.2.4 down to 1.0.0 and then
restarted at 4.3.0.

**4.2.1 and 4.2.2 have compare links and no entries.** Both were tagged
2026-04-26 and published to npm the same day. 4.2.0 had the same gap until this
change set, where its entry was reconstructed from its release-notes file; for
4.2.1 and 4.2.2 the only surviving record is the tag diff.

**Ten published versions have no entry at all**: 1.0.3, 1.0.4, 1.1.3, 1.1.8,
1.1.9, 3.2.2, 3.2.3, 3.2.5, 4.2.1 and 4.2.2. Three entries describe versions
that were never published to npm: 1.0.5, 4.1.1 and 5.0.1. Three entries have no
tag: 3.2.1, 4.1.1 and 4.1.2, though 3.2.1 and 4.1.2 were both published.

**There is no 5.0.1 anywhere outside this repository.** `package.json` says
5.0.1 and tag `v5.0.1` was created 2026-09-30, but npm's highest published
version is 5.0.0 (2026-08-24T22:56:36Z) and its `latest` tag points there. The
MCP Registry's newest entry for `io.github.jtalk22/slack-mcp-server` is 5.0.0,
flagged `isLatest`, published 2026-08-24T22:56:55Z. So the registry is not
lagging behind npm — 5.0.1 was prepared, tagged and written up, and never
shipped. Either publish it or the version in `package.json` overstates what
users can install.

**Release notes stopped being written.** `.github/` holds eight files, for
1.2.4, 2.0.0, 3.0.0, 3.1.0, 3.2.0, 3.2.4, 3.2.5 and 4.0.0. The practice then
moved into `docs/` for 4.1.2 and 4.2.0 — both folded into this file in the same
change set as this note — and stopped after that. 5.0.0 and 5.0.1 have none.
Nothing in the repository requires them, and the changelog entries from 4.6.1
onward carry the prose a release note used to; recording the gap rather than
back-filling eight months of notes.

### 2026-10-07 — the 4.1.0 "Stealth Mode" claim

Under `## [4.1.0] - 2026-04-01`, the Highlights list reads:

> - **Stealth Mode** — Session-token auth leaves zero footprint in workspace
>   admin settings. No app install, no bot user, no audit trail.

and the Changed list below it records "README: Stealth Mode framing".

Two of those three clauses are accurate; the third is false, and the framing
around all three is wrong.

"No app install" and "no bot user" were true and remain true. The local path
registers no Slack app and creates no bot identity, which is exactly why it
needs no admin approval.

"No audit trail" is false, and it states the opposite of how the server works.
The server calls Slack's Web API with the signed-in user's own session
credentials, as that user. There is no second identity that could be missing
from a record. A workspace sees the same API activity from that account that it
would see from any other client signed in as the same person, and what a
workspace retains is set by its own plan and settings — not by this package, and
not by anything this package could suppress if it wanted to. The sentence as
written reads as a feature for evading oversight. That is not what shipped and
not what the code does.

The name stays. "Stealth Mode" describes the part that is true and unusual —
no app to install, no bot identity, nothing in the workspace app directory, no
admin queue — and it is the operator's word for it (2026-10-07). What was
withdrawn on 2026-10-07 is the claim that rode along with it, not the name:
`scripts/check-public-language.sh` now blocks "no audit trail", "invisible to
admins" and "zero footprint" by pattern, and no longer blocks "stealth".

The accurate statement, and the one the rest of the documentation uses: session
credentials carry the same effective access as the signed-in browser user.

## [Unreleased]

## [5.1.0] - 2026-10-07

### The catch-up could not see what it was for

`slack_conversations_unreads` read `unread_count_display` from
`conversations.list` and filtered on it alone. Measured against a live
workspace before this release, that path returned **zero** conversations while
ten mentions were outstanding: every one of them sat in a channel whose unread
count was zero because the channel had been opened. A tool whose promise is
catching up reported nothing waiting.

It now also calls `client.counts`, the endpoint Slack's own web client uses for
its sidebar badges, and merges the two. The shapes are the measured ones, not
the documented ones — there is no documentation. Its items carry `has_unreads`,
`mention_count`, `last_read`, `latest`, `updated` and `id`, and **not**
`unread_count_display`, so `conversations.list` remains the only source of the
unread number and of names. `threads` is an object rather than a list, and with
`thread_counts_by_channel` it carries `unread_count_by_channel` and
`mention_count_by_channel`.

The same workspace after the change: 7 conversations, 10 mentions, and one
conversation the 200-item listing page never reached, now reported instead of
silently missing.

### Every message says who wrote it

Slack is a shared bus. A channel can hold Slack Connect participants from
another workspace, guests, and apps relaying content from outside Slack
entirely — and the same toolset that reads also writes. Every message now
carries `origin` (`self`, `internal`, `external`, `bot`, `unknown`) and
`author_trusted`, derived from fields Slack already returns, so classification
costs no extra API call.

Building the receipt for it exposed something worse than the gap it was built
for. Slack omits `team` from a message whose author is in the reading
workspace, so the classifier matched almost nothing: on a real 20-message
channel, 11 messages had a user and no team and all 11 were reported unknown.
More than half an ordinary channel read as unplaceable, which is not caution —
it is a label that has stopped carrying information. A conversation Slack
reports as not shared with another workspace structurally cannot hold an author
from one, so a team-less author there is internal. Same channel, same messages,
after: internal 5 to 16, unknown 11 to 0, outside-authored 15 to 4.

### Added

- **`client.counts` in `slack_conversations_unreads`** — mention counts per
  conversation, unread thread replies, and the conversations a single listing
  page never reaches, under `unreachable_from_listing`. Mentions sort above
  unread volume. A `sources` block names which endpoint answered; when
  `client.counts` throws, returns `ok:false`, or arrives without its groups,
  the tool degrades to exactly the previous view and says what is missing.
- **Message provenance** (`lib/message-provenance.js`) —
  `SLACK_MCP_PROVENANCE=off|label|strict`. `label` is the default and only adds
  keys. A batch containing outside authors carries an `untrusted_content`
  envelope. `strict` additionally holds `slack_send_message` once the session
  has read outside-authored text.
- **`slack_session_report`** — what this process did, as counts: messages read,
  how many were outside-authored and by which origin, writes attempted, writes
  held. No message text, channel name or user id is recorded.
- **`--read-only` / `SLACK_MCP_READ_ONLY=1`** — the four write-path tools are
  withheld from `tools/list` *and* refused at dispatch, because a client may
  call a name it was never offered. Applied after the tool profile resolves, so
  no profile or custom list widens it back.
- **`continuity` on `slack_catch_me_up`** — commitments someone made, asks
  nobody claimed, questions still unanswered, built from phrase and
  reply-count rules over messages the run already read. Every row carries the
  exact text that matched and a permalink to the message. The block states in
  its own words that the rules are shallow.
- **`externally_shared` on `slack_list_conversations`** — from fields
  `conversations.list` already returned, at no extra API cost.
- **A published prompt-injection corpus** (`test/injection-corpus/`,
  `docs/INJECTION-CORPUS.md`) — bidi overrides, zero-width splits, tool-call
  mimicry, attachment payloads, bot relays, Slack Connect authors, and
  attacker-settable identity fields, so other MCP authors can test their own
  servers.
- **CodeQL and OSV-Scanner** over the code and the dependency tree.
- **`--doctor --security`** — six checks with a pass, warn or fail and a one-line remedy each:
  credential storage, the plaintext file and its permissions, provenance mode, whether the write
  tools are registered, profile isolation, credential age. No letter grade, and it says why.

### Fixed

- **The strict hold could be switched off by the call it restrained.** The gate
  resolved its mode from `args.provenance`, so a request asking for `label`
  dropped out of `strict` even with `SLACK_MCP_PROVENANCE=strict` set. Both the
  gate and the read path now take the operator's configured mode and allow a
  request to tighten it, never to loosen it.
- **`slack_catch_me_up` never armed the gate.** It assembles its own provenance
  summary and returned it directly, while the session flag had a single owner
  elsewhere — so the read serving the most outside text was the one that left
  the hold disarmed.
- **The first-run screens described a path the code does not run.** The wizard
  advertised AppleScript and a live Slack tab; the default has been an on-disk
  LevelDB read needing neither. Every user-facing instruction now follows the
  structured reason code beside it rather than repeating one fixed line.
- **Setup prints the client configuration** instead of linking to a page that
  describes it.
- **Commands an `npx` user cannot run** were removed from the troubleshooting
  docs and the bug-report template; `--refresh-tokens` already existed and was
  documented nowhere.
- **A lost metadata update now retries.** The write lock gives up its wait
  budget and proceeds unlocked rather than failing, so a concurrent writer can
  land between a save and its read-back — an intermittent failure on Windows.
- **`slack_catch_me_up` classified a teamless colleague as unknown** while
  `slack_conversations_history` classified the same message as internal, so the untrusted counts
  from the two tools were different scales. Both read paths now resolve the conversation's sharing
  state.
- **Identity-keyed caches are cleared on a token refresh.** Nothing called
  `clearUserCache` or `clearWorkspaceIdentity` despite both documenting it; a
  refresh can land on a different workspace, and a stale home team id marks
  outside authors as colleagues.

### Changed

- **20 tools**, 13 read-only, 4 write-path, 3 local workflow. The read and
  write counts now live in `lib/public-metadata.js` beside the tool count, so
  the gate that catches drift cannot itself drift.
- **The README states the free-Slack case** — what a free workspace does not
  get, checked against Slack's published plans on 2026-10-07, and what this
  gives instead at no marginal cost.
- **Credential lifetime is measured, not asserted.** The README and SECURITY.md
  said one to two weeks. On one real workspace a credential written on
  2026-07-04 still authenticated 94 days later, stated as an existence proof
  with its sample size.
- **npm publishing uses OIDC trusted publishing.** The January attempt failed
  because Node 20 bundles npm 10, which has no OIDC support; the job runs on
  Node 24. `NPM_SECRET_TOKEN` is retired.
- **The README moves again.** The hero opens on the joke — It's Tuesday, 9:07 AM, a jammed
  printer, the PIN nobody knows — beside two people who asked and got zero replies. One search
  scrolls five months back to the post that had it all along, and a yellow band joins the PIN to
  its source. It is a GIF because GitHub plays a GIF inline and shows an MP4 as a still you have to
  click; a dark-mode twin follows the reader's theme through `<picture>`. Both are drawn by
  `docs/assets/hero-v2.html` and recorded frame by frame by `scripts/record-hero.mjs`, with the
  open-licence fonts vendored in `docs/assets/fonts/`, so a re-record is byte-identical and never
  touches the network. The commands — set up, check your setup, read-only — sit directly under it,
  and a short "New in 5.1" leads the page. The original mark is back, the badges are two deliberate
  rows, and two diagrams fill the page: the trust boundary, and the schema cost per tool profile.
- **"Stealth" is back in the vocabulary**, and the claims that rode along with it are not.
  `check-public-language.sh` no longer blocks the word and now blocks "no audit trail",
  "invisible to admins" and "zero footprint" — the session is the user's own, so a workspace sees
  the same activity it would from any client signed in as that person.
- **`SECURITY.md`** lists the current versions, names two real reporting
  channels, and states what the provenance control cannot do.

## [5.0.1] - 2026-09-30

### Added

- Clickable starter prompts for catch-ups, finding decisions, and drafting replies,
  with a direct path into the interactive demo and a clearer mobile install flow.
- Complete API documentation generated from the current 19 tool schemas, with
  a parity check that keeps examples and parameter tables current.
- Native Windows tests alongside Linux on Node 20, 22, 24, and 26.

### Changed

- Setup, compatibility, workflow recipes, and hosted descriptions reflect the
  current local catch-up and managed delivery paths.
- Updated vulnerable query-string and browser-worker IP dependencies, the
  browser runtime dependency, and pinned workflow actions.


### Fixed

- Concurrent messages from the same author share a single user-name lookup,
  reducing redundant Slack requests while preserving request pacing and cache
  invalidation.

- `slack_send_message` resolves user IDs to DM conversation IDs before posting,
  avoiding `channel_not_found` with browser-session credentials. Existing channel,
  DM, and threaded reply paths remain supported. Thanks to @ChocoTonic (#233).

- The standalone Worker bounds streamed request bodies to 1 MiB, JSON nesting
  to 64 levels, and batches to 100 requests. Oversized streams are cancelled
  before parsing. Thanks to @anupamme for identifying the issue (#244).

## [5.0.0] - 2026-08-24

### Speaks MCP 2026-07-28, drops the hosted stubs

Two changes, one release. The protocol layer moves to the 2026-07-28 revision
without breaking anything that talks to it today, and the two tools that never
did any work here are gone.

### Breaking

- **`slack_smart_search` and `slack_triage` are removed.** They made no Slack
  call; the OSS handlers returned an upgrade payload pointing at a hosted tier.
  Every tool this package advertises now does its work on your machine. The
  surface is **19 tools**: 12 read-only, 4 write-path, 3 local workflow tools.
  Clients that called either name receive the same `unknown_tool` result as
  any other unknown name. `SLACK_MCP_TOOLS=all` advertises 19 (≈3,134 estimated
  schema tokens per turn, down from ≈3,600); `read` (12) and `essentials` (6)
  are unchanged.
- **HTTP mode is per-request and stateless.** `src/server-http.js` no longer
  mints an `Mcp-Session-Id`; every `POST /mcp` is answered by a fresh server
  instance, and `GET` / `DELETE` — the 2025 session operations — answer `405`.
  2025-era clients are served the same way and keep working; they simply
  never had a session here. A client that depended on the SSE `GET` stream
  for server-initiated messages will not receive them over HTTP.
- **`Access-Control-Allow-Headers` changed** for the HTTP entry: `mcp-session-id`
  is gone; `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name`, and `Accept` are
  allowed. A browser-originated request whose `Origin` is outside
  `SLACK_MCP_HTTP_ALLOWED_ORIGINS` is now refused with `403` on `POST`, not
  only on preflight.
- **`@modelcontextprotocol/sdk` (v1) is no longer a dependency.** The runtime
  is `@modelcontextprotocol/server` 2.x and `@modelcontextprotocol/node` 2.x.
  Nothing in the package's public surface exposed the SDK, so this matters
  only to anyone importing internals.

### Added

- **MCP 2026-07-28 support, from the same binary as every 2025 revision.**
  stdio negotiates the era per connection (`serveStdio`, default
  `legacy: 'serve'`); HTTP serves it per request (`createMcpHandler`, default
  `legacy: 'stateless'`). On the 2026-07-28 era, `tools/list` carries
  `ttlMs: 60000, cacheScope: "public"` (the advertised surface is fixed for the
  life of a process), results carry `resultType: "complete"` and
  `_meta["io.modelcontextprotocol/serverInfo"]`, `Mcp-Method` is enforced
  against the body (`-32020` on disagreement), an unsupported revision is
  refused with `-32022`, and `server/discover` names the supported revision.
  2025-era protocol responses are byte-for-byte what they were; the one HTTP
  change a 2025 client can observe is the `WWW-Authenticate` header on the
  bearer `401`, noted below.
- **`test/mcp-era.test.js`** — the proof behind the README's claim. It drives
  the real SDK client at both eras against the in-process handler, spawns
  `src/server-http.js` and `src/server.js`, and asserts every conformance
  detail above. `check-public-surface-integrity.js` refuses a README that says
  "2026-07-28" without this file, an HTTP entry that mentions
  `sessionIdGenerator`, or any import of the v1 SDK.
- **`WWW-Authenticate` on the HTTP entry's bearer `401`** (required since the
  2025-06-18 revision) so a client can learn how to authenticate instead of
  dead-ending.
- **`lib/mcp-server.js`** — one factory both transports build from. The
  advertised tools, prompts, resources, and dispatch path can no longer drift
  between stdio and HTTP.
- **`workers/mcp-worker.js` is a version-parity surface.** The in-repo worker
  had carried `4.0.0` in three places since 4.0.0 and always answered
  `initialize` with `2024-11-05`; it now echoes the client's supported 2025
  revision and `check-version-parity.js` fails locally when its
  `WORKER_VERSION` disagrees with `package.json`.

### Changed

- The workflow-profile tool descriptions describe what runs here:
  `summary_cadence` sets `slack_catch_me_up`'s default window;
  `workflow_kind` sets the `output_contract` keys. The previous copy described
  a hosted scheduler and paid tiers inside the tool schema itself.
- README, `docs/DEPLOYMENT-MODES.md`, `docs/TROUBLESHOOTING.md`, the CLI help,
  `--apply-template` help, and the generated public pages state 19 tools and
  no longer describe placeholder tools or indexed retrieval as part of the
  local package.

## [4.9.0] - 2026-08-13

### Catch-up runs locally

`slack_catch_me_up` was a hosted-only stub: it advertised a rich contract in
every client's tool list and returned an upgrade payload. It runs locally now,
against your own session, with no hosted account and no server-side model.

The reason it can is structural. An MCP server is always called by something
that is already a language model, so summarising was never the part that needed
hosting — gathering was. This release does the gathering deterministically and
returns evidence for the caller to compose.

### Added

- **`slack_catch_me_up`, local** (`lib/catch-up.js`) — reads a saved workflow
  profile's channels since its cadence window (24h for `on_demand` and
  `daily_8am`, 7 days for `weekly_monday`, or an explicit `since`), expands
  active threads, and returns structured evidence:
  - `signals.unanswered_threads` — messages nobody replied to, plus threads
    where the only reply came from the person who opened it, ordered
    oldest-first with an age in hours.
  - `signals.priority_activity` and `signals.mentions_of_priority_people` —
    what the profile's priority people said, and where they were pinned.
  - `signals.busiest_conversations`, `signals.total_messages`.
  - `output_contract` — the keys to compose for this `workflow_kind`. They are
    deliberately **not** pre-filled; the payload is evidence, not a summary.
  - `truncation` — every cap that bound the run, reported rather than applied
    silently. A profile that names channels reads them even when Slack marks
    nothing unread, because silence in `#incidents` is itself an answer.
  - Work is bounded (12 conversations, 30 messages each, 8 expanded threads)
    because outbound calls are paced by default; an unbounded sweep of a busy
    workspace would take minutes.

### Changed

- **Positioning** — the hero led with a category claim. It now leads with the
  job, and the canonical short description carries hosted OAuth, which several
  third-party directories still deny because they scraped an older description
  and never re-synced. Landing page, share card, and registry metadata follow.
- **Tool inventory** — unchanged at 21 total (12 read-only, 4 write-path), but
  the local workflow group grows to 3 and the hosted stub group shrinks to 2.
  `slack_smart_search` and `slack_triage` remain hosted: an index and a model
  are infrastructure this package genuinely does not ship.
- `check-public-surface-integrity.js` no longer treats `slack_catch_me_up` as an
  upgrade stub, so narrowed profiles may advertise it without tripping the
  leak gate.

### Fixed

- `replaceTokens` in `lib/public-pages.js` declared an unused callback argument.
- The CI badge passed no `color` and rendered shields.io default green, the one
  palette violation in the README header.

## [4.8.0] - 2026-08-07

### Tool profiles and request pacing

No MCP tool contracts changed. This release addresses the two running costs of
a browser-session Slack server: the tool schema a client carries on every turn,
and the request velocity that Slack's session-anomaly detection watches.

### Added

- **Tool profiles (`SLACK_MCP_TOOLS` / `--tools`)** — advertise a smaller slice
  of the surface to cut per-turn tool-schema cost. `essentials` ships the six
  core tools (unread, history, search, thread, user lookup, send) at roughly
  985 estimated tokens of schema, down from about 3,600 for all 21; `read`
  advertises the 12 read-only Slack operations (~1,690); `all` remains the
  default, so
  existing installs are unchanged. A custom comma-separated allow-list is also
  accepted. Filtering narrows only the advertised `tools/list` — every handler
  stays callable. `scripts/measure-tool-schema.js` (`npm run measure:tools`)
  reproduces the numbers (a ~4-chars/token estimate, labelled as one). Files:
  `lib/tools.js`, `src/server.js`, `src/server-http.js`, `src/cli.js`,
  `scripts/setup-wizard.js`, `scripts/measure-tool-schema.js`.
- **Conservative request pacing, on by default** — outbound Slack calls are
  spaced by a minimum inter-request-start interval and capped in concurrency to
  stay under session-anomaly burst thresholds (most relevant on Enterprise
  Grid). Tunable via `SLACK_MCP_MIN_REQUEST_INTERVAL_MS` (default 350; 0
  disables) and `SLACK_MCP_MAX_CONCURRENCY` (default 3). No tool-contract
  change. Files: `lib/slack-client.js`.

### Changed

- **README** — new "Grid, credentials, and caching" section documents the
  Enterprise Grid session-anomaly risk and the pacing that mitigates it, the
  credential extraction path (Chrome LevelDB token, cookie SQLite database,
  Keychain Safe Storage, local PBKDF2 + AES-128-CBC decryption, local-only
  writes), its similarity to the access pattern credential stealers use, and
  the contents of the one user-name cache. The local/hosted split now states
  the boundary: local never contacts us, hosted never receives a browser
  cookie. Tool-profile and pacing configuration documented in README and CLI
  help.

## [4.7.0] - 2026-08-07

### The OS comes back

No MCP tool contracts changed. This release re-stages the public surface as
what made it work in the first place—the fiction of a running application—and
unifies every generated page on one design-token vocabulary.

### Changed

- **One token vocabulary** — `lib/public-pages.js` now emits a byte-identical
  `:root` block (`{{DESIGN_TOKENS}}`) and parameterized `@font-face` rules
  (`{{FONT_FACES}}`) into all six generated pages; CI asserts the canonical
  block on every page and bans retired token names in templates.
- **Proof reel re-shot as a screen-recording fiction** — the whole 42-second
  reel now lives inside one persistent faux-macOS window on a midnight-blue
  desktop: traffic lights, tools chip, fake input bar, timecode ticker. Grain
  overlay, solid full-bleed poster scenes, and italic-serif numerals removed;
  the system register (success green, link blue, clay assistant accent)
  returns inside app chrome. Scene marks, still branches, and the
  deterministic completion contract are unchanged.
- **Walkthrough restyled onto the shared vocabulary** — sans type inside the
  window, system-register accents, midnight desk bed; every scenario,
  control, easter egg, and the pinned narrative clock preserved.
- **App icon** — ink square, paper hashtag, one vermilion notification-badge
  dot (3 colors, down from 7); favicon and inline copies regenerated.
- **README rebuilt** — roughly half the visible length; deep material moved
  into collapsible sections with anchored headings kept visible; badge row
  re-inked (weekly-downloads badge, estate colors, registry badge linking to
  the live server record); Glama rating card added to Security.
- **Registry metadata unified** — `glama.json` pruned to the schema's minimal
  claim contract; the Docker image OCI description label now carries the
  canonical short description (CI-enforced); the publish workflow verifies the
  live npm description matches `package.json` after publish.
- **Docker build context** — marketing video renditions excluded via
  `.dockerignore`; they remain canonical on GitHub Pages.

## [4.6.2] - 2026-08-05

### The public surface catches up to the system underneath

No MCP tool contracts changed. This release turns the project's browser-session
engine, credential lifecycle, full-fidelity reads, guarded actions, and typed
workflows into a clearer install story and a legible proof experience.

### Changed

- **Category-defining public position** — the README, package metadata, CLI
  help, setup guide, compatibility matrix, registry metadata, and landing page
  now lead with the admin-free local path instead of a generic tool count or
  hosted pricing.
- **42-second proof reel + 20-second vertical cut** — one repo-owned HTML
  timeline produces a large-type desktop trailer, a recomposed mobile version,
  WebVTT captions, the README poster, and the GitHub social preview. The full
  3:24 walkthrough remains available as secondary proof.
- **Own-estate design system** — every public page, both proof videos, the
  poster, the social preview, and the access-path diagram now run on a single
  token system: Nyght Serif display, Roobert body, Roobert Mono labels, and an
  ink/bone/vermilion/amber palette. Self-hosted subset webfonts (~48 KB total)
  replace the previous stock pairing and the demo page's Google Fonts CDN
  dependency.
- **One accurate flagship diagram** — preserves the historical split-screen
  energy while replacing stale claims about Slack's official MCP with a current
  integration-path versus session-path comparison.
- **Generated media manifest** — `scripts/media-manifest.js` derives duration,
  dimensions, codecs, frame rate, bitrate, file sizes, caption counts, and image
  dimensions from the actual assets; CI and release preflight now reject drift.
- **Install UX** — `npx --setup` remains primary, the global-install path is
  documented, every supported client has a configuration recipe, and setup
  completion ends with restart plus `slack_health_check`.
- **Runtime posture** — Node 22/24 are recommended; v4 keeps Node 20
  compatibility, while CI verifies Node 20, 22, 24, and 26.

### Fixed

- **Dependabot false-red runs** — auto-merge requires both a Dependabot-authored
  PR and a Dependabot workflow actor, so maintainer branch updates skip instead
  of failing strict commit verification. The ineffective Actions self-approval
  step is gone and the policy has a regression verifier.
- **Root dependency advisory** — the supported MCP SDK dependency graph now
  resolves `@hono/node-server` 2.1.0; root and browser-worker audits are clean.

## [4.6.1] - 2026-08-04

### Shelf Repair — the discovery surfaces catch up to the product

No runtime changes to the stdio server. This release refreshes every surface a
new user meets before their first `npx`: the hosted-eval worker, the MCP
registry metadata, and the demo pages.

### Changed
- **Hosted-eval worker reaches tool parity + the upgrade path** (`workers/mcp-worker.js`) —
  the Smithery/hosted-eval worker now exposes 19 tools: the full 16-tool Slack
  read/write surface plus the 3 discoverable hosted upgrade stubs
  (`slack_smart_search`, `slack_catch_me_up`, `slack_triage`) with the same
  `tool_requires_hosted` payload the stdio server returns. Deployed to a fresh
  script name (`slack-mcp-oss`); `compatibility_date` bumped 2024-01-01 → 2026-08-01.
- **MCP registry description no longer reads as paid-only** (`server.json`) —
  "Free OSS + hosted tier from $19/mo" was being mirrored by downstream
  directories as "no free tier or trial available" for the hosted remote.
  Now: free OSS AND a hosted free tier, stated separately.
- **Smithery listing copy refreshed** (`smithery.yaml` + live listing) — stale
  "$9/mo Pro" corrected to $19/mo; description leads with session-tokens-not-OAuth
  and names the hosted tier.
- **Interactive demo no longer opens on a secrets-mining frame**
  (`public/demo.html`) — "Find the API Key — search DMs for sensitive
  information" reframed as self-directed retrieval and demoted to last;
  List Channels leads.
- **README surfaces the hosted option at the install decision point** — one
  compact pointer after the Install walkthrough; the candor framing stays.

## [4.6.0] - 2026-07-22

### Workspace Profiles + Chrome Extraction Overhaul

Two community-driven improvements: run work and personal Slack side-by-side, and extraction that tells you why it failed.

### Added
- **Workspace profiles** (`SLACK_MCP_PROFILE=work`, or `--profile work` on any CLI command) — every storage surface (token file, metadata sidecar, write lock, Keychain service) gets its own namespace, so multiple MCP server instances (work + personal) run side-by-side without sharing or overwriting each other's credentials (#164, requested by @iloveitaly). Pair with `SLACK_MCP_CHROME_PROFILE` to point each profile's extraction at the matching Chrome profile. Invalid profile names fail closed at startup. `slack_token_status` reports the active namespace under `storage.profile`; `--doctor` and `tokens:status` print it.
- **`SLACK_MCP_KEYCHAIN_TIMEOUT_MS`** — configurable timeout for the Chrome Safe Storage Keychain lookup (default 15000, up from a hard 5000 that real-world Keychains were observed to exceed at 4.9s).
- Chrome-extraction test rig (`test/chrome-extraction.test.js`) — builds a synthetic Chrome estate (real SQLite cookie DB with a genuine v10 AES-128-CBC-encrypted cookie, real LevelDB-style token log) and drives the actual extraction pipeline with only the Keychain lookup faked. Extraction was previously untestable without a live Chrome.

### Fixed
- **Chrome Safe Storage key looked up once per process, not once per profile per path** (#168) — the key is per-machine; it is now cached (refreshed once if a decrypt fails, in case Chrome re-keyed), and a fatal Keychain failure (timeout, denied) aborts the run instead of re-prompting for every profile and again in the AppleScript fallback.
- **Extraction failures name their cause** (#168) — every cookie-extraction failure carries a machine-usable reason (`no_cookie_db`, `no_slack_cookie_row`, `keychain_timeout`, `keychain_lookup_failed`, `cookie_decrypt_failed`, `unsupported_cookie_format`, …) and the final error lists per-profile reasons instead of collapsing everything into `extraction_failed_all_paths`.
- **AppleScript token read runs once per extraction, not once per profile** — it talks to the running Chrome app, not a profile directory, so repeating it per profile only multiplied prompts and wall-clock.

## [4.5.0] - 2026-07-21

### Keychain-Only Credential Storage — zero plaintext on disk, every failure loud

### Added
- **Keychain-only credential storage** (`SLACK_MCP_TOKEN_STORAGE=keychain-only`, macOS) — credentials live exclusively in the macOS Keychain and no plaintext token file is ever written (#162). `--setup`, `slack_refresh_tokens`, and automatic refresh work unchanged. An existing `~/.slack-mcp-tokens.json` is migrated into the Keychain on first load and removed only after both entries verify by read-back; a failed migration leaves the file untouched and reports `keychain_migration_failed`, and a verified migration whose file removal fails reports `plaintext_removal_failed` with the exact cleanup command — removal is attempted, never assumed. Keychain writes are verified and fail loudly (`keychain_write_failed`) instead of falling back to plaintext. Non-secret bookkeeping (token timestamp, auto-heal telemetry) moves to `~/.slack-mcp-meta.json` so `slack_token_status` age reporting and stuck-detection keep working.
- **`SLACK_MCP_TOKEN_STORAGE=file`** — token file only, the Keychain is never touched (no Keychain prompts; useful on shared machines and in CI). Default remains `auto` (file + Keychain), the previous behavior unchanged.
- **Setup wizard storage prompt (macOS)** — `--setup` asks where credentials should live (token file + Keychain backup, or Keychain only) and persists the choice in `~/.slack-mcp-meta.json`, so the MCP server, CLI, and any LaunchAgent follow it without plumbing an env var into each client config. `SLACK_MCP_TOKEN_STORAGE` overrides the persisted choice when set.
- `slack_token_status` reports the active backend under `storage` (`mode`, `mode_source`, `keychain_available`, `plaintext_file_present`); `--doctor` and `npm run tokens:status` print the storage mode with its origin (env var, setup choice, or default) and warn when a plaintext file is pending migration.
- Unit tests (`test/token-store.test.js`) covering mode parsing and precedence (env > persisted > default), verified writes, migration (success and failure paths), plaintext-file removal, telemetry routing, and fail-closed handling of unrecognized mode values from either source.
- End-to-end tests (`test/e2e-storage-modes.test.js`) that boot the real MCP server over stdio in a sandboxed HOME and assert what a client actually observes: backend reporting in each mode, a persisted setup choice reaching the server with no env var set, fail-closed startup on a typo'd mode, and a failed migration leaving the legacy file intact.

- **Cross-process write lock** — the token file and metadata sidecar are shared by the MCP server, the CLI, and any LaunchAgent refresh; read-modify-write cycles are now serialized through an `O_EXCL` lock file with stale-holder takeover, so concurrent writers can no longer silently drop each other's fields. Availability wins over strictness: an unlockable HOME degrades to the previous unlocked behavior. Regression-tested with two real processes interleaving 150 writes each (`test/meta-write-lock.test.js`).
- **In-memory last-known-good tokens** — when a freshly extracted token pair cannot be persisted (e.g. locked Keychain in keychain-only mode), the process now serves the fresh tokens from memory instead of discarding them: the auth-failure retry uses the new credentials rather than re-reading the stale persisted copy and failing again. Cleared automatically once persistence recovers. `slack_token_status` surfaces the condition as `storage.unpersisted_fresh_tokens`.

### Fixed
- **Silent plaintext-file leftovers** — in keychain-only mode, a failure to delete the plaintext token file (after migration or refresh) previously passed silently, so the mode could report success while credentials remained on disk and every subsequent load re-attempted migration. Both paths now throw `plaintext_removal_failed` with the exact manual cleanup command. (Adversarial-review finding on #163.)
- **Auto-heal no longer reports success when persistence fails** — proactive refresh and the `invalid_auth` retry path previously recorded a clean heal (`error: null`) and returned "Tokens refreshed successfully" even when `saveTokens()` threw. Telemetry now records the persistence error (stuck-detection can trip), and the health payload reports `persisted: false` with an honest message. (Adversarial-review finding on #163.)
- **Setup wizard hardening** — `keychain-only` is rejected up front on platforms without a macOS Keychain instead of collecting credentials that cannot be saved; the storage prompt re-prompts on any answer other than `1`/`2` instead of silently selecting plaintext storage; and save failures during setup print the action that fixes them (unlock the Keychain / manual file cleanup) instead of a raw stack trace.
- **`tokens:clear` honesty** — only a missing file counts as "nothing to delete"; permission/I-O failures are reported and the command exits non-zero instead of printing "All tokens cleared" over leftover secrets. `tokens:status` now warns about a lingering plaintext file even when no credentials load — the moment it matters most.
- **LaunchAgent example plist** — the optional `EnvironmentVariables` block in `docs/SETUP.md` is now a sibling of `ProgramArguments` (it was nested inside the array, which launchd rejects when uncommented). Verified with `plutil -lint` in both commented and uncommented form.

### Changed
- Keychain writes use `security add-generic-password -U` (update-in-place) instead of delete-then-add, removing the window where a failed add after a successful delete lost the entry.

## [4.4.3] - 2026-07-03

### Added
- **OAuth Lifeboat — token-death detection + recovery guidance** (`lib/lifeboat.js`). When a tool call fails because the Slack session token has expired or been revoked (`invalid_auth`, `not_authed`, `token_expired`, `token_revoked`, `account_inactive`, or an HTTP 401), the server now returns a helpful recovery message instead of a raw Slack error. The message names what happened, gives the self-fix first (re-extract via `npx -y @jtalk22/slack-mcp --setup`, or `slack_refresh_tokens` on macOS), and offers the permanent fix second (hosted OAuth, which does not rotate — free tier, no card). Wired into both transports (stdio + HTTP) and the `slack_health_check` connectivity test.
- **Throttle + opt-out** — the long-form message appears at most once per process per hour; subsequent auth failures in that window return a one-line version so agents in retry loops do not spam. `SLACK_MCP_NO_UPSELL=1` drops the hosted-option paragraph while keeping the self-fix guidance.
- Unit tests (`test/lifeboat.test.js`) covering the classifier (every auth-death code, non-auth errors, HTTP 401, the wrapped `token_auth_failed`), the hourly throttle, and the opt-out env var.

## [4.4.2] - 2026-07-02

### Fixed
- **HTTP transport dispatches all 21 advertised tools** — `slack_workflow_save`, `slack_workflows`, and the three hosted upgrade stubs previously returned `unknown_tool` over HTTP. Both transports now route through a shared handler map, with a schema test guarding against future drift between `tools/list` and the dispatch surface.
- **Worker tool contracts** — `slack_users_search` paginates `users.list` (explicit scan cap + `truncated` flag) and honors `limit`; `slack_conversations_unreads` returns the documented shape (`total_unread_conversations` + per-conversation entries) instead of a raw counts dump, with DM display names resolved concurrently.
- **Token extraction robustness** — LevelDB extraction now returns the newest token instead of the oldest (fixes stale-token `invalid_auth` after re-login); Chrome cookie snapshots include the `-wal`/`-shm` sidecars so extraction works while Chrome is running; extraction temp directories are removed instead of leaking.
- **Workflow store safety** — a corrupt profile store is quarantined aside (`.corrupt-<timestamp>`) with a warning instead of being silently replaced on the next save; saves are atomic (temp file + rename).
- **Status widget hardening** — remote `/status` fields render as text nodes; docs links are validated `https://` URLs.
- `conversations.history` only sets `inclusive` when a boundary timestamp is provided; empty user-search queries are rejected instead of matching everyone.

## [4.4.1] - 2026-07-02

### Changed
- Copy accuracy pass across every shipped surface: the scheduled morning catch-up DM is described as in development everywhere (no dated rollout claims), and one canonical package description is enforced across `package.json`, `server.json`, and `glama.json`.

## [4.4.0] - 2026-06-09

### Added
- `include_rich_message_fields` (opt-in) on `slack_conversations_history`, `slack_get_full_conversation`, `slack_get_thread`, and `slack_search_messages`: surfaces `attachments`, `blocks`, `files`, `reactions`, `metadata`, `subtype`, `bot_id`, `app_id`, and `team`. Independent `include_all_metadata` adds the full `event_payload`. (#143, thanks @rvandam)
- Unit test suite (`node --test`, wired into CI) covering the rich-fields merge helper and tool schemas.

## [4.3.0] - 2026-05-12

### Added
- **`--refresh-tokens` CLI flag** — `npx -y @jtalk22/slack-mcp --refresh-tokens` now runs the Chrome auto-extract path (equivalent to `npm run tokens:auto`). Closes the gap between the wizard-only `--setup` flag and the unscheduled-by-default token-refresh capability. Designed to be called from a LaunchAgent, cron, or CI to keep tokens fresh while Claude is closed for weeks at a time.
- **Token-refresh LaunchAgent docs** (`docs/SETUP.md`) — Optional macOS LaunchAgent template that runs `--refresh-tokens` twice a day, regardless of whether Claude is running. Closes the "tokens expired after vacation" failure mode. Honest about the trade-off (Chrome must be running for extraction to succeed).

### Changed
- **Tool count in maintainer docs** — `CLAUDE.md` updated from 16 to 21 tools, regrouped into Slack reads (12) / Slack writes (4) / workflow primitives (2) / hosted-brain upgrade stubs (3). Aligns with README's Tools section.
- **README clarity** — Workflow Primitives heading no longer pinned to "(new in 4.2)" — version info moved into body copy. Footer math clarified: "16 Slack tools (12 read, 4 write)" replaces the ambiguous "all 16 read/write Slack tools". "What's New in 4.2.0" section now collapsible (`<details>`) — sets a maintenance pattern for future release-note rollups.

### Fixed
- **SETUP.md troubleshooting** — "Verify the path to server.js is correct" replaced with "Verify JSON syntax in your client's MCP config", aligning with the npx invocation pattern that's already canonical elsewhere in the docs.

## [4.2.0] - 2026-04-26

### Workflow profiles, templates, and a tool surface that says what it cannot do

This release had no changelog entry for the first five months of its life; the
record of it was a separate release-notes file and three compare links. The
entry below is that file, folded in. Two workflow-profile primitives and six
packaged templates ship free and local; three tools that needed an index and a
model ship as stubs that name the upgrade instead of failing silently. Both of
those stub tools were removed outright in 5.0.0.

### Release notes, folded from `docs/RELEASE-NOTES-v4.2.0.md`

Published as `docs/RELEASE-NOTES-v4.2.0.md` and folded in here on 2026-10-07,
when the separate release-notes file was retired. This version had no changelog
entry of its own until that fold, though the compare link below has always been
here. The text is as published in April 2026: its prices, tier names, tool
counts and roadmap dates were current then and are not current now (the surface
is 19 tools as of 5.0.0). Client and vendor product names were replaced with the
transport or tier they describe; no claim was changed.

**Workflow primitives + paid stubs + 6 templates. Structured JSON, not message dumps.**

---

#### The axiom

A Slack catch-up that returns a wall of recent messages is a transcript, not an answer. Operators don't ask "what was said in #incident-room?" — they ask "what is open, who owns it, what's the next action?" Two different shapes. The first is what the MCP returned for a year. The second is what every actual workflow needs.

The bug class: tools that hand back narrative when the workflow needs structure. A support inbox catch-up should return `{open_threads, ack_lag, owner_gaps, escalations, next_actions}` — not paragraphs that the operator then has to re-parse into the same shape. The workflow_kind taxonomy makes the structure explicit, so the model returns it instead of the operator extracting it.

v4.2.0 is the structural fix. v4.2 reorchestrates the hosted tier model around it. v4.3 (Q2 2026) adds the scheduled morning catch-up DM that turns this into a daily habit.

---

#### What's new — v4.2.0

Three structural shifts. The OSS package gets new primitives that work standalone and gracefully degrade into discoverable upgrade stubs when the hosted retrieval tier isn't reachable.

##### 1. Workflow profile primitives (free in OSS)

Two new tools ship in the OSS package:

- `slack_workflow_save` — define a named profile bound to a `workflow_kind` (`support_inbox`, `incident_room`, `exec_brief`, `product_launch_watch`, or `custom`), a list of channels, optional priority people, retention mode, and summary cadence. Stored at `~/.slack-mcp-workflows.json`. Local. Yours.
- `slack_workflows` — list saved profiles.

Profiles are the routing surface. Once a profile is saved, paid tools (`slack_catch_me_up`, `slack_smart_search`, `slack_triage`) target it by name and return JSON shaped to the `workflow_kind`. The shape contract is part of the tool description, so MCP clients can present structured output directly.

##### 2. Six packaged templates

Apply with one command at install time:

```
npx -y @jtalk22/slack-mcp --apply-template <template-name> --channels C012,C067
```

| Template | workflow_kind | Use case |
|---|---|---|
| `oncall-handoff` | `incident_room` | Engineering handoffs, on-call queue, postmortems |
| `support-triage` | `support_inbox` | CX/support backlog, ack lag, owner gaps |
| `exec-monday` | `exec_brief` | Weekly exec brief, decisions, risks, asks |
| `sprint-tracker` | `product_launch_watch` | Launch readiness, blockers, metrics |
| `customer-feedback` | `custom` | Voice-of-customer rollups |
| `incident-room` | `incident_room` | Live incidents, timeline, owner gaps |

Templates set sensible defaults. Channels are bound at apply time. Profile name can be overridden via `--profile-name`.

##### 3. Three discoverable upgrade stubs

The hosted retrieval tier (`slack_smart_search`, `slack_catch_me_up`, `slack_triage`) is hosted-only — semantic search over a Vectorize index, structured catch-up output, multi-channel triage scoring. In OSS, these tools surface as discoverable stubs that return a structured `tool_requires_hosted` payload with the signup URL, free quota details, and Pro value prop. No silent failure. The MCP client sees the stub, knows the upgrade path, and the operator can route to `mcp.revasserlabs.com` to enable the full surface.

This is the right shape for OSS↔hosted boundaries: the OSS package is honest about what it can and can't do; the upgrade is one click away; the hosted tier delivers what self-host structurally cannot.

##### Total tool surface

**21 tools.** 16 read/write Slack tools (the existing surface from v4.1.x) + 2 workflow profile primitives (new, free) + 3 discoverable upgrade stubs (new, free OSS, paid hosted).

---

#### v4.2 hosted tier reorchestration

This release ships alongside the v5 hosted pricing model that went live on `mcp.revasserlabs.com` this week.

| Tier | Price | What it covers |
|---|---|---|
| Self-host (OSS) | Free (MIT) | Local stdio, all 21 tools (16 read/write + 2 primitives + 3 discoverable stubs) |
| Hosted Free | $0 (no card) | Email signup, 1 workspace, 10 smart_search/mo + 3 catch_me_up/mo + 5 triage/day. All 5 workflow profile types. 7-day index retention. |
| Hosted Pro | $9/mo | Unlimited hosted retrieval tools, permanent OAuth (no 2-week token rotation), 90-day Vectorize retention, 2 workspaces. Scheduled morning catch-up DM at 8am workspace tz **rolling out Q2 2026**. |
| Hosted Team | $49/mo flat | Pro + shared workflow profiles + audit log + 24h support + scheduled catch-up to channel + 5 workspaces |
| Ops engagement | from $199/mo (custom) | SLA, custom retention, SOC2 evidence path, multi-tenant isolation, 10+ workspaces, dedicated workflow tuning |

**Rolling out Q2 2026 — explicit caveat:** the scheduled morning catch-up DM at 8am workspace time is named in the Pro tier description because it is the daily-habit lever the architecture is designed around. The Cloudflare Cron handler that posts the structured brief to your Slack DM ships in **v4.3.0 (Q2 2026)**. Until then, Pro at $9/mo unlocks unlimited hosted retrieval tools (the differentiator from Free); the morning DM is forward-looking. Free $0 is fully functional today. Pro is a real upgrade today (unlimited credits, permanent OAuth, 90-day retention, 2 workspaces). The morning DM joins in v4.3.0.

We chose to ship v4.2.0 today rather than wait for the morning DM build because the workflow primitives are the structural foundation everything else depends on. Operators using Free or Pro today get real value; the morning DM lands when it lands.

---

#### Honest tradeoff

The v4.2.0 release widens the OSS surface (16 → 21 tools) without widening what self-host can structurally do. The 3 new tools that ship paid-only as hosted features (`slack_smart_search`, `slack_catch_me_up`, `slack_triage`) land in OSS as discoverable stubs that return a `tool_requires_hosted` payload pointing at signup. No silent failure. No bait-and-switch. The reader's MCP client sees the stub, knows the upgrade path, and routes the operator to mcp.revasserlabs.com when the hosted retrieval tier is the right move.

**What v4.2.0 adds to self-host (free, MIT):**

- 2 new workflow profile primitives — `slack_workflow_save`, `slack_workflows`. 5 named workflow_kind shapes, each returning a 4–5-key JSON contract.
- 6 packaged templates that bind a `workflow_kind` to a channel set in 30 seconds: `npx -y @jtalk22/slack-mcp --apply-template exec-monday --channels C012,C067`.
- 3 discoverable upgrade stubs that surface the hosted brain at the tool-list level instead of in marketing copy.

The v4.1.x carry-over (LevelDB token extraction, multi-profile Chrome enumeration, explicit shutdown handlers — all detailed under [4.1.2](#412---2026-04-12)) ships unchanged.

**What self-host structurally cannot do — and where hosted picks up:**

- Semantic search across Slack history. Vectorize is stateful and hosted-only.
- Connect hosted-web MCP clients. Their MCP transport is HTTP; self-host is stdio. This is a transport contract difference, not a configuration issue.
- Live in the Anthropic MCP Directory. The Directory's OAuth 2.1 bridge is a hosted-side surface; an npm package can't satisfy it.
- Persist credentials in encrypted at-rest storage that the operator never touches. Self-host writes tokens to `~/.slack-mcp-tokens.json` with `chmod 600`; hosted writes to AES-256-GCM-encrypted Cloudflare D1.
- Eliminate the 2-week token rotation cycle. Self-host re-pastes when Slack rotates the session; hosted holds an OAuth grant.

**What hosted does NOT own yet:** server-side OAuth refresh for tokens that pre-date the OAuth grant — operators connecting via session paste still re-paste on rotation, just like self-host. v4.1.3 territory.

**What v4.3.0 closes (Q2 2026):** the daily-habit lever. Pro tier names "scheduled morning catch-up DM at 8am workspace time" today; the Cloudflare Cron handler that posts the brief lands in v4.3.0. Until then, Pro $9/mo is real (unlimited hosted retrieval tools, permanent OAuth, 90-day Vectorize, 2 workspaces) and the morning DM is forward-looking — same shape v4.1.2 used for the `last_verified_with_slack_at` field.

---

#### Install

```bash
npx -y @jtalk22/slack-mcp
```

##### Apply a template at install time

```bash
npx -y @jtalk22/slack-mcp --apply-template support-triage --channels C012345,C067890
```

##### stdio client config

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"]
    }
  }
}
```

##### Other stdio clients

Same config block — all support stdio MCP.

---

#### Links

- GitHub: https://github.com/jtalk22/slack-mcp-server
- Hosted: https://mcp.revasserlabs.com
- Pricing: https://mcp.revasserlabs.com/pricing
- Full changelog: this file.
- Previous release: [4.1.2](#412---2026-04-12)

## [4.1.2] - 2026-04-12

### Fixed
- **LevelDB token extraction** — Reads session tokens directly from Chrome's LevelDB store (`{ChromeProfile}/Local Storage/leveldb/*.{ldb,log}`). Pure Node.js implementation, no AppleScript, no live Slack tab required. AppleScript path demoted to fallback.
- **Multi-profile Chrome enumeration** — Walks `Local State` → `profile.info_cache`, ranks candidate profiles by Cookies file mtime (freshest wins). Three new env vars for explicit override: `SLACK_MCP_CHROME_USER_DATA_DIR`, `SLACK_MCP_CHROME_PROFILE`, `SLACK_MCP_EXTRACTION_MODE`.
- **Explicit shutdown handlers** — SIGTERM, SIGINT, SIGHUP, stdin EOF, and stdin error all trigger clean exit. Closes the 53-orphan zombie-process bug where `unref()` on the background timer failed to exit because `StdioServerTransport` held the event loop open.

### Release notes, folded from `docs/RELEASE-NOTES-v4.1.2.md`

Published as `docs/RELEASE-NOTES-v4.1.2.md` and folded in here on 2026-10-07,
when the separate release-notes file was retired. The text is as published in
April 2026: its prices, tier names and roadmap dates were current then and are
not current now. Client and vendor product names were replaced with the
transport or tier they describe; no claim was changed.

**LevelDB extraction, multi-profile enumeration, zero zombies.**

---

#### The axiom

A status channel that reports without verifying against ground truth is a zombie signal. It can report green forever after the underlying reality has stopped.

The bug class: status systems track `last_attempt_at`, not `last_verified_ground_truth_at`. The two are not the same. An attempt succeeds when the status update writes; ground truth changes only when the underlying action observably affects the world. When those decouple, the status layer becomes fiction with a timestamp.

Three concurrent instances landed the same week: a pharmacy delivery system that "confirmed delivery with signature" for medication that was never in inventory; a Slack token-refresh loop that ran every four hours for 12 days without ever talking to Slack; and a Node process tree that grew to 53 zombie children because `unref()` was the documented exit path but `StdioServerTransport` kept the event loop open.

One bug class, three skins. The fix: persist `last_verified_ground_truth_at` separately from `last_attempt_at`. Escalate when the gap crosses a threshold.

---

#### The empirical proof — v4.1.2

Three structural fixes, each mapped to a status-channel divergence the maintainer hit and traced.

##### 1. LevelDB token extraction

**What broke:** AppleScript-based extraction required a live Slack tab open in Chrome and the `Allow JavaScript from Apple Events` flag enabled. Neither of those is guaranteed — and neither shows up in `slack_token_status`. The refresh loop ran. Tokens didn't change. Status said green.

**What changed:** The server now reads tokens directly from Chrome's LevelDB store (`{ChromeProfile}/Local Storage/leveldb/*.{ldb,log}`) using a pure Node.js implementation. No live tab, no AppleScript flag, no platform restriction. AppleScript is demoted to fallback for cases where LevelDB is locked.

##### 2. Multi-profile Chrome enumeration

**What broke:** Single-profile extraction picked the wrong Chrome profile on machines with multiple profiles (work + personal). Wrong profile = stale or absent tokens.

**What changed:** The server now walks `Local State` → `profile.info_cache`, ranks all candidate profiles by Cookies file mtime, and selects the freshest. Three env vars for explicit override:

```
SLACK_MCP_CHROME_USER_DATA_DIR   # path to Chrome user data dir
SLACK_MCP_CHROME_PROFILE         # profile folder name (e.g. "Profile 1")
SLACK_MCP_EXTRACTION_MODE        # leveldb | applescript | auto (default: auto)
```

##### 3. Explicit shutdown handlers

**What broke:** The background timer used `unref()` so Node would exit when nothing else was running. `StdioServerTransport` kept the event loop alive. Exit never happened. Restart accumulated 53 orphaned Node processes, oldest running for 2+ days.

**What changed:** Explicit handlers registered for SIGTERM, SIGINT, SIGHUP, stdin EOF, and stdin error. Each calls `process.exit(0)`. The process exits within milliseconds of receiving any shutdown signal. Zero zombies.

##### Also in v4.1.1 (shipped same release cycle)

- `last_auto_heal_attempt`, `last_auto_heal_error`, `stuck_since` fields in token store — surfaced by `slack_token_status`
- Structured `token_auth_failed` error code with `next_action` route-to-fix payload — no more swallowed generic errors

---

#### Honest tradeoff

This release fixes the local-machine pain points the maintainer can reach into and fix directly.

**What self-host (free) owns:** LevelDB extraction (no AppleScript dependency), multi-profile enumeration, zombie-free process lifecycle, structured error codes, auto-heal telemetry. Full 16-tool surface. MIT licensed.

**What hosted owns that self-host structurally cannot:**

- Managed MCP endpoint on the public internet — required for hosted-web MCP clients. The stdio transport that self-host uses cannot satisfy their HTTP transport contract. This is not a configuration issue; it is a transport contract difference.
- OAuth 2.1 bridge into the Anthropic MCP Directory — the only path for hosted-web MCP clients to connect without running a local server.
- Encrypted credential storage (AES-256-GCM in Cloudflare D1) — credentials never touch your filesystem.
- Stripe subscription billing and SLA guarantees.
- Structural absence of the zombie-process class — Cloudflare Workers are stateless per-request isolates. The `unref()` race condition is impossible by construction, not because we fixed it.

**What hosted does NOT own (yet):**

- Token acquisition — the user still pastes `xoxc-`/`xoxd-` from DevTools Console at setup time. Same browser dependency as self-host.
- Server-side token refresh — when Slack rotates your session, you re-paste. This is v4.1.3 territory.

---

#### Tier mapping (current — see v4.2 for the active model)

This v4.1.2 release predates the v4.2 pricing reorchestration. As of v4.2 the
hosted tiers are: Free $0 (no card, monthly model credits), Pro $9/mo (unlimited
+ scheduled morning catch-up DM), Team $49/mo flat (5 workspaces + shared
profiles + audit log), Ops from $199/mo custom (SLA, retention, SOC2,
multi-tenant isolation). See https://mcp.revasserlabs.com/pricing for live
plans and v4.2 release notes for the workflow profile primitives + paid stub
discoverability changes that landed alongside the pricing change.

| Tier | Who it serves |
|------|--------------|
| Self-host (free, MIT) | Developers, power users, local-first setups, and anyone who wants the workflow profile primitives + 3 discoverable upgrade stubs without the hosted brain |
| Hosted Free ($0, no card) | Anyone validating the hosted retrieval tier with monthly credits — 10 smart_search + 3 catch_me_up + 5 triage/day |
| Hosted Pro ($9/mo) | Solo operators who want unlimited hosted retrieval tools and the scheduled morning catch-up DM at 8am workspace time |
| Hosted Team ($49/mo flat) | 2-10 person ops squads needing shared workflow profiles + audit log + 24h support across 5 workspaces |
| Ops engagement (from $199/mo, custom) | 10+ workspace organizations with SLA, custom retention, SOC2 evidence, or multi-tenant isolation requirements |

---

#### What's next — v4.1.3

The axiom fix lands in both self-host and hosted. The missing field is `last_verified_with_slack_at` — a real Slack API call timestamp, not a refresh-function-returned timestamp.

- **Self-host:** Auto-heal loop re-verifies against a live Slack API call before marking tokens healthy. `slack_token_status` reports both `last_auto_heal_attempt` and `last_verified_with_slack_at`.
- **Hosted:** Status API exposes drift between last refresh attempt and last verified ground truth. Dashboard flags when the gap crosses threshold.

This closes the feedback loop that v4.1.1 instrumented but didn't complete.

---

#### Install

```bash
npx @jtalk22/slack-mcp
```

##### stdio client config

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@jtalk22/slack-mcp"]
    }
  }
}
```

##### Other stdio clients

Same config block — all three support stdio MCP.

##### Explicit Chrome profile override

```bash
SLACK_MCP_CHROME_USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome" \
SLACK_MCP_CHROME_PROFILE="Profile 1" \
SLACK_MCP_EXTRACTION_MODE="leveldb" \
npx @jtalk22/slack-mcp
```

---

#### Links

- GitHub: https://github.com/jtalk22/slack-mcp-server
- Hosted tiers and releases: https://mcp.revasserlabs.com/releases
- Full changelog: this file.

## [4.1.1] - 2026-04-12

### Added
- **Auto-heal telemetry** — Token store now persists `last_auto_heal_attempt`, `last_auto_heal_error`, and `stuck_since` fields. Surfaces via `slack_token_status`.
- **Structured `token_auth_failed` error code** — Auth failure response includes `next_action` route-to-fix payload so callers know exactly what to do (re-extract vs re-paste vs re-auth).

### Fixed
- **Error surface hardening** — Auth failures no longer swallowed as generic MCP errors; structured codes propagate to the client.

## [4.1.0] - 2026-04-01

### Highlights
- **Chrome DB decryption** — Session cookie extracted directly from Chrome's encrypted SQLite store (PBKDF2 + AES-128-CBC from macOS Keychain). No DevTools, no manual copy-paste.
- **Stealth Mode** — Session-token auth leaves zero footprint in workspace admin settings. No app install, no bot user, no audit trail.
- **Codex CLI support** — Config examples and confirmed compatibility.

### Changed
- README: Stealth Mode framing, Codex CLI quick start, expanded comparison table
- Diagram: Updated to show Chrome DB decryption flow, dark theme, attribution updated (version number dropped to prevent staleness)
- Landing page: Cloud messaging updated for hosted product direction
- Launch posts: Rewritten to lead with Chrome DB decryption (technical hook)
- Docs: Stale Cloud pricing removed from SETUP, TROUBLESHOOTING, DEPLOYMENT-MODES, ARCHITECTURE
- Demo assets rebranded: `demo-claude-*` → `demo-slack-mcp-*` (files, URLs, OG tags, scripts, templates) — client-agnostic naming
- Video polish: color grade, contrast +12%, sharpen, vignette, CRF 18 encode (2.5× bitrate) across all 5 video assets
- First 2s trimmed from recordings (stale badge eliminated)
- Old `demo-claude.html` preserved as redirect to canonical URL

### Removed
- 13 hash-named `.webm` iteration recordings (80.7MB) — stale pipeline artifacts, preserved in git history

### Fixed
- HttpOnly cookie extraction — The `d` cookie was always HttpOnly; `document.cookie` never worked for extraction. Now reads Chrome's encrypted SQLite DB directly.

## [4.0.0] - 2026-03-30

### Highlights
- **Monday Morning demo** — 7-scenario interactive narrative: triage 47 unreads, find a lost printer PIN, reply to incidents, export for post-mortems — without opening Slack once.
- **H.264 video pipeline** — `npm run record-demo` auto-encodes MP4 from Playwright recordings. Demo video page serves MP4 first with WebM fallback.
- **16 tools, one command** — `npx -y @jtalk22/slack-mcp --setup` gets you running with any MCP client: Claude, Cursor, Copilot, Gemini, Windsurf.
- **Schema.org SEO** — VideoObject markup on demo-video.html for Google rich results.
- **Play button poster** — README poster image composites a play button overlay for click-through.

### Changed
- **README rewritten** — Leads with the problem (Slack's OAuth is broken with Claude Code). Multi-client positioning, comparison diagram, demo video above the fold.
- **Landing page** — Hero rewritten to lead with differentiation, not features. Demo is the primary CTA.
- **Version bumped to 4.0.0** across package.json, server.json, glama.json

### Security
- **File permissions** — `fs.chmodSync` added to token file writes
- **API key redaction** — Dashboard URL prints truncated key
- **Integer validation** — `safeParseInt` guards numeric API parameters

### Compatibility
- No MCP tool names were removed or renamed. All 16 tools unchanged.
- All CLI entry points unchanged (`--setup`, `--status`, `--doctor`, `web`, `http`).

## [3.2.4] - 2026-03-11

### Fixed
- **Release integrity** — Runtime version emitters now resolve from `package.json`, restoring parity for CLI output, Docker smoke tests, and hosted runtime metadata.
- **Public surface drift** — Current README, marketing pages, setup docs, and hosted offering claims were aligned so self-hosted and managed offerings no longer contradict each other.

### Added
- **Public surface integrity gate** — CI and release preflight now validate current-version surfaces, hosted tool-count claims, and core metadata parity before release.
- **Attribution guardrail regression check** — CI and release preflight now verify the Dependabot skip conditions and main-branch owner enforcement remain intact.
- **Current release docs** — Added a `v3.2.4` release-note block and a same-day release runbook covering the Docker tag push vs GitHub Release sequencing.
- **Support routing visibility** — Deployment intake and support-boundary guidance are now elevated across the current repo trust surfaces.

## [3.2.1] - 2026-03-10

### Fixed
- **Safety annotations** — `destructiveHint: true` on 4 write-path tools (send_message, add_reaction, remove_reaction, conversations_mark). MCP clients now prompt for confirmation before write operations.

### Changed
- **README restructured** — 571 → ~180 lines. Annotation table, collapsible install configs, modern MCP patterns. Architecture and internals moved to docs/ARCHITECTURE.md.
- **SECURITY.md updated** — Version table current (3.x), professional language throughout.
- **Setup wizard tagline** — Removed "bypasses OAuth" phrasing.
- **Disclaimer reframed** — Professional language replacing "unofficial APIs."

## [3.2.0] - 2026-03-10

### Added
- **`slack_add_reaction`** — Add emoji reactions to messages
- **`slack_remove_reaction`** — Remove emoji reactions from messages
- **`slack_conversations_mark`** — Mark a conversation as read up to a timestamp
- **`slack_conversations_unreads`** — Priority-sorted unread inbox across all channels and DMs
- **`slack_users_search`** — Search workspace users by name, display name, or email
- REST endpoints: `POST /reactions`, `DELETE /reactions`, `POST /conversations/:id/mark`, `GET /conversations/unreads`, `GET /users/search`

### Fixed
- **server-http.js tool parity** — Hosted HTTP transport now dispatches all 16 tools (was missing reactions, mark, unreads, search)
- **Background timer crash** — `setInterval` callback in server.js wrapped in try/catch to prevent unhandled rejection
- **Express route ordering** — `/users/search` registered before `/users/:id` to prevent "search" matching as user ID

### Changed
- Tool count: 11 → 16 across all three transports (stdio, web, hosted HTTP)
- Hosted endpoint docs added to SETUP.md, DEPLOYMENT-MODES.md, and TROUBLESHOOTING.md

### Compatibility
- No MCP tool renames or removals. Fully backwards compatible.

## [3.1.0] - 2026-03-10

### Added
- **Hosted endpoint surface** — landing page with hosted endpoint and post-checkout key delivery
- **Homepage hosted CTA** — `index.html` links to hosted page
- **README hosted section** — link to hosted endpoint
- **Revenue Protection** — plan-based tool gating, D1 rate limit persistence, timing-safe admin auth
- **OAuth 2.1 + PKCE S256** — MCP Registry remote endpoint at `mcp.revasserlabs.com/oauth/mcp`
- **MCP Registry v3.1.0 published** with `remotes` section

### Security
- XSS fix: conversation names, user names, and channel names now escaped in web dashboard
- Shell injection fix: Keychain functions use `execFileSync` with array args instead of string interpolation
- Undefined param fix: `null`/`undefined` values no longer sent as literal `"undefined"` to Slack API
- JSON parse guard: non-JSON Slack responses now throw descriptive error instead of crashing
- `formatTimestamp` guards against NaN/undefined input

### Compatibility
- No MCP tool renames or removals. All 11 local tools unchanged.
- Hosted endpoint adds compound workflow tools for team deployments.

## [3.0.0] - 2026-02-28

### Changed
- **Hosted `/mcp` now requires auth** — `Authorization: Bearer` header mandatory for HTTP transport
- **CORS allowlisting** — hosted endpoint requires `SLACK_MCP_HTTP_ALLOWED_ORIGINS`
- Structured auth/CORS error responses for missing token config, invalid bearer, and denied origin
- Publish payload reduced by curating packaged files

### Added
- Web verification checks demo media reachability
- Worker compatibility for tool-facing contracts (`channel_id|channel`, `user_id|user`)

### Breaking (Hosted Only)
- Existing hosted deployments must set `SLACK_MCP_HTTP_AUTH_TOKEN` and `SLACK_MCP_HTTP_ALLOWED_ORIGINS` before upgrade
- Local `stdio` and `web` paths unchanged — no migration required

### Compatibility
- No MCP tool renames or removals

## [2.0.0] - 2026-02-26

### Fixed
- Enforced read-only `--status` behavior in install-flow verification for both local and published `npx` paths.
- Added deterministic `--doctor` runtime failure coverage (`exit 3`) using explicit connectivity test wiring.
- Standardized MCP transport tool-call failures with structured error payloads (`status`, `code`, `message`, `next_action`).

### Improved
- Added explicit `unknown_age` token-state semantics when credential timestamps are unavailable.
- Normalized web API error responses to structured diagnostics for auth, validation, and runtime failures.
- Added `verify:version-parity` script and report generation for npm/MCP registry/local metadata parity checks.
- Updated public metadata surface for distribution (`server.json` title, website URL, icon metadata).

### Compatibility
- No MCP tool renames or removals.

## [1.2.4] - 2026-02-26

### Fixed
- Made `--status` deterministic and read-only (no Chrome extraction side effects).
- Standardized `--doctor` behavior with explicit missing/invalid/runtime exit-code coverage in install-flow verification.
- Corrected token-age handling so missing timestamps report unknown age instead of false critical warnings.
- Added explicit Apple Events remediation guidance for Chrome extraction failures.

### Improved
- Unified health/status JSON shape across CLI handlers and web endpoints (`status`, `code`, `message`, `next_action`).
- Kept MCP tool contracts stable while improving runtime diagnostics and operator guidance.

### Compatibility
- No MCP tool renames or removals.

## [1.2.3] - 2026-02-25

### Improved
- Added concise issue/release follow-up templates and communication style guidance for faster post-publish bug handling.
- Added free local-first proof surfaces: README 30-second proof, HN launch kit, docs index, and demo CTA alignment.
- Added clean-room install verifier script (`scripts/verify-install-flow.js`) and CI coverage on Node 20.
- Added `--doctor` CLI diagnostics with deterministic exit codes and next-step guidance.

### Compatibility
- No API or MCP tool schema changes.

## [1.2.2] - 2026-02-25

### Improved
- Aligned CLI/setup guidance to `npx -y @jtalk22/slack-mcp` across docs and runtime messaging
- Removed stale token refresh command references
- Added deployment mode, support boundary, and use case recipe docs
- Added demo CTA strip and deployment intake issue template for qualified team rollout requests

### Compatibility
- No API or MCP tool schema changes

## [1.2.1] - 2026-02-24

### Fixed
- Form-encoded params for Slack endpoints that reject JSON (`conversations.replies`, `search.messages`, `search.all`, `search.files`, `users.info`) with server + worker parity
- Default package CLI entrypoint so `npx @jtalk22/slack-mcp` resolves consistently
- Unified CLI dispatch for stdio default plus `web`, `http`, `--setup`, `--status`, `--version`
- Setup wizard now reliably restores environment state after token validation and renders color interpolation correctly

### Security / Runtime
- Upgraded `@modelcontextprotocol/sdk` to `1.27.0`
- Docker base image updated to Node 20
- Setup/README runtime baseline aligned to Node 20+

## [1.2.0] - 2026-01-17

### Added
- **Interactive Setup Wizard** (`npx @jtalk22/slack-mcp --setup`)
  - Platform detection (macOS vs Linux/Windows)
  - macOS: Auto-extracts tokens from Chrome via AppleScript
  - Linux/Windows: Guided step-by-step manual entry
  - Token validation against Slack API before saving
  - Visual feedback with colored output
- New CLI commands: `--setup`, `--status`, `--version`, `--help`
- New bin entry: `slack-mcp-setup`
- New npm script: `npm run setup`

### Changed
- **Node.js 20+ required** (Node 18 EOL October 2025)
- Version bump across all files (package.json, server.json, server-http.js)

### Developer Experience
- Single-command setup replaces multi-step manual token extraction
- Consistent CLI interface for common operations

## [1.1.7] - 2026-01-08

### Fixed
- Version numbers now consistent across all files
- Error messages reference correct commands (`npm run tokens:auto`)
- Documentation updated with correct setup instructions
- `output_file` description reflects security-restricted path

### Changed
- Verification scripts use generic messages (not version-specific)
- `token-cli.js` uses shared `KEYCHAIN_SERVICE` constant
- `handlers.js` uses ES module import for `execSync`

### Documentation
- Added `slack_token_status` to API reference
- Fixed clone URL in SETUP.md
- Updated TROUBLESHOOTING.md with current API key behavior

## [1.1.6] - 2026-01-08

### Changed
- Web server binds to `127.0.0.1` (localhost only)
- CORS accepts localhost origins only
- File exports write to `~/.slack-mcp-exports/`

## [1.1.5] - 2026-01-08

### Changed
- README badges use pure markdown for mobile compatibility
- Simplified glama.json configuration

## [1.1.4] - 2026-01-08

### Changed
- Expanded npm keywords for discoverability
- Added Open Graph meta tags to demo page
- Enhanced Dockerfile with OCI labels

## [1.1.2] - 2026-01-08

### Changed
- Homepage in package.json now points to live demo for npm discoverability

## [1.1.1] - 2025-01-08

### Fixed
- User profile card now renders correctly in "Who is Alex?" scenario
- `showUserCard()` dynamically renders card instead of manipulating hidden element

## [1.1.0] - 2025-01-08

### Added
- **Magic Link**: One-click dashboard URL with embedded API key
- **Interactive Simulator**: Split-screen MCP client + Slack demo with 3 scenarios
- **Auth Modal**: Secure key entry with localStorage persistence
- **Reset Demo** button for simulator restart
- `scripts/verify-web.js` for automated Web UI testing
- URL parameter detection (`?key=`) with auto-save to localStorage
- Key stripped from URL after save (security polish)
- 401/403 handling clears invalid keys and re-prompts

### Changed
- Faster animation timings (~40% snappier scenarios)
- Anonymized mock data (replaced PII with generic names)
- Web server prints Magic Link to stderr for clean output
- Demo scenarios: "Find API Key", "List Channels", "Who is Alex?"

## [1.0.6] - 2025-01-08

### Added
- **Zombie Process Protection**: `unref()` on background timers
- **Atomic File Writes**: temp-file-then-rename pattern
- **Mutex Lock**: Prevents concurrent Chrome token extraction
- **Platform Detection**: `IS_MACOS` check for osascript features
- **Robust Boolean Parsing**: `parseBool()` handles LLM input variations
- `isAutoRefreshAvailable()` export for platform checks
- `scripts/verify-v106.js` verification script
- Background token health monitoring (every 4 hours)

### Changed
- DM cache uses atomic writes
- `handleRefreshTokens` returns helpful message on non-macOS

### Fixed
- Process no longer hangs after MCP transport closes
- No more `.tmp` file artifacts on crash
- Race conditions in token refresh eliminated

## [1.0.5] - 2025-01-07

### Added
- LRU user cache with TTL (500 users, 1-hour expiry)
- Network error retry with exponential backoff + jitter
- Token health monitoring with age warnings
- `slack_token_status` tool for detailed diagnostics
- `slack_list_users` with pagination (500+ users supported)

### Changed
- Improved error messages for token expiration
- Better rate limit handling

## [1.0.0] - 2025-01-06

### Added
- Initial release
- MCP server with stdio transport
- Web UI with REST API
- 10 Slack tools:
  - `slack_health_check`
  - `slack_refresh_tokens`
  - `slack_list_conversations`
  - `slack_conversations_history`
  - `slack_get_full_conversation`
  - `slack_search_messages`
  - `slack_send_message`
  - `slack_get_thread`
  - `slack_users_info`
  - `slack_list_users`
- Browser token extraction (macOS)
- Multi-layer token persistence (env, file, keychain)
- Auto-refresh from Chrome

[Unreleased]: https://github.com/jtalk22/slack-mcp-server/compare/v5.0.1...HEAD
[5.0.1]: https://github.com/jtalk22/slack-mcp-server/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.9.0...v5.0.0
[4.9.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.8.0...v4.9.0
[4.8.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.7.0...v4.8.0
[4.7.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.6.2...v4.7.0
[4.6.2]: https://github.com/jtalk22/slack-mcp-server/compare/v4.6.1...v4.6.2
[4.6.1]: https://github.com/jtalk22/slack-mcp-server/compare/v4.6.0...v4.6.1
[4.6.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.5.0...v4.6.0
[4.5.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.4.3...v4.5.0
[4.4.3]: https://github.com/jtalk22/slack-mcp-server/compare/v4.4.2...v4.4.3
[4.4.2]: https://github.com/jtalk22/slack-mcp-server/compare/v4.4.1...v4.4.2
[4.4.1]: https://github.com/jtalk22/slack-mcp-server/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.2.2...v4.3.0
[4.2.2]: https://github.com/jtalk22/slack-mcp-server/compare/v4.2.1...v4.2.2
[4.2.1]: https://github.com/jtalk22/slack-mcp-server/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.1.2...v4.2.0
[4.1.2]: https://github.com/jtalk22/slack-mcp-server/compare/v4.1.1...v4.1.2
[4.1.1]: https://github.com/jtalk22/slack-mcp-server/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/jtalk22/slack-mcp-server/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v3.2.5...v4.0.0
[3.2.4]: https://github.com/jtalk22/slack-mcp-server/compare/v3.2.3...v3.2.4
[3.2.0]: https://github.com/jtalk22/slack-mcp-server/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/jtalk22/slack-mcp-server/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.4...v2.0.0
[1.2.4]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/jtalk22/slack-mcp-server/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.9...v1.2.0
[1.1.7]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.2...v1.1.4
[1.1.2]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/jtalk22/slack-mcp-server/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/jtalk22/slack-mcp-server/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/jtalk22/slack-mcp-server/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/jtalk22/slack-mcp-server/compare/v1.0.0...v1.0.5
[1.0.0]: https://github.com/jtalk22/slack-mcp-server/releases/tag/v1.0.0
