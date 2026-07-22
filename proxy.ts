import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { canDeploy, isAdmin } from "@/lib/roles"
import type { Role } from "@/lib/roles"

export default auth((req) => {
  const session = req.auth
  const { pathname } = req.nextUrl

  // Public: login page + auth callbacks
  if (pathname === "/" || pathname.startsWith("/api/auth")) {
    if (session && pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Webhook is public — validated by HMAC inside the handler (see lib/webhook.ts)
  if (pathname === "/api/webhook") return NextResponse.next()

  // All other routes require a session
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/", req.url))
  }

  const role = session.user?.role as Role | undefined

  // Deployer-or-admin routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname === "/api/dispatch" ||
    pathname === "/api/refs"
  ) {
    if (!canDeploy(role)) {
      return pathname.startsWith("/api/")
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/history", req.url))
    }
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAdmin(role)) {
      return pathname.startsWith("/api/")
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
