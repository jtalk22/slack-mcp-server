# Slack MCP Server
# Deterministic image build from repository source for release-tag parity.
#
# Usage:
#   docker build -t slack-mcp-server .
#   docker run -e SLACK_TOKEN=xoxc-... -e SLACK_COOKIE=xoxd-... slack-mcp-server --version

FROM node:22-alpine

# OCI Image Labels for registry discoverability
LABEL maintainer="jtalk22"
LABEL org.opencontainers.image.title="Slack MCP Server"
LABEL org.opencontainers.image.description="Full Slack access for Claude - DMs, channels, search. No OAuth. No admin approval. Just works."
LABEL org.opencontainers.image.source="https://github.com/jtalk22/slack-mcp-server"
LABEL org.opencontainers.image.url="https://github.com/jtalk22/slack-mcp-server"
LABEL org.opencontainers.image.documentation="https://github.com/jtalk22/slack-mcp-server#readme"
LABEL org.opencontainers.image.vendor="jtalk22"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.authors="jtalk22"

WORKDIR /app

# Install production dependencies for the exact checked-out source
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy runtime sources
COPY src ./src
COPY lib ./lib
COPY scripts ./scripts
COPY public ./public
COPY docs ./docs
COPY server.json ./server.json
COPY smithery.yaml ./smithery.yaml
COPY README.md ./README.md
COPY LICENSE ./LICENSE

# Environment variables for Slack auth
ENV SLACK_TOKEN=""
ENV SLACK_COOKIE=""
ENV NODE_ENV="production"

# MCP servers communicate via stdio
ENTRYPOINT ["node", "src/cli.js"]
