import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=callback", request.url));
  let errorMessage="";
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if(error)errorMessage=error.message;
  }catch { errorMessage="network"; }
  if (errorMessage) return NextResponse.redirect(new URL("/login?error="+(errorMessage==="network"?"network":"callback"), request.url));
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, request.url));
}
