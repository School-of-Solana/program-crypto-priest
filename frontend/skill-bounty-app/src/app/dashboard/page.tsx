"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PROGRAM_ID } from "@/utils/constants";
import { formatSOL, formatAddress } from "@/utils/format";
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

interface Submission {
  submissionId: number;
  challengeId: number;
  submitter: PublicKey;
  proofUrl: string;
  timestamp: number;
  challengeTitle?: string;
  isWinner?: boolean;
}

export default function Dashboard() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeFilter, setChallengeFilter] = useState<"all" | "active" | "completed">("all");
  const [submissionFilter, setSubmissionFilter] = useState<"all" | "pending" | "won">("all");

  useEffect(() => {
    if (wallet.publicKey) {
      fetchUserData();
    }
  }, [wallet.publicKey, connection]);

  const fetchUserData = async () => {
    if (!wallet.publicKey) return;

    try {
      setLoading(true);
      setError(null);

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, provider);

      // Fetch all challenges with timeout
      const challengesPromise = (program.account as any).challenge.all();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 30000)
      );

      const allChallenges = await Promise.race([challengesPromise, timeoutPromise]) as any[];

      // Filter challenges created by user
      const userChallenges = allChallenges
        .filter((c: any) => c.account.creator.equals(wallet.publicKey))
        .map((c: any) => ({
          challengeId: c.account.challengeId.toNumber(),
          creator: c.account.creator,
          title: c.account.title,
          description: c.account.description,
          bountyAmount: c.account.bountyAmount.toNumber(),
          deadline: c.account.deadline.toNumber(),
          isActive: c.account.isActive,
          submissionCount: c.account.submissionCount,
        }))
        .sort((a: any, b: any) => b.challengeId - a.challengeId);

      setMyChallenges(userChallenges);

      // Fetch user's submissions - OPTIMIZED APPROACH
      try {
        // Fetch all submissions at once (much more efficient than nested loops)
        const submissionsPromise = (program.account as any).submission.all();
        const submissionsTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Submissions fetch timed out")), 30000)
        );

        const allSubmissions = await Promise.race([
          submissionsPromise,
          submissionsTimeoutPromise,
        ]) as any[];

        // Filter submissions by this user and map to challenge titles
        const allUserSubmissions: Submission[] = allSubmissions
          .filter((s: any) => s.account.submitter.equals(wallet.publicKey))
          .map((s: any) => {
            // Find the challenge this submission belongs to
            const challenge = allChallenges.find(
              (c: any) => c.account.challengeId.toNumber() === s.account.challengeId.toNumber()
            );

            return {
              submissionId: s.account.submissionId.toNumber(),
              challengeId: s.account.challengeId.toNumber(),
              submitter: s.account.submitter,
              proofUrl: s.account.proofUrl,
              timestamp: s.account.submittedAt.toNumber(),
              challengeTitle: challenge?.account.title || "Unknown Challenge",
              isWinner: challenge?.account.winner
                ? challenge.account.winner.equals(wallet.publicKey)
                : false,
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        setMySubmissions(allUserSubmissions);
      } catch (submissionError: any) {
        console.error("Error fetching submissions:", submissionError);
        // Set empty array if submissions can't be fetched
        // User's challenges are still shown
        setMySubmissions([]);

        // Only set error if it's not just empty submissions
        if (submissionError.message && !submissionError.message.includes("timed out")) {
          console.warn("Could not fetch submissions, but challenges loaded successfully");
        }
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);

      // Set user-friendly error message
      if (error.message === "Request timed out") {
        setError("Request timed out. Please check your internet connection and try again.");
      } else if (error.message?.includes("fetch")) {
        setError("Unable to connect to the blockchain. Please try again later.");
      } else {
        setError("Failed to load dashboard data. Please refresh the page.");
      }

      // Reset state on complete failure
      setMyChallenges([]);
      setMySubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChallenges = myChallenges.filter((c) => {
    if (challengeFilter === "active") return c.isActive;
    if (challengeFilter === "completed") return !c.isActive;
    return true;
  });

  const filteredSubmissions = mySubmissions.filter((s) => {
    if (submissionFilter === "won") return s.isWinner;
    if (submissionFilter === "pending") return !s.isWinner;
    return true;
  });

  const stats = {
    totalChallengesCreated: myChallenges.length,
    activeChallenges: myChallenges.filter((c) => c.isActive).length,
    totalBountyOffered: myChallenges.reduce(
      (sum, c) => sum + (c.isActive ? c.bountyAmount : 0),
      0
    ),
    totalSubmissions: mySubmissions.length,
    wonSubmissions: mySubmissions.filter((s) => s.isWinner).length,
  };

  if (!wallet.publicKey) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <Navbar />
        <main className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted-teal/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-muted-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-deep-teal mb-3">
              Connect Your Wallet
            </h2>
            <p className="text-dark-slate">
              Please connect your wallet to view your personalized dashboard
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-deep-teal">
            My Dashboard
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-muted-teal/20 rounded-full">
            <svg className="w-5 h-5 text-muted-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-muted-teal font-mono font-semibold">
              {formatAddress(wallet.publicKey.toString())}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12 max-w-6xl mx-auto">
          <div className="bg-white border-2 border-border-light rounded-lg p-5 text-center hover:border-muted-teal transition-colors">
            <p className="text-muted-teal text-xs font-semibold mb-2 uppercase">Created</p>
            <p className="text-3xl font-bold text-deep-teal mb-1">
              {stats.totalChallengesCreated}
            </p>
            <p className="text-xs text-dark-slate">Total</p>
          </div>

          <div className="bg-muted-teal/5 border-2 border-muted-teal/30 rounded-lg p-5 text-center hover:border-muted-teal transition-colors">
            <p className="text-muted-teal text-xs font-semibold mb-2 uppercase">Active</p>
            <p className="text-3xl font-bold text-muted-teal mb-1">
              {stats.activeChallenges}
            </p>
            <p className="text-xs text-dark-slate">Live Now</p>
          </div>

          <div className="bg-dark-slate/5 border-2 border-dark-slate/30 rounded-lg p-5 text-center hover:border-dark-slate transition-colors">
            <p className="text-dark-slate text-xs font-semibold mb-2 uppercase">Bounty</p>
            <p className="text-2xl font-bold text-dark-slate mb-1">
              {formatSOL(stats.totalBountyOffered)}
            </p>
            <p className="text-xs text-dark-slate">In Escrow</p>
          </div>

          <div className="bg-deep-teal/5 border-2 border-deep-teal/30 rounded-lg p-5 text-center hover:border-deep-teal transition-colors">
            <p className="text-deep-teal text-xs font-semibold mb-2 uppercase">Submissions</p>
            <p className="text-3xl font-bold text-deep-teal mb-1">
              {stats.totalSubmissions}
            </p>
            <p className="text-xs text-dark-slate">Total</p>
          </div>

          <div className="bg-dark-slate/5 border-2 border-dark-slate/30 rounded-lg p-5 text-center hover:border-dark-slate transition-colors">
            <p className="text-dark-slate text-xs font-semibold mb-2 uppercase">Wins</p>
            <p className="text-3xl font-bold text-dark-slate mb-1">
              {stats.wonSubmissions}
            </p>
            <p className="text-xs text-dark-slate">Won</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-muted-teal/20 border-t-muted-teal"></div>
            <p className="mt-4 text-dark-slate font-medium">Loading dashboard...</p>
            <p className="mt-2 text-sm text-muted-teal">Fetching your challenges and submissions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-slate/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-deep-teal mb-3">
              Unable to Load Dashboard
            </h3>
            <p className="text-dark-slate mb-6">{error}</p>
            <button
              onClick={fetchUserData}
              className="inline-flex items-center gap-2 px-6 py-3 bg-deep-teal text-ash-grey font-semibold rounded-lg hover:bg-dark-slate transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* My Challenges Section */}
            <section className="mb-16">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-bold text-deep-teal">
                  My Challenges <span className="text-muted-teal">({myChallenges.length})</span>
                </h2>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChallengeFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      challengeFilter === "all"
                        ? "bg-deep-teal text-ash-grey"
                        : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChallengeFilter("active")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      challengeFilter === "active"
                        ? "bg-muted-teal text-white"
                        : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setChallengeFilter("completed")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      challengeFilter === "completed"
                        ? "bg-dark-slate text-white"
                        : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="text-center py-16 bg-white border-2 border-border-light rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted-teal/10 flex items-center justify-center">
                    <span className="text-3xl">📝</span>
                  </div>
                  <h3 className="text-2xl font-bold text-deep-teal mb-2">
                    No challenges yet
                  </h3>
                  <p className="text-dark-slate mb-6">
                    Create your first challenge and start offering bounties!
                  </p>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-deep-teal text-ash-grey font-semibold rounded-lg hover:bg-dark-slate transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Challenge
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredChallenges.map((challenge) => (
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
            </section>

            {/* My Submissions Section */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-bold text-deep-teal">
                  My Submissions <span className="text-muted-teal">({mySubmissions.length})</span>
                </h2>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubmissionFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      submissionFilter === "all"
                        ? "bg-deep-teal text-ash-grey"
                        : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("pending")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      submissionFilter === "pending"
                        ? "bg-muted-teal text-white"
                        : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("won")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      submissionFilter === "won"
                        ? "bg-dark-slate text-white"
                        : "bg-white border-2 border-border-light text-dark-slate hover:border-muted-teal"
                    }`}
                  >
                    Won
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-white border-2 border-border-light rounded-xl">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted-teal/10 flex items-center justify-center">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold text-deep-teal mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-dark-slate mb-6">
                    Browse challenges and submit your solutions!
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-deep-teal text-ash-grey font-semibold rounded-lg hover:bg-dark-slate transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Browse Challenges
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission, index) => (
                    <div
                      key={submission.submissionId}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        submission.isWinner
                          ? "bg-dark-slate/5 border-dark-slate/50"
                          : "bg-white border-border-light hover:border-muted-teal"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-[300px]">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/challenge/${submission.challengeId}`}
                              className="text-xl font-bold text-deep-teal hover:text-muted-teal transition-colors"
                            >
                              {submission.challengeTitle}
                            </Link>
                            {submission.isWinner && (
                              <span className="px-3 py-1 bg-dark-slate text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <span>🏆</span>
                                WINNER
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-muted-teal text-sm font-medium">
                              Your submission #{index + 1}
                            </p>
                            <span className="text-dark-slate/40 text-xs">•</span>
                            <p className="text-dark-slate/60 text-xs font-mono">
                              ID: {submission.submissionId}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-muted-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <p className="text-dark-slate break-all font-mono text-xs">
                              {submission.proofUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={submission.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-white border-2 border-muted-teal hover:bg-muted-teal hover:text-white rounded-lg text-deep-teal text-sm font-semibold transition-all"
                          >
                            View Proof
                          </a>
                          <Link
                            href={`/challenge/${submission.challengeId}`}
                            className="px-5 py-2.5 bg-deep-teal rounded-lg text-ash-grey text-sm font-semibold hover:bg-dark-slate transition-all"
                          >
                            View Challenge
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
