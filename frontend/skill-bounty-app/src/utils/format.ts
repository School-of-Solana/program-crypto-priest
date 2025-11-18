import { LAMPORTS_PER_SOL } from "./constants";

/**
 * Format SOL amount from lamports
 */
export function formatSOL(lamports: number): string {
  return `${(lamports / LAMPORTS_PER_SOL).toFixed(2)} SOL`;
}

/**
 * Format wallet address (truncate middle)
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Format deadline countdown
 */
export function formatDeadline(deadline: number): string {
  const now = Date.now() / 1000;
  const diff = deadline - now;

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  return `${Math.floor(diff / 60)}m left`;
}
