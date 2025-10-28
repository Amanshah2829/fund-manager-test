
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = {
  "/admin": "admin",
}

function getRequiredRoleForPath(path: string): string | undefined {
  for (const route in protectedRoutes) {
    if (path.startsWith(route)) {
      return protectedRoutes[route as keyof typeof protectedRoutes]
    }
  }
  return undefined
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude API routes from middleware processing
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value

  // A simplified, Edge-compatible token verifier.
  const verifyTokenEdge = (token: string) => {
    try {
      const [header, payload, signature] = token.split('.');
      if (!header || !payload || !signature) return null;

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      
      if (decodedPayload.exp * 1000 < Date.now()) {
        console.log("Edge Middleware: Token expired");
        return null;
      }
      return decodedPayload;
    } catch (e) {
      console.log("Edge Middleware: Token verification failed", e);
      return null;
    }
  }

  const userPayload = token ? verifyTokenEdge(token) : null;

  // If a logged-in user tries to access login/signup, redirect to admin dashboard
  if (userPayload && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
    const url = request.nextUrl.clone()
    url.pathname = `/admin`
    return NextResponse.redirect(url)
  }

  const requiredRole = getRequiredRoleForPath(pathname)

  if (requiredRole) {
    if (!userPayload) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("redirectedFrom", pathname)
      return NextResponse.redirect(url)
    }

    if (userPayload.role !== requiredRole) {
      // If user is not the required role, redirect them to login
      const url = request.nextUrl.clone()
      url.pathname = `/login`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware only to the page routes that need it.
  // API routes are now excluded at the top of the middleware function.
  matcher: [
    "/admin/:path*",
    "/login",
    "/signup",
    "/",
  ],
}
