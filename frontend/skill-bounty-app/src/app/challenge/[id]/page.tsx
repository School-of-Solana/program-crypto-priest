"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import dynamic from "next/dynamic";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import ConfirmModal from "@/components/ConfirmModal";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
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

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<PublicKey | null>(null);

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
      try {
        const challengeSubmissions: Submission[] = [];

        const [submissionCounterPDA] = getSubmissionCounterPDA(PROGRAM_ID);
        const counterAccount = await (
          program.account as any
        ).submissionCounter.fetch(submissionCounterPDA);
        const totalSubmissions = (counterAccount.totalSubmissions as BN).toNumber();

        for (let i = 0; i < totalSubmissions; i++) {
          try {
            const [submissionPDA] = getSubmissionPDA(challengeId, i, PROGRAM_ID);
            const submissionAccount = await (
              program.account as any
            ).submission.fetch(submissionPDA);

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
            continue;
          }
        }

        challengeSubmissions.sort((a, b) => b.timestamp - a.timestamp);
        setSubmissions(challengeSubmissions);
      } catch (submissionErr) {
        console.error("Error fetching submissions:", submissionErr);
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

      const [submissionCounterPDA] = getSubmissionCounterPDA(PROGRAM_ID);
      const counterAccount = await (
        program.account as any
      ).submissionCounter.fetch(submissionCounterPDA);
      const nextSubmissionId = (counterAccount.totalSubmissions as BN).toNumber();

      const [challengePDA] = getChallengePDA(challengeId, PROGRAM_ID);
      const [submissionPDA] = getSubmissionPDA(
        challengeId,
        nextSubmissionId,
        PROGRAM_ID
      );

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
    setSelectedWinner(winnerPubkey);
    setShowConfirmModal(true);
  };

  const confirmSelectWinner = async () => {
    if (!selectedWinner || !wallet.publicKey || !challenge) return;

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
          winner: selectedWinner,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      success("Winner selected successfully!");

      await fetchChallengeData();
      setShowConfirmModal(false);
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-muted-teal/20 border-t-muted-teal"></div>
            <p className="mt-4 text-dark-slate">Loading challenge...</p>
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
            <p className="text-dark-slate">Challenge not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <Navbar />

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-dark-slate hover:text-deep-teal transition-colors flex items-center gap-2 font-medium group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to challenges
        </button>

        {/* Challenge Header Card */}
        <div className="bg-white rounded-2xl border-2 border-border-light p-8 mb-8 shadow-sm">
          {/* Title Row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-muted-teal font-semibold">
                  CHALLENGE #{challenge.challengeId}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    challenge.isActive
                      ? "bg-muted-teal/10 text-muted-teal border border-muted-teal"
                      : "bg-dark-slate/10 text-dark-slate border border-dark-slate"
                  }`}
                >
                  {challenge.isActive ? "ACTIVE" : "COMPLETED"}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                {challenge.title}
              </h1>
              <p className="text-dark-slate leading-relaxed">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Winner Banner */}
          {challenge.winner && (
            <div className="mb-6 p-6 bg-deep-teal/5 border-2 border-deep-teal/20 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <p className="text-deep-teal font-bold text-xl">
                      Winner Announced!
                    </p>
                  </div>
                  <p className="text-dark-slate">
                    Winner:{" "}
                    <span className="text-deep-teal font-mono font-semibold">
                      {formatAddress(challenge.winner.toString())}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-teal text-sm mb-1">Prize</p>
                  <p className="text-deep-teal text-3xl font-bold">
                    {formatSOL(challenge.bountyAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-deep-teal/5 border border-deep-teal/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-muted-teal uppercase">Bounty</span>
              </div>
              <p className="text-2xl font-bold text-deep-teal">
                {formatSOL(challenge.bountyAmount)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted-teal/5 border border-muted-teal/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-muted-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-muted-teal uppercase">Deadline</span>
              </div>
              <p className={`text-xl font-bold ${isDeadlinePassed ? "text-dark-slate" : "text-muted-teal"}`}>
                {formatDeadline(challenge.deadline)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-dark-slate/5 border border-dark-slate/20">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-dark-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-semibold text-muted-teal uppercase">Submissions</span>
              </div>
              <p className="text-2xl font-bold text-dark-slate">
                {challenge.submissionCount}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-ash-grey/30 border border-ash-grey">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-dark-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-semibold text-muted-teal uppercase">Creator</span>
              </div>
              <p className="text-sm font-mono font-semibold text-deep-teal truncate">
                {formatAddress(challenge.creator.toString())}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Solution Form */}
        {challenge.isActive && !isCreator && !hasSubmitted && (
          <div className="bg-white border-2 border-border-light rounded-xl p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold text-charcoal mb-6">
              Submit Your Solution
            </h2>

            {!wallet.publicKey && (
              <div className="mb-6 p-4 bg-muted-teal/10 border border-muted-teal/20 rounded-lg">
                <p className="text-deep-teal text-center font-medium">
                  Please connect your wallet to submit a solution
                </p>
              </div>
            )}

            {isDeadlinePassed && (
              <div className="mb-6 p-4 bg-dark-slate/10 border border-dark-slate/20 rounded-lg">
                <p className="text-dark-slate text-center font-medium">
                  The deadline for this challenge has passed
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div>
                <label
                  htmlFor="proofUrl"
                  className="block text-charcoal font-semibold mb-2"
                >
                  Proof URL (GitHub, Figma, Drive, etc.)
                  <span className="text-dark-slate ml-1">*</span>
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
                  className="w-full px-4 py-3 bg-white border-2 border-border-light rounded-lg text-charcoal placeholder-muted-teal focus:outline-none focus:border-muted-teal transition-colors"
                  placeholder="https://github.com/username/repo"
                  disabled={
                    submitting || !wallet.publicKey || isDeadlinePassed
                  }
                />
                {proofUrlError && (
                  <p className="text-dark-slate text-sm mt-1">{proofUrlError}</p>
                )}
                <p className="text-muted-teal text-sm mt-1">
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
                className="w-full py-3 bg-deep-teal rounded-lg text-white font-semibold hover:bg-dark-slate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mb-8 p-4 bg-muted-teal/10 border border-muted-teal/20 rounded-lg">
            <p className="text-deep-teal text-center font-medium">
              You have already submitted a solution to this challenge
            </p>
          </div>
        )}

        {/* Submissions List */}
        <div className="bg-white border-2 border-border-light rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-charcoal">
              Submissions ({submissions.length})
            </h2>
            {isCreator && challenge.isActive && submissions.length > 0 && !challenge.winner && (
              <div className="px-4 py-2 bg-muted-teal/10 border border-muted-teal/20 rounded-lg">
                <p className="text-deep-teal text-sm font-semibold">
                  Select a winner to complete challenge
                </p>
              </div>
            )}
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border-medium rounded-xl">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-charcoal text-xl font-semibold mb-2">No submissions yet</p>
              <p className="text-dark-slate text-sm">
                {challenge.isActive
                  ? "Be the first to submit a solution and win the bounty!"
                  : "This challenge had no submissions"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                    className={`relative rounded-xl border-2 p-6 transition-all ${
                      isWinner
                        ? "bg-deep-teal/5 border-deep-teal/30"
                        : isUserSubmission
                        ? "bg-muted-teal/5 border-muted-teal/30"
                        : "bg-white border-border-light hover:border-muted-teal"
                    }`}
                  >
                    {isWinner && (
                      <div className="absolute -top-3 -right-3 bg-deep-teal text-white px-4 py-1 rounded-full shadow-md text-xs font-bold uppercase flex items-center gap-1">
                        <span>🏆</span> Winner
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-muted-teal/10 rounded-lg">
                            <span className="text-muted-teal font-bold">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-charcoal font-semibold">
                              Submission #{index + 1}
                              {isUserSubmission && (
                                <span className="ml-2 px-2 py-0.5 bg-muted-teal/10 text-muted-teal text-xs font-bold rounded">
                                  YOUR SUBMISSION
                                </span>
                              )}
                            </p>
                            <p className="text-muted-teal text-sm">
                              {formatRelativeTime(submission.timestamp)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-3">
                          <span className="text-dark-slate">Submitter:</span>
                          <span className="text-deep-teal font-mono font-semibold bg-deep-teal/5 px-3 py-1 rounded">
                            {formatAddress(submission.submitter.toString())}
                          </span>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-ash-grey/30 rounded">
                          <svg className="w-4 h-4 text-muted-teal mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <p className="text-dark-slate text-sm break-all font-mono flex-1">
                            {submission.proofUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <a
                          href={submission.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white border-2 border-muted-teal hover:bg-muted-teal hover:text-white rounded-lg text-muted-teal text-sm font-semibold transition-all text-center whitespace-nowrap"
                        >
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
                              className="px-4 py-2 bg-deep-teal hover:bg-dark-slate rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {selectingWinner ? "Selecting..." : "Select Winner"}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSelectWinner}
        title="Select Winner"
        message={`Are you sure you want to select ${selectedWinner ? formatAddress(selectedWinner.toString()) : ''} as the winner?\n\nThis will transfer ${challenge ? formatSOL(challenge.bountyAmount) : ''} to them and close the challenge.`}
        confirmText="Select Winner"
        isLoading={selectingWinner}
      />
    </div>
  );
}
