// The key check for slack-browser-ops. It fails closed: with BROWSER_OPS_KEY
// unset, every request is refused, because an unset key once meant "anyone may
// drive the browser". The compare runs in constant time
// (crypto.subtle.timingSafeEqual, the Workers runtime's own), and unequal
// lengths are compared against themselves so the length of the key does not
// leak through timing either.

const encoder = new TextEncoder();

export function keyMatches(provided, expected) {
  const given = encoder.encode(provided || "");
  const secret = encoder.encode(expected);
  return given.byteLength === secret.byteLength
    ? crypto.subtle.timingSafeEqual(given, secret)
    : !crypto.subtle.timingSafeEqual(given, given);
}

function refuse(status, code, message) {
  return new Response(JSON.stringify({ status: "error", code, message }, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Returns a refusal Response, or null when the request may proceed.
export function checkKey(request, env) {
  const key = env?.BROWSER_OPS_KEY;
  if (!key) {
    return refuse(503, "not_configured", "BROWSER_OPS_KEY is not set on this Worker; every request is refused until it is.");
  }
  if (!keyMatches(request.headers.get("x-browser-key"), key)) {
    return refuse(401, "unauthorized", "Missing or wrong x-browser-key header.");
  }
  return null;
}
