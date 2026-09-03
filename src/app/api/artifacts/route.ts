import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { expiryFor } from "@/lib/retention";

export async function POST(request: Request) {
  const secret = process.env.TEST_DASHBOARD_UPLOAD_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const runId = request.headers.get("x-run-id");
  const status = request.headers.get("x-run-status") ?? "PASS";
  const relativePath = request.headers.get("x-relative-path");
  if (!(file instanceof File) || !runId || !relativePath || relativePath.includes("..")) return NextResponse.json({ error: "Invalid artifact" }, { status: 400 });
  const expiry = expiryFor(status).slice(0, 10);
  const pathname = `runs/${expiry}/${runId}/artifacts/${relativePath.replaceAll("\\", "/")}`;
  try {
    const blob = await put(pathname, file, { access: "private", addRandomSuffix: false, contentType: file.type || "application/octet-stream" });
    return NextResponse.json({ pathname: blob.pathname });
  } catch (error) {
    return NextResponse.json({ error: `Blob upload failed: ${(error as Error).message}` }, { status: 502 });
  }
}
