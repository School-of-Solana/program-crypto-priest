import { PublicKey } from "@solana/web3.js";

/**
 * Get Challenge PDA address
 */
export function getChallengePDA(
  challengeId: number,
  programId: PublicKey
): [PublicKey, number] {
  const challengeIdBuffer = Buffer.alloc(8);
  challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));

  return PublicKey.findProgramAddressSync(
    [Buffer.from("challenge"), challengeIdBuffer],
    programId
  );
}

/**
 * Get Submission PDA address
 */
export function getSubmissionPDA(
  challengeId: number,
  submissionId: number,
  programId: PublicKey
): [PublicKey, number] {
  const challengeIdBuffer = Buffer.alloc(8);
  challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));

  const submissionIdBuffer = Buffer.alloc(8);
  submissionIdBuffer.writeBigUInt64LE(BigInt(submissionId));

  return PublicKey.findProgramAddressSync(
    [Buffer.from("submission"), challengeIdBuffer, submissionIdBuffer],
    programId
  );
}

/**
 * Get Challenge Counter PDA
 */
export function getChallengeCounterPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("challenge_counter")],
    programId
  );
}

/**
 * Get Submission Counter PDA
 */
export function getSubmissionCounterPDA(
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("submission_counter")],
    programId
  );
}
