<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slack MCP Server</title>
  <meta name="description" content="Catch up on Slack without reading it: local browser-session control or hosted permanent OAuth for recurring workflows.">
  <link rel="canonical" href="{{GITHUB_PAGES_ROOT}}/public/share.html">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Slack MCP Server — Ask what happened. Get receipts. Close the loop.">
  <meta property="og:description" content="The free local path ships {{SELF_HOSTED_TOOL_COUNT}} tools today. Hosted adds permanent OAuth, indexing, schedules, and team continuity.">
  <meta property="og:url" content="{{GITHUB_PAGES_ROOT}}/public/share.html">
  <meta property="og:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Catch up on Slack without reading it">
  <meta name="twitter:description" content="Local control now. Hosted continuity when the workflow must run without you.">
  <meta name="twitter:image" content="{{SOCIAL_IMAGE_URL}}">
  <link rel="icon" href="{{ICON_URL}}" type="image/png">
  <style>
    {{FONT_FACES}}
    {{DESIGN_TOKENS}}
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--paper);
      background: var(--ink);
      font-family: var(--body);
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .wrap {
      width: min(980px, 100%);
      border: 1px solid var(--rule);
      border-radius: 16px;
      background: var(--surface);
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28);
      padding: 16px;
    }
    h1 {
      margin: 0;
      line-height: 1.08;
      letter-spacing: -0.02em;
      font-size: clamp(30px, 5vw, 48px);
      font-weight: 600;
    }
    .sub {
      margin: 8px 0 14px;
      color: var(--muted);
      font-size: clamp(16px, 2.4vw, 22px);
      line-height: 1.25;
    }
    .sub a { color: var(--signal); }
    .preview {
      display: block;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--rule);
      text-decoration: none;
      margin-bottom: 14px;
    }
    .preview img {
      width: 100%;
      display: block;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 8px;
    }
    .links a {
      display: inline-block;
      text-decoration: none;
      border: 1px solid var(--rule);
      border-radius: 10px;
      padding: 9px 12px;
      color: var(--paper);
      background: var(--surface-2);
      font-weight: 600;
      font-size: 14px;
    }
    .links a:hover { background: #232329; }
    .note {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }
    .note a { color: var(--signal); }
    .note strong { color: var(--paper); }
    @media (max-width: 640px) {
      body { padding: 10px; }
      .wrap { padding: 12px; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>Slack MCP Server</h1>
    <p class="sub">Slack for your AI agent — no OAuth, no admin, no app to register. Self-host {{SELF_HOSTED_TOOL_COUNT}} tools for free: 12 read, 4 write, 3 local workflow tools. Hosted free tier — workflow continuity + AI catch-up. Sign up no card at <a href="{{CANONICAL_SITE_URL}}">mcp.revasserlabs.com</a>.</p>

    <a class="preview" href="{{GITHUB_REPO_URL}}" rel="noopener">
      <img src="{{SOCIAL_IMAGE_URL}}" alt="Slack MCP Server social preview card">
    </a>

    <div class="links">
{{SHARE_LINKS}}
    </div>

    <p class="note">{{SHARE_NOTE}}</p>
  </main>
</body>
</html>
