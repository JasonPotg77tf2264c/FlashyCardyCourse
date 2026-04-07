import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { HeaderUserSection } from "@/components/header-user-section";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FlashyCardy",
  description: "Flashcard app to supercharge your learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <header className="flex items-center justify-between border-b border-border px-6 py-3">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              FlashyCardy
            </span>
            <div className="flex items-center gap-2">
              <HeaderUserSection />
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
