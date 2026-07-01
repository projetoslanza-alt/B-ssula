import fs from "node:fs";

function extractBalanced(css, startIdx) {
  const brace = css.indexOf("{", startIdx);
  if (brace === -1) return null;
  let depth = 1;
  let j = brace + 1;
  while (j < css.length && depth > 0) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") depth--;
    j++;
  }
  return { start: startIdx, end: j, innerStart: brace + 1, innerEnd: j - 1 };
}

function removeKeyframes(css) {
  const blocks = [];
  let out = css;
  while (true) {
    const idx = out.indexOf("@keyframes");
    if (idx === -1) break;
    const bal = extractBalanced(out, idx);
    if (!bal) break;
    blocks.push(out.slice(bal.start, bal.end));
    out = out.slice(0, bal.start) + out.slice(bal.end);
  }
  return { css: out, keyframes: blocks };
}

function scopeSelectors(css) {
  const parts = [];
  let i = 0;
  while (i < css.length) {
    if (css[i] === "@") {
      const at = css.indexOf("{", i);
      const bal = extractBalanced(css, i);
      if (!bal) break;
      const head = css.slice(i, at).trim();
      const body = css.slice(bal.innerStart, bal.innerEnd);
      if (head.startsWith("@media")) parts.push(`${head}{${scopeSelectors(body)}}`);
      else parts.push(css.slice(i, bal.end));
      i = bal.end;
      continue;
    }
    const nextAt = css.indexOf("@", i);
    const nextBrace = css.indexOf("{", i);
    if (nextBrace === -1) {
      parts.push(css.slice(i));
      break;
    }
    if (nextAt !== -1 && nextAt < nextBrace) {
      i = nextAt;
      continue;
    }
    const sel = css.slice(i, nextBrace).trim();
    const bal = extractBalanced(css, i);
    const body = css.slice(bal.innerStart, bal.innerEnd);
    if (!sel) {
      i = bal.end;
      continue;
    }
    const scoped = sel
      .split(",")
      .map((p) => {
        p = p.trim();
        if (!p) return p;
        if (p.startsWith(".dark-executive-app")) return p;
        if (p === "*") return ".dark-executive-app *";
        if (p === "html") return "html";
        if (/^(button|input|select|textarea|a|label|table|th|td|tr)$/.test(p)) {
          return `.dark-executive-app ${p}`;
        }
        return `.dark-executive-app ${p}`;
      })
      .join(", ");
    parts.push(`${scoped} {${body}}`);
    i = bal.end;
  }
  return parts.join("\n\n");
}

const html = fs.readFileSync("docs/design/bussola-dark-executive-gamificacao.html", "utf8");
let css = html.match(/<style>([\s\S]*?)<\/style>/)[1];

const bodyMatch = css.match(/body\s*\{([\s\S]*?)\}/);
const bodyInner = bodyMatch ? bodyMatch[1].trim() : "";
css = css.replace(/body\s*\{[\s\S]*?\}/, "");

const kf = removeKeyframes(css);
css = kf.css;

css = css.replace(/:root\s*\{([\s\S]*?)\}/, (_, vars) => {
  const cleanedBody = bodyInner
    .replace(/margin:\s*0;?/, "")
    .replace(/font-family:[^;]+;?/, "")
    .trim();
  return `.dark-executive-app {\n${vars.trim()}\n${cleanedBody}\nfont-family: var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif;\n}`;
});

const scoped = scopeSelectors(css);
const out = `/* Ported from docs/design/bussola-dark-executive-gamificacao.html */\n\n${scoped}\n\n${kf.keyframes.join("\n\n")}\n`;
fs.writeFileSync("src/styles/dark-executive-reference.css", out);

const issues = [
  out.match(/^\.hero/m),
  out.match(/\.dark-executive-app to /m),
  out.match(/\.dark-executive-app \}/m),
].filter(Boolean);
console.log("written", out.length, "issues", issues.length);
