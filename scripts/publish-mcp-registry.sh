#!/usr/bin/env bash
set -euo pipefail

SERVER_JSON_PATH="${1:-server.json}"
MODE="${2:-publish}"
PUBLISHER_BIN="${MCP_PUBLISHER_BIN:-mcp-publisher}"

if ! command -v "${PUBLISHER_BIN}" >/dev/null 2>&1; then
  cat >&2 <<'EOF'
mcp-publisher was not found in PATH.

Install the official binary from:
https://github.com/modelcontextprotocol/registry/releases/latest

Then re-run:
  MCP_PUBLISHER_BIN=/path/to/mcp-publisher bash scripts/publish-mcp-registry.sh
EOF
  exit 1
fi

echo "Validating ${SERVER_JSON_PATH} with ${PUBLISHER_BIN}..."
"${PUBLISHER_BIN}" validate "${SERVER_JSON_PATH}"

if [[ "${MODE}" == "--validate-only" ]]; then
  echo "Validation-only mode enabled. Skipping registry publish."
  exit 0
fi

cat <<'EOF'
Publishing to MCP Registry.
If you are not logged in yet, run one of:
  mcp-publisher login github
  mcp-publisher login dns --domain <domain> --private-key <key>
  mcp-publisher login http --domain <domain> --private-key <key>
EOF

"${PUBLISHER_BIN}" publish "${SERVER_JSON_PATH}"
