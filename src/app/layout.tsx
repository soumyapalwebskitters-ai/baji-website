import type { Metadata, Viewport } from "next";
import { site } from "@/data/site";
import "lenis/dist/lenis.css";
import "./globals.css";
import SparkleCursor from "@/components/SparkleCursor";
import CustomCursor from "@/components/CustomCursor";
import ConfettiEffect from "@/components/ConfettiEffect";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: "Baji Market — A little spark. A lot of celebration.",
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_IN", url: "/", siteName: site.name, title: "Baji Market — Made for moments that glow", description: site.description },
  twitter: { card: "summary_large_image", title: "Baji Market — Made for moments that glow", description: site.description },
  robots: { index: Boolean(process.env.NEXT_PUBLIC_SITE_URL), follow: true },
};
export const viewport: Viewport = { themeColor: "#153d31", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <body><SparkleCursor /><CustomCursor /><ConfettiEffect />{children}<CookieConsent /></body>
  </html>;
}
