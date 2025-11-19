"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import dynamic from "next/dynamic";
import { PROGRAM_ID } from "@/utils/constants";
import IDL from "@/utils/idl.json";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const ChallengeCard = dynamic(() => import("@/components/ChallengeCard"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });

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
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-deep-teal">
            Browse Challenges
          </h1>
          <p className="text-lg text-dark-slate max-w-2xl mx-auto">
            Discover skill challenges, earn bounties, and prove your expertise
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-10 space-y-6 max-w-5xl mx-auto">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title or description..."
              className="w-full px-6 py-4 pl-14 bg-white border-2 border-border-light rounded-lg text-deep-teal placeholder-muted-teal focus:outline-none focus:border-muted-teal transition-colors"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-teal"
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
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-teal hover:text-dark-slate transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-dark-slate font-semibold">Filter:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "all"
                      ? "bg-deep-teal text-ash-grey"
                      : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "active"
                      ? "bg-muted-teal text-white"
                      : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "completed"
                      ? "bg-dark-slate text-white"
                      : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-dark-slate font-semibold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white border-2 border-border-light rounded-lg text-deep-teal font-medium focus:outline-none focus:border-muted-teal cursor-pointer transition-colors"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Bounty</option>
                <option value="lowest">Lowest Bounty</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-dark-slate">
              Showing <span className="font-bold text-deep-teal">{sortedChallenges.length}</span> of <span className="font-bold text-deep-teal">{challenges.length}</span> challenges
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-muted-teal/20 border-t-muted-teal"></div>
            <p className="mt-4 text-dark-slate font-medium">Loading challenges...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedChallenges.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-border-light max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted-teal/10 flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-deep-teal mb-2">
              No challenges found
            </h3>
            <p className="text-dark-slate mb-6">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : filter === "all"
                ? "No challenges available at the moment."
                : `No ${filter} challenges at the moment.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-3 bg-deep-teal text-ash-grey font-semibold rounded-lg hover:bg-dark-slate transition-colors duration-200"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Challenges Grid */}
        {!loading && sortedChallenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
