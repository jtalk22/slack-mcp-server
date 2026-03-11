<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slack MCP Server - Install in 30 Seconds</title>
  <meta name="description" content="{{SELF_HOSTED_TOOL_COUNT}} self-hosted Slack MCP tools for Claude. Read channels, search messages, send replies, react, and manage unreads. Managed Cloud deployment is also available.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Slack MCP Server — 16 Self-Hosted Tools for Claude">
  <meta property="og:description" content="Give Claude your Slack. Self-host {{SELF_HOSTED_TOOL_COUNT}} tools for free, or use Cloud for {{CLOUD_MANAGED_TOOL_COUNT}} managed tools with support and hosted credentials.">
  <meta property="og:url" content="{{GITHUB_PAGES_ROOT}}/">
  <meta property="og:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Slack MCP Server — 16 Self-Hosted Tools for Claude">
  <meta name="twitter:description" content="Give Claude your Slack. Self-host {{SELF_HOSTED_TOOL_COUNT}} tools for free, or use Cloud for {{CLOUD_MANAGED_TOOL_COUNT}} managed tools with support and hosted credentials.">
  <meta name="twitter:image" content="{{SOCIAL_IMAGE_URL}}">
  <link rel="icon" href="{{ICON_URL}}" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-heading: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
      --font-body: "IBM Plex Sans", "Inter", "Segoe UI", sans-serif;
      --bg-1: #091433;
      --bg-2: #10214f;
      --panel: rgba(11, 27, 67, 0.82);
      --panel-border: rgba(130, 161, 225, 0.35);
      --text: #edf3ff;
      --muted: #afc0e4;
      --accent: #53d2cb;
      --button-bg: rgba(18, 57, 121, 0.75);
      --button-border: rgba(134, 161, 224, 0.45);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-body);
      color: var(--text);
      min-height: 100vh;
      background:
        radial-gradient(900px 460px at 10% 0%, #2b4d95 0%, transparent 58%),
        radial-gradient(1020px 500px at 100% 100%, #114584 0%, transparent 64%),
        linear-gradient(145deg, var(--bg-1), var(--bg-2));
      padding: 22px 16px 26px;
    }

    .shell {
      max-width: 1160px;
      margin: 0 auto;
      border: 1px solid var(--panel-border);
      border-radius: 18px;
      background: linear-gradient(160deg, var(--panel), rgba(8, 20, 55, 0.92));
      box-shadow: 0 24px 46px rgba(0, 0, 0, 0.32);
      overflow: hidden;
    }

    .hero {
      padding: 22px 24px 16px;
      border-bottom: 1px solid rgba(141, 167, 226, 0.2);
    }

    .hero h1 {
      font-family: var(--font-heading);
      letter-spacing: -0.02em;
      font-size: clamp(1.95rem, 3.6vw, 2.85rem);
      line-height: 1.04;
      margin-bottom: 8px;
    }

    .hero p {
      color: var(--muted);
      font-size: clamp(0.96rem, 1.35vw, 1.14rem);
      max-width: 940px;
      margin-bottom: 12px;
    }

    .cta-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .cta-row a {
      text-decoration: none;
      color: #e9f4ff;
      border: 1px solid var(--button-border);
      border-radius: 999px;
      padding: 7px 12px;
      background: var(--button-bg);
      font-size: 0.91rem;
      font-weight: 600;
    }

    .cta-row a strong { color: var(--accent); }

    .verify {
      background: #091c4c;
      border: 1px solid rgba(128, 157, 217, 0.4);
      border-radius: 12px;
      padding: 11px 13px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: clamp(0.8rem, 1.05vw, 0.96rem);
      line-height: 1.45;
      color: #dce9ff;
      overflow-x: auto;
      white-space: pre;
    }

    .snapshot-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 4px;
    }

    .snapshot-card {
      border: 1px solid rgba(133, 160, 222, 0.32);
      border-radius: 14px;
      background: rgba(8, 20, 55, 0.82);
      padding: 14px 15px;
      min-height: 120px;
    }

    .snapshot-label {
      display: block;
      font-size: 0.74rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8fa9da;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .snapshot-value {
      display: block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 1.05rem;
      font-weight: 700;
      color: #edf3ff;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .snapshot-note {
      display: block;
      color: var(--muted);
      font-size: 0.84rem;
      line-height: 1.45;
    }

    .snapshot-note a,
    .snapshot-value a {
      color: #9ac3ff;
    }

    .decision-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .decision-card {
      border: 1px solid rgba(133, 160, 222, 0.32);
      border-radius: 14px;
      background: rgba(8, 20, 55, 0.82);
      padding: 16px;
      min-height: 220px;
    }

    .decision-card.accent {
      border-color: rgba(240, 194, 70, 0.38);
      box-shadow: inset 0 0 0 1px rgba(240, 194, 70, 0.1);
    }

    .decision-label {
      display: inline-block;
      margin-bottom: 8px;
      color: #8fa9da;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .decision-card h2 {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    .decision-card p,
    .decision-card li {
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.48;
    }

    .decision-card ul {
      padding-left: 18px;
      margin: 10px 0 0;
    }

    .decision-links {
      margin-top: 12px;
    }

    .decision-links a {
      color: #9ac3ff;
    }

    .stage {
      padding: 16px 24px 20px;
    }

    .video-shell {
      border: 1px solid rgba(133, 160, 222, 0.35);
      border-radius: 14px;
      overflow: hidden;
      position: relative;
      background: #081334;
      min-height: 280px;
    }

    video {
      display: block;
      width: 100%;
      height: auto;
      background: #050b1f;
    }

    .video-controls {
      position: absolute;
      left: 12px;
      bottom: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .video-controls button,
    .video-controls a {
      border: 1px solid rgba(135, 163, 225, 0.55);
      background: rgba(9, 30, 74, 0.88);
      color: #e8f2ff;
      border-radius: 10px;
      padding: 7px 11px;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .video-status {
      margin-left: auto;
      margin-top: 8px;
      color: #9fb6e3;
      font-size: 0.83rem;
    }

    .footer {
      border-top: 1px solid rgba(141, 167, 226, 0.2);
      padding: 12px 24px 16px;
      font-size: 0.88rem;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .footer a { color: #9ac3ff; }

    @media (max-width: 760px) {
      body { padding: 10px; }
      .hero, .stage, .footer { padding-left: 12px; padding-right: 12px; }
      .snapshot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .decision-grid { grid-template-columns: 1fr; }
      .video-shell { min-height: 200px; }
      .video-controls { left: 8px; bottom: 8px; }
      .video-controls button,
      .video-controls a { padding: 6px 9px; font-size: 0.8rem; }
    }
    @media (max-width: 560px) {
      .snapshot-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <h1>Give Claude your Slack</h1>
      <p>{{SELF_HOSTED_TOOL_COUNT}} self-hosted tools for channels, search, replies, reactions, unread triage, and user search. Cloud provides {{CLOUD_MANAGED_TOOL_COUNT}} managed tools, with {{TEAM_AI_WORKFLOW_COUNT}} AI workflows on Team.</p>
      <div class="cta-row">
        <a href="{{CANONICAL_SITE_URL}}" style="background:rgba(240,194,70,0.18);border-color:rgba(240,194,70,0.45)"><strong style="color:#f0c246">Cloud</strong></a>
        <a href="{{SETUP_URL}}"><strong>Self-Host</strong> (free)</a>
        <a href="{{RELEASES_URL}}"><strong>Latest Release</strong></a>
        <a href="{{CLOUD_DOCS_URL}}"><strong>Cloud Docs</strong></a>
        <a href="{{CLOUD_DEPLOYMENT_URL}}"><strong>Deployment</strong></a>
        <a href="{{CLOUD_SUPPORT_URL}}"><strong>Support</strong></a>
        <a href="{{NPM_URL}}"><strong>npm</strong></a>
      </div>
      <div class="verify">npx -y @jtalk22/slack-mcp --setup
npx -y @jtalk22/slack-mcp@latest --version
npx -y @jtalk22/slack-mcp@latest --doctor
npx -y @jtalk22/slack-mcp@latest --status</div>
      <p class="verify" style="margin-top:12px">For rollout support, use deployment review. Reproducible bugs and install blockers still go through standard issue triage.</p>
    </section>

    <section class="stage" style="padding-top:0">
      <div class="snapshot-grid" aria-label="Current distribution snapshot">
        <div class="snapshot-card">
          <span class="snapshot-label">npm latest</span>
          <strong class="snapshot-value" id="npmLatest">Loading...</strong>
          <span class="snapshot-note" id="npmLatestNote">Registry dist-tag for <code>@jtalk22/slack-mcp</code>.</span>
        </div>
        <div class="snapshot-card">
          <span class="snapshot-label">GitHub release</span>
          <strong class="snapshot-value" id="releaseTag">Loading...</strong>
          <span class="snapshot-note" id="releaseTagNote">Latest tagged release from GitHub.</span>
        </div>
        <div class="snapshot-card">
          <span class="snapshot-label">Cloud status</span>
          <strong class="snapshot-value" id="cloudHealth">Checking...</strong>
          <span class="snapshot-note" id="cloudHealthNote">Reads the hosted <code>/status</code> endpoint and degrades to a raw status link only if cross-origin access is unavailable.</span>
        </div>
        <div class="snapshot-card">
          <span class="snapshot-label">Operator links</span>
          <strong class="snapshot-value"><a href="{{RELEASE_HEALTH_URL}}">Release health</a></strong>
          <span class="snapshot-note"><a href="{{VERSION_PARITY_URL}}">Version parity</a> · <a href="{{RUNBOOK_URL}}">Runbook</a></span>
        </div>
      </div>
    </section>

{{ROOT_DECISION_PANEL}}

    <section class="stage">
      <div class="video-shell">
        <video id="heroVideo" autoplay muted loop playsinline preload="metadata" poster="docs/images/demo-claude-mobile-poster.png" aria-label="Slack MCP demo autoplay">
          <source src="docs/videos/demo-claude-mobile-20s.mp4" type="video/mp4">
        </video>
        <div class="video-controls">
          <button type="button" id="playBtn">Play</button>
          <button type="button" id="pauseBtn">Pause</button>
          <a href="public/demo-video.html">Live Demo Page</a>
          <a href="public/share.html">Share Surface</a>
        </div>
      </div>
      <div class="video-status" id="videoStatus">Autoplay check in progress...</div>
    </section>

    <footer class="footer">
      <span><a href="{{CANONICAL_SITE_URL}}">Cloud Plans</a> · <a href="{{CLOUD_DOCS_URL}}">Cloud Docs</a> · <a href="{{CLOUD_DEPLOYMENT_URL}}">Deployment</a> · <a href="{{CLOUD_SUPPORT_URL}}">Support</a> · <a href="{{CANONICAL_SITE_URL}}/privacy">Privacy</a> · <a href="{{GITHUB_REPO_URL}}">GitHub</a> · <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a></span>
      <span>25+ releases · 300+ edge PoPs · <a href="https://github.com/sponsors/jtalk22">Sponsor</a></span>
    </footer>
  </main>

  <script>
    const video = document.getElementById('heroVideo');
    const statusEl = document.getElementById('videoStatus');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const npmLatestEl = document.getElementById('npmLatest');
    const npmLatestNoteEl = document.getElementById('npmLatestNote');
    const releaseTagEl = document.getElementById('releaseTag');
    const releaseTagNoteEl = document.getElementById('releaseTagNote');
    const cloudHealthEl = document.getElementById('cloudHealth');
    const cloudHealthNoteEl = document.getElementById('cloudHealthNote');

    async function ensureAutoplay() {
      try {
        await video.play();
        statusEl.textContent = 'Autoplay active (muted).';
      } catch {
        statusEl.textContent = 'Autoplay blocked by browser policy. Use Play to start.';
      }
    }

    playBtn.addEventListener('click', async () => {
      try {
        await video.play();
        statusEl.textContent = 'Playback active.';
      } catch {
        statusEl.textContent = 'Playback blocked. Check browser media settings.';
      }
    });

    pauseBtn.addEventListener('click', () => {
      video.pause();
      statusEl.textContent = 'Playback paused.';
    });

    async function loadDistributionSnapshot() {
      const npmPromise = fetch('https://registry.npmjs.org/@jtalk22/slack-mcp/latest')
        .then((res) => {
          if (!res.ok) throw new Error(`npm registry returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          npmLatestEl.textContent = `v${data.version}`;
          npmLatestNoteEl.textContent = `Published package: ${data.name}`;
        })
        .catch((error) => {
          npmLatestEl.textContent = 'Unavailable';
          npmLatestNoteEl.textContent = `Registry lookup failed: ${error.message}`;
        });

      const releasePromise = fetch('https://api.github.com/repos/jtalk22/slack-mcp-server/releases/latest')
        .then((res) => {
          if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          releaseTagEl.textContent = data.tag_name || 'Unknown';
          const publishedAt = data.published_at
            ? new Date(data.published_at).toLocaleDateString()
            : 'date unavailable';
          releaseTagNoteEl.textContent = `GitHub Release published ${publishedAt}.`;
        })
        .catch((error) => {
          releaseTagEl.textContent = 'Unavailable';
          releaseTagNoteEl.textContent = `GitHub release lookup failed: ${error.message}`;
        });

      const cloudPromise = fetch('{{CLOUD_STATUS_URL}}', {
        headers: { accept: 'application/json' }
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Cloud status returned ${res.status}`);
          return res.json();
        })
        .then((data) => {
          cloudHealthEl.textContent = data.status || 'ok';
          const hostedVersion = data.version ? `v${data.version}` : 'version unavailable';
          const standardTools = data.tools && typeof data.tools.standard === 'number' ? data.tools.standard : 'n/a';
          const aiTools = data.tools && typeof data.tools.ai_compound === 'number' ? data.tools.ai_compound : 'n/a';
          const docsUrl = data.docs && data.docs.docs_url ? data.docs.docs_url : '{{CLOUD_DOCS_URL}}';
          cloudHealthNoteEl.innerHTML = `${hostedVersion} · ${standardTools} managed tools · ${aiTools} Team AI workflows · <a href="${docsUrl}">Cloud docs</a>`;
        })
        .catch((error) => {
          cloudHealthEl.textContent = 'Open /status';
          cloudHealthNoteEl.innerHTML = `Cross-origin status lookup unavailable: ${error.message}. Use <a href="{{CLOUD_STATUS_URL}}">raw status JSON</a>.`;
        });

      await Promise.allSettled([npmPromise, releasePromise, cloudPromise]);
    }

    ensureAutoplay();
    loadDistributionSnapshot();
  </script>
</body>
</html>
