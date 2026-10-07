# Prompt-Injection Test Corpus

A set of adversarial message fixtures for any MCP server that reads a shared
message bus and hands the result to a model. The fixtures live in
[`test/injection-corpus/`](../test/injection-corpus) as JSON, one file per
vector class, and are exercised by
[`test/injection-corpus.test.js`](../test/injection-corpus.test.js).

The corpus is defensive. Every payload is neutral placeholder content with
reserved `.invalid` hostnames and addresses; nothing here is a working exploit
against a third party, and no fixture carries a credential, a real person's name
or a live workspace identifier. A test in the corpus asserts that property, so a
fixture that drifts fails the suite.

`test/` is not in this package's npm `files[]` whitelist, so the corpus does not
ship to package consumers. It is a repository artifact.

## Why this exists

The shape of the problem is not specific to Slack. It appears whenever one
toolset does three things at once:

1. **Reads from a bus other people can write to.** A Slack channel can contain
   Slack Connect participants from another workspace, multi-channel and
   single-channel guests, and apps relaying content that was authored outside
   Slack entirely.
2. **Returns that content as text into a model's context,** where it sits next to
   the operator's own instructions with no structural difference between them.
3. **Exposes a write tool in the same toolset.** This server has
   `slack_send_message`, `slack_add_reaction` and `slack_conversations_mark`.
   Read and act are one capability surface.

Put together: text an outsider wrote arrives in the same channel as the
operator's instructions, and the model holding both can take an action. The
corpus is the input side of that problem — the fixtures a server should be tested
against before it claims to handle untrusted message content.

Two framings worth separating. A **labelling** problem is one where the data a
server needs is present and simply is not surfaced; a **boundary** problem is one
where no amount of labelling helps because the model is being asked to
distinguish instruction from content by reading it. Classes 1 to 3 below are
boundary problems. Classes 4 to 8 are labelling problems, and those are the ones
a server can actually fix.

## Running it

```bash
npm test                                  # whole suite
node --test test/injection-corpus.test.js # corpus only
```

The corpus test discovers fixtures by reading the directory, so adding a JSON
file is enough to bring it under the integrity checks. No index to update.

## Fixture format

```json
{
  "id": "connect-outside-team",
  "class": "Slack Connect author from another workspace",
  "payload_kind": "message",
  "codepoints": ["‮"],
  "reaches_model_via": ["slack_conversations_history", "..."],
  "mechanism": "why the vector works",
  "tests": "what a test against this fixture is measuring",
  "correct_handling": "what a server should do about it",
  "slack": { "type": "message", "...": "a real Slack API payload" },
  "channel": { "id": "C_...", "is_ext_shared": true }
}
```

| Key | Meaning |
|-----|---------|
| `id` | Stable identifier; tests select fixtures by it. |
| `class` | The vector class, as named in this document. |
| `payload_kind` | `message` (default), `user` or `channel` — which API shape `slack` holds. |
| `codepoints` | Invisible or control characters the fixture depends on. A test asserts each one really survives into the payload, so a stripped `\uXXXX` escape fails rather than silently weakening the fixture. |
| `reaches_model_via` | The tools that carry this payload into a model's context. |
| `mechanism` | Why it works, mechanically. |
| `tests` | What is being measured. |
| `correct_handling` | What a server should do. |
| `slack` | The payload, in the field names the Slack Web API actually returns. A test enforces this against a whitelist of real message fields, so an invented field fails the suite rather than teaching the wrong shape to anyone porting the corpus. |
| `channel` | Optional. The containing channel's `conversations.list` entry, for vectors where the channel's sharing state is part of the vector. Context that is not part of the message object belongs here, never inside `slack`. |

Codepoints are written as JSON `\uXXXX` escapes rather than literal bytes. The
escapes stay reviewable in a diff, survive copy-paste between editors, and parse
back to the real codepoint — which the integrity test confirms.

## The vector classes

Each section gives the mechanism, what a server should do, and what this server
does today. The "today" notes are measured by the corpus test against `lib/` on
`main`, not asserted from reading the code.

### 1. Unicode bidirectional override

`test/injection-corpus/01-bidi-override.json`

U+202E RIGHT-TO-LEFT OVERRIDE reorders the glyphs that follow it without
changing the code-unit order. The bytes a server returns and the sentence a
human sees in the Slack client are different sentences. U+202C POP DIRECTIONAL
FORMATTING closes the span, so the rest of the message renders normally and the
message does not look tampered with. Same effect: U+202D (LRO), U+2066–U+2069
(directional isolates), U+200E/U+200F (LRM/RLM).

Why it works: review happens in the client, action happens on the bytes. An
operator who audits the channel and approves what they read has approved a
different string from the one the model acted on.

**What a server should do.** Do not pass the raw codepoints through unmarked.
Any of three answers is defensible: strip the `Bidi_Control` set, escape the
characters to a visible form, or keep them and flag the message. The property to
hold is that the operator's audit and the model's input agree. Stripping is safe
on an agent surface because no legitimate message needs an unbalanced override
to be understood.

**Today:** passed through byte for byte. No normalization, no flag.

