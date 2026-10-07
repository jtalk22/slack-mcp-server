// The web dashboard's API key is a bearer for the local server's Slack
// session. These run the page's own script against stub browser storage: the
// key lives in sessionStorage only, and a key an earlier version remembered in
// localStorage is moved out of it on the next load.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML = readFileSync(join(ROOT, "public", "index.html"), "utf-8");
const SCRIPT = HTML.match(/<script>([\s\S]*?)<\/script>/)[1];

function stubStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); },
    contents: () => Object.fromEntries(data),
  };
}

function stubElement() {
  return {
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    classList: { add() {}, remove() {} },
    focus() {},
    addEventListener() {},
  };
}

function loadDashboard({ search = "", session = {}, local = {} } = {}) {
  const elements = new Map();
  const page = {
    sessionStorage: stubStorage(session),
    localStorage: stubStorage(local),
    URLSearchParams,
    window: { location: { search, pathname: "/" } },
    history: { replaceState() {} },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, stubElement());
        return elements.get(id);
      },
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    // connect() runs on load; its request stays pending so no handler fires.
    fetch: () => new Promise(() => {}),
  };
  vm.createContext(page);
  vm.runInContext(SCRIPT, page);
  return page;
}

test("the dashboard never writes the API key to localStorage", () => {
  assert.doesNotMatch(SCRIPT, /localStorage\.setItem/);
  assert.doesNotMatch(HTML, /rememberApiKey/);
});

test("a key entered in the modal is held in sessionStorage only", () => {
  const page = loadDashboard();
  page.document.getElementById("modalApiKey").value = "smcp_entered";
  page.submitApiKey();
  assert.deepEqual(page.sessionStorage.contents(), { slackApiKey: "smcp_entered" });
  assert.deepEqual(page.localStorage.contents(), {});
});

test("a magic-link key is held in sessionStorage only", () => {
  const page = loadDashboard({ search: "?key=smcp_link" });
  assert.deepEqual(page.sessionStorage.contents(), { slackApiKey: "smcp_link" });
  assert.deepEqual(page.localStorage.contents(), {});
});

test("a key an earlier version left in localStorage moves to sessionStorage", () => {
  const page = loadDashboard({ local: { slackApiKey: "smcp_legacy" } });
  assert.deepEqual(page.sessionStorage.contents(), { slackApiKey: "smcp_legacy" });
  assert.deepEqual(page.localStorage.contents(), {});
});

test("a leftover localStorage key is deleted even when the tab already has one", () => {
  const page = loadDashboard({
    session: { slackApiKey: "smcp_tab" },
    local: { slackApiKey: "smcp_legacy" },
  });
  assert.deepEqual(page.sessionStorage.contents(), { slackApiKey: "smcp_tab" });
  assert.deepEqual(page.localStorage.contents(), {});
});
