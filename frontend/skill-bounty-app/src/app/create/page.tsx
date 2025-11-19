"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
import {
  PROGRAM_ID,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  LAMPORTS_PER_SOL,
  SECONDS_PER_DAY,
} from "@/utils/constants";
import { getChallengePDA, getChallengeCounterPDA } from "@/utils/anchor";
import IDL from "@/utils/idl.json";

export default function CreateChallenge() {
  const router = useRouter();
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toasts, removeToast, success, error } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bountyAmount: "",
    deadlineDays: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }

    // Bounty amount validation
    const bounty = parseFloat(formData.bountyAmount);
    if (!formData.bountyAmount) {
      newErrors.bountyAmount = "Bounty amount is required";
    } else if (isNaN(bounty) || bounty <= 0) {
      newErrors.bountyAmount = "Bounty must be greater than 0";
    } else if (bounty < 0.01) {
      newErrors.bountyAmount = "Minimum bounty is 0.01 SOL";
    }

    // Deadline validation
    const days = parseInt(formData.deadlineDays);
    if (!formData.deadlineDays) {
      newErrors.deadlineDays = "Deadline is required";
    } else if (isNaN(days) || days <= 0) {
      newErrors.deadlineDays = "Deadline must be greater than 0";
    } else if (days < 1) {
      newErrors.deadlineDays = "Minimum deadline is 1 day";
    } else if (days > 365) {
      newErrors.deadlineDays = "Maximum deadline is 365 days";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey) {
      error("Please connect your wallet first!");
      return;
    }

    if (!validateForm()) {
      error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "confirmed",
      });

      const program = new Program(IDL as any, provider);

      // Get challenge counter PDA
      const [challengeCounterPDA] = getChallengeCounterPDA(PROGRAM_ID);

      // Fetch current challenge counter to get the next challenge ID
      const counterAccount = await (program.account as any).challengeCounter.fetch(
        challengeCounterPDA
      );
      const nextChallengeId = (counterAccount.totalChallenges as BN).toNumber();

      // Get challenge PDA for the new challenge
      const [challengePDA] = getChallengePDA(nextChallengeId, PROGRAM_ID);

      // Convert bounty to lamports
      const bountyLamports = Math.floor(
        parseFloat(formData.bountyAmount) * LAMPORTS_PER_SOL
      );

      // Create the challenge
      const tx = await program.methods
        .createChallenge(
          formData.title.trim(),
          formData.description.trim(),
          new BN(bountyLamports),
          new BN(parseInt(formData.deadlineDays))
        )
        .accounts({
          challenge: challengePDA,
          challengeCounter: challengeCounterPDA,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      success("Challenge created successfully! Redirecting...");

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err: any) {
      console.error("Failed to create challenge:", err);

      const errorMessage = err.message?.includes("User rejected")
        ? "Transaction was cancelled"
        : err.message?.includes("insufficient")
        ? "Insufficient SOL balance"
        : "Failed to create challenge. Please try again.";

      error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

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

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-deep-teal">
            Create a Skill Challenge
          </h1>
          <p className="text-lg text-dark-slate">
            Set a challenge and reward the best solution with SOL
          </p>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 border-border-light rounded-xl p-8 shadow-sm">
            {!wallet.publicKey && (
              <div className="mb-6 p-4 bg-muted-teal/10 border-2 border-muted-teal/30 rounded-lg">
                <p className="text-deep-teal text-center font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please connect your wallet to create a challenge
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-deep-teal font-semibold mb-2"
                >
                  Challenge Title
                  <span className="text-dark-slate ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full px-4 py-3 bg-white border-2 border-border-light rounded-lg text-deep-teal placeholder-muted-teal focus:outline-none focus:border-muted-teal transition-colors"
                  placeholder="e.g., Build a Solana NFT Marketplace"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between mt-2">
                  {errors.title && (
                    <p className="text-dark-slate text-sm font-medium">{errors.title}</p>
                  )}
                  <p className="text-muted-teal text-sm ml-auto">
                    {formData.title.length}/{MAX_TITLE_LENGTH}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-deep-teal font-semibold mb-2"
                >
                  Description
                  <span className="text-dark-slate ml-1">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={6}
                  className="w-full px-4 py-3 bg-white border-2 border-border-light rounded-lg text-deep-teal placeholder-muted-teal focus:outline-none focus:border-muted-teal transition-colors resize-none"
                  placeholder="Describe the challenge requirements, acceptance criteria, and any specific guidelines..."
                  disabled={isSubmitting}
                />
                <div className="flex justify-between mt-2">
                  {errors.description && (
                    <p className="text-dark-slate text-sm font-medium">{errors.description}</p>
                  )}
                  <p className="text-muted-teal text-sm ml-auto">
                    {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Bounty Amount */}
                <div>
                  <label
                    htmlFor="bountyAmount"
                    className="block text-deep-teal font-semibold mb-2"
                  >
                    Bounty Amount (SOL)
                    <span className="text-dark-slate ml-1">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-dark-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <input
                      type="number"
                      id="bountyAmount"
                      name="bountyAmount"
                      value={formData.bountyAmount}
                      onChange={handleChange}
                      step="0.01"
                      min="0.01"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-border-light rounded-lg text-deep-teal placeholder-muted-teal focus:outline-none focus:border-muted-teal transition-colors"
                      placeholder="1.5"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.bountyAmount && (
                    <p className="text-dark-slate text-sm font-medium mt-2">
                      {errors.bountyAmount}
                    </p>
                  )}
                  <p className="text-muted-teal text-sm mt-2">
                    Locked in escrow until winner selected
                  </p>
                </div>

                {/* Deadline */}
                <div>
                  <label
                    htmlFor="deadlineDays"
                    className="block text-deep-teal font-semibold mb-2"
                  >
                    Deadline (Days)
                    <span className="text-dark-slate ml-1">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-3.5 w-5 h-5 text-muted-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <input
                      type="number"
                      id="deadlineDays"
                      name="deadlineDays"
                      value={formData.deadlineDays}
                      onChange={handleChange}
                      min="1"
                      max="365"
                      className="w-full pl-12 pr-4 py-3 bg-white border-2 border-border-light rounded-lg text-deep-teal placeholder-muted-teal focus:outline-none focus:border-muted-teal transition-colors"
                      placeholder="7"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.deadlineDays && (
                    <p className="text-dark-slate text-sm font-medium mt-2">
                      {errors.deadlineDays}
                    </p>
                  )}
                  <p className="text-muted-teal text-sm mt-2">
                    Days from now until deadline
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!wallet.publicKey || isSubmitting}
                className="w-full py-4 bg-deep-teal rounded-lg text-ash-grey font-semibold text-lg hover:bg-dark-slate transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-deep-teal shadow-md"
              >
                {isSubmitting ? (
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
                    Creating Challenge...
                  </span>
                ) : (
                  "Create Challenge"
                )}
              </button>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-10 bg-white rounded-xl border-2 border-border-light p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-muted-teal/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-muted-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-deep-teal font-bold text-xl mb-1">How it works</h3>
                <p className="text-dark-slate text-sm">Simple 4-step process</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-deep-teal text-ash-grey flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-deep-teal font-semibold mb-1">Escrow Lock</h4>
                  <p className="text-dark-slate text-sm">Your bounty is locked safely in a smart contract escrow</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-muted-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-deep-teal font-semibold mb-1">Submissions Open</h4>
                  <p className="text-dark-slate text-sm">Participants submit their solutions before the deadline</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-dark-slate text-white flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-deep-teal font-semibold mb-1">Review & Select</h4>
                  <p className="text-dark-slate text-sm">Review submissions and pick the best one as winner</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-dark-slate text-white flex items-center justify-center flex-shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="text-deep-teal font-semibold mb-1">Auto Payout</h4>
                  <p className="text-dark-slate text-sm">Winner receives the full bounty amount automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
