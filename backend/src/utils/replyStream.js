// Pulls the text of one string field (by default "reply") out of a JSON
// object while it is still arriving, so the patient's words can be shown as
// the AI writes them. Feed it each piece of raw JSON; it returns the newly
// decoded text of the field (or "" if there's nothing new). Everything else
// in the object is ignored here and checked once the whole answer is in.
const ESCAPES = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };

export function createReplyExtractor(field = "reply") {
  const opening = new RegExp(`"${field}"\\s*:\\s*"`);
  let buffer = "";
  let state = "seeking";
  let pos = 0;
  let escaped = false;
  let hex = null;

  return function push(chunk) {
    if (state === "done" || !chunk) return "";
    buffer += chunk;
    if (state === "seeking") {
      const match = opening.exec(buffer);
      if (!match) return "";
      state = "reading";
      pos = match.index + match[0].length;
    }
    let out = "";
    for (; pos < buffer.length; pos += 1) {
      const ch = buffer[pos];
      if (hex !== null) {
        hex += ch;
        if (hex.length === 4) {
          out += String.fromCharCode(Number.parseInt(hex, 16) || 0xfffd);
          hex = null;
        }
      } else if (escaped) {
        escaped = false;
        if (ch === "u") hex = "";
        else out += ESCAPES[ch] ?? ch;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        state = "done";
        break;
      } else {
        out += ch;
      }
    }
    return out;
  };
}
