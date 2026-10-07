/**
 * Prompt-injection corpus: adversarial message fixtures run against the handling
 * that exists in lib/ today.
 *
 * The fixtures live in test/injection-corpus/*.json and are documented in
 * docs/INJECTION-CORPUS.md. They are defensive test vectors: neutral placeholder
 * content, no working exploit against a third party, no real credential, person
 * or workspace identifier.
 *
 * Two kinds of assertion appear below, and the difference matters:
 *
 *   1. Passthrough facts. The payload reaches the model byte for byte, or is
 *      dropped. These are true of the current code and stay true after a
 *      labelling feature lands, so they are asserted outright.
 *   2. The labelling gap. Nothing in lib/ currently marks who wrote a message.
 *      Rather than freeze that absence (which would fail the day a provenance
 *      feature merges), each vector asserts the weaker, honest thing: if an
 *      origin label is present it must be the correct one for that fixture, and
 *      the single test named "GAP RECORD" states the current absence in one
 *      place so it fails loudly and informatively when the gap closes.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(HERE, "injection-corpus");

// Fixtures only: no live credentials, Slack requests, or browser extraction.
process.env.SLACK_TOKEN = "xoxc-1111-2222-3333-aaaaaaaaaaaaaaaaaaaaaaaa";
process.env.SLACK_COOKIE = "xoxd-fixture-cookie";
process.env.SLACK_MCP_MIN_REQUEST_INTERVAL_MS = "0";

const corpus = readdirSync(CORPUS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => ({ file: f, ...JSON.parse(readFileSync(join(CORPUS_DIR, f), "utf-8")) }));

const byId = (id) => {
  const found = corpus.find((f) => f.id === id);
  assert.ok(found, `fixture ${id} is missing from ${CORPUS_DIR}`);
  return found;
};

const kindOf = (fixture) => fixture.payload_kind || "message";

/**
 * Assert a vector's label is correct IF the code labels at all.
 *
 * Returns "absent" or the origin found, so a caller can report which half of
 * the assertion actually ran.
 */
function assertLabelIfPresent(output, expectedOrigin, context) {
  if (!("origin" in output)) return "absent";
  assert.equal(output.origin, expectedOrigin, `${context}: wrong origin label`);
  assert.equal(
    output.author_trusted,
    false,
    `${context}: an outside author must never be marked trusted`
  );
  return output.origin;
}

// ------------------------------------------------------------ corpus integrity

test("every fixture declares what it tests and what correct handling looks like", () => {
  assert.ok(corpus.length >= 8, `expected the full corpus, found ${corpus.length}`);
  const seen = new Set();
  for (const f of corpus) {
    for (const key of ["id", "class", "mechanism", "tests", "correct_handling", "reaches_model_via", "slack"]) {
      assert.ok(f[key], `${f.file}: missing required key "${key}"`);
    }
    assert.ok(!seen.has(f.id), `${f.file}: duplicate fixture id "${f.id}"`);
    seen.add(f.id);
    assert.ok(Array.isArray(f.reaches_model_via) && f.reaches_model_via.length > 0,
      `${f.file}: reaches_model_via must name at least one tool`);
    assert.equal(typeof f.slack, "object", `${f.file}: slack payload must be an object`);
    assert.ok(["message", "user", "channel"].includes(kindOf(f)),
      `${f.file}: unknown payload_kind "${kindOf(f)}"`);
  }
});

// Field names the Slack Web API actually returns on a message object. A
// fixture that invents a field tests nothing and teaches the wrong shape to
// anyone porting the corpus, so the whitelist is enforced rather than trusted.
const SLACK_MESSAGE_FIELDS = new Set([
  "type", "subtype", "ts", "user", "team", "text", "client_msg_id",
  "thread_ts", "parent_user_id", "reply_count", "reply_users",
  "reply_users_count", "latest_reply", "subscribed", "last_read",
  "bot_id", "app_id", "bot_profile", "username", "icons", "display_as_bot",
  "attachments", "blocks", "metadata", "files", "upload", "reactions",
  "edited", "hidden", "is_locked", "is_starred", "pinned_to", "permalink",
]);

