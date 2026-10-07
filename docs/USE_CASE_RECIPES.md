# Use Case Recipes

Copy and paste any prompt into your MCP client. Each recipe maps to existing tools and parameters.

## 1) Fast Health Check

Prompt:
`Run slack_health_check and tell me if my workspace connection is valid.`

## 2) Token Age and Cache Snapshot

Prompt:
`Run slack_token_status and summarize token age, health, and cache stats.`

## 3) List Recent DMs

Prompt:
`Use slack_list_conversations with types="im,mpim" and limit=50. Return names and IDs.`

## 4) Summarize a Channel for the Last 3 Days

Prompt:
`Use slack_conversations_history with channel_id="<CHANNEL_ID>", oldest="<UNIX_TS_3_DAYS_AGO>", limit=100, resolve_users=true, then summarize decisions and action items.`

## 5) Pull a Full Thread

Prompt:
`Use slack_get_thread with channel_id="<CHANNEL_ID>" and thread_ts="<THREAD_TS>". Summarize timeline and owners.`

## 6) Search for Decisions

Prompt:
`Use slack_search_messages with query="decision OR approved after:2026-01-01" and count=50. Group results by channel.`

## 7) Find Messages from One Person

Prompt:
`Use slack_search_messages with query="from:@<USERNAME> after:2026-01-01" and count=30. Return top themes.`

## 8) Export Conversation History

Prompt:
`Use slack_get_full_conversation with channel_id="<CHANNEL_ID>", max_messages=2000, include_threads=true, output_file="q1-export.json".`

## 9) Lookup a User Profile

Prompt:
`Use slack_users_info with user_id="<USER_ID>" and return role, timezone, and status fields.`

## 10) Send a Channel Update

Prompt:
`Use slack_send_message with channel_id="<CHANNEL_ID>" and text="Daily update: build passed, deploy at 4 PM ET."`

## 11) Reply in a Thread

Prompt:
`Use slack_send_message with channel_id="<CHANNEL_ID>", thread_ts="<THREAD_TS>", text="Acknowledged. I will post follow-up logs in 30 minutes."`

## 12) Directory Snapshot

Prompt:
`Use slack_list_users with limit=500. Return a compact list of users with admin/bot flags.`

## 13) Keep Your Own Record Before the 90-Day Window Closes

Prompt:
`Use slack_list_conversations with types="im,mpim,private_channel" and limit=200 to list every DM, group DM, and private channel I belong to. Then for each one, call slack_get_full_conversation with that channel_id, include_threads=true, include_rich_message_fields=true, max_messages=10000, and output_file="<conversation-name>.json".`

Exports land in `~/.slack-mcp-exports/`. Run it on a schedule — monthly is
frequent enough against a 90-day window — so each run captures what the next
one would otherwise lose.

**Why this is the only practical route on a free workspace.** Slack's own export
covers "messages and file links from public channels". It is available on every
plan, and it is run by Workspace Owners and Admins. Private channels and direct
messages need a Business+ or Enterprise plan and a separate application to
Slack. An ordinary member of a free workspace therefore has no first-party way
to export their own DMs or private channels at all.
`slack_get_full_conversation` reads them through your own session, which already
has access to exactly those conversations and no others.

**What ages out.** On the free plan you "can view and search messages and files
from the last 90 days", and Slack "will start hiding messages and files older
than 90 days to make room for new ones". Hidden is not deleted: "when you
upgrade, your messages and files beyond the 90-day limit will be revealed." For
the first year, then, this is a loss of access rather than of data. After that it
is both — since August 26, 2024, data older than one year may be deleted on a
rolling basis from workspaces on the free plan.

**The honest limit.** This cannot recover anything already past the window.
Slack hides that history from the workspace, not merely from one client, so
there is nothing for the API to return across that span and no parameter that
reaches behind it — setting `oldest` earlier than the boundary does not help.
The recipe only works forward: it preserves what you can still read, starting
from the first time you run it.

Sources, read 2026-10-07: [Usage limits for free
workspaces](https://slack.com/help/articles/115002422943-Usage-limits-for-free-workspaces),
[Feature limitations on the free version of
Slack](https://slack.com/help/articles/27204752526611-Feature-limitations-on-the-free-version-of-Slack),
[Export your workspace
data](https://slack.com/help/articles/201658943-Export-your-workspace-data).

## Notes

For a repeatable morning brief, save a workflow with `slack_workflow_save`
(`profile_name="morning"`, `workflow_kind="exec_brief"`, and your channel IDs),
then ask: `Run slack_catch_me_up with profile_name="morning". Write a concise
brief from its evidence and link the messages behind each decision or blocker.`
List existing profiles with `slack_workflows`.

- Replace placeholders before running (`<CHANNEL_ID>`, `<THREAD_TS>`, `<USER_ID>`, `<USERNAME>`, timestamps).
- Timestamp parameters are Unix seconds in string form.
- For large workspaces, start with smaller limits, then expand.
