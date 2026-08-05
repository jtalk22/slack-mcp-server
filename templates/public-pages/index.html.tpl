<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slack MCP Server — Slack’s operating layer for AI agents</title>
  <meta name="description" content="Slack’s operating layer for AI agents: searchable workspace memory, approved actions, and typed workflows—local without an app/admin queue or hosted with permanent OAuth.">
  <link rel="canonical" href="{{GITHUB_PAGES_ROOT}}/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Slack MCP Server — Ask what happened. Get receipts. Close the loop.">
  <meta property="og:description" content="Run locally without an app/admin queue, or hosted with permanent OAuth, indexing, schedules, and team continuity.">
  <meta property="og:url" content="{{GITHUB_PAGES_ROOT}}/">
  <meta property="og:image" content="{{SOCIAL_IMAGE_URL}}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Slack’s operating layer for AI agents">
  <meta name="twitter:description" content="Ask what happened. Find the decision. Close the loop—locally or through permanent hosted OAuth.">
  <meta name="twitter:image" content="{{SOCIAL_IMAGE_URL}}">
  <link rel="icon" href="{{ICON_URL}}" type="image/png">
  <style>
    @font-face { font-family: "Nyght Serif"; src: url("public/fonts/nyght-serif-medium.woff2") format("woff2"); font-display: swap; font-weight: 500; }
    @font-face { font-family: "Nyght Serif"; src: url("public/fonts/nyght-serif-medium-italic.woff2") format("woff2"); font-display: swap; font-weight: 500; font-style: italic; }
    @font-face { font-family: "Roobert"; src: url("public/fonts/roobert-regular.woff2") format("woff2"); font-display: swap; font-weight: 400; }
    @font-face { font-family: "Roobert"; src: url("public/fonts/roobert-semibold.woff2") format("woff2"); font-display: swap; font-weight: 600; }
    @font-face { font-family: "Roobert Mono"; src: url("public/fonts/roobert-mono.woff2") format("woff2"); font-display: swap; font-weight: 400 600; }

    :root {
      color-scheme: dark;
      --ground: #0b0b0c;
      --surface: #131315;
      --surface-2: #18181b;
      --rule: #2b2b30;
      --paper: #eeebe3;
      --muted: #9a978e;
      --stamp: #e5482f;
      --signal: #ffb224;
      --display: "Nyght Serif", Georgia, "Times New Roman", serif;
      --body: "Roobert", system-ui, sans-serif;
      --mono: "Roobert Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--ground); color: var(--paper); font-family: var(--body); }
    a { color: inherit; }
    button { font: inherit; }
    .page { min-height: 100vh; overflow: hidden; }
    .frame { width: min(1440px, 100%); margin: 0 auto; padding-inline: clamp(20px, 4vw, 72px); }

    .site-header {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--rule);
    }
    .brand { font-family: var(--display); font-size: 15px; letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
    .brand span { color: var(--signal); }
    .nav { display: flex; gap: 22px; align-items: center; }
    .nav a { color: var(--muted); font-size: 14px; text-decoration: none; }
    .nav a:hover { color: var(--paper); }
    .nav .nav-cta { color: var(--paper); border-bottom: 1px solid var(--stamp); padding-bottom: 3px; }

    .hero {
      min-height: calc(100svh - 70px);
      display: grid;
      grid-template-columns: minmax(0, .88fr) minmax(520px, 1.12fr);
      gap: clamp(34px, 5vw, 88px);
      align-items: center;
      padding-block: clamp(44px, 6vw, 92px);
    }
    .eyebrow { margin: 0 0 20px; color: var(--stamp); font-family: var(--mono); font-size: 12px; letter-spacing: .15em; text-transform: uppercase; }
    h1 { margin: 0; font-family: var(--display); font-size: clamp(50px, 6.2vw, 96px); font-weight: 500; letter-spacing: -.015em; line-height: .99; max-width: 780px; }
    h1 em { font-style: italic; color: var(--signal); }
    .hero-deck { margin: 28px 0 0; max-width: 690px; color: #c6c3ba; font-size: clamp(17px, 1.4vw, 21px); line-height: 1.55; }
    .hero-deck strong { color: var(--paper); font-weight: 600; }
    .command-row { margin-top: 34px; display: flex; align-items: stretch; max-width: 700px; }
    .command { min-width: 0; flex: 1; background: var(--surface); border: 1px solid var(--rule); padding: 17px 20px; color: var(--signal); font-family: var(--mono); font-size: clamp(13px, 1.2vw, 16px); overflow-x: auto; white-space: nowrap; }
    .copy { border: 1px solid var(--signal); background: var(--signal); color: #131208; padding: 0 22px; font-weight: 600; cursor: pointer; }
    .copy:hover { background: #ffc24d; }
    .hero-actions { display: flex; gap: 18px; align-items: center; margin-top: 22px; flex-wrap: wrap; }
    .button { display: inline-flex; align-items: center; justify-content: center; min-height: 45px; padding: 0 18px; border: 1px solid var(--paper); text-decoration: none; font-weight: 600; font-size: 14px; }
    .button.primary { background: var(--paper); color: #121212; }
    .text-link { color: var(--muted); font-size: 14px; text-decoration-color: var(--rule); text-underline-offset: 5px; }
    .client-rail { margin-top: 32px; color: #87847b; font-family: var(--mono); font-size: 11px; line-height: 1.8; text-transform: uppercase; letter-spacing: .05em; }

    .proof { position: relative; border: 1px solid #38383e; background: #0a0a0b; overflow: hidden; }
    .proof::before { content: "LIVE PROOF / 00:42"; display: block; position: absolute; z-index: 2; top: 15px; left: 17px; color: var(--paper); font-family: var(--mono); font-size: 10px; letter-spacing: .12em; }
    .proof::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(255,255,255,.025); }
    .proof video { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #0a0a0b; }
    .proof-caption { display: flex; justify-content: space-between; gap: 18px; align-items: baseline; padding: 17px 18px; border-top: 1px solid var(--rule); }
    .proof-caption strong { font-family: var(--display); font-size: clamp(16px, 1.4vw, 21px); }
    .proof-caption span { color: var(--muted); font-family: var(--mono); font-size: 11px; text-align: right; }

    .trust { border-block: 1px solid var(--rule); }
    .trust-inner { min-height: 72px; display: grid; grid-template-columns: repeat(5, 1fr); align-items: center; }
    .trust a { min-height: 72px; display: flex; flex-direction: column; justify-content: center; padding: 0 18px; text-decoration: none; border-right: 1px solid var(--rule); }
    .trust a:first-child { border-left: 1px solid var(--rule); }
    .trust small { color: #838078; font-family: var(--mono); font-size: 9px; letter-spacing: .12em; text-transform: uppercase; }
    .trust strong { margin-top: 5px; font-size: 13px; font-weight: 600; }
    .trust strong.signal { color: var(--signal); }

    section { border-bottom: 1px solid var(--rule); }
    .section-grid { display: grid; grid-template-columns: 300px 1fr; gap: clamp(48px, 8vw, 140px); padding-block: clamp(80px, 10vw, 150px); }
    .section-index { color: var(--stamp); font-family: var(--mono); font-size: 11px; letter-spacing: .12em; }
    .section-label { margin: 13px 0 0; font-family: var(--display); font-size: 19px; font-weight: 500; }
    .section-copy h2 { margin: 0; max-width: 920px; font-family: var(--display); font-size: clamp(38px, 5vw, 74px); font-weight: 500; line-height: 1.05; letter-spacing: -.012em; }
    .section-copy > p { max-width: 820px; margin: 26px 0 0; color: #b1aea5; font-size: 18px; line-height: 1.65; }

    .outcome-flow { margin-top: 54px; display: grid; grid-template-columns: repeat(4, 1fr); border-block: 1px solid var(--rule); }
    .outcome { min-height: 190px; padding: 27px 20px; border-right: 1px solid var(--rule); }
    .outcome:last-child { border-right: 0; }
    .outcome .number { display: block; color: var(--paper); font-family: var(--display); font-size: clamp(50px, 5vw, 78px); line-height: 1; }
    .outcome:nth-child(3) .number { color: var(--signal); }
    .outcome:nth-child(4) .number { color: var(--stamp); }
    .outcome p { margin: 18px 0 0; color: var(--muted); font-size: 14px; line-height: 1.5; }

    .systems { margin-top: 58px; border-top: 1px solid var(--rule); }
    .system { display: grid; grid-template-columns: 60px minmax(180px, .7fr) 1.3fr; gap: 25px; padding: 27px 0; border-bottom: 1px solid var(--rule); align-items: start; }
    .system .id { color: var(--signal); font-family: var(--mono); font-size: 11px; }
    .system h3 { margin: 0; font-family: var(--display); font-size: 23px; font-weight: 500; }
    .system p { margin: 0; color: var(--muted); line-height: 1.65; }

    .diagram { margin-top: 52px; width: 100%; height: auto; display: block; border: 1px solid var(--rule); border-radius: 22px; }
    .decision { margin-top: 44px; display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--rule); }
    .path { padding: clamp(28px, 4vw, 54px); }
    .path + .path { border-left: 1px solid var(--rule); }
    .path small { color: var(--stamp); font-family: var(--mono); font-size: 10px; letter-spacing: .12em; }
    .path:nth-child(2) small { color: var(--signal); }
    .path h3 { margin: 14px 0 0; font-family: var(--display); font-size: clamp(27px, 3vw, 42px); font-weight: 500; }
    .path p { color: var(--muted); line-height: 1.65; }
    .path a { display: inline-block; margin-top: 12px; text-underline-offset: 5px; }

    .final { min-height: 70vh; display: flex; align-items: center; text-align: center; }
    .final-inner { width: 100%; padding-block: 100px; }
    .final h2 { margin: 0 auto; max-width: 1000px; font-family: var(--display); font-size: clamp(46px, 7.5vw, 110px); line-height: .99; letter-spacing: -.015em; font-weight: 500; }
    .final h2 span { color: var(--signal); }
    .final .command-row { margin-inline: auto; }

    footer { padding-block: 35px 50px; color: var(--muted); font-size: 13px; }
    .footer-row { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .footer-row nav { display: flex; gap: 18px; flex-wrap: wrap; }
    .footer-row a { text-underline-offset: 4px; }

    .reveal { opacity: 0; transform: translateY(18px); animation: reveal .65s ease forwards; }
    .hero-copy .reveal:nth-child(2) { animation-delay: .08s; }
    .hero-copy .reveal:nth-child(3) { animation-delay: .16s; }
    .hero-copy .reveal:nth-child(4) { animation-delay: .24s; }
    .proof.reveal { animation-delay: .2s; }
    @keyframes reveal { to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 1040px) {
      .hero { grid-template-columns: 1fr; min-height: auto; }
      .hero-copy { max-width: 850px; }
      .proof { max-width: 900px; }
      .section-grid { grid-template-columns: 190px 1fr; }
      .trust-inner { grid-template-columns: repeat(3, 1fr); }
      .trust a:nth-child(4) { border-left: 1px solid var(--rule); }
    }

    @media (max-width: 700px) {
      .site-header { height: 58px; }
      .nav a:not(.nav-cta) { display: none; }
      .hero { min-height: auto; padding-block: 42px 55px; gap: 36px; }
      h1 { font-size: clamp(48px, 15vw, 68px); }
      .hero-deck { font-size: 17px; }
      .command-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; }
      .command { padding: 14px 13px; font-size: 11px; }
      .copy { padding-inline: 14px; }
      .proof video { aspect-ratio: 9 / 16; }
      .proof-caption { display: block; }
      .proof-caption span { display: block; margin-top: 6px; text-align: left; }
      .trust-inner { grid-template-columns: 1fr 1fr; }
      .trust a, .trust a:first-child, .trust a:nth-child(4) { border-left: 0; border-right: 1px solid var(--rule); }
      .section-grid { grid-template-columns: 1fr; gap: 35px; padding-block: 76px; }
      .outcome-flow { grid-template-columns: 1fr 1fr; }
      .outcome:nth-child(2) { border-right: 0; }
      .outcome:nth-child(-n+2) { border-bottom: 1px solid var(--rule); }
      .system { grid-template-columns: 36px 1fr; }
      .system p { grid-column: 2; }
      .decision { grid-template-columns: 1fr; }
      .path + .path { border-left: 0; border-top: 1px solid var(--rule); }
      .final { min-height: auto; }
      .final h2 { font-size: clamp(54px, 16vw, 82px); }
    }

    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      .reveal { opacity: 1; transform: none; animation: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="frame site-header">
      <a class="brand" href="{{GITHUB_REPO_URL}}">Slack MCP <span>/ local</span></a>
      <nav class="nav" aria-label="Primary navigation">
        <a href="#proof">Proof</a>
        <a href="#systems">Systems</a>
        <a href="#paths">Paths</a>
        <a class="nav-cta" href="{{SETUP_URL}}">Install</a>
      </nav>
    </header>

    <main>
      <div class="frame hero">
        <div class="hero-copy">
          <p class="eyebrow reveal">Slack’s operating layer for AI agents</p>
          <h1 class="reveal">Ask what happened.<br><em>Get receipts.</em><br>Close the loop.</h1>
          <p class="hero-deck reveal">Turn Slack from an interruption stream into searchable operating memory and approved action. Run the <strong>{{SELF_HOSTED_TOOL_COUNT}}-tool surface available today</strong> locally with no app/admin queue, or move recurring work to hosted permanent OAuth, indexing, and schedules.</p>
          <div class="command-row reveal" aria-label="Install command">
            <code class="command">npx -y @jtalk22/slack-mcp --setup</code>
            <button class="copy" type="button" data-copy="npx -y @jtalk22/slack-mcp --setup">Copy</button>
          </div>
          <div class="hero-actions reveal">
            <a class="button primary" href="{{SETUP_URL}}">Install locally</a>
            <a class="text-link" href="public/demo-video.html">Watch the 42-second proof →</a>
          </div>
          <p class="client-rail reveal">Claude Code · Claude Desktop · Cursor · Copilot · Windsurf · Gemini CLI · Codex CLI · any stdio MCP client</p>
        </div>

        <a class="proof reveal" href="public/demo-video.html" aria-label="Watch the 42-second Slack MCP proof reel">
          <video id="heroVideo" autoplay muted loop playsinline preload="metadata" poster="docs/images/demo-poster.png">
            <source src="docs/videos/slack-mcp-proof-42s.mp4" type="video/mp4">
            <source src="docs/videos/slack-mcp-proof-42s.webm" type="video/webm">
          </video>
          <div class="proof-caption">
            <strong>Monday, 9:07. Slack has already formed opinions.</strong>
            <span>47 → 1 → 0 AFTER APPROVAL</span>
          </div>
        </a>
      </div>

      <aside class="trust" aria-label="Project trust signals">
        <div class="frame trust-inner">
          <a href="{{NPM_URL}}"><small>npm</small><strong id="npmVersion">latest release</strong></a>
          <a href="{{NPM_URL}}"><small>distribution</small><strong id="npmDownloads">total downloads</strong></a>
          <a href="{{GITHUB_REPO_URL}}/actions/workflows/ci.yml"><small>build</small><strong class="signal">CI verified</strong></a>
          <a href="{{GITHUB_REPO_URL}}#provenance-dont-take-my-word-for-it"><small>supply chain</small><strong class="signal">provenance signed</strong></a>
          <a href="https://registry.modelcontextprotocol.io"><small>discovery</small><strong>MCP Registry</strong></a>
        </div>
      </aside>

      <section id="proof">
        <div class="frame section-grid">
          <div><span class="section-index">01 / OUTCOME</span><p class="section-label">What blew up overnight?</p></div>
          <div class="section-copy">
            <h2>Slack noise goes in. A prioritized operating brief comes out.</h2>
            <p>The agent inventories unread channels and DMs, retrieves the history that matters, finds buried details, and closes approved loops through real Slack tool calls.</p>
            <div class="outcome-flow" aria-label="47 unread messages become one brief without opening Slack">
              <div class="outcome"><span class="number">47</span><p>unread messages competing for attention</p></div>
              <div class="outcome"><span class="number">4</span><p>conversations with work that actually matters</p></div>
              <div class="outcome"><span class="number">1</span><p>prioritized brief with owners, risks, and next actions</p></div>
              <div class="outcome"><span class="number">0</span><p>Slack tabs required to understand the morning</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="systems">
        <div class="frame section-grid">
          <div><span class="section-index">02 / SYSTEMS</span><p class="section-label">Built past the demo.</p></div>
          <div class="section-copy">
            <h2>The difficult part is not another chat tool. It is the operating layer underneath.</h2>
            <p>The local path combines browser-session extraction, a real credential lifecycle, full-fidelity Slack reads, guarded action tools, and automation-ready output.</p>
            <div class="systems">
              <article class="system"><span class="id">01</span><h3>Browser-session engine</h3><p>Chrome LevelDB, cookie SQLite + WAL, macOS Keychain, PBKDF2, and AES decryption—locally, with structured failure codes.</p></article>
              <article class="system"><span class="id">02</span><h3>Credential lifecycle</h3><p>Keychain-only storage, owner-only files, atomic writes, cross-process locks, health monitoring, refresh, and isolated workspace profiles.</p></article>
              <article class="system"><span class="id">03</span><h3>Full-fidelity reads</h3><p>DMs, channels, search, complete histories, threads, unread state, users, blocks, attachments, files, reactions, and metadata.</p></article>
              <article class="system"><span class="id">04</span><h3>Approved action</h3><p>Replies, reactions, and read-state changes with MCP destructive annotations so the client can gate workspace writes.</p></article>
              <article class="system"><span class="id">05</span><h3>Typed workflows</h3><p>Incident, executive, support, launch, and custom profiles that turn Slack into contract-shaped JSON rather than prompt-shaped glue.</p></article>
            </div>
          </div>
        </div>
      </section>

      <section id="paths">
        <div class="frame section-grid">
          <div><span class="section-index">03 / ACCESS</span><p class="section-label">Same workspace. Different gate.</p></div>
          <div class="section-copy">
            <h2>Slack already knows who you are.</h2>
            <p>The official path is a managed remote integration governed by workspace policy. The local path starts from the browser session you already have; the hosted path turns the same operating jobs into durable, unattended workflows.</p>
            <img class="diagram" src="docs/images/diagram-oauth-comparison.svg" alt="Two paths into Slack: a managed integration path and the local browser-session path">
            <div class="decision">
              <article class="path"><small>LOCAL / MIT / FREE</small><h3>Move now.</h3><p>One-command setup, existing browser permissions, the full current tool surface, and the runtime on your machine. Best for interactive, operator-driven work.</p><a href="{{SETUP_URL}}">Run local setup →</a></article>
              <article class="path"><small>HOSTED / PERMANENT OAUTH</small><h3>Run unattended.</h3><p>Indexed retrieval, AI triage, scheduled briefs, shared profiles, managed workspaces, and no browser-session rotation.</p><a href="{{CANONICAL_SITE_URL}}">See hosted →</a></article>
            </div>
          </div>
        </div>
      </section>

      <section class="final">
        <div class="frame final-inner">
          <p class="eyebrow">If you can read it in Slack, your agent can work from it.</p>
          <h2>Make Slack useful.<br><span>Without living in it.</span></h2>
          <div class="command-row">
            <code class="command">npx -y @jtalk22/slack-mcp --setup</code>
            <button class="copy" type="button" data-copy="npx -y @jtalk22/slack-mcp --setup">Copy</button>
          </div>
        </div>
      </section>
    </main>

    <footer class="frame">
      <div class="footer-row">
        <span>MIT · not affiliated with Slack Technologies, Inc.</span>
        <nav aria-label="Footer links"><a href="{{GITHUB_REPO_URL}}">GitHub</a><a href="{{NPM_URL}}">npm</a><a href="{{SETUP_URL}}">Setup</a><a href="{{CANONICAL_SITE_URL}}">Hosted</a><a href="mailto:{{SUPPORT_EMAIL}}">Support</a></nav>
      </div>
    </footer>
  </div>

  <script>
    const DESKTOP_VIDEO = 'docs/videos/slack-mcp-proof-42s.mp4';
    const MOBILE_VIDEO = 'docs/videos/slack-mcp-proof-20s-vertical.mp4';
    const heroVideo = document.getElementById('heroVideo');

    if (window.matchMedia('(max-width: 700px)').matches) {
      heroVideo.querySelectorAll('source').forEach((source) => source.remove());
      heroVideo.src = MOBILE_VIDEO;
      heroVideo.load();
      heroVideo.play().catch(() => {});
    }

    document.querySelectorAll('[data-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        await navigator.clipboard.writeText(button.dataset.copy);
        const previous = button.textContent;
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = previous; }, 1400);
      });
    });

    fetch('https://registry.npmjs.org/@jtalk22%2Fslack-mcp/latest')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('npm unavailable')))
      .then((data) => { document.getElementById('npmVersion').textContent = `v${data.version}`; })
      .catch(() => {});

    const downloadEnd = new Date().toISOString().slice(0, 10);
    fetch(`https://api.npmjs.org/downloads/point/2026-01-03:${downloadEnd}/%40jtalk22%2Fslack-mcp`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('downloads unavailable')))
      .then((data) => { document.getElementById('npmDownloads').textContent = `${new Intl.NumberFormat('en').format(data.downloads)} downloads since Jan`; })
      .catch(() => {});
  </script>
</body>
</html>
