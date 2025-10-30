import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Skip Telegram webhook and other public APIs that must not be redirected
  if (pathname.startsWith("/api/telegram/webhook")) {
    return NextResponse.next();
  }

  // A simplified, Edge-compatible token verifier.
  const verifyTokenEdge = (token: string) => {
    try {
      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) return null;

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      if (decodedPayload.exp * 1000 < Date.now()) {
        return null;
      }
      return decodedPayload;
    } catch (e) {
      return null;
    }
  };

  const token = request.cookies.get("token")?.value;
  const userPayload = token ? verifyTokenEdge(token) : null;

  // If a logged-in user tries to access login/signup, redirect to admin dashboard
  if (userPayload && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin`;
    return NextResponse.redirect(url);
  }

  // If a non-logged-in user tries to access a protected admin route
  if (!userPayload && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Apply middleware only to routes requiring authentication logic.
   * /api routes (especially Telegram webhook) are excluded.
   */
  matcher: ['/admin/:path*', '/', '/login', '/signup'],
};
