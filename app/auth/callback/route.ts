import { NextResponse, type NextRequest } from "next/server";
import {
  ACTIVE_ROLE_COOKIE,
  ROLE_COOKIE_MAX_AGE,
  getUserRole,
  resolvePostLoginRedirect,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const role = getUserRole(data.user);
      const redirectTo = resolvePostLoginRedirect({
        requestedPath: next,
        role,
      });
      const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin));

      response.cookies.set(ACTIVE_ROLE_COOKIE, role, {
        httpOnly: true,
        maxAge: ROLE_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
}
