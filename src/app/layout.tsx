import type { Metadata } from "next";
import { Inter, Coustard } from "next/font/google";
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const coustard = Coustard({ 
  subsets: ["latin"], 
  weight: ["400", "900"],
  variable: "--font-headline",
});

export const metadata: Metadata = {
  title: "GiornoBene",
  description: "Your daily wellness journal, powered by AI.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.variable} ${coustard.variable}`}>
        <div className="max-w-xl mx-auto">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
