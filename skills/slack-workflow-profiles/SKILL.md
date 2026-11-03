---
name: slack-workflow-profiles
description: Set up a saved Slack catch-up profile by choosing its workflow_kind, channels, priority people and cadence, so slack_catch_me_up returns evidence shaped for an incident room, a support inbox, an exec brief or a launch watch. Use when the user wants a repeatable catch-up or a handoff routine, or asks which channels and people to track.
metadata:
  requires-tools: slack_workflow_save slack_workflows slack_catch_me_up
---

# Workflow profiles

A profile is a saved scope for `slack_catch_me_up`. It records which channels
to read, whose messages count most, how far back to look, and which output keys
the catch-up asks for. Profiles are stored on this machine in
`~/.slack-mcp-workflows.json`. Saving one sends nothing to Slack.

## Choose the kind

The kind decides which keys `slack_catch_me_up` asks you to write.

| `workflow_kind` | Use it for | Keys the catch-up asks for |
|---|---|---|
| `incident_room` | an incident channel, an on-call handoff | `incident_summary`, `timeline`, `open_risks`, `owner_gaps`, `next_actions` |
| `support_inbox` | customer or internal support queues | `open_threads`, `ack_lag`, `owner_gaps`, `escalations`, `next_actions` |
| `exec_brief` | a leadership digest across several channels | `summary`, `decisions`, `risks`, `asks`, `action_items` |
| `product_launch_watch` | a launch, a release cycle, a feedback stream | `launch_signals`, `feedback_themes`, `blockers`, `metrics`, `next_actions` |
| `custom` | anything else | `summary`, `highlights`, `open_questions`, `next_actions` |

## Build it

1. Ask what the catch-up is for and who reads it, then pick the kind.
2. Channels: call `slack_list_conversations` and use channel IDs. Names also
   match when the catch-up runs, but IDs survive a rename. If you leave
   `channels` empty, every catch-up reads whatever is unread at that moment.
3. Priority people: call `slack_users_search` with a name or email and put the
   user IDs in `priority_people`. Their messages and their mentions get their
   own lists in the catch-up.
4. `summary_cadence` sets the default look-back: 24 hours for `on_demand` and
   `daily_8am`, 7 days for `weekly_monday`. It schedules nothing. Something
   still has to call `slack_catch_me_up`.
5. `retention_mode` (`ephemeral` by default, or `persistent`) is recorded on
   the profile. This server does not act on it.
6. Call `slack_workflow_save` with `profile_name`, `workflow_kind` and the
   fields above. Saving an existing `profile_name` updates that profile.
   Confirm the result with `slack_workflows`, then run `slack_catch_me_up`
   once so the user sees what the profile returns.

## Start from a template

The package ships six templates, applied from a terminal rather than through a
tool call:

```bash
npx -y @jtalk22/slack-mcp --apply-template oncall-handoff --channels C012345,C067890 --priority-people U0PRIME
```

| Template | Kind | Cadence |
|---|---|---|
| `incident-room` | `incident_room` | `on_demand` |
| `oncall-handoff` | `incident_room` | `on_demand` |
| `support-triage` | `support_inbox` | `daily_8am` |
| `exec-monday` | `exec_brief` | `weekly_monday` |
| `customer-feedback` | `product_launch_watch` | `daily_8am` |
| `sprint-tracker` | `product_launch_watch` | `daily_8am` |