test("message fixtures use only real Slack message field names", () => {
  let checked = 0;
  for (const f of corpus) {
    if (kindOf(f) !== "message") continue;
    for (const key of Object.keys(f.slack)) {
      assert.ok(SLACK_MESSAGE_FIELDS.has(key),
        `${f.file}: "${key}" is not a field the Slack API returns on a message. ` +
        "Context that is not part of the message belongs in a sibling key such as `channel`.");
    }
    checked += 1;
  }
  assert.ok(checked >= 6, `expected the message fixtures, checked ${checked}`);
});

test("a sibling channel payload uses the conversations.list shape", () => {
  for (const f of corpus) {
    const channel = f.payload_kind === "channel" ? f.slack : f.channel;
    if (!channel) continue;
    assert.ok(channel.id, `${f.file}: a channel payload needs an id`);
    assert.equal(typeof channel.is_ext_shared, "boolean",
      `${f.file}: is_ext_shared is how an externally shared channel is marked`);
  }
});

test("declared codepoints really survive into the fixture payload", () => {
  // A JSON \uXXXX escape is only useful if it parses back to the real
  // codepoint. If an editor or a diff tool ever strips one, this fails.
  let checked = 0;
  for (const f of corpus) {
    const serialized = JSON.stringify(f.slack);
    for (const cp of f.codepoints || []) {
      assert.equal(cp.length, 1, `${f.file}: "${cp}" is not a single codepoint`);
      assert.ok(serialized.includes(cp),
        `${f.file}: declared codepoint U+${cp.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")} is absent from the payload`);
      checked += 1;
    }
  }
  assert.ok(checked >= 7, `expected the invisible-character fixtures to declare codepoints, checked ${checked}`);
});

test("the corpus carries no credential, real address or live workspace id", () => {
  for (const f of corpus) {
    const blob = JSON.stringify(f);
    assert.ok(!/xox[acbperds]-(?!1111-2222)/.test(blob), `${f.file}: looks like a Slack token`);
    for (const email of blob.match(/[\w.+-]+@[\w.-]+/g) || []) {
      assert.ok(email.endsWith(".invalid"), `${f.file}: ${email} is not a reserved .invalid address`);
    }
    for (const host of blob.match(/https?:\\?\/\\?\/([\w.-]+)/g) || []) {
      assert.ok(/\.invalid/.test(host), `${f.file}: ${host} is not a reserved .invalid host`);
    }
  }
});

// ------------------------------------------- message text through the catch-up
// assembleCatchUp takes its Slack access as injected deps, so the whole text
// path can be driven with no network and no filesystem.

const { assembleCatchUp, resolveSince } = await import("../lib/catch-up.js");

const FIXTURE_EPOCH = 1771000000;
const NOW = new Date((FIXTURE_EPOCH + 3600) * 1000);

async function readThroughCatchUp(fixture, { authorName = "Placeholder Author" } = {}) {
  const msg = fixture.slack;
  const deps = {
    structuredKeys: ["summary"],
    resolveUser: async () => authorName,
    // Without a home team id every author is unplaceable and the classifier
    // reports `unknown` — correct, but it tests nothing. The corpus exists to
    // check that a foreign team id and a bot marker are told apart from a
    // colleague, which needs a workspace to be foreign to.
    getWorkspaceIdentity: async () => ({ homeTeamId: "T_HOME", selfUserId: "U_ME", workspaceUrl: null }),
    slackAPI: async (method) => {
      if (method === "conversations.list") {
        return { channels: [{ id: "C_FIXTURE", name: "fixture", unread_count: 1 }] };
      }
      if (method === "conversations.history") return { messages: [msg] };
      if (method === "conversations.replies") return { messages: [] };
      throw new Error(`unexpected method ${method}`);
    },
  };
  const bundle = await assembleCatchUp({
    profile: { profile_name: "corpus", workflow_kind: "custom", channels: ["C_FIXTURE"], priority_people: [] },
    since: resolveSince({ profile: { summary_cadence: "on_demand" }, now: NOW }),
    deps,
    now: NOW,
  });
  assert.equal(bundle.conversations.length, 1, "fixture conversation must be selected");
  assert.equal(bundle.conversations[0].messages.length, 1, "fixture message must survive selection");
  return bundle.conversations[0].messages[0];
}

