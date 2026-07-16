import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditIQ | Autonomous Audit Operating System",
  description: "AuditIQ Enterprise Control Tower and continuous monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-[#0F1115]">
      <body className="min-h-full flex flex-col text-[#F3F4F6]">
        <nav className="bg-[#181B21]/80 backdrop-blur-md text-white shadow-sm border-b border-[#2A2E37] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#5E6AD2] to-[#22D3EE]">
                  AuditIQ
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#5E6AD2]/20 hover:text-white transition-all">Home</Link>
                    <Link href="/control-tower" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#5E6AD2]/20 hover:text-white transition-all">Control Tower</Link>
                    <Link href="/results" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#5E6AD2]/20 hover:text-white transition-all">Results Workspace</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
