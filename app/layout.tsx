import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Garage Management System",
  description: "Enterprise Garage Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Toast Notification System */}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}