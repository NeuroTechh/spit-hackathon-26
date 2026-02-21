import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hudson — Universal Identity",
  description:
    "Verify once, use everywhere. Decentralized identity platform with privacy-preserving verification.",
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
