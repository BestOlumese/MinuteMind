import type { Metadata } from "next";
import { Manrope, Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
const manrope = Manrope({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minute Mind",
  description: "AI Powered Collaboration Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.className}`}
      >
        {children}
        <Toaster closeButton={true} />
      </body>
    </html>
  );
}
