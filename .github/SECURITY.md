# Security Policy

## Important Security Notes

This project uses Slack browser session tokens (`xoxc-` and `xoxd-`) which provide full access to your Slack workspace. Please understand the security implications:

### Token Security

- **Never share your tokens** - They provide the same access as your Slack login
- **Tokens are stored locally** with restricted permissions (`chmod 600`)
- **macOS Keychain** provides encrypted storage when available
- **Keychain-only mode** (`SLACK_MCP_TOKEN_STORAGE=keychain-only`, macOS) stores credentials exclusively in the Keychain: no plaintext token file is written, an existing one is migrated in and removed only after both entries verify, and Keychain writes fail loudly rather than falling back to plaintext. Every failure in this mode is loud by design — an unremovable plaintext file reports `plaintext_removal_failed` with the manual cleanup command, and `slack_token_status` flags the file as `plaintext_file_present` until it is actually gone
- **Token lifetime is worth measuring, not assuming.** This project used to state 1-2 weeks. The two halves differ — the `d` cookie is long-lived, the `xoxc` token is the volatile one — and on one real workspace a credential written on 2026-07-04 still authenticated 94 days later. Treat that as an existence proof, not a guarantee: yours may rotate sooner. `slack_token_status` reports the age of what you actually hold. A credential that lasts months is a longer exposure window, not a shorter one, which is the argument for keychain-only storage and for `--read-only` where writes are not needed

### Local Security

- The web server binds to `localhost` only by default
- API keys are required for web server access
- Never expose the web server to the public internet

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :white_check_mark: |
| < 5.0   | :x:                |

Fixes land on the current minor. Older lines are not backported; upgrading is the supported path.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Use either private channel:
   - GitHub private vulnerability reporting: <https://github.com/jtalk22/slack-mcp-server/security/advisories/new>
   - Email <support@revasserlabs.com>, the address this project already designates for privacy and credential-sensitive concerns
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in the security advisory (if desired)

## Security Best Practices

When using this project:

1. **Keep tokens private** - Never commit them to version control
2. **Use token auto-refresh** - Limits exposure of stale tokens
3. **Monitor access** - Check Slack's "Access Logs" periodically
4. **Limit scope** - Only use in trusted environments
5. **Keep updated** - Install security updates promptly

## Disclosure Policy

We follow responsible disclosure:

1. Reporter notifies maintainer privately
2. Maintainer confirms and assesses severity
3. Fix is developed and tested
4. Security advisory is published with fix
5. Reporter is credited (if desired)

## What the provenance control does, and what it does not

Every message this server returns becomes text in a model's context, beside the operator's own instructions, and the same toolset that reads also writes. Each message is stamped with an `origin` (`self`, `internal`, `external`, `bot`, `unknown`) and `author_trusted`, derived from fields Slack already returns. The classifier fails closed: an author it cannot positively place inside the workspace is reported untrusted.

The limits, stated because a control that oversells itself is worse than none:

- **A label is advice to the calling model.** It is unsigned, it can be stripped by anything downstream, and it raises the cost of an injected instruction without making one impossible.
- **The `strict` hold does not prove human approval.** It refuses `slack_send_message` once the session has read outside-authored text, but the release flag `confirm_untrusted_context` is set by the caller. It interrupts the send and puts it on the record; it cannot verify that anyone was asked.
- **Two surfaces reach the model unlabelled.** User display names, real names, titles and status text from `slack_users_info`, `slack_list_users` and `slack_users_search`, and channel topics and purposes from `slack_list_conversations`, are attacker-settable free text carrying no origin stamp. A Slack Connect guest chooses their own display name.
- **An exported file leaves this server's control.** `slack_get_full_conversation` with `output_file` writes raw message text to `~/.slack-mcp-exports/`, which anything else on the machine can read.
- **`--read-only` is the only guarantee that does not depend on the model.** With `--read-only` or `SLACK_MCP_READ_ONLY=1` the write tools are never registered and are refused at dispatch. An absent tool needs no trust.
- **`slack_session_report`** returns counts of what this process did — messages read, how many were outside-authored and by which origin, writes attempted, writes held — so the claim can be checked after the fact rather than taken on faith.

## Known Limitations

- This project accesses Slack's Web API using browser session credentials
- Tokens may be invalidated by Slack at any time
- Token access scope matches the user's existing Slack access
- Not affiliated with or endorsed by Slack Technologies
