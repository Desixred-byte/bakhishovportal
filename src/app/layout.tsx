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
  metadataBase: new URL("https://app.bakhishov.com"),
  title: {
    default: "Bakhishov Brands Portal",
    template: "%s · Bakhishov Brands",
  },
  description: "Bakhishov Brands client portal for project progress, invoices, deliverables, and support in one secure workspace.",
  icons: {
    icon: "/BAKHISHOV.png",
    shortcut: "/BAKHISHOV.png",
    apple: "/BAKHISHOV.png",
  },
  openGraph: {
    title: "Bakhishov Brands Portal",
    description: "Track project progress, invoices, deliverables, and updates in one premium portal experience.",
    url: "https://app.bakhishov.com",
    siteName: "Bakhishov Brands",
    images: [
      {
        url: "https://app.bakhishov.com/webthumb.jpg",
        width: 1200,
        height: 630,
        alt: "Bakhishov Brands Portal",
        type: "image/jpeg",
      },
      {
        url: "https://app.bakhishov.com/webthumb.png",
        width: 1200,
        height: 630,
        alt: "Bakhishov Brands Portal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bakhishov Brands Portal",
    description: "Track project progress, invoices, deliverables, and updates in one premium workspace.",
    images: ["https://app.bakhishov.com/webthumb.jpg"],
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
