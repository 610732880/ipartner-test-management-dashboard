import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (!process.env.DASHBOARD_PASSWORD || password !== process.env.DASHBOARD_PASSWORD) return NextResponse.json({ error: "密码错误" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("dashboard_access", process.env.DASHBOARD_SESSION_SECRET!, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
