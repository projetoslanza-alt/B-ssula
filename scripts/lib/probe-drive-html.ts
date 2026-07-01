import { readFileSync, writeFileSync } from "node:fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function main() {
  const res = await fetch(
    "https://drive.google.com/embeddedfolderview?id=169hCDQcHZgAJ8c0M8KcecbOtJMlpAErt",
    { headers: { "User-Agent": UA } },
  );
  const html = await res.text();
  writeFileSync(".local/course-import/drive-sample.html", html);

  const linkRe = /href="https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view[^"]*"[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  const linkMatches: string[] = [];
  while ((m = linkRe.exec(html))) linkMatches.push(`${m[1]} | ${m[2]}`);

  const ids = [...html.matchAll(/file\/d\/([^/]+)/g)].map((x) => x[1]);
  const names = [...html.matchAll(/>([^<]*\.mp4)</gi)].map((x) => x[1].trim());

  console.log("html len", html.length);
  console.log("linkRe matches", linkMatches.length, linkMatches);
  console.log("ids", ids.length, ids);
  console.log("names", names.length, names);

  const idx = html.indexOf("Aula 01");
  console.log("snippet:", html.slice(Math.max(0, idx - 150), idx + 80));
}

main();
