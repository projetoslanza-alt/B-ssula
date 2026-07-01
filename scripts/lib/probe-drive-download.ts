import { writeFileSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const fileId = "18rYoDr0Fy0OtXcIQETf8RyrGx4MEVq3-";
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  const html = await res.text();
  writeFileSync(".local/course-import/download-warning.html", html);
  console.log("final url", res.url);
  console.log("cookies", res.headers.getSetCookie?.() ?? "n/a");

  const patterns = [
    /confirm=([0-9A-Za-z_]+)/g,
    /uuid=([0-9a-f-]{36})/g,
    /downloadUrl":"([^"]+)"/g,
    /href="([^"]*export=download[^"]*)"/g,
    /id="download-form"[^>]*action="([^"]+)"/g,
  ];
  for (const p of patterns) {
    const m = [...html.matchAll(p)];
    if (m.length) console.log(p.source, m.slice(0, 3));
  }
}

main();
