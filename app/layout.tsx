import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import FirebaseNotificationHandler from "@/components/pwa/FirebaseNotificationHandler";
import TenantBrandingHead from "@/components/layout/TenantBrandingHead";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "My Gurukul SaaS Platform",
  description: "Advanced Multi-Tenant Institutional & Alumni Governance System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Gurukul Portal",
  },
  icons: {
    icon: "/my-gurukul.png",
    shortcut: "/my-gurukul.png",
    apple: "/my-gurukul.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} h-full antialiased font-outfit`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50" suppressHydrationWarning>
        <TenantBrandingHead />
        {children}
        <PwaInstallPrompt />
        <FirebaseNotificationHandler />
      </body>
    </html>
  );
}
