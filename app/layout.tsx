import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shadow CFO",
  description: "AI-powered financial decision support",
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
