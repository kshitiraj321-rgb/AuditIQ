import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditIQ | Exception Intelligence Platform",
  description: "AuditIQ is a procurement audit dashboard for three-way matching, exception detection, and risk analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-slate-900">{children}</body>
    </html>
  );
}
