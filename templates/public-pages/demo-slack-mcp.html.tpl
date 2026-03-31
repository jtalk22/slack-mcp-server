<!--
  Slack MCP Server - Claude Desktop Demo
  Author: @jtalk22
  Repository: https://github.com/jtalk22/slack-mcp-server
  License: MIT
  Created: January 2026
-->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="@jtalk22">
  <title>Slack MCP Server — Claude Desktop Demo</title>
  <meta name="description" content="No OAuth. No admin. {{SELF_HOSTED_TOOL_COUNT}} Slack tools for any MCP client. Works with Claude, Cursor, Copilot, Gemini. One command setup.">

  <!-- Open Graph -->
  <meta property="og:title" content="Slack MCP Server — No OAuth, no admin, just your browser session">
  <meta property="og:description" content="Slack's official MCP needs OAuth + admin approval. This one uses your browser session. {{SELF_HOSTED_TOOL_COUNT}} tools, works with Claude, Cursor, Copilot, Gemini.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{{GITHUB_PAGES_ROOT}}/public/demo-slack-mcp.html">
  <meta property="og:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Slack MCP Server — No OAuth, no admin, just your browser session">
  <meta name="twitter:description" content="{{SELF_HOSTED_TOOL_COUNT}} tools for Claude, Cursor, Copilot, Gemini. npx -y @jtalk22/slack-mcp --setup">
  <meta name="twitter:image" content="{{SOCIAL_IMAGE_URL}}">

  <!-- Theme -->
  <meta name="theme-color" content="#1a1a1a">
  <link rel="icon" href="../docs/assets/icon-512.png" type="image/png">
  <style>
    /* Self-hosted fonts — no CDN, instant load */
    @font-face {
      font-family: "Space Grotesk";
      font-style: normal;
      font-weight: 500 700;
      font-display: swap;
      src: url("../public/fonts/space-grotesk-500.woff2") format("woff2");
    }
    @font-face {
      font-family: "IBM Plex Sans";
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url("../public/fonts/ibm-plex-sans-400.woff2") format("woff2");
    }
    @font-face {
      font-family: "IBM Plex Sans";
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url("../public/fonts/ibm-plex-sans-500.woff2") format("woff2");
    }
    @font-face {
      font-family: "IBM Plex Sans";
      font-style: normal;
      font-weight: 600;
      font-display: swap;
      src: url("../public/fonts/ibm-plex-sans-600.woff2") format("woff2");
    }

    /* ═══════════════════════════════════════════════════════════════
       Claude Desktop Color Palette (Dark Mode)
       ═══════════════════════════════════════════════════════════════ */
    :root {
      --font-heading: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
      --font-body: "IBM Plex Sans", "Inter", "Segoe UI", sans-serif;
      --font-mono: "SF Mono", "Menlo", "Monaco", monospace;

      /* Window chrome */
      --window-bg: #1a1a1a;
      --window-chrome: #2d2d2d;
      --window-border: #3a3a3a;
      --traffic-red: #ff5f57;
      --traffic-yellow: #febc2e;
      --traffic-green: #28c840;

      /* Messages */
      --user-bubble-bg: #3b3b3b;
      --claude-bubble-bg: #2a2a2a;
      --claude-orange: #da7756;

      /* Tool calls */
      --tool-box-bg: #1f1f1f;
      --tool-box-border: #3a3a3a;
      --tool-header-bg: #252525;
      --tool-name-color: #a0a0a0;

      /* Text */
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --text-muted: #666666;

      /* Accents */
      --link-color: #6eb5ff;
      --code-bg: #2d2d2d;
      --code-text: #e6e6e6;
      --success-color: #28c840;
      --warning-color: #febc2e;

      /* Brand DNA (subliminal) */
      --text-warm: #E8E4DF;

      /* Shadows */
      --shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

      /* Z-index scale */
      --z-caption: 50;
      --z-dropdown: 100;
      --z-modal: 200;
    }

    /* ═══════════════════════════════════════════════════════════════
       Typography (SF Pro / System)
       ═══════════════════════════════════════════════════════════════ */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-body);
      font-size: 15px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: var(--text-primary);
    }

    .mono {
      font-family: var(--font-mono);
    }

    /* ═══════════════════════════════════════════════════════════════
       Page Header
       ═══════════════════════════════════════════════════════════════ */
    .page-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-family: var(--font-heading);
      letter-spacing: -0.02em;
    }

    .page-header p {
      color: var(--text-secondary);
      font-size: 16px;
    }
    .cta-strip {
      width: 100%;
      max-width: 960px;
      margin-bottom: 14px;
      background: rgba(15, 52, 96, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 13px;
    }
    .cta-strip .links {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cta-strip .links a {
      color: #d8efff;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 999px;
      padding: 4px 8px;
    }
    .cta-strip .links a:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cta-strip .note {
      color: rgba(255, 255, 255, 0.78);
    }
    .cta-strip .note a {
      color: #9ee7ff;
      text-decoration: underline;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(218, 119, 86, 0.2);
      color: var(--claude-orange);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    /* ═══════════════════════════════════════════════════════════════
       Scenario Selector
       ═══════════════════════════════════════════════════════════════ */
    .scenario-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      justify-content: center;
      width: min(100%, 960px);
    }

    .scenario-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      font-weight: 500;
    }

    .scenario-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
      transform: translateY(-2px);
    }

    .scenario-btn.active {
      background: rgba(218, 119, 86, 0.2);
      border-color: var(--claude-orange);
      color: var(--claude-orange);
    }

    .scenario-btn.playing {
      animation: pulse-border 1.5s ease-in-out infinite;
    }

    @keyframes pulse-border {
      0%, 100% { box-shadow: 0 0 0 0 rgba(218, 119, 86, 0.4); }
      50% { box-shadow: 0 0 0 4px rgba(218, 119, 86, 0); }
    }

    .scenario-btn .icon {
      font-size: 18px;
    }

    .replay-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: rgba(110, 181, 255, 0.1);
      border: 1px solid rgba(110, 181, 255, 0.3);
      border-radius: 12px;
      color: var(--link-color);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
      font-weight: 500;
    }

    .replay-btn:hover {
      background: rgba(110, 181, 255, 0.2);
      transform: translateY(-2px);
    }

    .replay-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .controls-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
      width: min(100%, 920px);
    }

    .speed-control {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      font-size: 12px;
    }

    .speed-control select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: var(--text-secondary);
      padding: 6px 10px;
      font-size: 12px;
      cursor: pointer;
    }

    .speed-control select:focus {
      outline: none;
      border-color: var(--link-color);
    }

    .progress-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
      font-size: 12px;
    }

    .progress-bar {
      width: 80px;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--success-color);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .share-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      font-weight: 500;
    }

    .share-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
    }

    .share-btn.copied {
      background: rgba(40, 200, 64, 0.15);
      border-color: var(--success-color);
      color: var(--success-color);
    }

    .share-btn .share-icon {
      font-size: 14px;
    }

    /* ═══════════════════════════════════════════════════════════════
       Claude Desktop Window Frame
       ═══════════════════════════════════════════════════════════════ */
    .claude-window {
      width: 100%;
      max-width: 800px;
      background: var(--window-bg);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      border: 1px solid var(--window-border);
      position: relative;
    }

    .window-chrome {
      height: 52px;
      background: var(--window-chrome);
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid var(--window-border);
    }

    .traffic-lights {
      display: flex;
      gap: 8px;
    }

    .traffic-light {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .traffic-light.red { background: var(--traffic-red); }
    .traffic-light.yellow { background: var(--traffic-yellow); }
    .traffic-light.green { background: var(--traffic-green); }

    .window-title {
      flex: 1;
      text-align: center;
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .window-controls {
      width: 52px;
    }

    /* ═══════════════════════════════════════════════════════════════
       Chat Container
       ═══════════════════════════════════════════════════════════════ */
    .chat-container {
      height: 520px;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scroll-behavior: smooth;
    }

    /* Loading Skeleton */
    .loading-skeleton {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .skeleton-message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .skeleton-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(90deg, var(--window-border) 25%, #4a4a4a 50%, var(--window-border) 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
    }

    .skeleton-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skeleton-line {
      height: 16px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--window-border) 25%, #4a4a4a 50%, var(--window-border) 75%);
      background-size: 200% 100%;
      animation: skeleton-shimmer 1.5s infinite;
    }

    @keyframes skeleton-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .chat-container::-webkit-scrollbar {
      width: 8px;
    }

    .chat-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-container::-webkit-scrollbar-thumb {
      background: var(--window-border);
      border-radius: 4px;
    }

    /* ═══════════════════════════════════════════════════════════════
       Message Bubbles
       ═══════════════════════════════════════════════════════════════ */
    .message {
      max-width: 100%;
      animation: message-appear 0.3s ease-out;
    }

    @keyframes message-appear {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .message-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .message.user .message-avatar {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      font-weight: 600;
      font-size: 12px;
    }

    .message.claude .message-avatar {
      background: linear-gradient(135deg, var(--claude-orange) 0%, #c56644 100%);
      color: white;
      font-weight: 600;
      font-size: 12px;
    }

    .message.claude .message-avatar svg {
      width: 16px;
      height: 16px;
    }

    .message-sender {
      font-weight: 600;
      font-size: 14px;
    }

    .message.user .message-sender { color: #a5b4fc; }
    .message.claude .message-sender { color: var(--claude-orange); }

    .message-time {
      color: var(--text-muted);
      font-size: 12px;
    }

    .message-content {
      padding: 16px;
      border-radius: 12px;
      font-size: 15px;
      line-height: 1.6;
    }

    .message.user .message-content {
      background: var(--user-bubble-bg);
    }

    .message.claude .message-content {
      background: var(--claude-bubble-bg);
    }

    /* ═══════════════════════════════════════════════════════════════
       Tool Call Box
       ═══════════════════════════════════════════════════════════════ */
    .tool-call {
      background: var(--tool-box-bg);
      border: 1px solid var(--tool-box-border);
      border-radius: 8px;
      margin: 12px 0;
      overflow: hidden;
    }

    .tool-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: var(--tool-header-bg);
      cursor: pointer;
      transition: background 0.2s;
    }

    .tool-header:hover {
      background: #2a2a2a;
    }

    .tool-icon {
      font-size: 16px;
    }

    .tool-name {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--link-color);
      font-weight: 500;
    }

    .tool-status {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .tool-status.running {
      color: var(--warning-color);
    }

    .tool-status.running::before {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--warning-color);
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tool-status.success {
      color: var(--success-color);
    }

    .tool-chevron {
      color: var(--text-muted);
      transition: transform 0.3s ease;
      font-size: 12px;
    }

    .tool-call.expanded .tool-chevron {
      transform: rotate(180deg);
    }

    .tool-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }

    .tool-call.expanded .tool-body {
      max-height: 400px;
    }

    .tool-call.expanded {
      border-left: 3px solid var(--claude-orange);
    }

    .tool-section {
      padding: 12px 16px;
      border-top: 1px solid var(--tool-box-border);
    }

    .tool-section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .tool-params {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--code-text);
      background: var(--code-bg);
      padding: 12px;
      border-radius: 6px;
      white-space: pre-wrap;
    }

    .tool-result {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .tool-result .result-item {
      padding: 8px 12px;
      margin: 0 -12px;
      border-bottom: 1px solid var(--tool-box-border);
      border-left: 2px solid transparent;
      border-radius: 4px;
      transition: all 0.15s ease;
      cursor: default;
    }

    .tool-result .result-item:hover {
      background: rgba(255, 255, 255, 0.03);
      border-left-color: var(--claude-orange);
    }

    .tool-result .result-item:last-child {
      border-bottom: none;
    }

    .result-channel {
      color: var(--link-color);
      font-weight: 500;
    }

    .result-user {
      color: #f0abfc;
      font-weight: 500;
    }

    .result-time {
      color: var(--text-muted);
      font-size: 12px;
    }

    /* ═══════════════════════════════════════════════════════════════
       Typing Indicator
       ═══════════════════════════════════════════════════════════════ */
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--claude-bubble-bg);
      border-radius: 12px;
      width: fit-content;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      background: var(--text-muted);
      border-radius: 50%;
      animation: typing-bounce 1.4s ease-in-out infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.16s; }
    .typing-dot:nth-child(3) { animation-delay: 0.32s; }

    @keyframes typing-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-4px); opacity: 1; }
    }

    .typing-cursor {
      display: inline-block;
      width: 2px;
      height: 1em;
      background: var(--claude-orange);
      margin-left: 1px;
      animation: cursor-blink 0.8s ease-in-out infinite;
      vertical-align: text-bottom;
    }

    @keyframes cursor-blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    /* ═══════════════════════════════════════════════════════════════
       Input Bar
       ═══════════════════════════════════════════════════════════════ */
    .input-bar {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: var(--window-chrome);
      border-top: 1px solid var(--window-border);
      gap: 12px;
    }

    .input-field {
      flex: 1;
      background: var(--window-bg);
      border: 1px solid var(--window-border);
      border-radius: 24px;
      padding: 12px 20px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .tools-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      background: rgba(218, 119, 86, 0.15);
      border: 1px solid rgba(218, 119, 86, 0.3);
      border-radius: 20px;
      color: var(--claude-orange);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      font-weight: 500;
      position: relative;
    }

    .tools-button:hover {
      background: rgba(218, 119, 86, 0.25);
    }

    .tools-button .icon {
      font-size: 16px;
    }

    /* ═══════════════════════════════════════════════════════════════
       Tools Dropdown
       ═══════════════════════════════════════════════════════════════ */
    .tools-dropdown {
      position: absolute;
      bottom: calc(100% + 8px);
      right: 0;
      width: 320px;
      background: var(--window-bg);
      border: 1px solid var(--window-border);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.2s ease;
      z-index: var(--z-dropdown);
    }

    .tools-button:hover .tools-dropdown,
    .tools-dropdown:hover {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--window-border);
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dropdown-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 10px 16px;
      border-bottom: 1px solid var(--tool-box-border);
      cursor: default;
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .dropdown-item-name {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--link-color);
      margin-bottom: 2px;
    }

    .dropdown-item-desc {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* ═══════════════════════════════════════════════════════════════
       Code Inline
       ═══════════════════════════════════════════════════════════════ */
    code {
      font-family: var(--font-mono);
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 13px;
    }

    strong {
      font-weight: 600;
    }

    em {
      font-style: italic;
      color: var(--text-secondary);
    }

    /* ═══════════════════════════════════════════════════════════════
       Footer
       ═══════════════════════════════════════════════════════════════ */
    .page-footer {
      margin-top: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }

    .page-footer a {
      color: var(--link-color);
      text-decoration: none;
    }

    .page-footer a:hover {
      text-decoration: underline;
    }

    kbd {
      display: inline-block;
      padding: 2px 6px;
      font-family: var(--font-mono);
      font-size: 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: var(--text-secondary);
    }

    /* Fullscreen / Presentation Mode */
    body.fullscreen-mode {
      padding: 0;
      justify-content: center;
    }

    body.fullscreen-mode .page-header,
    body.fullscreen-mode .scenario-bar,
    body.fullscreen-mode .controls-bar,
    body.fullscreen-mode .page-footer {
      display: none !important;
    }

    body.fullscreen-mode .cta-strip {
      display: none !important;
    }

    body.fullscreen-mode .claude-window {
      max-width: 100%;
      height: 100vh;
      border-radius: 0;
      border: none;
    }

    body.fullscreen-mode .chat-container {
      height: calc(100vh - 52px - 68px);
    }

    .fullscreen-hint {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: var(--text-secondary);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }

    body.fullscreen-mode .fullscreen-hint {
      opacity: 1;
    }

    /* ═══════════════════════════════════════════════════════════════
       Accessibility
       ═══════════════════════════════════════════════════════════════ */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    .scenario-btn:focus-visible,
    .replay-btn:focus-visible,
    .tools-button:focus-visible,
    .speed-control select:focus-visible {
      outline: 2px solid var(--link-color);
      outline-offset: 2px;
    }

    .tool-header:focus-visible {
      outline: 2px solid var(--link-color);
      outline-offset: -2px;
    }

    /* ═══════════════════════════════════════════════════════════════
       Responsive
       ═══════════════════════════════════════════════════════════════ */
    @media (max-width: 900px) {
      body {
        padding: 14px;
      }

      .page-header {
        margin-bottom: 16px;
      }

      .page-header h1 {
        font-size: 24px;
      }

      .scenario-btn {
        padding: 10px 14px;
      }

      .controls-bar {
        gap: 10px;
      }

      .claude-window {
        max-width: 100%;
      }
    }

    @media (max-width: 600px) {
      body {
        padding: 12px;
      }

      .cta-strip {
        padding: 10px;
        gap: 8px;
      }

      .cta-strip .links {
        width: 100%;
      }

      .cta-strip .note {
        font-size: 12px;
      }

      .page-header h1 {
        font-size: 22px;
        flex-wrap: wrap;
        gap: 8px;
      }

      .page-header p {
        font-size: 14px;
      }

      .scenario-bar {
        gap: 8px;
        margin-bottom: 14px;
      }

      .scenario-btn {
        padding: 9px 12px;
        font-size: 13px;
        border-radius: 10px;
      }

      .scenario-btn .label {
        display: none;
      }

      .controls-bar {
        gap: 8px;
        margin-bottom: 12px;
      }

      .replay-btn,
      .share-btn {
        padding: 8px 12px;
      }

      .speed-control {
        width: 100%;
        justify-content: space-between;
      }

      .chat-container {
        height: min(55vh, 450px);
        padding: 14px;
      }

      .tools-dropdown {
        width: 280px;
        right: auto;
        left: 50%;
        transform: translateX(-50%) translateY(0);
      }

      .tools-button:hover .tools-dropdown,
      .tools-dropdown:hover {
        transform: translateX(-50%) translateY(0);
      }

      .scenario-caption {
        top: 56px;
        font-size: 12px;
        padding: 7px 14px;
      }
    }

    /* ═══════════════════════════════════════════════════════════════
       Production Polish - Title, Captions, Transitions, Closing
       ═══════════════════════════════════════════════════════════════ */

    /* Title Card */
    .title-card {
      position: absolute;
      inset: 0;
      top: 32px; /* Below window chrome */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--window-bg);
      z-index: var(--z-modal);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.5s ease, visibility 0s linear 0.5s;
      will-change: opacity;
    }

    .title-card.visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity 0.5s ease, visibility 0s linear 0s;
    }

    .title-card h1 {
      color: var(--text-warm);
      letter-spacing: 0.08em;
      font-weight: 300;
      font-size: 28px;
      margin: 16px 0 8px;
    }

    .title-card .title-logo { width: 56px; height: 56px; border-radius: 12px; }
    .title-card .title-tagline { color: var(--text-secondary); font-size: 16px; }
    .title-card .title-version { color: var(--text-muted); font-size: 13px; margin-top: 24px; }

    /* Staggered reveal — each line fades in with a beat */
    .title-card .title-line {
      opacity: 0;
      transform: translateY(6px);
    }
    .title-card.visible .title-line {
      animation: titleReveal 0.5s ease forwards;
    }
    .title-card.visible .title-line:nth-child(1) { animation-delay: 0.2s; }  /* logo */
    .title-card.visible .title-line:nth-child(2) { animation-delay: 0.5s; }  /* Monday 9:07 */
    .title-card.visible .title-line:nth-child(3) { animation-delay: 1.1s; }  /* 47 unreads... */
    .title-card.visible .title-line:nth-child(4) { animation-delay: 2.0s; }  /* What if... */
    .title-card.visible .title-line:nth-child(5) { animation-delay: 2.8s; }  /* Slack MCP Server */

    @keyframes titleReveal {
      to { opacity: 1; transform: translateY(0); }
    }

    /* Scenario Caption Overlay */
    .scenario-caption {
      position: absolute;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: var(--text-primary);
      padding: 10px 24px;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.01em;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: var(--z-caption);
      pointer-events: none;
      max-width: calc(100% - 24px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .scenario-caption.visible {
      opacity: 1;
    }

    /* Smooth Transitions */
    .chat-container {
      transition: opacity 0.3s ease;
    }

    .chat-container.fading {
      opacity: 0;
    }

    /* Closing Card */
    .closing-card {
      position: absolute;
      inset: 0;
      top: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--window-bg);
      z-index: var(--z-modal);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity 0.5s ease, visibility 0s linear 0.5s;
      will-change: opacity;
    }

    .closing-card.visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition: opacity 0.5s ease, visibility 0s linear 0s;
    }

    .closing-check { font-size: 48px; margin-bottom: 16px; }

    .closing-card h2 {
      color: var(--text-warm);
      font-weight: 400;
      font-size: 24px;
      margin-bottom: 8px;
    }

    .closing-cta {
      color: var(--text-secondary);
      margin: 8px 0 24px;
      font-size: 15px;
    }

    .closing-links code {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-family: "SF Mono", "Menlo", monospace;
    }

    .closing-github {
      margin-top: 24px;
      color: var(--link-color);
      font-size: 14px;
    }

    /* ê Easter Egg - The Rêvasser Wink */
    .easter-egg {
      position: absolute;
      bottom: 16px;
      right: 20px;
      color: var(--text-warm);
      opacity: 0.15;
      font-size: 14px;
      font-weight: 300;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
    }

    .closing-card.visible .easter-egg {
      animation: egg-wink 8s ease 2s forwards;
    }

    @keyframes egg-wink {
      0%, 100% { opacity: 0.15; }
      10% { opacity: 0.35; }
      20% { opacity: 0.15; }
    }
  </style>
