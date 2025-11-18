"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ChallengeCard from "@/components/ChallengeCard";
import Footer from "@/components/Footer";
import { PROGRAM_ID } from "@/utils/constants";
import { formatSOL, formatAddress } from "@/utils/format";
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

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, provider);

      // Fetch all challenges
      const allChallenges = await (program.account as any).challenge.all();

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

      // Fetch user's submissions to any challenge
      try {
        const allUserSubmissions: Submission[] = [];

        // Check all challenges for submissions by this user
        for (const challenge of allChallenges) {
          const challengeId = challenge.account.challengeId.toNumber();

          // Try a reasonable range of submission IDs
          for (let i = 0; i < 20; i++) {
            try {
              const submissionIdBuffer = Buffer.alloc(8);
              submissionIdBuffer.writeBigUInt64LE(BigInt(i));

              const challengeIdBuffer = Buffer.alloc(8);
              challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));

              const [submissionPDA] = PublicKey.findProgramAddressSync(
                [
                  Buffer.from("submission"),
                  challengeIdBuffer,
                  submissionIdBuffer,
                ],
                PROGRAM_ID
              );

              const accountInfo = await connection.getAccountInfo(submissionPDA);
              if (accountInfo) {
                const submissionAccount = await (
                  program.account as any
                ).submission.fetch(submissionPDA);

                // Only add if submitted by this user
                if (submissionAccount.submitter.equals(wallet.publicKey)) {
                  allUserSubmissions.push({
                    submissionId: submissionAccount.submissionId.toNumber(),
                    challengeId: submissionAccount.challengeId.toNumber(),
                    submitter: submissionAccount.submitter,
                    proofUrl: submissionAccount.proofUrl,
                    timestamp: submissionAccount.submittedAt.toNumber(),
                    challengeTitle: challenge.account.title,
                    isWinner: challenge.account.winner
                      ? challenge.account.winner.equals(wallet.publicKey)
                      : false,
                  });
                }
              }
            } catch (err) {
              // Submission doesn't exist or error fetching, skip
              continue;
            }
          }
        }

        // Sort by newest first
        allUserSubmissions.sort((a, b) => b.timestamp - a.timestamp);

        setMySubmissions(allUserSubmissions);
      } catch (submissionError) {
        console.error("Error fetching submissions:", submissionError);
        // Set empty array if submissions can't be fetched
        // User's challenges are still shown
        setMySubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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
            <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <svg className="w-16 h-16 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-lg text-gray-300 mb-8">
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
          <h1 className="text-6xl font-extrabold mb-4 text-white">
            My <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border-2 border-accent-purple/20 rounded-full">
            <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-accent-purple font-mono font-bold">
              {formatAddress(wallet.publicKey.toString())}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
          <div className="bg-white border-2 border-border-light rounded-2xl p-6 text-center hover:border-accent-purple hover:shadow-lg transition-all">
            <p className="text-text-muted text-sm font-semibold mb-2 uppercase tracking-wider">Created</p>
            <p className="text-5xl font-bold text-text-primary mb-2">
              {stats.totalChallengesCreated}
            </p>
            <p className="text-xs text-text-muted">Total Challenges</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all">
            <p className="text-green-700 text-sm font-semibold mb-2 uppercase tracking-wider">Active</p>
            <p className="text-5xl font-bold text-green-600 mb-2">
              {stats.activeChallenges}
            </p>
            <p className="text-xs text-green-600">Live Now</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all">
            <p className="text-cyan-700 text-sm font-semibold mb-2 uppercase tracking-wider">Bounty</p>
            <p className="text-3xl font-bold text-cyan-600 mb-2">
              {formatSOL(stats.totalBountyOffered)}
            </p>
            <p className="text-xs text-cyan-600">In Escrow</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all">
            <p className="text-pink-700 text-sm font-semibold mb-2 uppercase tracking-wider">Submissions</p>
            <p className="text-5xl font-bold text-pink-600 mb-2">
              {stats.totalSubmissions}
            </p>
            <p className="text-xs text-pink-600">Total</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all">
            <p className="text-yellow-700 text-sm font-semibold mb-2 uppercase tracking-wider">Wins</p>
            <p className="text-5xl font-bold text-yellow-600 mb-2">
              {stats.wonSubmissions}
            </p>
            <p className="text-xs text-yellow-600">Challenges Won</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-accent-purple/20 border-t-accent-purple"></div>
            <p className="mt-6 text-gray-300 font-medium text-lg">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* My Challenges Section */}
            <section className="mb-20">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h2 className="text-4xl font-bold text-white">
                  My Challenges <span className="text-accent-purple">({myChallenges.length})</span>
                </h2>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChallengeFilter("all")}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      challengeFilter === "all"
                        ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg"
                        : "bg-white border-2 border-border-light text-text-secondary hover:border-accent-purple"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChallengeFilter("active")}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      challengeFilter === "active"
                        ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg"
                        : "bg-white border-2 border-border-light text-text-secondary hover:border-accent-purple"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setChallengeFilter("completed")}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      challengeFilter === "completed"
                        ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg"
                        : "bg-white border-2 border-border-light text-text-secondary hover:border-accent-purple"
                    }`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {filteredChallenges.length === 0 ? (
                <div className="text-center py-20 bg-white border-2 border-border-light rounded-2xl">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <span className="text-5xl">📝</span>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    No challenges yet
                  </h3>
                  <p className="text-text-secondary mb-8">
                    Create your first challenge and start offering bounties!
                  </p>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl text-white font-bold hover:shadow-lg hover:scale-105 transition-all"
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
                <h2 className="text-4xl font-bold text-white">
                  My Submissions <span className="text-accent-cyan">({mySubmissions.length})</span>
                </h2>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubmissionFilter("all")}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      submissionFilter === "all"
                        ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg"
                        : "bg-white border-2 border-border-light text-text-secondary hover:border-accent-purple"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("pending")}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      submissionFilter === "pending"
                        ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg"
                        : "bg-white border-2 border-border-light text-text-secondary hover:border-accent-purple"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setSubmissionFilter("won")}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      submissionFilter === "won"
                        ? "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg"
                        : "bg-white border-2 border-border-light text-text-secondary hover:border-accent-purple"
                    }`}
                  >
                    Won
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-20 bg-white border-2 border-border-light rounded-2xl">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                    <span className="text-5xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-text-secondary mb-8">
                    Browse challenges and submit your solutions!
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl text-white font-bold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Browse Challenges
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((submission) => (
                    <div
                      key={submission.submissionId}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        submission.isWinner
                          ? "bg-gradient-to-br from-purple-50 to-pink-50 border-accent-purple shadow-lg"
                          : "bg-white border-border-light hover:border-accent-cyan"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-[300px]">
                          <div className="flex items-center gap-3 mb-3">
                            <Link
                              href={`/challenge/${submission.challengeId}`}
                              className="text-xl font-bold text-text-primary hover:text-accent-purple transition-colors"
                            >
                              {submission.challengeTitle}
                            </Link>
                            {submission.isWinner && (
                              <span className="px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                WINNER
                              </span>
                            )}
                          </div>
                          <p className="text-text-muted text-sm mb-2 font-semibold">
                            Submission #{submission.submissionId}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <p className="text-text-secondary break-all font-mono text-xs">
                              {submission.proofUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={submission.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-white border-2 border-border-medium hover:border-accent-cyan rounded-xl text-text-primary text-sm font-semibold transition-all hover:shadow-md"
                          >
                            View Proof →
                          </a>
                          <Link
                            href={`/challenge/${submission.challengeId}`}
                            className="px-5 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl text-white text-sm font-bold hover:shadow-lg hover:scale-105 transition-all"
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
