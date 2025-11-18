"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
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
          <h1 className="text-6xl font-extrabold mb-4 text-white">
            Create a <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">Skill Challenge</span>
          </h1>
          <p className="text-xl text-gray-300">
            Set a challenge and reward the best solution with SOL
          </p>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 border-border-light rounded-2xl p-8 shadow-lg">
            {!wallet.publicKey && (
              <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <p className="text-orange-700 text-center font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please connect your wallet to create a challenge
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-text-primary font-bold mb-3 text-lg"
                >
                  Challenge Title
                  <span className="text-accent-pink ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-border-light rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:bg-white transition-all"
                  placeholder="e.g., Build a Solana NFT Marketplace"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between mt-2">
                  {errors.title && (
                    <p className="text-red-600 text-sm font-medium">{errors.title}</p>
                  )}
                  <p className="text-text-muted text-sm ml-auto">
                    {formData.title.length}/{MAX_TITLE_LENGTH}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-text-primary font-bold mb-3 text-lg"
                >
                  Description
                  <span className="text-accent-pink ml-1">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={6}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-border-light rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:bg-white transition-all resize-none"
                  placeholder="Describe the challenge requirements, acceptance criteria, and any specific guidelines..."
                  disabled={isSubmitting}
                />
                <div className="flex justify-between mt-2">
                  {errors.description && (
                    <p className="text-red-600 text-sm font-medium">{errors.description}</p>
                  )}
                  <p className="text-text-muted text-sm ml-auto">
                    {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Bounty Amount */}
                <div>
                  <label
                    htmlFor="bountyAmount"
                    className="block text-text-primary font-bold mb-3 text-lg"
                  >
                    Bounty Amount (SOL)
                    <span className="text-accent-pink ml-1">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-4 w-6 h-6 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-border-light rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:bg-white transition-all"
                      placeholder="1.5"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.bountyAmount && (
                    <p className="text-red-600 text-sm font-medium mt-2">
                      {errors.bountyAmount}
                    </p>
                  )}
                  <p className="text-text-muted text-sm mt-2">
                    Locked in escrow until winner selected
                  </p>
                </div>

                {/* Deadline */}
                <div>
                  <label
                    htmlFor="deadlineDays"
                    className="block text-text-primary font-bold mb-3 text-lg"
                  >
                    Deadline (Days)
                    <span className="text-accent-pink ml-1">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-4 w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="w-full pl-14 pr-4 py-4 bg-gray-50 border-2 border-border-light rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple focus:bg-white transition-all"
                      placeholder="7"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.deadlineDays && (
                    <p className="text-red-600 text-sm font-medium mt-2">
                      {errors.deadlineDays}
                    </p>
                  )}
                  <p className="text-text-muted text-sm mt-2">
                    Days from now until deadline
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!wallet.publicKey || isSubmitting}
                className="w-full py-5 bg-gradient-to-r from-accent-purple to-accent-pink rounded-xl text-white font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

          {/* Info Box - Redesigned */}
          <div className="mt-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/10 via-pink-500/5 to-transparent border border-purple-500/30 p-10 shadow-[0_20px_60px_rgba(124,58,237,0.15)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center shadow-[0_8px_30px_rgba(124,58,237,0.2)]">
                  <svg className="w-7 h-7 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">How it works</h3>
                  <p className="text-gray-400 text-sm">Simple 4-step process</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Escrow Lock</h4>
                    <p className="text-gray-400 text-sm">Your bounty is locked safely in a smart contract escrow</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Submissions Open</h4>
                    <p className="text-gray-400 text-sm">Participants submit their solutions before the deadline</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Review & Select</h4>
                    <p className="text-gray-400 text-sm">Review submissions and pick the best one as winner</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Auto Payout</h4>
                    <p className="text-gray-400 text-sm">Winner receives the full bounty amount automatically</p>
                  </div>
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
