import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

function contentTypeFor(pathname: string) {
  const extension = pathname.split(".").pop()?.toLowerCase();
  return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", html: "text/html; charset=utf-8", json: "application/json" } as Record<string, string>)[extension ?? ""] ?? "application/octet-stream";
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
  return new Response(result.stream, { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300" } });
}
