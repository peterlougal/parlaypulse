import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParlayPulse — Live Ticket Health",
  description: "Track live parlay ticket health and find hedge opportunities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
