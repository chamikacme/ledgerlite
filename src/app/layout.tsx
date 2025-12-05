import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LedgerLite",
  description: "Simplified Personal Finance Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
        >
          <SignedIn>
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {children}
            </main>
          </SignedIn>
          <SignedOut>
             <main className="flex-1">
              {children}
            </main>
          </SignedOut>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
