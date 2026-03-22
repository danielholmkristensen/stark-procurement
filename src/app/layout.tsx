import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DevTools } from "@/components/dev/DevTools";
import { UserProvider } from "@/context/UserContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "STARK Procurement",
  description: "Procurement Management System for STARK Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 font-sans antialiased">
        <UserProvider>
          {children}
          <DevTools />
        </UserProvider>
      </body>
    </html>
  );
}
