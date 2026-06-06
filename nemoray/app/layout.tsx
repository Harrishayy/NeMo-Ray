import type { Metadata } from "next";
import { Saira, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NeMo-Ray - ESN",
  description:
    "GPU digital twin of the UK Emergency Services Network — Sionna RT coverage, cuOpt optimisation, and a Nemotron agent, in one mission-control console.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${saira.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="h-screen overflow-hidden bg-bg text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
