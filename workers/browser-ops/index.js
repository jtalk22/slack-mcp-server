import puppeteer from "@cloudflare/puppeteer";

function unauthorized() {
  return new Response(JSON.stringify({ status: "error", code: "unauthorized" }, null, 2), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function badRequest(message) {
  return new Response(JSON.stringify({ status: "error", code: "bad_request", message }, null, 2), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const key = env.BROWSER_OPS_KEY;
    if (key && request.headers.get("x-browser-key") !== key) {
      return unauthorized();
    }

    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    const mode = (url.searchParams.get("mode") || "title").toLowerCase();

    if (!target) {
      return badRequest("Missing query parameter: url");
    }

    const browser = await puppeteer.launch(env.BROWSER);
    try {
      const page = await browser.newPage();
      await page.goto(target, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      if (mode === "title") {
        const title = await page.title();
        return new Response(JSON.stringify({ status: "ok", mode, url: target, title }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      }

      if (mode === "content") {
        const content = await page.content();
        return new Response(content, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }

      if (mode === "text") {
        const text = await page.evaluate(() => document.body?.innerText || "");
        return new Response(JSON.stringify({ status: "ok", mode, url: target, text }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      }

      if (mode === "links") {
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll("a[href]"))
            .map((a) => ({ href: a.href, text: (a.textContent || "").trim() }))
            .filter((a) => a.href)
        );
        return new Response(JSON.stringify({ status: "ok", mode, url: target, count: links.length, links }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      }

      if (mode === "screenshot") {
        const image = await page.screenshot({
          type: "png",
          fullPage: true,
        });
        return new Response(image, {
          headers: {
            "content-type": "image/png",
            "cache-control": "no-store",
          },
        });
      }

      return badRequest(`Unsupported mode: ${mode}`);
    } catch (error) {
      return new Response(
        JSON.stringify({ status: "error", code: "browser_failure", message: String(error?.message || error) }, null, 2),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    } finally {
      await browser.close();
    }
  },
};