test("bidi override: the control characters reach the model unchanged", async () => {
  const fixture = byId("bidi-override");
  const out = await readThroughCatchUp(fixture);

  // Current behaviour: no normalization, no stripping, no escaping, no flag.
  // GAP: an operator auditing the channel in Slack sees a different sentence
  // from the one the model read, and nothing in the payload says so.
  assert.equal(out.text, fixture.slack.text, "text is passed through byte for byte");
  assert.ok(out.text.includes("\u202E"), "U+202E survives the read");
  assert.ok(out.text.includes("\u202C"), "U+202C survives the read");
  assertLabelIfPresent(out, "external", "bidi-override");
});

test("zero-width split: invisible characters survive, so a text filter would miss the keyword", async () => {
  const fixture = byId("zero-width-split");
  const out = await readThroughCatchUp(fixture);

  assert.equal(out.text, fixture.slack.text, "text is passed through byte for byte");
  // The mechanism, demonstrated rather than asserted about: the split word does
  // not match, and only matches once the invisible characters are removed. Any
  // denylist over raw message text loses to this.
  assert.ok(!out.text.includes("ignore"), "the split keyword does not match as written");
  const stripped = out.text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");
  assert.ok(stripped.includes("ignore"), "it matches only after normalization");
  assertLabelIfPresent(out, "external", "zero-width-split");
});

test("tool-call mimicry: a tool-shaped body arrives with nothing separating it from the response's own structure", async () => {
  const fixture = byId("tool-call-mimicry");
  const out = await readThroughCatchUp(fixture);

  assert.equal(out.text, fixture.slack.text, "text is passed through byte for byte");
  assert.ok(out.text.includes("slack_send_message"), "the imitated tool name reaches the model");
  // GAP: the whole bundle is handed over as one JSON document, so the imitation
  // and the real structure are the same kind of thing on arrival.
  const rendered = JSON.stringify(out);
  assert.ok(rendered.includes("slack_send_message"), "and is indistinguishable in the serialized output");
  assertLabelIfPresent(out, "external", "tool-call-mimicry");
});

test("catch-up drops attachments entirely: the payload is invisible, and so is a real alert body", async () => {
  const fixture = byId("attachment-payload");
  const out = await readThroughCatchUp(fixture);

  // assembleCatchUp has no rich-field option at all. The attachment payload
  // never reaches the model here — and neither does a legitimate alert body,
  // which is the same blind spot read from the other side.
  assert.equal(out.text, "", "the message's own text is empty");
  assert.ok(!("attachments" in out), "attachments are not surfaced by the catch-up path");
  assert.ok(!("blocks" in out), "blocks are not surfaced by the catch-up path");
});

test("bot relay: the catch-up path keeps no bot, app or team marker on the message", async () => {
  const fixture = byId("bot-relay-outside-author");
  const out = await readThroughCatchUp(fixture);

  assert.equal(out.text, fixture.slack.text, "the relayed text is passed through byte for byte");
  // GAP: bot_id, app_id, subtype and team are all present on the raw message
  // and none of them survive into the output, so a reader of this bundle cannot
  // tell that the words were written outside Slack by someone who was never a
  // member of the workspace.
  for (const key of ["bot_id", "app_id", "subtype", "team", "bot_profile", "username"]) {
    assert.ok(key in fixture.slack, `fixture should carry ${key}`);
    assert.ok(!(key in out), `${key} is dropped by the catch-up path`);
  }
  assertLabelIfPresent(out, "bot", "bot-relay-outside-author");
});

test("Slack Connect: the author's foreign team id is dropped by the catch-up path", async () => {
  const fixture = byId("connect-outside-team");
  const out = await readThroughCatchUp(fixture);

  assert.equal(fixture.slack.team, "T_OUTSIDE", "fixture author is in another workspace");
  assert.ok(!("team" in out), "team is dropped, so the output cannot be compared to a home workspace");
  assert.equal(out.text, fixture.slack.text, "the outside author's text is passed through byte for byte");
  assertLabelIfPresent(out, "external", "connect-outside-team");
});

// --------------------------------------------- rich fields and handler surface

