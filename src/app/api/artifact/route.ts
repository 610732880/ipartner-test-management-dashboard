import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

function contentTypeFor(pathname: string) {
  const extension = pathname.split(".").pop()?.toLowerCase();
  return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", html: "text/html; charset=utf-8", json: "application/json" } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream";
}

function proxiedReportHtml(html: string, reportPath: string) {
  const directory = reportPath.slice(0, reportPath.lastIndexOf("/") + 1);
  const proxied = html.replace(/\b(src|href)="([^"#][^"]*\.(?:png|jpe?g|webp|gif))"/gi, (match, attribute, value) => {
    if (/^(https?:|data:|\/)/i.test(value)) return match;
    const artifactPath = `${directory}${value.replace(/^\.\//, "")}`;
    return `${attribute}="/api/artifact?path=${encodeURIComponent(artifactPath)}"`;
  });
  const viewer = `<style>#dashboard-image-viewer{position:fixed;inset:0;z-index:9999;display:none;place-items:center;padding:32px;background:rgba(5,15,30,.82)}#dashboard-image-viewer.open{display:grid}#dashboard-image-viewer img{max-width:96vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 12px 48px #000}#dashboard-image-viewer button{position:absolute;top:18px;right:22px;width:42px;height:42px;border:0;border-radius:50%;background:#fff;color:#172033;font-size:30px;line-height:1;cursor:pointer}</style><div id="dashboard-image-viewer" role="dialog" aria-modal="true" aria-label="图片预览"><button type="button" aria-label="关闭图片预览">×</button><img alt="" /></div><script>(function(){var viewer=document.getElementById('dashboard-image-viewer'),image=viewer.querySelector('img'),close=viewer.querySelector('button');function hide(){viewer.classList.remove('open');image.removeAttribute('src')}document.querySelectorAll('a.shot').forEach(function(link){link.addEventListener('click',function(event){event.preventDefault();var picture=link.querySelector('img');image.src=picture.currentSrc||picture.src;image.alt=picture.alt||'';viewer.classList.add('open')})});close.addEventListener('click',hide);viewer.addEventListener('click',function(event){if(event.target===viewer)hide()});document.addEventListener('keydown',function(event){if(event.key==='Escape')hide()})})();</script>`;
  return proxied.includes("</body>") ? proxied.replace("</body>", `${viewer}</body>`) : `${proxied}${viewer}`;
}

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("path");
  if (!pathname?.startsWith("runs/") || pathname.includes("..")) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  const result = await get(pathname, { access: "private" });
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Older uploads made by PowerShell can arrive as application/octet-stream.
  // Prefer the pathname for report/screenshot types so browsers render them inline.
  const storedType = result.blob.contentType;
  const contentType = storedType && storedType !== "application/octet-stream" ? storedType : contentTypeFor(pathname);
  if (pathname.toLowerCase().endsWith(".html")) {
    const html = await new Response(result.stream).text();
    return new Response(proxiedReportHtml(html, pathname), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, max-age=300" } });
  }
  return new Response(result.stream, { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" } });
}
