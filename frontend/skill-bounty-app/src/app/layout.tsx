import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import ProgressBar from "@/components/ProgressBar";
import NetworkWarning from "@/components/NetworkWarning";

export const metadata: Metadata = {
  title: "Skill Bounty - Prove Your Skills, Earn Rewards",
  description: "Blockchain-verified skill challenges with SOL bounties",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: '/logo.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProgressBar />
        <WalletContextProvider>
          <NetworkWarning />
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
