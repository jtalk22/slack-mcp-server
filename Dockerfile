# Slack MCP Server
# Docker image for running slack-mcp-server in containers
#
# Usage:
#   docker build -t slack-mcp-server .
#   docker run -e SLACK_TOKEN=xoxc-... -e SLACK_COOKIE=xoxd-... slack-mcp-server
#
# Or mount a token file:
#   docker run -v ~/.slack-mcp-tokens.json:/root/.slack-mcp-tokens.json slack-mcp-server

FROM node:18-alpine

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

# Install from npm (production only)
RUN npm install -g @jtalk22/slack-mcp

# Environment variables for Slack auth
# Get these from your browser - see README for instructions
ENV SLACK_TOKEN=""
ENV SLACK_COOKIE=""

# MCP servers communicate via stdio
ENTRYPOINT ["slack-mcp-server"]
