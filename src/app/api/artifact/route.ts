import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("path");
  if (!pathname?.startsWith("runs/") || pathname.includes("..")) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  const result = await get(pathname, { access: "private" });
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return new Response(result.stream, { headers: { "Content-Type": result.blob.contentType ?? "application/octet-stream", "Content-Disposition": result.blob.contentDisposition } });
}
