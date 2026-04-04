import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow CFO",
  description: "Guided financial decision support with hardened consent, idempotency, and ledger rails",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