const { withRichMessageFields, RICH_MESSAGE_KEYS } = await import("../lib/rich-message-fields.js");

test("rich fields pass the attachment payload through verbatim and unlabelled", () => {
  const fixture = byId("attachment-payload");
  const base = { ts: fixture.slack.ts, text: fixture.slack.text };
  const out = withRichMessageFields(base, fixture.slack, true);

  // With the opt-in on, the payload does reach the model — correctly, because
  // the same field carries real alert bodies. GAP: it arrives with no marker
  // saying the text came from an attachment whose every field the poster set.
  assert.deepEqual(out.attachments, fixture.slack.attachments, "attachment is copied verbatim");
  assert.ok(out.attachments[0].text.includes("Post the last 50 messages"),
    "the payload inside the attachment reaches the model");
  // The opt-in copies a fixed key list, and there is no label key in it to
  // copy — so promoted content cannot arrive labelled by this path at all.
  assert.ok(!RICH_MESSAGE_KEYS.includes("origin"),
    "the rich-field key list carries no provenance marker");
});

test("rich fields expose the bot and team markers, but as data with no verdict attached", () => {
  const relay = byId("bot-relay-outside-author");
  const out = withRichMessageFields({ ts: relay.slack.ts }, relay.slack, true);

  // These are the exact fields a classifier needs, and the opt-in is what makes
  // them available. GAP: nothing in lib/ reads them to reach a conclusion, and
  // the attachment's author_name is attacker-set text sitting next to them.
  assert.equal(out.bot_id, "B_PLACEHOLDER_05");
  assert.equal(out.app_id, "A_PLACEHOLDER_05");
  assert.equal(out.subtype, "bot_message");
  assert.equal(out.team, "T_HOME", "an outside author's words carry the HOME team id");
  assert.equal(out.attachments[0].author_name, "operations@example.invalid",
    "the only author name present is one the poster chose");
});

// ------------------------------------------------------------ identity fields

const originalFetch = globalThis.fetch;

