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

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [connection]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);

      // Create a default provider (works even without wallet connected)
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

      challengesData.sort((a, b) => b.challengeId - a.challengeId);

      setChallenges(challengesData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const featuredChallenges = challenges.slice(0, 6);

  return (
    <div className="min-h-screen bg-primary-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section - Feedana inspired */}
        <div className="text-center mb-20 max-w-5xl mx-auto">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-green-50 border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              Live: {challenges.length} active challenges
            </span>
          </div>

          {/* Main Headline - HUGE and Bold */}
          <h1 className="text-7xl md:text-8xl font-extrabold mb-6 leading-tight text-white">
            Prove your skills,
            <br />
            <span className="bg-gradient-to-r from-accent-purple via-accent-pink to-accent-orange bg-clip-text text-transparent">
              earn rewards
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Blockchain-verified skill challenges with instant SOL bounties - no middlemen, just results
          </p>

          {/* Value Prop Box */}
          <div className="inline-block mb-12 px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-accent-purple/40">
            <p className="text-lg font-semibold text-accent-purple">
              "Skills speak louder than resumes"
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Prove yourself • Get paid • Build reputation
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              href="/create"
              className="px-8 py-4 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-lg rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] hover:scale-105 transition-all duration-200"
            >
              + Create Challenge
            </Link>
            <Link
              href="/browse"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-bold text-lg rounded-xl hover:border-accent-purple hover:bg-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-200"
            >
              Browse All Challenges
            </Link>
          </div>

          {/* Platform Stats - Real Data */}
          <div className="max-w-6xl mx-auto pt-16 border-t border-white/10">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl font-bold text-white mb-3">Platform at a Glance</h2>
              <p className="text-gray-400 text-lg">Real-time statistics from the Skill Bounty ecosystem</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Challenges */}
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 hover:shadow-[0_20px_60px_rgba(124,58,237,0.4),0_0_100px_rgba(124,58,237,0.2)] hover:-translate-y-3 hover:scale-105 transition-all duration-500 cursor-pointer animate-slide-up">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Floating orbs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 group-hover:scale-150 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-100 rounded-full blur-2xl opacity-30 group-hover:opacity-50 group-hover:scale-125 transition-all duration-700"></div>

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    {challenges.length}
                  </div>
                  <p className="text-gray-600 font-semibold text-lg group-hover:text-purple-700 transition-colors duration-300">Total Challenges</p>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-600 transition-colors duration-300">All-time created</p>
                </div>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              {/* Active Challenges */}
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 hover:shadow-[0_20px_60px_rgba(34,197,94,0.4),0_0_100px_rgba(34,197,94,0.2)] hover:-translate-y-3 hover:scale-105 transition-all duration-500 cursor-pointer animate-slide-up" style={{animationDelay: '0.1s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 group-hover:scale-150 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100 rounded-full blur-2xl opacity-30 group-hover:opacity-50 group-hover:scale-125 transition-all duration-700"></div>

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-8 h-8 text-white group-hover:scale-110 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    {challenges.filter(c => c.isActive).length}
                  </div>
                  <p className="text-gray-600 font-semibold text-lg group-hover:text-green-700 transition-colors duration-300">Active Now</p>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-600 transition-colors duration-300">Open for submissions</p>
                </div>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              {/* Total Bounty */}
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 hover:shadow-[0_20px_60px_rgba(8,145,178,0.4),0_0_100px_rgba(8,145,178,0.2)] hover:-translate-y-3 hover:scale-105 transition-all duration-500 cursor-pointer animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 group-hover:scale-150 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-30 group-hover:opacity-50 group-hover:scale-125 transition-all duration-700"></div>

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    {(challenges.reduce((sum, c) => sum + c.bountyAmount, 0) / 1000000000).toFixed(2)} SOL
                  </div>
                  <p className="text-gray-600 font-semibold text-lg group-hover:text-cyan-700 transition-colors duration-300">Total Bounties</p>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-600 transition-colors duration-300">In rewards offered</p>
                </div>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              {/* Completed */}
              <div className="group relative overflow-hidden rounded-3xl bg-white p-8 hover:shadow-[0_20px_60px_rgba(234,88,12,0.4),0_0_100px_rgba(234,88,12,0.2)] hover:-translate-y-3 hover:scale-105 transition-all duration-500 cursor-pointer animate-slide-up" style={{animationDelay: '0.3s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 group-hover:opacity-70 group-hover:scale-150 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-100 rounded-full blur-2xl opacity-30 group-hover:opacity-50 group-hover:scale-125 transition-all duration-700"></div>

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    {challenges.filter(c => !c.isActive).length}
                  </div>
                  <p className="text-gray-600 font-semibold text-lg group-hover:text-orange-700 transition-colors duration-300">Completed</p>
                  <p className="text-gray-400 text-sm mt-1 group-hover:text-gray-600 transition-colors duration-300">Successfully finished</p>
                </div>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Challenges Section */}
        <div id="challenges-section" className="scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold text-white mb-4">
              Featured <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">Challenges</span>
            </h2>
            <p className="text-gray-300 text-lg">Latest skill challenges with bounties</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-32">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-accent-purple/20 border-t-accent-purple"></div>
              <p className="mt-6 text-gray-300 font-medium text-lg">Loading challenges...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && featuredChallenges.length === 0 && (
            <div className="text-center py-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shadow-[0_8px_30px_rgba(124,58,237,0.2)]">
                <span className="text-5xl">🎯</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">
                No challenges yet
              </h3>
              <p className="text-lg text-gray-300 mb-8">
                Be the first to create a challenge!
              </p>
              <Link
                href="/create"
                className="inline-block px-8 py-4 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] hover:scale-105 transition-all"
              >
                Create First Challenge
              </Link>
            </div>
          )}

          {/* Challenges Grid */}
          {!loading && featuredChallenges.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {featuredChallenges.map((challenge) => (
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

              {challenges.length > 6 && (
                <div className="text-center">
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-lg rounded-xl shadow-[0_8px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.6)] hover:scale-105 transition-all"
                  >
                    View All {challenges.length} Challenges
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
