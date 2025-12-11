import type { Metadata } from "next";
import "./globals.css";

export const metadata = {
  title: "Drive Together, Thrive Together | Our Common Commute",
  description:
    "Drive Together, Thrive Together. Our Common Commute connects riders and drivers with clear pricing, safe trips, and a simple way to share everyday journeys.",
 
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
