import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACTIVE_ROLE_COOKIE,
  getEffectiveRole,
  getUserRole,
  isAppPath,
  isDashboardPath,
  resolvePostLoginRedirect,
} from "@/lib/auth-roles";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const requestedPath = `${pathname}${request.nextUrl.search}`;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signin" ||
    pathname === "/signup";
  const isDashboardPage = isDashboardPath(pathname);
  const isAppPage = isAppPath(pathname);

  if (!user && (isDashboardPage || isAppPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", requestedPath);
    return NextResponse.redirect(url);
  }

  if (user) {
    const accountRole = getUserRole(user);
    const role = getEffectiveRole({
      accountRole,
      activeRolePreference: request.cookies.get(ACTIVE_ROLE_COOKIE)?.value,
    });

    if (isAuthPage) {
      const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
      const redirectTo = resolvePostLoginRedirect({
        requestedPath: redirectedFrom,
        role,
      });

      return NextResponse.redirect(new URL(redirectTo, request.nextUrl.origin));
    }

    if (isDashboardPage && role !== "admin") {
      return NextResponse.redirect(new URL("/app", request.nextUrl.origin));
    }

    if (isAppPage && role === "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
    }
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*", "/login", "/register", "/signin", "/signup"],
};
