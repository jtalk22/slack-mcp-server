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

## Notes

For a repeatable morning brief, save a workflow with `slack_workflow_save`
(`profile_name="morning"`, `workflow_kind="exec_brief"`, and your channel IDs),
then ask: `Run slack_catch_me_up with profile_name="morning". Write a concise
brief from its evidence and link the messages behind each decision or blocker.`
List existing profiles with `slack_workflows`.

- Replace placeholders before running (`<CHANNEL_ID>`, `<THREAD_TS>`, `<USER_ID>`, `<USERNAME>`, timestamps).
- Timestamp parameters are Unix seconds in string form.
- For large workspaces, start with smaller limits, then expand.
