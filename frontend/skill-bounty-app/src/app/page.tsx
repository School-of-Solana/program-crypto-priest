"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import dynamic from "next/dynamic";
import { PROGRAM_ID } from "@/utils/constants";
import IDL from "@/utils/idl.json";
import styles from "./page.module.css";

// Dynamically import components to prevent hydration issues
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

      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: "confirmed" }
      );

      const program = new Program(IDL as any, provider);
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
  const activeChallenges = challenges.filter(c => c.isActive).length;
  const totalBounty = challenges.reduce((sum, c) => sum + c.bountyAmount, 0) / 1000000000;

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <div className={styles.hero}>
          {/* Status Badge */}
          <div className={styles.statusBadge}>
            <div className={styles.statusDot}></div>
            <span className={styles.statusText}>
              {challenges.length} Challenges Available
            </span>
          </div>

          {/* Main Headline */}
          <h1 className={styles.headline}>
            Prove Your Skills,<br />
            <span className={styles.headlineAccent}>Earn Rewards</span>
          </h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>
            Blockchain-verified skill challenges with instant SOL bounties. No middlemen, just results.
          </p>

          {/* CTA Buttons */}
          <div className={styles.ctaButtons}>
            <Link href="/browse" className={styles.ctaPrimary}>
              Browse Challenges
            </Link>
            <Link href="/create" className={styles.ctaSecondary}>
              Create Challenge
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Platform Overview
            </h2>
            <p className={styles.sectionDescription}>Real-time statistics from the ecosystem</p>
          </div>

          <div className={styles.statsGrid}>
            {/* Total Challenges */}
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconDeepTeal}`}>
                <svg className={`${styles.statSvg} ${styles.statSvgDeepTeal}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className={`${styles.statValue} ${styles.statValueCharcoal}`}>{challenges.length}</div>
              <p className={styles.statLabel}>Total Challenges</p>
            </div>

            {/* Active Challenges */}
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconMutedTeal}`}>
                <svg className={`${styles.statSvg} ${styles.statSvgMutedTeal}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className={`${styles.statValue} ${styles.statValueMutedTeal}`}>{activeChallenges}</div>
              <p className={styles.statLabel}>Active Now</p>
            </div>

            {/* Total Bounty */}
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconDarkSlate}`}>
                <svg className={`${styles.statSvg} ${styles.statSvgDarkSlate}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`${styles.statValue} ${styles.statValueDarkSlate}`}>{totalBounty.toFixed(2)} SOL</div>
              <p className={styles.statLabel}>Total Bounties</p>
            </div>
          </div>
        </div>

        {/* Featured Challenges Section */}
        <div id="challenges-section" className={styles.challengesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Featured Challenges
            </h2>
            <p className={styles.sectionDescription}>Latest skill challenges with bounties</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading challenges...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && featuredChallenges.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className={styles.emptyTitle}>
                No challenges yet
              </h3>
              <p className={styles.emptyDescription}>
                Be the first to create a challenge!
              </p>
              <Link href="/create" className={styles.emptyButton}>
                Create First Challenge
              </Link>
            </div>
          )}

          {/* Challenges Grid */}
          {!loading && featuredChallenges.length > 0 && (
            <>
              <div className={styles.challengesGrid}>
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
                <div className={styles.viewAllSection}>
                  <Link href="/browse" className={styles.viewAllButton}>
                    View All {challenges.length} Challenges
                    <svg className={styles.viewAllIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