### 2. Invisible character keyword splitting

`test/injection-corpus/02-zero-width-split.json`

U+200B (ZWSP), U+200C/U+200D (ZWNJ/ZWJ), U+2060 (WORD JOINER) and U+FEFF render
as nothing. Inserted inside a word they leave the display unchanged and destroy
every byte-level match for that word.

Why it works: the author of the message picks the split points after reading
your denylist. The corpus test demonstrates this rather than describing it — the
split keyword does not match as written, and matches only after the invisible
characters are removed.

**What a server should do.** Do not treat a text filter as a security control.
Where text is matched at all, normalize first — NFKC, then remove the
`Default_Ignorable_Code_Point` set, then match. The durable control is provenance
plus a standing rule that message bodies are never instructions; a denylist
loses to the next unassigned invisible codepoint.

**Today:** passed through byte for byte. There is no keyword filter to evade,
which is the right posture for the wrong reason — nothing marks the text either.

### 3. Tool-call mimicry in a message body

`test/injection-corpus/03-tool-call-mimicry.json`

Read tools serialize their result, so message text is delivered inside a JSON
document. A message body shaped like a tool call — fenced, named after a tool
that exists, with a plausible argument object — arrives as a string imitating
the transport's own control plane.

Why it works: the string does not execute, and that is not the risk. The risk is
that nothing in the payload distinguishes a quoted call from a real one, and the
write tool is in the same toolset.

**What a server should do.** Keep the boundary structural rather than textual.
Message text belongs in a field the model is told is data; a tool call belongs in
the protocol's tool-call channel and should not be constructible from inside a
result string. Pair that with a write-path confirmation once untrusted text has
entered the session, so a misread cannot become a send by itself. This is the
class where labelling helps least and a capability boundary helps most.

**Today:** passed through byte for byte, inside the same serialized document as
the response's real structure.

### 4. Payload outside the `text` field

`test/injection-corpus/04-attachment-payload.json`

A Slack message carries text in several places: `text`, `attachments[].text`,
`attachments[].pretext` / `title` / `footer`, `attachments[].fields[].value`, and
Block Kit `blocks[]`. A message can have an empty `text` and still render a full
paragraph, which is ordinary for alerting and integration traffic.

Why it works: a reader that inspects only `text` sees nothing, while a human
sees the paragraph and the API returns it verbatim. The same blind spot hides
legitimate alert bodies, which is the reason to surface these fields at all —
the fix is not to stop reading them.

**What a server should do.** Treat every text-bearing field as the same trust
class as the message that holds it. When attachments and blocks are surfaced,
carry the message's origin onto them, and never let an attachment's own
`author_name`, `service_name`, `title_link` or `footer` stand in for authorship —
the poster sets all of them. Do not describe a scan that reads only `text` as
covering the message.

**Today:** two behaviours. The local catch-up path drops attachments entirely,
so neither the payload nor a real alert body reaches the model. The history,
thread and search tools surface them under the opt-in
`include_rich_message_fields`, verbatim and with no marker saying the text was
promoted out of an attachment.

### 5. An app relaying text authored outside the bus

`test/injection-corpus/05-bot-relay-outside-author.json`

An RSS reader, an email-to-channel bridge or an alerting integration is
installed in the home workspace and posts with the home `team` id. The words it
posts were written by whoever controls the upstream feed — an article author, an
email sender, a webhook caller — who was never a member of the workspace and
needed no access to it.

Why it works: this is the case where a trust model built on workspace membership
is not merely incomplete but inverted. The one signal that looks like
authorship — the message is in my workspace, from an app we installed — carries
no information about who wrote the text, and the relayed content is reachable by
anyone who can email the bridge or edit the feed.

**What a server should do.** Rank a bot or app author untrusted regardless of
workspace membership, and decide it **before** the team comparison: `bot_id`,
`app_id`, or `subtype: "bot_message"` means the author of the words is unknown.
Surface the relaying app as the transport, never as the author. Where a bridge
preserves an upstream sender, present it as a claim by the bridge rather than a
verified identity.

**Today:** `bot_id`, `app_id`, `subtype`, `team`, `bot_profile` and `username`
are all present on the raw message. The catch-up path drops every one of them,
so a reader of that bundle cannot tell the words came from outside Slack. The
rich-fields opt-in exposes them as data, with nothing reading them to reach a
conclusion.

### 6. A participant from another workspace

`test/injection-corpus/06-connect-outside-team.json`

In a Slack Connect channel the participants belong to different workspaces, and
Slack marks it on each message: the author's `team` differs from the reader's
home team id. The channel is an ordinary `conversations.list` entry with
`is_ext_shared` and `connected_team_ids` set.

Why it works: nothing about reading the channel signals that some messages were
written by people the operator's administrators do not control, cannot offboard
and never vetted. A thread is where it most often appears — a trusted parent
with an outside reply beneath it — so a check applied only to top-level messages
misses it.

**What a server should do.** Compare the message's `team` against the home team
id and mark a mismatch untrusted. Fail closed: a message with no `team`, or a
read with no known home team id, is *unknown*, not internal. A false untrusted
mark is a label; a false trusted mark is an injection path. Apply the same check
to replies and count them in whatever summary the response carries.

