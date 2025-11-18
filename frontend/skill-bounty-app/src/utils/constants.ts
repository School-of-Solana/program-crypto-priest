import { PublicKey } from "@solana/web3.js";

// Solana Program
export const PROGRAM_ID = new PublicKey("F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b");
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const MAINNET_RPC = "https://api.mainnet-beta.solana.com";
export const LAMPORTS_PER_SOL = 1_000_000_000;

export const getRpcEndpoint = (): string => {
  if (typeof window === 'undefined') return DEVNET_RPC;

  const network = localStorage.getItem('solana-network') || 'devnet';
  return network === 'mainnet-beta' ? MAINNET_RPC : DEVNET_RPC;
};

// Challenge limits
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_PROOF_URL_LENGTH = 200;

// Time
export const SECONDS_PER_DAY = 86400;

// Status
export enum ChallengeStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
}

export enum SubmissionStatus {
  PENDING = "pending",
  WON = "won",
  LOST = "lost",
}