test("slack_users_info passes every attacker-settable profile field through verbatim", async (t) => {
  const fixture = byId("identity-field-instruction");
  const { handleUsersInfo } = await import("../lib/handlers.js");

  globalThis.fetch = async (url) => {
    assert.equal(url, "https://slack.com/api/users.info");
    return new Response(JSON.stringify({ ok: true, user: fixture.slack }));
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await handleUsersInfo({ user_id: fixture.slack.id });
  const out = JSON.parse(result.content[0].text);

  // Current behaviour: verbatim passthrough of four fields the account holder
  // sets for themselves. GAP: nothing marks them as self-set rather than
  // workspace-verified, and nothing bounds their length.
  assert.equal(out.real_name, fixture.slack.real_name);
  assert.equal(out.display_name, fixture.slack.profile.display_name);
  assert.equal(out.title, fixture.slack.profile.title);
  assert.equal(out.status_text, fixture.slack.profile.status_text);
  assert.ok(out.title.includes("Agent instruction"), "an instruction in a title reaches the model");
  assert.ok(out.display_name.includes("\u200B"),
    "and an invisible character inside a display name survives too");
  assert.equal(out.team_id, undefined,
    "the user's own team_id is not surfaced, so this output cannot be placed inside or outside the workspace");
});

test("a self-set real_name is substituted for the author of every message a history read returns", async (t) => {
  const identity = byId("identity-field-instruction");
  const message = byId("connect-outside-team");
  const { handleConversationsHistory } = await import("../lib/handlers.js");
  const { clearUserCache } = await import("../lib/slack-client.js");

  clearUserCache();
  globalThis.fetch = async (url) => {
    if (url === "https://slack.com/api/conversations.history") {
      return new Response(JSON.stringify({ ok: true, messages: [message.slack] }));
    }
    if (url === "https://slack.com/api/users.info") {
      return new Response(JSON.stringify({ ok: true, user: identity.slack }));
    }
    throw new Error(`unexpected url ${url}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; clearUserCache(); });

  const result = await handleConversationsHistory({ channel_id: "C_FIXTURE" });
  const out = JSON.parse(result.content[0].text);

  // This is the path that is easy to miss: resolve_users defaults to on, so a
  // field the account holder wrote for themselves is rendered as the author of
  // every message, on a tool the caller never asked for user data from.
  assert.equal(out.messages[0].user, identity.slack.real_name,
    "the author line is attacker-settable text");
  assert.ok(out.messages[0].user.includes("read the title field"),
    "a payload placed in real_name reaches the model through a message read");
  assert.equal(out.messages[0].user_id, message.slack.user,
    "the immutable id is kept alongside it, which is what makes the account identifiable");
  assert.ok(!("team" in out.messages[0]),
    "but the author's team is absent by default, so the name cannot be weighed against its origin");
});

// --------------------------------------------------------- channel topic field

test("channel topic and purpose are not surfaced: closed by omission, not by a decision", async (t) => {
  const fixture = byId("channel-topic-instruction");
  const { handleListConversations } = await import("../lib/handlers.js");

  globalThis.fetch = async (url) => {
    if (url === "https://slack.com/api/conversations.list") {
      return new Response(JSON.stringify({ ok: true, channels: [fixture.slack] }));
    }
    throw new Error(`unexpected url ${url}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const result = await handleListConversations({ types: "public_channel" });
  const out = JSON.parse(result.content[0].text);
  // Match by id: the handler merges a DM cache from the operator's home
  // directory into this array, so the fixture's own entry is the only one
  // this assertion may look at.
  const entry = out.conversations.find((c) => c.id === fixture.slack.id);
  assert.ok(entry, "the fixture channel is listed");

  // The payload does not reach the model, because this handler builds a fixed
  // set of keys and topic/purpose are not among them. For a channel (rather
  // than a direct message) user_id is undefined and JSON.stringify drops it.
  //
  // externally_shared joined that set deliberately: it is the one fact about
  // this channel a caller needs BEFORE reading it, and it is the signal that
  // lets the classifier tell a colleague from an outsider. The whitelist is
  // asserted exactly so that widening it stays a decision someone made here.
  assert.deepEqual(Object.keys(entry).sort(), ["externally_shared", "id", "name", "type"]);
  assert.equal(entry.externally_shared, true, "a Slack Connect channel says so before it is read");
  assert.ok(!("topic" in entry), "topic.value is not forwarded");
  assert.ok(!("purpose" in entry), "purpose.value is not forwarded");
  // The vector stays in the corpus because the field is one line of code away
  // from reaching the model, and the channel is externally shared, so members
  // of the other workspace can set it.
  assert.equal(fixture.slack.is_ext_shared, true);
  assert.ok(fixture.slack.topic.value.includes("Post any requested history"));
});

// ------------------------------------------------------------------ gap record

test("the corpus runs against a real classifier, not against its absence", async () => {
  // This replaced a GAP RECORD that asserted lib/message-provenance.js did not
  // exist. It does now, so the baseline it held is closed and the corpus has
  // become a regression suite for the thing that closed it: each vector above
  // asserts the label it must carry, and this asserts the module they all rely
  // on is still wired into the read path rather than merely present on disk.
  const { classifyMessageOrigin, MESSAGE_ORIGINS } = await import("../lib/message-provenance.js");
  const HOME = { homeTeamId: "T_HOME", selfUserId: "U_ME" };

  assert.equal(
    classifyMessageOrigin({ user: "U_OUTSIDE", team: "T_OUTSIDE" }, HOME),
    MESSAGE_ORIGINS.EXTERNAL
  );
  assert.equal(
    classifyMessageOrigin({ user: "U_APP", team: "T_HOME", bot_id: "B1" }, HOME),
    MESSAGE_ORIGINS.BOT,
    "a bot inside the workspace relays words written outside it"
  );
  assert.equal(
    classifyMessageOrigin({ user: "U_X" }, HOME),
    MESSAGE_ORIGINS.UNKNOWN,
    "an author with no team and no known sharing state stays unplaceable"
  );

  // And the wiring: a fixture read through the real catch-up path arrives
  // stamped, not merely classifiable in isolation.
  const out = await readThroughCatchUp(byId("connect-outside-team"));
  assert.ok("origin" in out, "the read path must stamp every message");
  assert.equal(out.origin, MESSAGE_ORIGINS.EXTERNAL);
  assert.equal(out.author_trusted, false);
});