**Today:** the author's `team` is dropped by the catch-up path and by the default
history output, so the output carries nothing to compare against a home
workspace. The field is available on the raw message.

### 7. Instruction in an attacker-settable identity field

`test/injection-corpus/07-identity-field-instruction.json`

`display_name`, `real_name`, `title` and `status_text` are set by the account
holder, not by an administrator — and a guest or Slack Connect participant sets
their own. They reach a model through `slack_users_info`, `slack_list_users` and
`slack_users_search`.

Why it works, and the part that is easy to miss: a resolved display name is
substituted for the author of **every** message a history read returns. One of
these fields therefore reaches the model on every message that user wrote, on a
tool the caller never asked for user data from. A reader hardened against
message bodies but not against the name attached to them still takes the
payload. The field is also short, persistent and re-sent on every read, where a
message scrolls out of the window.

**What a server should do.** Treat every profile field except the immutable `id`
as author-supplied text of the same trust class as that author's messages. Where
a resolved name is substituted into a message, carry the author's origin with it
and keep the raw user id in the output, because the id is the only part the
account holder cannot choose. Length-bound the fields before rendering. Never
present a self-set field as an identity the workspace has verified.

**Today:** all four fields are passed through verbatim, invisible characters
included. `slack_users_info` does not surface the user's own `team_id`, so its
output cannot be placed inside or outside the workspace. The substitution path
is live: `resolve_users` defaults to on, so `real_name` is the author line on
every message a history read returns, with the immutable `user_id` kept beside
it.

### 8. Instruction in a channel topic or purpose

`test/injection-corpus/08-channel-topic-instruction.json`

A channel's topic and purpose are free text, settable by any member unless an
administrator restricts it — and in an externally shared channel, by members of
the other workspace. Both are returned on every `conversations.list` entry as
`topic.value` and `purpose.value`.

Why it works: the text arrives as channel *description*, which reads as
configuration rather than as content, and that framing invites a model to treat
it as standing context instead of something to report on. One edit by one member
then applies to every later read of that channel, in every agent session, with no
message in the history showing where it came from.

**What a server should do.** If topic or purpose is surfaced, mark it as
member-supplied text and bound its length; in an externally shared channel treat
it as untrusted outright. Prefer the channel id for identity, and never let topic
text stand in for a channel's purpose when deciding whether an action is
authorized.

**Today:** not surfaced. `slack_list_conversations` builds a fixed set of keys —
`id`, `name`, `type`, `user_id` — and topic and purpose are not among them. The
vector stays in the corpus because that is closure by omission, one line of code
away from reopening. The fixture is the answer already written down for the day
someone adds the field.

## What labelling can and cannot do

Worth stating plainly, because a provenance feature is easy to over-claim.

An origin label fixes **attribution**: it tells a model, and an operator reading
the transcript, which text came from outside the trust boundary. That is a real
control and it is cheap, because the deciding fields — `team`, `bot_id`,
`app_id`, `subtype`, `user` — are already on the message object, so classifying
costs no extra API call and no rate-limit budget.

It does not fix **instruction-following**. A model told that a string is
untrusted may still act on it. Labelling raises the cost of the attack and gives
an operator something to audit; it is not a parser that separates instruction
from data. The controls that actually bound the damage are capability-side:

- Confirmation on the write path once untrusted text has been read in the
  session, with the gate's own mode read from the operator's configuration and
  never from the request it is meant to restrain. A gate that can be switched off
  by naming it can be switched off by the injected text.
- Fail-closed classification, so an unrecognized shape is untrusted rather than
  assumed internal.
- A default that is on. A control that ships off protects nobody.

## Reusing the corpus

The fixtures are plain JSON in real Slack field names, so they port without
modification to a server written in any language. The pattern that makes them
reusable:

1. Load the directory; each file is one vector.
2. Feed `fixture.slack` to your own read path, in the shape `payload_kind` names.
3. Assert against `fixture.correct_handling` — not against a golden output, which
   would only encode your current behaviour.

Where your server has no defence yet, assert the behaviour you measured and name
the gap in a comment, rather than skipping the test or asserting something that
cannot fail. The corpus test here follows that rule: each vector asserts the
passthrough it measured, and asserts the *correct* label if a label is present at
all, so the same test becomes a real check the day labelling lands. A single test
named `GAP RECORD` holds the current-state baseline in one place, so closing the
gap fails exactly one test with a message saying what to update.

For a server on a different bus, the classes map directly. Classes 1 to 3 depend
only on text reaching a model. Class 4 becomes any format with more than one
text-bearing field. Class 5 becomes any relay, webhook or integration. Class 6
becomes any federation or guest boundary. Classes 7 and 8 become any
self-settable display name or container description.

## Related

- [Architecture](ARCHITECTURE.md) — where the read path and the write tools sit.
- [API Reference](API.md) — the tools named in each fixture's `reaches_model_via`.
- [Support Boundaries](SUPPORT-BOUNDARIES.md) — what this project does and does not undertake.
