/**
 * The browser-origin allowlist for the HTTP transport
 * (SLACK_MCP_HTTP_ALLOWED_ORIGINS, comma-separated).
 *
 * An entry is either an exact origin (`https://app.example.com`) or a scheme
 * wildcard, `<scheme>://*` in lowercase, which admits every origin of one
 * non-web scheme. The wildcard exists for MCP clients that run as browser
 * extensions: Firefox gives an extension a different ID on every install, so
 * `moz-extension://<id>` cannot be listed ahead of time. The rule is the one
 * `@modelcontextprotocol/server` 2.3.0 adopted for its own origin validation:
 * `http://*` and `https://*` are not honoured, because a wildcard over the web
 * would admit every website. List websites one origin at a time.
 *
 * The allowlist governs browser requests only. A request with no Origin header
 * is not a browser request and is checked by the bearer token alone.
 */

const SCHEME_WILDCARD = /^([a-z][a-z0-9+.-]*):\/\/\*$/;
const WEB_SCHEMES = new Set(["http", "https"]);

/** Parse the raw env value into exact origins, wildcard schemes and refused entries. */
export function parseAllowedOrigins(raw) {
  const exact = new Set();
  const schemes = new Set();
  const refused = [];
  for (const entry of String(raw ?? "").split(",").map((part) => part.trim()).filter(Boolean)) {
    const wildcard = SCHEME_WILDCARD.exec(entry);
    if (wildcard) {
      if (WEB_SCHEMES.has(wildcard[1])) {
        refused.push({ entry, reason: "a wildcard over http or https would admit every website; list each origin" });
      } else {
        schemes.add(`${wildcard[1]}:`);
      }
      continue;
    }
    if (entry.includes("*")) {
      refused.push({ entry, reason: "the only wildcard form is a lowercase <scheme>://* for a non-web scheme" });
      continue;
    }
    exact.add(entry);
  }
  return { exact, schemes, refused };
}

/** Whether a browser request's Origin header is on the allowlist. */
export function isOriginAllowed(origin, allow) {
  if (!origin) return false;
  if (allow.exact.has(origin)) return true;
  if (allow.schemes.size === 0) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  // A real Origin is exactly scheme://host[:port]: no path, query or fragment,
  // and never the opaque `null` an origin-less context sends.
  if (!url.hostname || origin !== `${url.protocol}//${url.host}`) return false;
  if (WEB_SCHEMES.has(url.protocol.slice(0, -1))) return false;
  return allow.schemes.has(url.protocol);
}

/** The allowlist as one line for the startup log. */
export function describeAllowedOrigins(allow) {
  return [...allow.exact, ...[...allow.schemes].map((scheme) => `${scheme}//*`)].join(", ");
}
