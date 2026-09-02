import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { expiryFor, manifestPath, type TestRun } from "@/lib/retention";

function authorized(request: Request) {
  const secret = process.env.TEST_DASHBOARD_UPLOAD_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await request.json();
  if (!input?.run_id || !input?.case_id || !input?.environment || !input?.functional_status) {
    return NextResponse.json({ error: "run_id, case_id, environment and functional_status are required" }, { status: 400 });
  }
  const status = input.compatibility_status ?? input.functional_status;
  const run: TestRun = { ...input, artifact_paths: input.artifact_paths ?? [], expires_at: expiryFor(status) };
  const pathname = manifestPath(run);
  await put(pathname, JSON.stringify(run, null, 2), { access: "private", contentType: "application/json", addRandomSuffix: false });
  return NextResponse.json({ run, pathname });
}
