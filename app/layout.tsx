import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow CFO - Find Hidden Financial Leaks",
  description: "AI-powered financial analysis to find fee drag, missed deductions, and savings opportunities.",
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
