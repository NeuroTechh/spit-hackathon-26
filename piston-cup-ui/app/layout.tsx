import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Piston Cup — Premium Motorsport Events",
  description:
    "Discover and attend the most prestigious racing events in the Piston Cup championship.",
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
