import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CurrencyProvider } from "@/contexts/currency-context";

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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SignedIn>
            <CurrencyProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  <div className="w-full max-w-full">
                    {children}
                  </div>
                </main>
              </div>
            </CurrencyProvider>
          </SignedIn>
          <SignedOut>
            <main className="min-h-screen w-full max-w-full">
              {children}
            </main>
          </SignedOut>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
