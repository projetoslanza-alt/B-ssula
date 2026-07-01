import re
import urllib.request

folder = "169hCDQcHZgAJ8c0M8KcecbOtJMlpAErt"
url = f"https://drive.google.com/drive/folders/{folder}"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "ignore")
print("html len", len(html))

blocks = re.findall(r'aria-label="([^"]+\.mp4[^"]*)"[^>]*ssk=\'([^\']+)', html)
print("blocks", len(blocks))
for b in blocks:
    print(b)

ids = re.findall(r'data-id="([^"]+)"', html)
print("data-id count", len(ids), ids[:10])

# try embeddedfolderview
url2 = f"https://drive.google.com/embeddedfolderview?id={folder}"
html2 = urllib.request.urlopen(urllib.request.Request(url2, headers={"User-Agent": "Mozilla/5.0"}), timeout=60).read().decode("utf-8", "ignore")
print("embedded len", len(html2))
links = re.findall(r'href="(https://drive.google.com/file/d/[^"]+)"', html2)
print("links", len(links), links[:5])
