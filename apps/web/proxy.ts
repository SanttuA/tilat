import { NextResponse, type NextRequest } from "next/server";

const locales = ["fi", "en"] as const;
const publicFile = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || publicFile.test(pathname)) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1];
  if (locales.includes(firstSegment as (typeof locales)[number])) {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", firstSegment, { sameSite: "lax", path: "/" });
    return response;
  }

  const savedLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const locale = locales.includes(savedLocale as (typeof locales)[number]) ? savedLocale : "fi";
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
