"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export default function NetworkBadge() {
  const { connection } = useConnection();
  const [network, setNetwork] = useState<"devnet" | "mainnet" | "unknown">("unknown");

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash();
        const devnetHash = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
        setNetwork(genesisHash === devnetHash ? "devnet" : "mainnet");
      } catch (error) {
        setNetwork("unknown");
      }
    };

    checkNetwork();
  }, [connection]);

  if (network === "unknown") return null;

  return (
    <div
      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
        network === "devnet"
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
      }`}
    >
      {network === "devnet" ? "Devnet" : "Mainnet"}
    </div>
  );
}
