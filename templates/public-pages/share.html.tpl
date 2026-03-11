<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slack MCP Server</title>
  <meta name="description" content="Session-based Slack MCP for Claude. Self-host locally or use the managed Cloud path with Gemini CLI support, pricing, security/procurement review, deployment review, and hosted credentials.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Slack MCP Server">
  <meta property="og:description" content="Session-based Slack MCP for Claude. Self-host {{SELF_HOSTED_TOOL_COUNT}} tools for free or use Cloud for {{CLOUD_MANAGED_TOOL_COUNT}} managed tools, Gemini CLI support, security/procurement review, deployment review, and support.">
  <meta property="og:url" content="{{GITHUB_PAGES_ROOT}}/public/share.html">
  <meta property="og:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Slack MCP Server">
  <meta name="twitter:description" content="Session-based Slack MCP for Claude. Self-host {{SELF_HOSTED_TOOL_COUNT}} tools for free or use Cloud for {{CLOUD_MANAGED_TOOL_COUNT}} managed tools, Gemini CLI support, security/procurement review, deployment review, and support.">
  <meta name="twitter:image" content="{{SOCIAL_IMAGE_URL}}">
  <link rel="icon" href="{{ICON_URL}}" type="image/png">
  <style>
    :root {
      --bg-1: #0b1436;
      --bg-2: #0e1d49;
      --line: rgba(131, 161, 224, 0.36);
      --text: #edf4ff;
      --muted: #b4c4e8;
      --link-bg: rgba(17, 57, 120, 0.7);
      --link-bg-hover: rgba(22, 71, 148, 0.85);
      --accent: #54d8cf;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        radial-gradient(900px 430px at 12% 0%, #2b4f98 0%, transparent 60%),
        radial-gradient(980px 480px at 100% 100%, #124b8c 0%, transparent 64%),
        linear-gradient(145deg, var(--bg-1), var(--bg-2));
      font-family: "Space Grotesk", "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
      display: grid;
      place-items: center;
      padding: 20px;
    }
    .wrap {
      width: min(980px, 100%);
      border: 1px solid var(--line);
      border-radius: 16px;
      background: linear-gradient(165deg, rgba(17, 41, 92, 0.72), rgba(10, 22, 56, 0.9));
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28);
      padding: 16px;
    }
    h1 {
      margin: 0;
      line-height: 1.08;
      letter-spacing: -0.02em;
      font-size: clamp(30px, 5vw, 48px);
    }
    .sub {
      margin: 8px 0 14px;
      color: var(--muted);
      font-size: clamp(16px, 2.4vw, 22px);
      line-height: 1.25;
    }
    .preview {
      display: block;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(135, 163, 225, 0.4);
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
      border: 1px solid rgba(131, 161, 224, 0.5);
      border-radius: 10px;
      padding: 9px 12px;
      color: var(--text);
      background: var(--link-bg);
      font-weight: 600;
      font-size: 14px;
    }
    .links a:hover { background: var(--link-bg-hover); }
    .note {
      color: #9fb4de;
      font-size: 13px;
      line-height: 1.45;
    }
    .note strong { color: var(--accent); }
    @media (max-width: 640px) {
      body { padding: 10px; }
      .wrap { padding: 12px; }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>Slack MCP Server</h1>
    <p class="sub">Give Claude full access to your Slack. Self-host {{SELF_HOSTED_TOOL_COUNT}} tools for free, or use Cloud for {{CLOUD_MANAGED_TOOL_COUNT}} managed tools, Gemini CLI support, hosted credentials, rollout support, and buyer-facing security review.</p>

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
