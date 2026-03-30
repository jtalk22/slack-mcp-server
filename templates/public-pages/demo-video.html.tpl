<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slack MCP Server — Video Demo</title>
  <meta name="description" content="Slack's official MCP needs OAuth + admin approval and doesn't work with Claude Code or Copilot. This one uses your browser session. {{SELF_HOSTED_TOOL_COUNT}} tools, one command.">
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="Slack MCP Server — No OAuth, no admin, just your browser session">
  <meta property="og:description" content="{{SELF_HOSTED_TOOL_COUNT}} tools for search, threads, DMs, reactions, and more. Works with Claude, Cursor, Copilot, Gemini. One command: npx -y @jtalk22/slack-mcp --setup">
  <meta property="og:url" content="{{GITHUB_PAGES_ROOT}}/public/demo-video.html">
  <meta property="og:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta property="og:video" content="{{GITHUB_PAGES_ROOT}}/docs/videos/demo-claude-mobile-20s.mp4">
  <meta property="og:video:secure_url" content="{{GITHUB_PAGES_ROOT}}/docs/videos/demo-claude-mobile-20s.mp4">
  <meta property="og:video:type" content="video/mp4">
  <meta property="og:video:width" content="1080">
  <meta property="og:video:height" content="1920">
  <meta name="twitter:card" content="player">
  <meta name="twitter:title" content="Slack MCP Server — No OAuth, no admin, just your browser session">
  <meta name="twitter:description" content="{{SELF_HOSTED_TOOL_COUNT}} tools. Works with Claude, Cursor, Copilot, Gemini. One command setup.">
  <meta name="twitter:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta name="twitter:player" content="{{GITHUB_PAGES_ROOT}}/public/demo-video.html">
  <meta name="twitter:player:width" content="1280">
  <meta name="twitter:player:height" content="800">
  <meta name="twitter:player:stream" content="{{GITHUB_PAGES_ROOT}}/docs/videos/demo-claude-mobile-20s.mp4">
  <meta name="twitter:player:stream:content_type" content="video/mp4">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Slack MCP Server — Monday Morning Demo",
    "description": "Watch an AI handle 47 unread Slack messages without opening Slack. 16 tools, one command, no OAuth. Works with Claude, Cursor, Copilot, Gemini.",
    "thumbnailUrl": "{{SOCIAL_IMAGE_URL}}",
    "uploadDate": "2026-03-30",
    "contentUrl": "{{GITHUB_PAGES_ROOT}}/docs/videos/demo-claude.webm",
    "embedUrl": "{{GITHUB_PAGES_ROOT}}/public/demo-video.html",
    "duration": "PT3M",
    "publisher": {
      "@type": "Organization",
      "name": "Revasser",
      "url": "https://mcp.revasserlabs.com"
    }
  }
  </script>
  <link rel="icon" href="{{ICON_URL}}" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-heading: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
      --font-body: "IBM Plex Sans", "Inter", "Segoe UI", sans-serif;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--font-body);
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      max-width: 900px;
      width: 100%;
    }
    h1 {
      color: #ffffff;
      font-size: 1.75rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.5rem;
      font-family: var(--font-heading);
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: #94a3b8;
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 1rem;
    }
    .cta-strip {
      margin: 0 auto 1rem;
      background: rgba(15, 52, 96, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 0.8125rem;
    }
    .cta-strip .links {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cta-strip .links a {
      color: #d8efff;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 999px;
      padding: 4px 8px;
    }
    .cta-strip .links a:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cta-strip .note {
      color: rgba(255, 255, 255, 0.82);
    }
    .cta-strip .note a {
      color: #9ee7ff;
      text-decoration: underline;
    }
    .video-wrapper {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      background: #0f0f1a;
    }
    video {
      width: 100%;
      display: block;
      border-radius: 12px;
    }
    .controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4ecdc4;
      color: #1a1a2e;
    }
    .btn-primary:hover {
      background: #5eead4;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .back-link {
      margin-top: 2rem;
      text-align: center;
    }
    .back-link a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.875rem;
    }
    .back-link a:hover {
      color: #ffffff;
    }

    @media (max-width: 640px) {
      body {
        padding: 1rem 0.75rem;
      }

      .cta-strip .links {
        width: 100%;
      }

      .controls {
        gap: 0.75rem;
      }

      .btn {
        flex: 1;
        min-width: 0;
        padding: 0.72rem 0.95rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Slack MCP Server</h1>
    <p class="subtitle">No OAuth. No admin approval. {{SELF_HOSTED_TOOL_COUNT}} tools for Claude, Cursor, Copilot, Gemini, and any MCP client. <code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:0.875rem">npx -y @jtalk22/slack-mcp --setup</code></p>
    <div class="cta-strip">
      <div class="links">
{{DEMO_LINKS}}
      </div>
      <div class="note">
        {{DEMO_NOTE}}
      </div>
    </div>

    <div class="video-wrapper">
      <video id="demo" poster="../docs/images/demo-poster.png" playsinline autoplay muted loop>
        <source src="../docs/videos/demo-claude.webm" type="video/webm">
        <source src="https://jtalk22.github.io/slack-mcp-server/docs/videos/demo-claude.webm" type="video/webm">
        Your browser does not support the video tag.
      </video>
    </div>

    <div class="controls">
      <button class="btn btn-primary" onclick="togglePlay()">Play / Pause</button>
      <button class="btn btn-secondary" onclick="restart()">Restart</button>
    </div>

    <div class="back-link">
      {{DEMO_FOOTER_LINKS}}
    </div>
  </div>

  <script>
    const video = document.getElementById('demo');
    const HIGHLIGHT_START_SECONDS = 6;

    function playFromHighlight() {
      if (video.duration && video.duration > HIGHLIGHT_START_SECONDS + 1) {
        video.currentTime = HIGHLIGHT_START_SECONDS;
      }
      return video.play();
    }

    // Autoplay with 1 second delay
    setTimeout(() => {
      playFromHighlight().catch(() => {
        // Autoplay blocked, user will need to click
        console.log('Autoplay blocked, click to play');
      });
    }, 1000);

    function togglePlay() {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }

    function restart() {
      video.currentTime = 0;
      video.play();
    }

    // Loop the video
    video.addEventListener('ended', () => {
      video.currentTime = HIGHLIGHT_START_SECONDS;
      video.play();
    });
  </script>
</body>
</html>
