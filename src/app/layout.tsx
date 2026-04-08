import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bakhishovportal.vercel.app"),
  title: {
    default: "Muwafaq Solutions Client Portal",
    template: "%s · Muwafaq Solutions",
  },
  description: "Private client portal for Muwafaq Solutions — project progress, invoices, deliverables, and support in one place.",
  openGraph: {
    title: "Muwafaq Solutions Client Portal",
    description: "Track delivered projects, invoices, and client updates in a premium portal experience.",
    url: "https://bakhishovportal.vercel.app",
    siteName: "Muwafaq Solutions Portal",
    images: [
      {
        url: "/webthumb.png",
        width: 1200,
        height: 630,
        alt: "Muwafaq Solutions Client Portal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muwafaq Solutions Client Portal",
    description: "Track delivered projects, invoices, and client updates in one premium workspace.",
    images: ["/webthumb.png"],
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
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
