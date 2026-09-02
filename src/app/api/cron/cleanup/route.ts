import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expiredPrefixes = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "runs/", cursor });
    for (const blob of page.blobs) {
      const match = /^runs\/(\d{4}-\d{2}-\d{2})\/([^/]+)\//.exec(blob.pathname);
      if (match && new Date(`${match[1]}T00:00:00.000Z`) < new Date()) expiredPrefixes.add(`runs/${match[1]}/${match[2]}/`);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  let deleted = 0;
  for (const prefix of expiredPrefixes) {
    const { blobs } = await list({ prefix });
    if (blobs.length) { await del(blobs.map((blob) => blob.url)); deleted += blobs.length; }
  }
  return NextResponse.json({ deleted, expiredRuns: expiredPrefixes.size });
}
