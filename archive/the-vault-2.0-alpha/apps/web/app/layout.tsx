import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Vault 2.0-alpha",
  description:
    "Persistent, source-aware connectome workspace with GitHub identity and private vault ownership.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
