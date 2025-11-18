"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import {
  PROGRAM_ID,
  MAX_PROOF_URL_LENGTH,
  LAMPORTS_PER_SOL,
} from "@/utils/constants";
import {
  formatSOL,
  formatAddress,
  formatDeadline,
  formatRelativeTime,
} from "@/utils/format";
import {
  getChallengePDA,
  getSubmissionPDA,
  getSubmissionCounterPDA,
} from "@/utils/anchor";
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
  winner?: PublicKey;
}

interface Submission {
  submissionId: number;
  challengeId: number;
  submitter: PublicKey;
  proofUrl: string;
  timestamp: number;
}

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toasts, removeToast, success, error } = useToast();

  const challengeId = parseInt(params.id as string);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);

  const [proofUrl, setProofUrl] = useState("");
  const [proofUrlError, setProofUrlError] = useState("");

  useEffect(() => {
    fetchChallengeData();
  }, [challengeId, connection]);

  const fetchChallengeData = async () => {
    try {
      setLoading(true);

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, provider);

      // Fetch challenge
      const [challengePDA] = getChallengePDA(challengeId, PROGRAM_ID);
      const challengeAccount = await (program.account as any).challenge.fetch(
        challengePDA
      );

      const challengeData: Challenge = {
        challengeId: challengeAccount.challengeId.toNumber(),
        creator: challengeAccount.creator,
        title: challengeAccount.title,
        description: challengeAccount.description,
        bountyAmount: challengeAccount.bountyAmount.toNumber(),
        deadline: challengeAccount.deadline.toNumber(),
        isActive: challengeAccount.isActive,
        submissionCount: challengeAccount.submissionCount,
        winner: challengeAccount.winner,
      };

      setChallenge(challengeData);

      // Fetch submissions for this challenge
      // Strategy: Try to fetch by individual PDAs since submission.all() often fails
      try {
        const challengeSubmissions: Submission[] = [];

        // Get total submissions to know how many to try
        const [submissionCounterPDA] = getSubmissionCounterPDA(PROGRAM_ID);
        const counterAccount = await (
          program.account as any
        ).submissionCounter.fetch(submissionCounterPDA);
        const totalSubmissions = (counterAccount.totalSubmissions as BN).toNumber();

        // Try to fetch each possible submission PDA for this challenge
        for (let i = 0; i < totalSubmissions; i++) {
          try {
            const [submissionPDA] = getSubmissionPDA(challengeId, i, PROGRAM_ID);
            const submissionAccount = await (
              program.account as any
            ).submission.fetch(submissionPDA);

            // Only add if it belongs to this challenge
            if (submissionAccount.challengeId.toNumber() === challengeId) {
              challengeSubmissions.push({
                submissionId: submissionAccount.submissionId.toNumber(),
                challengeId: submissionAccount.challengeId.toNumber(),
                submitter: submissionAccount.submitter,
                proofUrl: submissionAccount.proofUrl,
                timestamp: submissionAccount.submittedAt.toNumber(),
              });
            }
          } catch (err) {
            // Submission doesn't exist at this PDA, skip
            continue;
          }
        }

        // Sort by newest first
        challengeSubmissions.sort((a, b) => b.timestamp - a.timestamp);

        setSubmissions(challengeSubmissions);
      } catch (submissionErr) {
        console.error("Error fetching submissions:", submissionErr);
        // Don't fail the entire page if submissions can't be fetched
        // Challenge data is still valid
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching challenge:", err);
      error("Challenge not found");
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey) {
      error("Please connect your wallet first!");
      return;
    }

    if (!challenge) return;

    // Validation
    if (!proofUrl.trim()) {
      setProofUrlError("Proof URL is required");
      return;
    }

    if (proofUrl.length > MAX_PROOF_URL_LENGTH) {
      setProofUrlError(
        `URL must be ${MAX_PROOF_URL_LENGTH} characters or less`
      );
      return;
    }

    // Check if URL is valid
    try {
      new URL(proofUrl);
    } catch {
      setProofUrlError("Please enter a valid URL");
      return;
    }

    setSubmitting(true);

    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, provider);

      // Get submission counter
      const [submissionCounterPDA] = getSubmissionCounterPDA(PROGRAM_ID);
      const counterAccount = await (
        program.account as any
      ).submissionCounter.fetch(submissionCounterPDA);
      const nextSubmissionId = (counterAccount.totalSubmissions as BN).toNumber();

      // Get PDAs
      const [challengePDA] = getChallengePDA(challengeId, PROGRAM_ID);
      const [submissionPDA] = getSubmissionPDA(
        challengeId,
        nextSubmissionId,
        PROGRAM_ID
      );

      // Submit solution
      const tx = await program.methods
        .submitSolution(new BN(challengeId), proofUrl.trim())
        .accounts({
          submission: submissionPDA,
          challenge: challengePDA,
          submissionCounter: submissionCounterPDA,
          submitter: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      success("Solution submitted successfully!");

      setProofUrl("");
      await fetchChallengeData();
    } catch (err: any) {
      console.error("Failed to submit solution:", err);

      const errorMessage = err.message?.includes("User rejected")
        ? "Transaction was cancelled"
        : err.message?.includes("inactive")
        ? "This challenge is no longer active"
        : "Failed to submit solution. Please try again.";

      error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWinner = async (winnerPubkey: PublicKey) => {
    if (!wallet.publicKey || !challenge) return;

    if (
      !confirm(
        `Are you sure you want to select ${formatAddress(
          winnerPubkey.toString()
        )} as the winner?\n\nThis will transfer ${formatSOL(
          challenge.bountyAmount
        )} to them and close the challenge.`
      )
    ) {
      return;
    }

    setSelectingWinner(true);

    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, provider);

      const [challengePDA] = getChallengePDA(challengeId, PROGRAM_ID);

      const tx = await program.methods
        .selectWinner(new BN(challengeId))
        .accounts({
          challenge: challengePDA,
          creator: wallet.publicKey,
          winner: winnerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      success("Winner selected successfully!");

      await fetchChallengeData();
    } catch (err: any) {
      console.error("Failed to select winner:", err);

      const errorMessage = err.message?.includes("User rejected")
        ? "Transaction was cancelled"
        : err.message?.includes("unauthorized")
        ? "Only the creator can select a winner"
        : "Failed to select winner. Please try again.";

      error(errorMessage);
    } finally {
      setSelectingWinner(false);
    }
  };

  const isCreator = !!(
    wallet.publicKey && challenge?.creator.equals(wallet.publicKey)
  );
  const hasSubmitted = !!(
    wallet.publicKey &&
    submissions.some((s) => s.submitter.equals(wallet.publicKey!))
  );
  const isDeadlinePassed = challenge
    ? Date.now() / 1000 > challenge.deadline
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <Navbar />

        {/* Toast Notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-purple border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading challenge...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-primary-bg">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-red-400">Challenge not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <Navbar />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center"
        >
          ← Back to challenges
        </button>

        {/* Challenge Header */}
        <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1325] border border-accent-purple/30 rounded-2xl p-8 mb-8 shadow-xl">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-5xl font-bold text-white">
                  {challenge.title}
                </h1>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    challenge.isActive
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                  }`}
                >
                  {challenge.isActive ? "🔥 Active" : "✓ Completed"}
                </span>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Winner Banner - Show prominently if winner exists */}
          {challenge.winner && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-500/10 via-accent-purple/10 to-accent-pink/10 border-2 border-yellow-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 font-bold text-2xl mb-2 flex items-center">
                    <span className="text-3xl mr-3">🏆</span>
                    Winner Announced!
                  </p>
                  <p className="text-gray-300 text-sm">
                    Congratulations to:{" "}
                    <span className="text-accent-cyan font-mono text-base font-semibold">
                      {formatAddress(challenge.winner.toString())}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">Prize Awarded</p>
                  <p className="text-accent-cyan text-3xl font-bold flex items-center">
                    <span className="mr-2">💎</span>
                    {formatSOL(challenge.bountyAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5 hover:border-cyan-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Bounty Reward</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-accent-cyan text-3xl font-bold">
                {formatSOL(challenge.bountyAmount)}
              </p>
              <p className="text-cyan-300 text-xs mt-1 opacity-75">
                {!challenge.isActive ? "Claimed" : "Unclaimed"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-5 hover:border-orange-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Time Left</p>
                <span className="text-2xl">⏰</span>
              </div>
              <p className={`text-2xl font-bold ${isDeadlinePassed ? "text-red-400" : "text-orange-400"}`}>
                {formatDeadline(challenge.deadline)}
              </p>
              <p className="text-orange-300 text-xs mt-1 opacity-75">
                {isDeadlinePassed ? "Deadline passed" : "Until deadline"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Submissions</p>
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-white text-3xl font-bold">
                {challenge.submissionCount}
              </p>
              <p className="text-purple-300 text-xs mt-1 opacity-75">
                {challenge.submissionCount === 0 ? "No submissions yet" : `${submissions.length} loaded`}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-5 hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Challenge Creator</p>
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-accent-purple text-lg font-mono font-semibold">
                {formatAddress(challenge.creator.toString())}
              </p>
              <p className="text-indigo-300 text-xs mt-1 opacity-75">
                {isCreator ? "You" : "Other"}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Solution Form */}
        {challenge.isActive && !isCreator && !hasSubmitted && (
          <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1325] border border-accent-purple/30 rounded-2xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">
              Submit Your Solution
            </h2>

            {!wallet.publicKey && (
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-400 text-center">
                  ⚠️ Please connect your wallet to submit a solution
                </p>
              </div>
            )}

            {isDeadlinePassed && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-center">
                  ⚠️ The deadline for this challenge has passed
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div>
                <label
                  htmlFor="proofUrl"
                  className="block text-white font-semibold mb-2"
                >
                  Proof URL (GitHub, Figma, Drive, etc.)
                  <span className="text-accent-pink ml-1">*</span>
                </label>
                <input
                  type="url"
                  id="proofUrl"
                  value={proofUrl}
                  onChange={(e) => {
                    setProofUrl(e.target.value);
                    setProofUrlError("");
                  }}
                  maxLength={MAX_PROOF_URL_LENGTH}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20"
                  placeholder="https://github.com/username/repo"
                  disabled={
                    submitting || !wallet.publicKey || isDeadlinePassed
                  }
                />
                {proofUrlError && (
                  <p className="text-red-400 text-sm mt-1">{proofUrlError}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {proofUrl.length}/{MAX_PROOF_URL_LENGTH}
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  !wallet.publicKey ||
                  submitting ||
                  !proofUrl ||
                  isDeadlinePassed
                }
                className="w-full py-3 bg-gradient-to-r from-accent-purple to-accent-pink rounded-lg text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit Solution"
                )}
              </button>
            </form>
          </div>
        )}

        {hasSubmitted && challenge.isActive && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-center">
              ✓ You have already submitted a solution to this challenge
            </p>
          </div>
        )}

        {/* Submissions List */}
        <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1325] border border-accent-purple/30 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <span className="mr-3 text-2xl">📋</span>
              Submissions
              <span className="ml-3 text-lg font-normal text-gray-400">
                ({submissions.length} of {challenge.submissionCount})
              </span>
            </h2>
            {isCreator && challenge.isActive && submissions.length > 0 && !challenge.winner && (
              <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-semibold">
                  ⚡ Select a winner to complete challenge
                </p>
              </div>
            )}
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-xl">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-300 text-xl font-semibold mb-2">No submissions yet</p>
              <p className="text-gray-500 text-sm">
                {challenge.isActive
                  ? "Be the first to submit a solution and win the bounty!"
                  : "This challenge had no submissions"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {submissions.map((submission, index) => {
                const isWinner =
                  challenge.winner &&
                  submission.submitter.equals(challenge.winner);
                const isUserSubmission =
                  wallet.publicKey &&
                  submission.submitter.equals(wallet.publicKey);

                return (
                  <div
                    key={submission.submissionId}
                    className={`relative rounded-xl border-2 transition-all hover:shadow-lg ${
                      isWinner
                        ? "bg-gradient-to-r from-yellow-500/10 via-accent-purple/10 to-accent-pink/10 border-yellow-500/50 shadow-yellow-500/20"
                        : isUserSubmission
                        ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Winner Ribbon */}
                    {isWinner && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-1 rounded-full shadow-lg text-xs font-bold uppercase tracking-wide flex items-center">
                        <span className="mr-1">🏆</span> Winner
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-accent-purple/20 rounded-lg">
                              <span className="text-accent-purple font-bold text-lg">
                                #{submission.submissionId}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-bold text-lg">
                                Submission #{submission.submissionId}
                                {isUserSubmission && (
                                  <span className="ml-2 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded">
                                    YOUR SUBMISSION
                                  </span>
                                )}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Submitted {formatRelativeTime(submission.timestamp)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Submitter:</span>
                            <span className="text-accent-cyan font-mono font-semibold bg-accent-cyan/10 px-3 py-1 rounded-lg">
                              {formatAddress(submission.submitter.toString())}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={submission.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/50 hover:border-indigo-400 rounded-lg text-white text-sm font-semibold transition-all flex items-center gap-2"
                          >
                            <span>👁️</span>
                            View Proof
                          </a>

                          {isCreator &&
                            challenge.isActive &&
                            !challenge.winner && (
                              <button
                                onClick={() =>
                                  handleSelectWinner(submission.submitter)
                                }
                                disabled={selectingWinner}
                                className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                              >
                                <span>🏆</span>
                                {selectingWinner ? "Selecting..." : "Select as Winner"}
                              </button>
                            )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 text-sm mt-0.5">🔗</span>
                          <p className="text-gray-400 text-sm break-all flex-1 font-mono bg-black/20 px-3 py-2 rounded">
                            {submission.proofUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
