import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Common Commute",
  description: "Earn rewards every mile with safer shared rides.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