</head>
<body>
  <div class="cta-strip">
    <div class="links">
{{DEMO_LINKS}}
    </div>
    <div class="note">
      {{DEMO_NOTE}}
    </div>
  </div>
  <header class="page-header">
    <h1>
      <span>Slack MCP Server</span>
      <span class="badge">🔧 MCP Demo</span>
    </h1>
    <p>Watch an AI handle your Monday morning Slack without ever opening it</p>
  </header>

  <div class="scenario-bar" role="tablist" aria-label="Demo scenarios">
    <button class="scenario-btn active" data-scenario="triage" onclick="runScenario('triage')" role="tab" aria-selected="true" aria-label="Morning triage scenario">
      <span class="icon" aria-hidden="true">🔔</span>
      <span class="label">Catch Up</span>
    </button>
    <button class="scenario-btn" data-scenario="search" onclick="runScenario('search')" role="tab" aria-selected="false" aria-label="Search messages scenario">
      <span class="icon" aria-hidden="true">🔍</span>
      <span class="label">Find</span>
    </button>
    <button class="scenario-btn" data-scenario="thread" onclick="runScenario('thread')" role="tab" aria-selected="false" aria-label="Thread decisions scenario">
      <span class="icon" aria-hidden="true">🧵</span>
      <span class="label">Decisions</span>
    </button>
    <button class="scenario-btn" data-scenario="respond" onclick="runScenario('respond')" role="tab" aria-selected="false" aria-label="Read and respond scenario">
      <span class="icon" aria-hidden="true">↩️</span>
      <span class="label">Respond</span>
    </button>
    <button class="scenario-btn" data-scenario="people" onclick="runScenario('people')" role="tab" aria-selected="false" aria-label="People lookup scenario">
      <span class="icon" aria-hidden="true">👤</span>
      <span class="label">Who?</span>
    </button>
    <button class="scenario-btn" data-scenario="react" onclick="runScenario('react')" role="tab" aria-selected="false" aria-label="Quick actions scenario">
      <span class="icon" aria-hidden="true">⚡</span>
      <span class="label">Quick Act</span>
    </button>
    <button class="scenario-btn" data-scenario="export" onclick="runScenario('export')" role="tab" aria-selected="false" aria-label="Export conversation scenario">
      <span class="icon" aria-hidden="true">📦</span>
      <span class="label">Export</span>
    </button>
  </div>

  <div class="controls-bar" role="toolbar" aria-label="Demo controls">
    <button class="replay-btn" id="replayBtn" onclick="replayScenario()" aria-label="Replay current scenario">
      <span aria-hidden="true">↻</span>
      <span>Replay</span>
    </button>
    <button class="replay-btn" id="autoPlayBtn" onclick="autoPlayAll()" style="background: rgba(40, 200, 64, 0.1); border-color: rgba(40, 200, 64, 0.3); color: var(--success-color);" aria-label="Auto-play all scenarios">
      <span aria-hidden="true">▶</span>
      <span>Auto-Play All</span>
    </button>
    <div class="speed-control">
      <label>Speed:</label>
      <select id="speedSelect" onchange="updateSpeed(this.value)">
        <option value="0.5">0.5x (Slow - Video)</option>
        <option value="1" selected>1x (Normal)</option>
        <option value="1.5">1.5x (Fast)</option>
        <option value="2">2x</option>
      </select>
    </div>
    <div class="progress-indicator" id="progressIndicator" style="display: none;">
      <span class="progress-text"></span>
      <div class="progress-bar"><div class="progress-fill"></div></div>
    </div>
    <button class="share-btn" onclick="copyShareLink()" aria-label="Copy link to share">
      <span class="share-icon">🔗</span>
      <span class="share-text">Share</span>
    </button>
  </div>

  <div class="claude-window">
    <div class="window-chrome">
      <div class="traffic-lights">
        <div class="traffic-light red"></div>
        <div class="traffic-light yellow"></div>
        <div class="traffic-light green"></div>
      </div>
      <div class="window-title">Claude</div>
      <div class="window-controls"></div>
    </div>

    <!-- Title Card (auto-play only) — staggered reveal -->
    <div class="title-card" id="titleCard">
      <div class="title-line" style="margin-bottom: 20px;">
        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzRBMTU0QiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzRDExNDAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgoKICA8IS0tIEJhY2tncm91bmQgcm91bmRlZCBzcXVhcmUgLS0+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHJ4PSI5NiIgcnk9Ijk2IiBmaWxsPSJ1cmwoI2JnKSIvPgoKICA8IS0tIFN0eWxpemVkIGhhc2h0YWcvY2hhbm5lbCBzeW1ib2wgLS0+CiAgPGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjM2IiBzdHJva2UtbGluZWNhcD0icm91bmQiPgogICAgPCEtLSBWZXJ0aWNhbCBsaW5lcyAtLT4KICAgIDxsaW5lIHgxPSIxODAiIHkxPSIxNDAiIHgyPSIxNjAiIHkyPSIzNzIiLz4KICAgIDxsaW5lIHgxPSIzNTIiIHkxPSIxNDAiIHgyPSIzMzIiIHkyPSIzNzIiLz4KICAgIDwhLS0gSG9yaXpvbnRhbCBsaW5lcyAtLT4KICAgIDxsaW5lIHgxPSIxMjAiIHkxPSIyMDAiIHgyPSIzOTIiIHkyPSIyMDAiLz4KICAgIDxsaW5lIHgxPSIxMjAiIHkxPSIzMTIiIHgyPSIzOTIiIHkyPSIzMTIiLz4KICA8L2c+CgogIDwhLS0gU2xhY2stY29sb3JlZCBjb25uZWN0aW9uIGRvdHMgKHJlcHJlc2VudGluZyBNQ1AgYnJpZGdlKSAtLT4KICA8Y2lyY2xlIGN4PSI0MjAiIGN5PSI5MiIgcj0iMjgiIGZpbGw9IiMzNkM1RjAiLz4KICA8Y2lyY2xlIGN4PSI5MiIgY3k9IjQyMCIgcj0iMjgiIGZpbGw9IiMyRUI2N0QiLz4KICA8Y2lyY2xlIGN4PSI0MjAiIGN5PSI0MjAiIHI9IjI4IiBmaWxsPSIjRUNCMjJFIi8+CiAgPGNpcmNsZSBjeD0iOTIiIGN5PSI5MiIgcj0iMjgiIGZpbGw9IiNFMDFFNUEiLz4KPC9zdmc+Cg==" alt="" style="width: 44px; height: 44px; border-radius: 10px;">
      </div>
      <h1 class="title-line" style="font-size: 30px; margin-bottom: 12px; letter-spacing: -0.01em;">It's Monday, 9:07 AM.</h1>
      <p class="title-line" style="font-size: 18px; color: var(--text-secondary); line-height: 1.6;">47 unreads. A database outage.<br>A jammed printer. Nobody knows the PIN.</p>
      <p class="title-line" style="margin-top: 24px; font-size: 16px; color: var(--claude-orange); font-weight: 500;">What if your AI could read your Slack?</p>
      <p class="title-line title-version" style="margin-top: 16px; font-size: 12px; color: var(--text-muted);">Slack MCP Server · No OAuth · One command</p>
    </div>

    <!-- Scenario Caption Overlay -->
    <div class="scenario-caption" id="scenarioCaption"></div>

    <!-- Closing Card (auto-play only) -->
    <div class="closing-card" id="closingCard">
      <div class="closing-check" style="font-size: 56px; font-weight: 700; font-family: var(--font-heading); letter-spacing: -0.03em; margin-bottom: 4px; color: var(--text-warm);">0 unreads.</div>
      <h2 style="font-size: 22px; font-weight: 400; margin-bottom: 16px;">You never opened Slack.</h2>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 28px;">The printer PIN is 4729.</p>
      <div class="closing-links">
        <code>npx -y @jtalk22/slack-mcp --setup</code>
      </div>
      <p style="color: var(--text-muted); font-size: 13px; margin-top: 14px;">Claude · Cursor · Copilot · Gemini · Windsurf</p>
      <p class="closing-github">github.com/jtalk22/slack-mcp-server</p>
      <span class="easter-egg">ê</span>
    </div>

    <div class="chat-container" id="chatContainer" role="log" aria-label="Chat demonstration" aria-live="polite">
      <!-- Loading skeleton shown before first scenario -->
      <div class="loading-skeleton" id="loadingSkeleton">
        <div class="skeleton-message">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line" style="width: 60%"></div>
            <div class="skeleton-line" style="width: 80%"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-bar">
      <div class="input-field">Message Claude...</div>
      <div class="tools-button">
        <span class="icon">🔨</span>
        <span>16 tools</span>
        <div class="tools-dropdown">
          <div class="dropdown-header">
            <span>🔨</span> Available Slack Tools
          </div>
          <div class="dropdown-list">
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_search_messages</div>
              <div class="dropdown-item-desc">Search across your workspace</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_list_conversations</div>
              <div class="dropdown-item-desc">List DMs and channels</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_conversations_history</div>
              <div class="dropdown-item-desc">Get messages from a conversation</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_get_thread</div>
              <div class="dropdown-item-desc">Get all replies in a thread</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_send_message</div>
              <div class="dropdown-item-desc">Send a message to any channel</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_get_full_conversation</div>
              <div class="dropdown-item-desc">Export full history with threads</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_users_info</div>
              <div class="dropdown-item-desc">Get user details</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_list_users</div>
              <div class="dropdown-item-desc">List workspace users</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_conversations_unreads</div>
              <div class="dropdown-item-desc">Get channels with unread messages</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_add_reaction</div>
              <div class="dropdown-item-desc">Add emoji reaction to a message</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_conversations_mark</div>
              <div class="dropdown-item-desc">Mark conversation as read</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_users_search</div>
              <div class="dropdown-item-desc">Search users by name or email</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_remove_reaction</div>
              <div class="dropdown-item-desc">Remove emoji reaction</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_health_check</div>
              <div class="dropdown-item-desc">Verify token validity</div>
            </div>
            <div class="dropdown-item">
              <div class="dropdown-item-name">slack_token_status</div>
              <div class="dropdown-item-desc">Check token health</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="fullscreen-hint">Press <kbd>F</kbd> or <kbd>Esc</kbd> to exit</div>

  <footer class="page-footer">
    <p>
      Made by <a href="https://github.com/jtalk22" target="_blank">@jtalk22</a> ·
      <a href="https://github.com/jtalk22/slack-mcp-server" target="_blank">GitHub</a> ·
      <a href="https://www.npmjs.com/package/@jtalk22/slack-mcp" target="_blank">npm</a> ·
      <a href="demo.html">Web UI Demo</a>
    </p>
    <p style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
      Keyboard: <kbd>1-7</kbd> scenarios · <kbd>R</kbd> replay · <kbd>A</kbd> auto-play · <kbd>F</kbd> fullscreen · <kbd>Esc</kbd> exit
    </p>
    <p style="margin-top: 12px; font-size: 11px; color: var(--text-muted);">
      © 2026 Revasser · MIT License
    </p>
  </footer>

  <script>
    // ═══════════════════════════════════════════════════════════════
    // Scenario Data
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // "Monday, 9:07 AM" — A connected narrative
    // Each scenario builds on the last. The incident from #1 comes
    // back in #4. The person from #5 reacted in #2. By the end,
    // 47 unreads → 0, and you never opened Slack.
    // ═══════════════════════════════════════════════════════════════
    const scenarios = {
      triage: {
        userMessage: "I just opened my laptop — what blew up overnight?",
        claudeIntro: "Let me check your unread channels and DMs.",
        isMultiTool: true,
        toolCalls: [
          {
            name: "slack_conversations_unreads",
            params: {
              types: "im,public_channel,private_channel",
              limit: 20
            },
            result: {
              total_unread_conversations: 4,
              conversations: [
                { id: "C04INCIDENTS", name: "#incidents", type: "public_channel", unread_count: 23 },
                { id: "C04ENGINEER9", name: "#engineering", type: "public_channel", unread_count: 14 },
                { id: "C04PRODUCTZ", name: "#product", type: "public_channel", unread_count: 8 },
                { id: "D04LENAPARK", name: "DM from Lena Park", type: "dm", unread_count: 2 }
              ]
            }
          },
          {
            name: "slack_conversations_history",
            params: {
              channel_id: "C04INCIDENTS",
              limit: 6
            },
            result: [
              { channel: "#incidents", user: "PagerDuty Bot", time: "2:14 AM", text: "🔴 P1 ALERT: RDS connection pool exhausted — primary database unreachable" },
              { channel: "#incidents", user: "Kai Nakamura", time: "2:22 AM", text: "I'm on it. Pulling up the runbook now" },
              { channel: "#incidents", user: "Kai Nakamura", time: "2:31 AM", text: "Following the runbook... ok step 4 is straight up lying to me. The automatic failover is a myth. Going manual." },
              { channel: "#incidents", user: "Kai Nakamura", time: "3:47 AM", text: "✅ Resolved. Manually promoted the read replica. All services recovering." },
              { channel: "#incidents", user: "Lena Park", time: "7:12 AM", text: "Nice work Kai. Post-mortem this afternoon. Also the 3rd floor printer is jammed again and nobody knows the admin PIN — IT shared it in #facilities like 5 months ago but who reads that channel. Someone please find it and tape it to the printer." }
            ]
          }
        ],
        claudeSummary: "Here's your Monday morning:\n\n🔴 <strong>P1 database outage at 2:14 AM</strong> — RDS connection pool exhausted. Kai resolved it at 3:47 AM with a manual failover. He described the runbook's automatic failover step as \"a myth.\" At 3am. Love that energy.\n\n<strong>4 channels, 47 unreads:</strong>\n• #incidents (23) — the P1 above\n• #engineering (14) — Postgres 17 migration thread\n• #product (8) — sprint planning\n• DM from Lena Park (2) — your CTO, probably about the incident\n\nYour CTO is waiting — I'd start there. She's also on a mission to find the 3rd floor printer admin PIN. IT posted it in #facilities five months ago. She says \"who reads that channel.\" Valid question. Want me to find it?"
      },

      search: {
        userMessage: "Yeah find that printer PIN before I lose my mind. I'm standing here staring at it.",
        claudeIntro: "Searching your entire Slack history for a printer PIN. This is what I'm here for.",
        toolCall: {
          name: "slack_search_messages",
          params: {
            query: "printer admin PIN 3rd floor",
            count: 10
          },
          result: [
            { channel: "#facilities", user: "Dave Chen (IT)", time: "Oct 12", text: "For anyone who needs it — the admin PIN for the 3rd floor printer is 4729. Go to Menu → Admin Settings → enter PIN to clear jams. Posting here so nobody has to ask again." },
            { channel: "#random", user: "Marcus Webb", time: "2 weeks ago", text: "does anyone know the admin PIN for the printer on 3? it's jammed again and I'm just staring at it" },
            { channel: "#general", user: "Priya Sharma", time: "3 months ago", text: "the 3rd floor printer is jammed. I tried turning it off and on. I am not proud of what I said to it." }
          ]
        },
        claudeSummary: "<strong>Incident resolved.</strong> The PIN is <strong>4729</strong>.\n\nDave from IT posted it in #facilities on October 12th: Menu → Admin Settings → enter PIN. He even wrote \"posting here so nobody has to ask again.\"\n\nThat message had <strong>zero reactions</strong>. Nobody read it. Marcus asked the exact same question in #random two weeks ago and was met with silence. Priya attempted a power cycle three months ago and described the experience as humbling.\n\nFive months. Three people. Same printer. The answer was there the whole time.\n\nTape it to the printer."
      },

      thread: {
        userMessage: "What was decided about the Postgres 17 migration in #engineering?",
        claudeIntro: "Let me pull that thread and summarize it.",
        toolCall: {
          name: "slack_get_thread",
          params: {
            channel_id: "C04ENGINEER9",
            thread_ts: "1711728000.294817"
          },
          result: [
            { user: "Priya Sharma", time: "Yesterday, 2:15 PM", text: "OK — Postgres 17 benchmarks are in. 23% faster on our query patterns. I may have audibly gasped." },
            { user: "Kai Nakamura", time: "Yesterday, 2:28 PM", text: "The jsonb changes break our audit logger though. Maybe 2 days to fix. I can take it." },
            { user: "Lena Park", time: "Yesterday, 3:00 PM", text: "What's the rollback story if something breaks in prod?" },
            { user: "Priya Sharma", time: "Yesterday, 3:15 PM", text: "pg_upgrade supports rollback to 16 within 24hrs. After that we'd need dump/restore. So we'd know fast." },
            { user: "Alex Torres", time: "Yesterday, 3:45 PM", text: "New here but — should we run it in staging for a sprint first? Asking because I don't want my first week to be a post-mortem 😅" },
            { user: "Priya Sharma", time: "Yesterday, 4:30 PM", text: "Ha, fair point Alex. Revised plan: Kai fixes audit logger this sprint, staging + QA next sprint, cutover in April. Objections speak now. 🔇" }
          ]
        },
        claudeSummary: "The team decided to <strong>migrate to Postgres 17 in April</strong>. Here's the plan:\n\n1. <strong>Kai</strong> fixes the audit logger compatibility (~2 days, this sprint)\n2. <strong>Full sprint of staging + QA</strong> before cutover — Alex Torres suggested this, two weeks into the job and already saving the team from themselves\n3. <strong>Rollback:</strong> pg_upgrade supports rollback to PG 16 within 24 hours\n4. <strong>Why bother:</strong> 23% faster on current query patterns (Priya \"audibly gasped\")\n\nNo objections. Migration is green-lit."
      },

      respond: {
        userMessage: "Reply to the incidents thread — pool needs bumping to 250, tag Kai",
        claudeIntro: "I'll read the thread for context, then post your update.",
        isMultiTool: true,
        toolCalls: [
          {
            name: "slack_get_thread",
            params: {
              channel_id: "C04INCIDENTS",
              thread_ts: "1711843200.183746"
            },
            result: [
              { user: "PagerDuty Bot", time: "2:14 AM", text: "🔴 P1 ALERT: RDS connection pool exhausted" },
              { user: "Kai Nakamura", time: "2:22 AM", text: "I'm on it." },
              { user: "Kai Nakamura", time: "3:47 AM", text: "✅ Resolved. Manually promoted the read replica." },
              { user: "Lena Park", time: "7:12 AM", text: "Nice work Kai. Post-mortem this afternoon." }
            ]
          },
          {
            name: "slack_send_message",
            params: {
              channel_id: "C04INCIDENTS",
              thread_ts: "1711843200.183746",
              text: "Reviewed the RDS logs. Root cause: pool was at 100, but the 2 AM batch job spikes to ~180 connections. Bumping to 250 with a hard cap at 300 — PR incoming.\n\n@Kai great catch on the manual failover. Runbook step 4 needs a rewrite, adding it to the post-mortem agenda."
            },
            result: {
              success: true,
              channel: "#incidents",
              timestamp: "1711872000.293847"
            }
          }
        ],
        claudeSummary: "Posted to the <strong>#incidents</strong> thread:\n\n<em>\"Reviewed the RDS logs. Root cause: pool was at 100, but the 2 AM batch job spikes to ~180 connections. Bumping to 250 with a hard cap at 300 — PR incoming. @Kai great catch on the manual failover. Runbook step 4 needs a rewrite, adding it to the post-mortem agenda.\"</em>\n\nKai and Lena will see it in the thread."
      },

      people: {
        userMessage: "Someone named Alex Torres reacted to my message in #engineering — who is that?",
        claudeIntro: "Let me look them up.",
        isMultiTool: true,
        toolCalls: [
          {
            name: "slack_users_search",
            params: {
              query: "Alex Torres",
              limit: 5
            },
            result: [
              { name: "Alex Torres", id: "U04XTORRES", lastMessage: "Backend Engineer", preview: "Started 2 weeks ago · PST" }
            ]
          },
          {
            name: "slack_users_info",
            params: {
              user_id: "U04XTORRES"
            },
            result: {
              id: "U04XTORRES",
              real_name: "Alex Torres",
              title: "Backend Engineer (started 2 weeks ago)",
              email: "alex.torres@acme-corp.com",
              status_text: "Onboarding — learning the codebase (send help)"
            }
          }
        ],
        claudeSummary: "That's <strong>Alex Torres</strong> — backend engineer, started <strong>2 weeks ago</strong>.\n\n• <strong>Status:</strong> \"Onboarding — learning the codebase (send help)\"\n• <strong>Timezone:</strong> PST (probably still asleep — unlike Kai, who was debugging at 3am while the rest of you dreamed of well-indexed queries)\n• <strong>Email:</strong> alex.torres@acme-corp.com\n\nThis is who suggested staging first in the Postgres 17 thread. Two weeks in and already the voice of reason. Worth a welcome DM."
      },

      react: {
        userMessage: "Checkmark Kai's resolution message and mark #incidents as read",
        claudeIntro: "On it.",
        isMultiTool: true,
        toolCalls: [
          {
            name: "slack_add_reaction",
            params: {
              channel_id: "C04INCIDENTS",
              timestamp: "1711847220.847293",
              reaction: "white_check_mark"
            },
            result: {
              status: "added",
              channel: "#incidents",
              timestamp: "1711847220.847293",
              reaction: "white_check_mark"
            }
          },
          {
            name: "slack_conversations_mark",
            params: {
              channel_id: "C04INCIDENTS",
              timestamp: "1711872000.293847"
            },
            result: {
              status: "marked",
              channel: "#incidents",
              read_up_to: "1711872000.293847"
            }
          }
        ],
        claudeSummary: "Done — ✅ on Kai's 3:47 AM resolution message, and <strong>#incidents marked as read</strong>.\n\nThat's 1 of 4 channels cleared. Still have #engineering (14), #product (8), and Lena's DM (2)."
      },

      export: {
        userMessage: "Export the last 24 hours of #incidents with all threads — need it for the post-mortem",
        claudeIntro: "I'll pull the full history with threads and save it.",
        toolCall: {
          name: "slack_get_full_conversation",
          params: {
            channel_id: "C04INCIDENTS",
            oldest: "1711756800",
            latest: "1711872000",
            include_threads: true,
            output_file: "incidents-postmortem-2026-03-30.json"
          },
          result: {
            total_messages: 47,
            threads_included: 3,
            thread_replies: 14,
            date_range: "Mar 29, 8:00 PM → Mar 30, 9:07 AM",
            saved_to: "~/.slack-mcp-exports/incidents-postmortem-2026-03-30.json"
          }
        },
        claudeSummary: "Exported <strong>47 messages</strong> and <strong>3 threads</strong> (14 replies) from #incidents.\n\n📁 Saved to: <code>~/.slack-mcp-exports/incidents-postmortem-2026-03-30.json</code>\n\nCovers the full incident: PagerDuty alert, Kai's 3am heroics, your RDS fix, and Lena asking someone to tape the printer PIN to the printer. All there.\n\n<em>47 unreads when you woke up. Zero now. You never opened Slack.</em>"
      }
    };

    // ═══════════════════════════════════════════════════════════════
    // Animation Helpers
    // ═══════════════════════════════════════════════════════════════
    let speedMultiplier = 1;
    let currentScenario = 'triage';

    const sleep = ms => new Promise(r => setTimeout(r, ms / speedMultiplier));

    function updateSpeed(value) {
      speedMultiplier = parseFloat(value);
    }

    function replayScenario() {
      runScenario(currentScenario);
    }

    async function typeText(element, text, speed = 25) {
      // Convert \n\n to proper line breaks for final display
      const formattedText = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

      // For short text or fast speed, just fade in
      if (speedMultiplier >= 1.5 || text.length < 20) {
        element.style.opacity = '0';
        element.innerHTML = formattedText;
        element.style.transition = 'opacity 0.3s ease-out';
        await sleep(50);
        element.style.opacity = '1';
        return;
      }

      // Parse HTML and type text content while preserving tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedText;
      const plainText = tempDiv.textContent;

      // Character-by-character typing with cursor
      element.innerHTML = '<span class="typing-cursor"></span>';
      const cursor = element.querySelector('.typing-cursor');
      const textSpan = document.createElement('span');
      element.insertBefore(textSpan, cursor);

      if (plainText.length > 150) {
        // Word-by-word for long text (summaries) — 3x faster, still animated
        const words = plainText.split(/(\s+)/);
        for (const word of words) {
          textSpan.textContent += word;
          if (word.trim()) await sleep(speed * 2.5);
        }
      } else {
        // Character-by-character for short text (intros)
        for (const char of plainText) {
          textSpan.textContent += char;
          await sleep(speed);
        }
      }

      // Replace with formatted HTML and remove cursor
      await sleep(100);
      element.innerHTML = formattedText;
    }

    // Claude's sparkle icon SVG
    const claudeIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z"/></svg>`;

    function createMessage(type, sender, time) {
      const msg = document.createElement('div');
      msg.className = `message ${type}`;
      const avatar = type === 'user' ? 'Y' : claudeIcon;
      msg.innerHTML = `
        <div class="message-header">
          <div class="message-avatar">${avatar}</div>
          <span class="message-sender">${sender}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-content"></div>
      `;
      return msg;
    }

    function createTypingIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'message claude';
      indicator.id = 'typingIndicator';
      indicator.innerHTML = `
        <div class="message-header">
          <div class="message-avatar">${claudeIcon}</div>
          <span class="message-sender">Claude</span>
        </div>
        <div class="typing-indicator">
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `;
      return indicator;
    }

    function createToolCall(tool, isRunning = true) {
      const toolEl = document.createElement('div');
      toolEl.className = 'tool-call';

      let resultHtml = '';
      if (Array.isArray(tool.result)) {
        resultHtml = tool.result.map(item => {
          if (item.channel) {
            return `<div class="result-item">
              <span class="result-channel">${item.channel}</span> ·
              <span class="result-user">${item.user}</span> ·
              <span class="result-time">${item.time}</span><br>
              <em>"${item.text}"</em>
            </div>`;
          } else if (item.name) {
            return `<div class="result-item">
              <span class="result-user">${item.name}</span> ·
              <span class="result-time">${item.lastMessage}</span><br>
              <em>"${item.preview}"</em>
            </div>`;
          } else {
            return `<div class="result-item">
              <span class="result-user">${item.user}</span> ·
              <span class="result-time">${item.time}</span><br>
              <em>"${item.text}"</em>
            </div>`;
          }
        }).join('');
      } else if (tool.result.success) {
        resultHtml = `<div class="result-item">
          ✅ Message sent to <span class="result-channel">${tool.result.channel}</span>
        </div>`;
      } else if (tool.result.status === 'added') {
        resultHtml = `<div class="result-item">
          ✅ Reaction :${tool.result.reaction}: added to message in <span class="result-channel">${tool.result.channel}</span>
        </div>`;
      } else if (tool.result.status === 'marked') {
        resultHtml = `<div class="result-item">
          ✅ <span class="result-channel">${tool.result.channel}</span> marked as read
        </div>`;
      } else if (tool.result.total_messages !== undefined) {
        resultHtml = `<div class="result-item">
          📦 <strong>${tool.result.total_messages} messages</strong> exported (${tool.result.threads_included} threads, ${tool.result.thread_replies} replies)<br>
          <span class="result-time">${tool.result.date_range}</span><br>
          <em>Saved to: <code>${tool.result.saved_to}</code></em>
        </div>`;
      } else if (tool.result.real_name) {
        resultHtml = `<div class="result-item">
          <span class="result-user">${tool.result.real_name}</span> · <span class="result-time">${tool.result.title}</span><br>
          ${tool.result.email}<br>
          <em>"${tool.result.status_text}"</em>
        </div>`;
      } else if (tool.result.total_unread_conversations !== undefined) {
        const typeLabel = t => ({ dm: 'DM', mpim: 'Group DM', public_channel: 'Channel', private_channel: 'Private' }[t] || t);
        resultHtml = `<div class="result-item" style="color:var(--text-muted);font-size:12px;padding-bottom:4px;">
            ${tool.result.total_unread_conversations} conversations with unreads
          </div>` + tool.result.conversations.map(c =>
          `<div class="result-item">
            <span class="result-channel">${c.name}</span> ·
            <span class="result-time">${typeLabel(c.type)}</span> ·
            <strong style="color:var(--warning-color)">${c.unread_count} unread</strong>
          </div>`
        ).join('');
      }

      const statusClass = isRunning ? 'running' : 'success';
      const statusText = isRunning ? 'Running...' : 'Complete';

      toolEl.innerHTML = `
        <div class="tool-header" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="tool-icon">🔧</span>
          <span class="tool-name">${tool.name}</span>
          <span class="tool-status ${statusClass}">${statusText}</span>
          <span class="tool-chevron">▼</span>
        </div>
        <div class="tool-body">
          <div class="tool-section">
            <div class="tool-section-label">Input</div>
            <div class="tool-params">${JSON.stringify(tool.params, null, 2)}</div>
          </div>
          <div class="tool-section">
            <div class="tool-section-label">Output</div>
            <div class="tool-result">${resultHtml}</div>
          </div>
        </div>
      `;
      return toolEl;
    }

    function updateToolStatus(toolEl, isComplete) {
      const statusEl = toolEl.querySelector('.tool-status');
      statusEl.className = `tool-status ${isComplete ? 'success' : 'running'}`;
      statusEl.textContent = isComplete ? 'Complete' : 'Running...';
    }

    // ═══════════════════════════════════════════════════════════════
    // Run Scenario
    // ═══════════════════════════════════════════════════════════════
    let isRunning = false;

    async function runScenario(scenarioId) {
      if (isRunning) return;
      isRunning = true;
      currentScenario = scenarioId;

      // Update button states
      const replayBtn = document.getElementById('replayBtn');
      if (replayBtn) replayBtn.disabled = true;

      document.querySelectorAll('.scenario-btn').forEach(btn => {
        const isActive = btn.dataset.scenario === scenarioId;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('playing', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      const container = document.getElementById('chatContainer');

      // Show scenario caption
      const captions = {
        triage: "🔔 What blew up overnight?",
        search: "🔍 Find the printer PIN",
        thread: "🧵 What was decided?",
        respond: "↩️ Post the fix",
        people: "👤 Who's the new person?",
        react: "⚡ Close the loops",
        export: "📦 Save for the post-mortem"
      };
      const caption = document.getElementById('scenarioCaption');
      caption.textContent = captions[scenarioId] || scenarioId;
      caption.classList.add('visible');
      setTimeout(() => caption.classList.remove('visible'), 2000);

      // Smooth transition: fade out, clear, fade in
      container.classList.add('fading');
      await sleep(300);
      container.innerHTML = '';
      container.classList.remove('fading');

      const scenario = scenarios[scenarioId];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      // 1. User message appears
      const userMsg = createMessage('user', 'You', timeStr);
      container.appendChild(userMsg);
      userMsg.querySelector('.message-content').textContent = scenario.userMessage;
      container.scrollTop = container.scrollHeight;

      await sleep(600);

      // 2. Claude starts typing
      const typing = createTypingIndicator();
      container.appendChild(typing);
      container.scrollTop = container.scrollHeight;

      await sleep(1200);

      // 3. Claude's intro
      typing.remove();
      const claudeMsg = createMessage('claude', 'Claude', timeStr);
      container.appendChild(claudeMsg);
      const contentEl = claudeMsg.querySelector('.message-content');
      await typeText(contentEl, scenario.claudeIntro);
      container.scrollTop = container.scrollHeight;

      await sleep(700);

      // 4. Tool call(s) - handle single or multi-tool scenarios
      if (scenario.isMultiTool && scenario.toolCalls) {
        // Multi-tool scenario
        for (let i = 0; i < scenario.toolCalls.length; i++) {
          const tool = scenario.toolCalls[i];
          const toolCall = createToolCall(tool, true);
          contentEl.appendChild(toolCall);
          container.scrollTop = container.scrollHeight;

          await sleep(400);
          toolCall.classList.add('expanded');
          container.scrollTop = container.scrollHeight;

          await sleep(1200);
          updateToolStatus(toolCall, true);
          container.scrollTop = container.scrollHeight;

          if (i < scenario.toolCalls.length - 1) {
            await sleep(600); // Pause between tools
          }
        }
      } else {
        // Single tool scenario
        const toolCall = createToolCall(scenario.toolCall, true);
        contentEl.appendChild(toolCall);
        container.scrollTop = container.scrollHeight;

        await sleep(400);
        toolCall.classList.add('expanded');
        container.scrollTop = container.scrollHeight;

        await sleep(1500);
        updateToolStatus(toolCall, true);
        container.scrollTop = container.scrollHeight;
      }

      await sleep(500);

      // 5. Claude's summary
      const summaryP = document.createElement('div');
      summaryP.style.marginTop = '16px';
      contentEl.appendChild(summaryP);
      await typeText(summaryP, scenario.claudeSummary);
      container.scrollTop = container.scrollHeight;

      // Cleanup
      document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.classList.remove('playing');
      });
      if (replayBtn) replayBtn.disabled = false;
      isRunning = false;
    }

    // ═══════════════════════════════════════════════════════════════
    // Auto-Play All Scenarios
    // ═══════════════════════════════════════════════════════════════
    let isAutoPlaying = false;

    async function autoPlayAll() {
      if (isAutoPlaying || isRunning) return;
      isAutoPlaying = true;

      const autoPlayBtn = document.getElementById('autoPlayBtn');
      if (autoPlayBtn) {
        autoPlayBtn.innerHTML = '<span>⏹</span><span>Stop</span>';
        autoPlayBtn.onclick = stopAutoPlay;
      }

      // Show title card for 3s before starting
      const titleCard = document.getElementById('titleCard');
      const chatContainer = document.getElementById('chatContainer');
      chatContainer.style.display = 'none';
      titleCard.classList.add('visible');
      await sleep(3000);
      titleCard.classList.remove('visible');
      await sleep(500); // Fade transition
      chatContainer.style.display = '';

      const scenarioOrder = ['triage', 'search', 'thread', 'respond', 'people', 'react', 'export'];

      for (let i = 0; i < scenarioOrder.length; i++) {
        if (!isAutoPlaying) break;
        updateProgress(i + 1, scenarioOrder.length);
        await runScenario(scenarioOrder[i]);
        if (!isAutoPlaying) break;
        await sleep(2000); // Pause between scenarios
      }
      updateProgress(0, 0); // Clear progress

      // Show closing card for 4s after completion (only if not stopped)
      if (isAutoPlaying) {
        const closingCard = document.getElementById('closingCard');
        chatContainer.style.display = 'none';
        await sleep(500);
        closingCard.classList.add('visible');
        await sleep(4000);
        closingCard.classList.remove('visible');
        await sleep(500);
        chatContainer.style.display = '';
      }

      stopAutoPlay();
    }

    function stopAutoPlay() {
      isAutoPlaying = false;
      const autoPlayBtn = document.getElementById('autoPlayBtn');
      if (autoPlayBtn) {
        autoPlayBtn.innerHTML = '<span>▶</span><span>Auto-Play All</span>';
        autoPlayBtn.onclick = autoPlayAll;
      }
      updateProgress(0, 0);
    }

    function updateProgress(current, total) {
      const indicator = document.getElementById('progressIndicator');
      if (!indicator) return;

      if (current === 0 || total === 0) {
        indicator.style.display = 'none';
        return;
      }

      indicator.style.display = 'flex';
      indicator.querySelector('.progress-text').textContent = `${current}/${total}`;
      indicator.querySelector('.progress-fill').style.width = `${(current / total) * 100}%`;
    }

    async function copyShareLink() {
      const btn = document.querySelector('.share-btn');
      const url = window.location.href.split('?')[0]; // Remove any query params

      try {
        await navigator.clipboard.writeText(url);
        btn.classList.add('copied');
        btn.querySelector('.share-text').textContent = 'Copied!';
        btn.querySelector('.share-icon').textContent = '✓';

        setTimeout(() => {
          btn.classList.remove('copied');
          btn.querySelector('.share-text').textContent = 'Share';
          btn.querySelector('.share-icon').textContent = '🔗';
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // Keyboard Shortcuts
    // ═══════════════════════════════════════════════════════════════
    function toggleFullscreen() {
      document.body.classList.toggle('fullscreen-mode');
    }

    document.addEventListener('keydown', (e) => {
      // Fullscreen can toggle anytime
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
        return;
      }

      // Escape exits fullscreen first, then stops auto-play
      if (e.key === 'Escape') {
        if (document.body.classList.contains('fullscreen-mode')) {
          toggleFullscreen();
        } else {
          stopAutoPlay();
        }
        return;
      }

      if (isRunning) return;

      switch(e.key) {
        case '1': runScenario('triage'); break;
        case '2': runScenario('search'); break;
        case '3': runScenario('thread'); break;
        case '4': runScenario('respond'); break;
        case '5': runScenario('people'); break;
        case '6': runScenario('react'); break;
        case '7': runScenario('export'); break;
        case 'r': case 'R': replayScenario(); break;
        case 'a': case 'A': autoPlayAll(); break;
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // Initialize
    // ═══════════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
      // Skip initial scenario when recording (?noauto flag)
      if (new URLSearchParams(window.location.search).has('noauto')) return;
      runScenario('triage');
    });
  </script>
</body>
</html>
