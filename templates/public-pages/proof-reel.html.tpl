<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>What blew up overnight? — Slack MCP proof reel</title>
  <style>
    @font-face { font-family: "Nyght Serif"; src: url("fonts/nyght-serif-medium.woff2") format("woff2"); font-display: swap; font-weight: 500; }
    @font-face { font-family: "Nyght Serif"; src: url("fonts/nyght-serif-medium-italic.woff2") format("woff2"); font-display: swap; font-weight: 500; font-style: italic; }
    @font-face { font-family: "Roobert"; src: url("fonts/roobert-regular.woff2") format("woff2"); font-display: swap; font-weight: 400; }
    @font-face { font-family: "Roobert"; src: url("fonts/roobert-semibold.woff2") format("woff2"); font-display: swap; font-weight: 600; }
    @font-face { font-family: "Roobert Mono"; src: url("fonts/roobert-mono.woff2") format("woff2"); font-display: swap; font-weight: 400 600; }
    :root {
      color-scheme: dark;
      --ink: #0b0b0c;
      --night: #131316;
      --paper: #eeebe3;
      --paper-2: #e3e0d6;
      --stamp: #e5482f;
      --signal: #ffb224;
      --rule: rgba(238,235,227,.24);
      --display: "Nyght Serif", Georgia, "Times New Roman", serif;
      --body: "Roobert", system-ui, sans-serif;
      --mono: "Roobert Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: var(--ink); color: var(--paper); }
    body { font-family: var(--body); }
    .reel { position: relative; width: 100%; height: 100%; overflow: hidden; background: var(--ink); isolation: isolate; }
    .reel::after { content: ""; position: absolute; z-index: 50; inset: 0; pointer-events: none; opacity: .21; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
    .topbar { position: absolute; z-index: 40; top: 0; left: 0; right: 0; height: 7.5%; min-height: 58px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 18px; padding: 0 3.2%; color: var(--paper); background: var(--ink); border-bottom: 1px solid var(--rule); }
    .brand, .status, .fiction { font-family: var(--mono); font-size: clamp(9px, .68vw, 13px); letter-spacing: .12em; text-transform: uppercase; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark { width: clamp(27px, 2vw, 38px); height: clamp(27px, 2vw, 38px); border-radius: 8px; box-shadow: 0 0 0 1px rgba(255,255,255,.13); }
    .brand strong { color: var(--signal); font-weight: 400; }
    .fiction { color: #98958c; text-align: center; }
    .status { display: flex; justify-content: flex-end; align-items: center; gap: 14px; color: #a5a299; }
    .ticker { width: 11vw; height: 2px; background: #2f2f34; }
    .ticker span { display: block; width: 0; height: 100%; background: var(--stamp); }
    .scene { position: absolute; inset: 7.5% 0 0; opacity: 0; pointer-events: none; transform: scale(1.015); transition: opacity .34s ease, transform .6s cubic-bezier(.2,.75,.2,1); }
    .scene.active { opacity: 1; transform: scale(1); }
    .scene.active .rise { animation: rise .72s cubic-bezier(.16,.82,.26,1) both; }
    .scene.active .rise:nth-child(2) { animation-delay: .08s; }
    .scene.active .rise:nth-child(3) { animation-delay: .16s; }
    /* Still captures (?still=poster|final) must be end-state, never mid-animation */
    html[data-still] .scene, html[data-still] .scene.active .rise { animation: none; transition: none; }
    @keyframes rise { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .kicker { margin: 0; font: 600 clamp(10px, .72vw, 14px)/1 var(--mono); letter-spacing: .16em; text-transform: uppercase; }
    .display { margin: 0; font-family: var(--display); font-weight: 500; letter-spacing: -.015em; line-height: .94; }
    .stamp { display: inline-flex; align-items: center; gap: 10px; border: 1px solid currentColor; padding: 9px 13px; font: 600 clamp(9px, .68vw, 13px)/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; }

    .question-scene { padding: 5.2% 5.5%; background: var(--night); }
    .question-scene::before { content: "?"; position: absolute; right: 2.5%; bottom: -23%; color: rgba(229,72,47,.1); font: italic 700 min(82vw, 990px)/.72 var(--display); }
    .hero-mark { position: absolute; z-index: 4; right: 5.5%; top: 6%; width: clamp(72px, 7.4vw, 142px); border-radius: 22%; box-shadow: 14px 14px 0 rgba(0,0,0,.25); transform: rotate(3deg); }
    .question-card { position: relative; z-index: 2; width: 74%; }
    .question-card .kicker { color: var(--stamp); }
    .question-card h1 { max-width: 1180px; margin-top: 2.5%; font-size: clamp(76px, 10.1vw, 194px); font-style: italic; }
    .question-card h1::before { content: "“"; color: var(--stamp); margin-left: -.55em; margin-right: .05em; }
    .answer-slip { position: absolute; z-index: 3; right: 5.5%; bottom: 8%; width: 38%; padding: 2.1% 2.4% 2.4%; color: var(--ink); background: var(--paper); box-shadow: 16px 18px 0 var(--stamp); transform: rotate(-1.8deg); }
    .answer-slip .kicker { color: #6c6b68; }
    .answer-slip p:last-child { margin: 8% 0 0; font: italic 400 clamp(24px, 2.8vw, 54px)/1.08 var(--display); letter-spacing: -.03em; }
    .coffee { position: absolute; left: 5.5%; bottom: 7%; color: #8f8c83; font: clamp(10px, .75vw, 14px)/1 var(--mono); letter-spacing: .11em; }

    .sort-scene { padding: 4.1% 4.8%; color: var(--ink); background: var(--paper); }
    .sort-head { display: flex; justify-content: space-between; gap: 6%; align-items: flex-end; }
    .sort-head .kicker { color: #8f2f1c; }
    .sort-head h2 { max-width: 950px; margin-top: 1.5%; font-size: clamp(58px, 6.8vw, 130px); }
    .giant-count { color: var(--stamp); font: italic 400 clamp(115px, 14vw, 270px)/.66 var(--display); letter-spacing: -.03em; }
    .sort-grid { margin-top: 3.5%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.3%; }
    .signal { position: relative; min-height: 280px; padding: 2.2% 2.2% 2.5%; color: var(--paper); background: var(--ink); border-top: 8px solid var(--signal); box-shadow: 0 13px 25px rgba(10,13,18,.13); }
    .signal:nth-child(2) { transform: rotate(1.2deg) translateY(7px); border-color: var(--signal); }
    .signal:nth-child(3) { transform: rotate(-1deg) translateY(-5px); border-color: var(--paper-2); }
    .signal:nth-child(4) { transform: rotate(.6deg) translateY(9px); border-color: var(--signal); }
    .signal .channel { font: 600 clamp(16px, 1.3vw, 25px)/1 var(--body); }
    .signal .number { display: block; margin-top: 12%; font: italic 400 clamp(72px, 7.4vw, 142px)/.72 var(--display); }
    .signal .verdict { position: absolute; left: 8%; right: 8%; bottom: 9%; color: #b5b2a9; font: 600 clamp(9px, .68vw, 13px)/1.25 var(--mono); letter-spacing: .12em; text-transform: uppercase; }
    .tool-receipt { position: absolute; right: 4.8%; bottom: 3.6%; color: #555851; font: clamp(9px, .64vw, 12px)/1 var(--mono); }

    .incident-scene { padding: 4.4% 5%; background: var(--stamp); color: var(--ink); }
    .incident-layout { display: grid; grid-template-columns: 1.02fr .98fr; gap: 5.5%; height: 100%; }
    .incident-copy { display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 3%; }
    .incident-copy .kicker { color: #6e2415; }
    .incident-copy h2 { margin-top: 4%; max-width: 780px; font-size: clamp(60px, 7vw, 134px); }
    .incident-copy h2 em { color: var(--paper); font-weight: 400; }
    .incident-copy .summary { max-width: 660px; margin: 4% 0 0; font-size: clamp(17px, 1.45vw, 28px); line-height: 1.45; }
    .case-file { align-self: center; padding: 5.5% 6%; color: var(--paper); background: var(--ink); transform: rotate(.8deg); box-shadow: 18px 18px 0 rgba(90,28,15,.32); }
    .case-head { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-bottom: 4%; border-bottom: 1px solid var(--rule); color: var(--signal); font: clamp(10px, .74vw, 14px)/1 var(--mono); }
    .case-event { display: grid; grid-template-columns: 88px 1fr; gap: 6%; padding: 5.5% 0; border-bottom: 1px solid var(--rule); }
    .case-event time { color: var(--stamp); font: 600 clamp(18px, 1.65vw, 32px)/1 var(--mono); }
    .case-event strong { font-size: clamp(17px, 1.45vw, 28px); }
    .case-event p { margin: 8px 0 0; color: #aca99f; font-size: clamp(13px, 1vw, 19px); line-height: 1.45; }
    .case-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-top: 5%; }
    .case-footer .stamp { color: var(--signal); }
    .case-footer span:last-child { color: #94918a; font: clamp(9px, .68vw, 13px)/1.35 var(--mono); text-align: right; }

    .search-scene { padding: 4.2% 5%; color: var(--ink); background: var(--signal); }
    .search-scene::before { content: "SLACK ARCHAEOLOGY"; position: absolute; top: 7%; right: -2%; color: rgba(11,11,12,.08); font: 600 clamp(70px, 10vw, 190px)/.8 var(--body); letter-spacing: -.07em; transform: rotate(90deg) translateX(50%); transform-origin: right top; }
    .search-scene .kicker { color: #7a5200; }
    .search-scene h2 { margin-top: 1.7%; max-width: 1200px; font-size: clamp(54px, 6.6vw, 126px); }
    .query { margin-top: 2.7%; width: 84%; padding: 1.7% 2.2%; color: var(--paper); background: var(--ink); font: clamp(17px, 1.5vw, 29px)/1.25 var(--mono); box-shadow: 12px 12px 0 rgba(120,80,0,.28); }
    .query::before { content: "ASKED  "; color: var(--stamp); }
    .finding { position: relative; width: 72%; margin: 2.7% 0 0 8%; padding: 2.6% 3% 3%; background: var(--paper); border: 2px solid var(--ink); transform: rotate(-.7deg); }
    .finding blockquote { margin: 0; font: italic 400 clamp(28px, 3vw, 58px)/1.08 var(--display); letter-spacing: -.03em; }
    .finding footer { margin-top: 2.6%; color: #656762; font: 600 clamp(9px, .7vw, 13px)/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }
    .found-note { position: absolute; right: -21%; top: 17%; width: 22%; padding: 2.4%; color: var(--paper); background: var(--stamp); font: 600 clamp(10px, .8vw, 15px)/1.35 var(--mono); text-transform: uppercase; transform: rotate(3deg); }

    .action-scene { padding: 4.2% 5%; background: var(--night); }
    .action-head { display: grid; grid-template-columns: 1.22fr .78fr; gap: 6%; align-items: end; }
    .action-head .kicker { color: var(--signal); }
    .action-head h2 { margin-top: 1.5%; font-size: clamp(64px, 7.8vw, 150px); color: var(--paper); }
    .action-head p { margin: 0 0 3%; color: #aca99f; font-size: clamp(16px, 1.35vw, 26px); line-height: 1.5; }
    .action-head p strong { color: var(--signal); }
    .velvet { position: relative; margin-top: 4%; border-top: 4px solid var(--stamp); }
    .velvet::before, .velvet::after { content: ""; position: absolute; top: -16px; width: 25px; height: 25px; border-radius: 50%; background: var(--signal); border: 6px solid var(--ink); }
    .velvet::before { left: -2px; } .velvet::after { right: -2px; }
    .tickets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5%; margin-top: 2.5%; }
    .ticket { min-height: 245px; padding: 2.6%; color: var(--ink); background: var(--paper); border-left: 9px solid var(--stamp); }
    .ticket:nth-child(2) { transform: translateY(12px); }
    .ticket h3 { margin: 7% 0 0; font: italic 400 clamp(28px, 2.7vw, 52px)/1 var(--display); letter-spacing: -.03em; }
    .ticket code { display: block; margin-top: 8%; color: #555851; font-size: clamp(9px, .72vw, 14px); }
    .ticket .stamp { margin-top: 8%; color: #8a5f00; background: rgba(255,178,36,.15); }

    .systems-scene { padding: 4.1% 5%; background: var(--ink); }
    .systems-head { display: flex; justify-content: space-between; gap: 7%; align-items: end; }
    .systems-head .kicker { color: var(--signal); }
    .systems-head h2 { margin-top: 1.5%; max-width: 1080px; font-size: clamp(54px, 6.2vw, 118px); }
    .systems-head p { width: 28%; margin: 0 0 1%; color: #aca99f; font-size: clamp(14px, 1.14vw, 22px); line-height: 1.5; }
    .pipeline { margin-top: 3.6%; display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr; align-items: stretch; gap: 1.25%; }
    .pipe-card { min-height: 235px; padding: 9% 8%; color: var(--ink); background: var(--paper); border-top: 8px solid var(--stamp); }
    .pipe-card:nth-of-type(3) { border-color: var(--signal); }
    .pipe-card:nth-of-type(5) { border-color: var(--signal); }
    .pipe-card:nth-of-type(7) { color: var(--paper); background: #1b1b1f; border-color: var(--signal); }
    .pipe-card .step { color: #7d7c75; font: 600 clamp(9px, .65vw, 12px)/1 var(--mono); letter-spacing: .12em; }
    .pipe-card h3 { margin: 11% 0 0; font: italic 400 clamp(25px, 2.2vw, 42px)/1 var(--display); }
    .pipe-card code { display: block; margin-top: 12%; color: #63655f; font-size: clamp(9px, .7vw, 13px); line-height: 1.6; }
    .pipe-card:nth-of-type(7) code { color: var(--signal); }
    .pipe-arrow { align-self: center; color: var(--stamp); font: italic 400 clamp(25px, 2.4vw, 46px)/1 var(--display); }
    .system-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 2.6%; }
    .system-tags span { padding: 8px 11px; border: 1px solid #3f3f45; color: #a8a59c; font: 600 clamp(8px, .62vw, 12px)/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; }

    .final-scene { display: flex; align-items: center; padding: 3.7% 5%; color: var(--ink); background: var(--paper); }
    .final-grid { width: 100%; display: grid; grid-template-columns: .88fr 1.12fr; gap: 6%; align-items: center; }
    .math { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: center; gap: 2.5%; }
    .number strong { display: block; font: italic 400 clamp(118px, 15vw, 288px)/.72 var(--display); letter-spacing: -.03em; }
    .number:first-child strong { color: var(--stamp); }
    .number.brief strong { color: #8f6300; }
    .number.clear strong { color: #b03a20; }
    .number span { display: block; margin-top: 13%; color: #656762; font: 600 clamp(9px, .7vw, 14px)/1 var(--mono); letter-spacing: .14em; text-align: center; }
    .math-arrow { font: italic 400 clamp(35px, 4vw, 78px)/1 var(--display); }
    .final-copy .kicker { color: #9b2f1a; }
    .final-copy h2 { margin-top: 2%; font-size: clamp(57px, 6.2vw, 118px); }
    .final-command { margin-top: 5%; padding: 2.5% 3%; color: var(--signal); background: var(--ink); font: clamp(15px, 1.35vw, 26px)/1.25 var(--mono); box-shadow: 10px 10px 0 var(--stamp); }
    .final-foot { display: flex; justify-content: space-between; gap: 18px; margin-top: 5%; color: #5e615c; font: 600 clamp(9px, .69vw, 13px)/1.4 var(--mono); letter-spacing: .08em; text-transform: uppercase; }

    @media (max-aspect-ratio: 3/4) {
      .topbar { height: 5%; min-height: 76px; padding-inline: 5.5%; grid-template-columns: 1fr auto; }
      .fiction { display: none; }
      .ticker { display: none; }
      .scene { inset: 5% 0 0; }
      .question-scene { padding: 12% 7%; }
      .question-card { width: 100%; }
      .hero-mark { top: 4.5%; right: 7%; width: clamp(82px, 17vw, 180px); }
      .question-card h1 { margin-top: 8%; font-size: clamp(76px, 20vw, 220px); line-height: .91; }
      .question-card h1::before { margin-left: 0; }
      .answer-slip { right: 7%; bottom: 12%; width: 72%; padding: 5.5%; box-shadow: 12px 14px 0 var(--stamp); }
      .answer-slip p:last-child { font-size: clamp(30px, 7.2vw, 74px); }
      .coffee { left: 7%; bottom: 5%; }
      .sort-scene { padding: 8% 6%; }
      .sort-head { align-items: flex-start; }
      .sort-head h2 { font-size: clamp(54px, 12.5vw, 130px); }
      .giant-count { font-size: clamp(100px, 25vw, 250px); }
      .sort-grid { margin-top: 8%; grid-template-columns: 1fr 1fr; gap: 3.5%; }
      .signal { min-height: 290px; padding: 7%; }
      .signal .number { font-size: clamp(75px, 18vw, 180px); }
      .tool-receipt { left: 6%; right: auto; bottom: 3%; }
      .incident-scene { padding: 9% 6%; }
      .incident-layout { grid-template-columns: 1fr; gap: 4%; }
      .incident-copy { display: block; }
      .incident-copy h2 { font-size: clamp(54px, 12vw, 125px); }
      .incident-copy .summary { font-size: clamp(18px, 4vw, 40px); }
      .case-file { padding: 5%; align-self: stretch; }
      .case-event { grid-template-columns: 105px 1fr; }
      .case-event:nth-of-type(3) { display: none; }
      .search-scene { padding: 10% 6%; }
      .search-scene h2 { margin-top: 5%; font-size: clamp(55px, 12.5vw, 132px); }
      .query { width: 100%; margin-top: 8%; padding: 5%; font-size: clamp(16px, 3.5vw, 38px); }
      .finding { width: 94%; margin: 8% 0 0 3%; padding: 6%; }
      .finding blockquote { font-size: clamp(29px, 6.5vw, 70px); }
      .found-note { position: static; width: 62%; margin: 7% 0 0 auto; padding: 4%; }
      .action-scene { padding: 9% 6%; }
      .action-head { grid-template-columns: 1fr; }
      .action-head h2 { font-size: clamp(64px, 15vw, 160px); }
      .tickets { grid-template-columns: 1fr; gap: 2.3%; }
      .ticket { min-height: 180px; padding: 4.5%; display: grid; grid-template-columns: 1fr auto; gap: 3%; align-items: center; }
      .ticket:nth-child(2) { transform: none; }
      .ticket h3, .ticket code, .ticket .stamp { margin: 0; }
      .ticket code { grid-column: 1; }
      .ticket .stamp { grid-column: 2; grid-row: 1 / span 2; }
      .systems-scene { padding: 9% 6%; }
      .systems-head { display: block; }
      .systems-head h2 { margin-top: 5%; font-size: clamp(55px, 12.5vw, 132px); }
      .systems-head p { width: 100%; margin-top: 5%; font-size: clamp(17px, 3.8vw, 40px); }
      .pipeline { margin-top: 8%; grid-template-columns: 1fr 1fr; gap: 3%; }
      .pipe-arrow { display: none; }
      .pipe-card { min-height: 230px; padding: 7%; }
      .pipe-card h3 { font-size: clamp(28px, 6vw, 64px); }
      .pipe-card code { font-size: clamp(10px, 2.25vw, 24px); }
      .system-tags span { font-size: clamp(8px, 1.75vw, 18px); }
      .final-scene { padding: 8% 6%; }
      .final-grid { grid-template-columns: 1fr; gap: 10%; }
      .number strong { font-size: clamp(110px, 27vw, 270px); }
      .final-copy h2 { font-size: clamp(58px, 13vw, 135px); }
      .final-command { padding: 5%; font-size: clamp(14px, 3vw, 32px); }
      .final-foot { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="reel" id="reel">
    <header class="topbar">
      <div class="brand"><img class="brand-mark" src="../docs/assets/icon.svg" alt="">SLACK MCP <strong>/ THE RECEIPTS CUT</strong></div>
      <div class="fiction">SIMULATED WORKSPACE · SHIPPED TOOLS</div>
      <div class="status"><span id="timecode">00:00</span><span class="ticker"><span id="progress"></span></span></div>
    </header>

    <section class="scene question-scene active" data-scene="0">
      <img class="hero-mark rise" src="../docs/assets/icon.svg" alt="">
      <div class="question-card">
        <p class="kicker rise">Monday / 09:07 / laptop barely open</p>
        <h1 class="display rise">What blew up overnight?</h1>
      </div>
      <aside class="answer-slip rise">
        <p class="kicker">Agent / already reading</p>
        <p>A database, a runbook’s credibility, and—somehow—the printer queue.</p>
      </aside>
      <span class="coffee">COFFEE: AUTH PENDING · CHROME: SESSION FOUND</span>
    </section>

    <section class="scene sort-scene" data-scene="1">
      <div class="sort-head rise">
        <div><p class="kicker">slack_conversations_unreads / complete</p><h2 class="display">Most notifications<br>are not news.</h2></div>
        <div class="giant-count">47</div>
      </div>
      <div class="sort-grid rise">
        <article class="signal"><span class="channel">#incidents</span><strong class="number">23</strong><span class="verdict">Actually on fire</span></article>
        <article class="signal"><span class="channel">#engineering</span><strong class="number">14</strong><span class="verdict">The post-mortem pre-mortem</span></article>
        <article class="signal"><span class="channel">#product</span><strong class="number">8</strong><span class="verdict">A decision hid here</span></article>
        <article class="signal"><span class="channel">DM · Lena</span><strong class="number">2</strong><span class="verdict">An actual human</span></article>
      </div>
      <span class="tool-receipt">4 conversations · 47 unread · 0 Slack tabs opened</span>
    </section>

    <section class="scene incident-scene" data-scene="2">
      <div class="incident-layout">
        <div class="incident-copy rise">
          <div><p class="kicker">The useful part / with receipts</p><h2 class="display">The database fell over. Kai picked it up. The <em>runbook lied.</em></h2><p class="summary">Its automatic failover step was, technically speaking, “a myth.” At 3 AM. Love that energy.</p></div>
          <span class="stamp">P1 first · noise second</span>
        </div>
        <aside class="case-file rise">
          <div class="case-head"><span>slack_conversations_history</span><span>rich fields: on</span></div>
          <article class="case-event"><time>02:14</time><div><strong>PagerDuty / attachment recovered</strong><p>RDS connection pool exhausted. Primary database unreachable.</p></div></article>
          <article class="case-event"><time>02:22</time><div><strong>Kai Nakamura</strong><p>On it. Pulling up the runbook.</p></div></article>
          <article class="case-event"><time>03:47</time><div><strong>Resolved</strong><p>Pool limits corrected. Step 4 in the runbook is still wrong.</p></div></article>
          <div class="case-footer"><span class="stamp">Resolved / 03:47</span><span>OWNER: KAI<br>OPEN RISK: STALE RUNBOOK</span></div>
        </aside>
      </div>
    </section>

    <section class="scene search-scene" data-scene="3">
      <p class="kicker rise">slack_search_messages / five months of workspace history</p>
      <h2 class="display rise">Five months. Three people. One printer.</h2>
      <div class="query rise">printer admin PIN 3rd floor</div>
      <article class="finding rise">
        <blockquote>“The admin PIN for the 3rd floor printer is 4729.”</blockquote>
        <footer>#facilities · Dave from IT · October 12 · zero reactions</footer>
        <aside class="found-note">Posted so nobody had to ask again.<br>Naturally.</aside>
      </article>
    </section>

    <section class="scene action-scene" data-scene="4">
      <div class="action-head rise">
        <div><p class="kicker">Write paths / behind the velvet rope</p><h2 class="display">Send nothing weird.</h2></div>
        <p>Reads can run. <strong>Replies, reactions, and read-state changes stay explicitly gated</strong> so the client controls the consequential part.</p>
      </div>
      <div class="velvet rise"></div>
      <div class="tickets rise">
        <article class="ticket"><div><p class="kicker">01 / Reply</p><h3>Send Lena the printer PIN.</h3><code>slack_send_message</code></div><span class="stamp">Approval gate</span></article>
        <article class="ticket"><div><p class="kicker">02 / React</p><h3>Acknowledge Kai’s 3 AM heroics.</h3><code>slack_add_reaction</code></div><span class="stamp">Approval gate</span></article>
        <article class="ticket"><div><p class="kicker">03 / Clear</p><h3>Mark the handled channels read.</h3><code>slack_conversations_mark</code></div><span class="stamp">Approval gate</span></article>
      </div>
    </section>

    <section class="scene systems-scene" data-scene="5">
      <div class="systems-head rise"><div><p class="kicker">Under the hood / because sessions rotate</p><h2 class="display">The part that keeps working tomorrow.</h2></div><p>The joke stops at credential handling. Extraction, decryption, health, refresh, and storage are a real lifecycle.</p></div>
      <div class="pipeline rise">
        <article class="pipe-card"><span class="step">01 / CHROME PROFILE</span><h3>Find the session.</h3><code>LevelDB → xoxc<br>newest record first</code></article><span class="pipe-arrow">→</span>
        <article class="pipe-card"><span class="step">02 / COOKIE STORE</span><h3>Recover the pair.</h3><code>SQLite + WAL → xoxd<br>locked DB snapshot</code></article><span class="pipe-arrow">→</span>
        <article class="pipe-card"><span class="step">03 / KEYCHAIN</span><h3>Decrypt locally.</h3><code>PBKDF2 + AES-128-CBC<br>no clipboard detour</code></article><span class="pipe-arrow">→</span>
        <article class="pipe-card"><span class="step">04 / LOCAL STDIO</span><h3>Use 21 tools.</h3><code>DMs · search · threads<br>actions · workflows</code></article>
      </div>
      <div class="system-tags rise"><span>automatic refresh</span><span>keychain-only mode</span><span>atomic writes</span><span>cross-process locks</span><span>workspace profiles</span><span>structured failure codes</span></div>
    </section>

    <section class="scene final-scene" data-scene="6">
      <div class="final-grid">
        <div class="math rise"><div class="number"><strong>47</strong><span>UNREAD</span></div><span class="math-arrow">→</span><div class="number brief"><strong>1</strong><span>BRIEF / WITH RECEIPTS</span></div><span class="math-arrow">→</span><div class="number clear"><strong>0</strong><span>AFTER APPROVAL</span></div></div>
        <div class="final-copy rise"><p class="kicker">Your Slack / your agent / no permission slip</p><h2 class="display">You ask once. It does the scrolling.</h2><div class="final-command">npx -y @jtalk22/slack-mcp --setup</div><div class="final-foot"><span>21 Slack tools · any stdio MCP client</span><span>No app registration · no admin queue</span></div></div>
      </div>
    </section>
  </main>

  <script>
    const params = new URLSearchParams(location.search);
    const short = params.has('short');
    const still = params.get('still');
    const marks = short ? [0, 1500, 4600, 7800, 10900, 14000, 17200, 20000] : [0, 3200, 10000, 17800, 25000, 31000, 37000, 42000];
    const scenes = Array.from(document.querySelectorAll('.scene'));
    const progress = document.getElementById('progress');
    const timecode = document.getElementById('timecode');
    let startedAt = null;
    let finished = false;

    function render(elapsed) {
      const duration = marks.at(-1);
      const bounded = Math.max(0, Math.min(elapsed, duration));
      let active = scenes.length - 1;
      for (let i = 0; i < marks.length - 1; i++) {
        if (bounded < marks[i + 1]) { active = i; break; }
      }
      scenes.forEach((scene, index) => scene.classList.toggle('active', index === active));
      progress.style.width = `${(bounded / duration) * 100}%`;
      const seconds = Math.floor(bounded / 1000);
      timecode.textContent = `00:${String(seconds).padStart(2, '0')}`;
      document.documentElement.dataset.scene = String(active);
    }

    function tick(now) {
      if (startedAt === null) startedAt = now;
      const elapsed = now - startedAt;
      render(elapsed);
      if (elapsed < marks.at(-1)) {
        requestAnimationFrame(tick);
      } else if (!finished) {
        finished = true;
        document.body.classList.add('reel-complete');
      }
    }

    if (still === 'final') {
      document.documentElement.dataset.still = '1';
      render(marks.at(-1) - 1);
      document.body.classList.add('reel-complete');
    } else if (still === 'poster') {
      document.documentElement.dataset.still = '1';
      render(1400);
      document.body.classList.add('reel-complete');
    } else {
      requestAnimationFrame(tick);
    }

    window.REEL_DURATION_MS = marks.at(-1);
    window.REEL_READY = true;
  </script>
</body>
</html>
