import { get, list, put } from "@vercel/blob";
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

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "runs/" });
    const manifests = blobs.filter((blob) => blob.pathname.endsWith("/manifest.json"));
    const runs = await Promise.all(manifests.map(async (blob) => {
      const result = await get(blob.url, { access: "private", useCache: false });
      return result ? JSON.parse(await new Response(result.stream).text()) as TestRun : null;
    }));
    return NextResponse.json(runs.filter(Boolean).sort((a, b) => Date.parse(b!.started_at) - Date.parse(a!.started_at)).slice(0, 50));
  } catch {
    return NextResponse.json([]);
  }
}
