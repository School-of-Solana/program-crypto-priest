"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Navbar from "@/components/Navbar";
import ChallengeCard from "@/components/ChallengeCard";
import Footer from "@/components/Footer";
import { PROGRAM_ID } from "@/utils/constants";
import IDL from "@/utils/idl.json";

interface Challenge {
  challengeId: number;
  creator: PublicKey;
  title: string;
  description: string;
  bountyAmount: number;
  deadline: number;
  isActive: boolean;
  submissionCount: number;
}

type SortOption = "latest" | "oldest" | "highest" | "lowest";
type FilterOption = "all" | "active" | "completed";

export default function BrowsePage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchChallenges();
  }, [connection]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);

      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );

      const program = new Program(IDL as any, provider);

      // Fetch all challenge accounts
      const challengeAccounts = await (program.account as any).challenge.all();

      const challengesData: Challenge[] = challengeAccounts.map((acc: any) => ({
        challengeId: acc.account.challengeId.toNumber(),
        creator: acc.account.creator,
        title: acc.account.title,
        description: acc.account.description,
        bountyAmount: acc.account.bountyAmount.toNumber(),
        deadline: acc.account.deadline.toNumber(),
        isActive: acc.account.isActive,
        submissionCount: acc.account.submissionCount,
      }));

      setChallenges(challengesData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter challenges based on status
  const filteredChallenges = challenges.filter((c) => {
    // Apply status filter
    if (filter === "active" && !c.isActive) return false;
    if (filter === "completed" && c.isActive) return false;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Sort challenges
  const sortedChallenges = [...filteredChallenges].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return b.challengeId - a.challengeId;
      case "oldest":
        return a.challengeId - b.challengeId;
      case "highest":
        return b.bountyAmount - a.bountyAmount;
      case "lowest":
        return a.bountyAmount - b.bountyAmount;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-primary-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-4 text-white">
            Browse <span className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-orange bg-clip-text text-transparent">Challenges</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover skill challenges, earn bounties, and prove your expertise
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search challenges by title or description..."
                className="w-full px-6 py-4 pl-14 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-accent-purple focus:bg-white/15 transition-all text-lg"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <span className="text-gray-300 font-semibold">Filter:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                    filter === "all"
                      ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-[0_8px_30px_rgba(124,58,237,0.4)]"
                      : "bg-white/10 backdrop-blur-sm border-2 border-white/20 text-gray-300 hover:border-accent-purple hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                    filter === "active"
                      ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-[0_8px_30px_rgba(124,58,237,0.4)]"
                      : "bg-white/10 backdrop-blur-sm border-2 border-white/20 text-gray-300 hover:border-accent-purple hover:text-white"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                    filter === "completed"
                      ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-[0_8px_30px_rgba(124,58,237,0.4)]"
                      : "bg-white/10 backdrop-blur-sm border-2 border-white/20 text-gray-300 hover:border-accent-purple hover:text-white"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-gray-300 font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-6 py-2.5 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white font-semibold focus:outline-none focus:border-accent-purple cursor-pointer hover:border-accent-purple transition-all"
              >
                <option value="latest" className="bg-gray-900">Latest First</option>
                <option value="oldest" className="bg-gray-900">Oldest First</option>
                <option value="highest" className="bg-gray-900">Highest Bounty</option>
                <option value="lowest" className="bg-gray-900">Lowest Bounty</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-gray-400 text-lg">
              Showing <span className="text-white font-bold">{sortedChallenges.length}</span> of <span className="text-white font-bold">{challenges.length}</span> challenges
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-accent-purple/20 border-t-accent-purple"></div>
            <p className="mt-6 text-gray-300 font-medium text-lg">Loading challenges...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedChallenges.length === 0 && (
          <div className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shadow-[0_8px_30px_rgba(124,58,237,0.2)]">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              No challenges found
            </h3>
            <p className="text-lg text-gray-300 mb-8">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : filter === "all"
                ? "No challenges available at the moment."
                : `No ${filter} challenges at the moment.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-8 py-4 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] hover:scale-105 transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Challenges Grid */}
        {!loading && sortedChallenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.challengeId}
                challengeId={challenge.challengeId}
                title={challenge.title}
                description={challenge.description}
                bountyAmount={challenge.bountyAmount}
                deadline={challenge.deadline}
                isActive={challenge.isActive}
                creator={challenge.creator.toString()}
                submissionCount={challenge.submissionCount}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
