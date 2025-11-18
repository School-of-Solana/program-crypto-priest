"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export default function NetworkWarning() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isDevnet, setIsDevnet] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash();
        const devnetHash = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
        setIsDevnet(genesisHash === devnetHash);
      } catch (error) {
        console.error("Failed to check network:", error);
      }
    };

    if (wallet.connected) {
      checkNetwork();
    }
  }, [connection, wallet.connected]);

  if (!wallet.connected || isDevnet) {
    return null;
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 shadow-2xl border-2 border-orange-300 animate-slide-in">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Wrong Network Detected</h3>
            <p className="text-white/90 mb-4">
              You're connected to <strong>Mainnet</strong>, but this app requires <strong>Devnet</strong>.
              The Skill Bounty smart contract is deployed on Devnet only.
            </p>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="font-semibold mb-2">How to switch to Devnet:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open your wallet settings (⚙️)</li>
                <li>Find "Network" or "Developer Settings"</li>
                <li>Select <strong>"Devnet"</strong></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
