import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/platform-settings";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { siteTitle } = await getSiteSettings();
  return { title: siteTitle, description: `${siteTitle} — No-Code Web Builder` };
}
export default async function RootLayout({ children }: { children: ReactNode }) {
  const { primaryColor } = await getSiteSettings();
  const style = { "--brand-primary": primaryColor } as CSSProperties;
  return <html lang="vi" style={style}><body>{children}</body></html>;
}
