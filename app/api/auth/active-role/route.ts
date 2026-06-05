import { NextResponse } from "next/server";
import {
  ACTIVE_ROLE_COOKIE,
  ROLE_COOKIE_MAX_AGE,
  getDefaultRedirectForRole,
  getEffectiveRole,
  getUserRole,
  normalizeAuthRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";

function getRoleCookieOptions(maxAge = ROLE_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
  const requestedRole = normalizeAuthRole(body?.role);

  if (!requestedRole) {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountRole = getUserRole(user);

  if (requestedRole === "admin" && accountRole !== "admin") {
    return NextResponse.json({ error: "Anda tidak memiliki akses admin." }, { status: 403 });
  }

  const activeRole = getEffectiveRole({
    accountRole,
    activeRolePreference: requestedRole,
  });
  const response = NextResponse.json({
    activeRole,
    redirectTo: getDefaultRedirectForRole(activeRole),
  });

  response.cookies.set(ACTIVE_ROLE_COOKIE, activeRole, getRoleCookieOptions());

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ACTIVE_ROLE_COOKIE, "", getRoleCookieOptions(0));

  return response;
}
