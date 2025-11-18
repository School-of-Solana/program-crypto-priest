import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SkillBounty } from "./target/types/skill_bounty";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Connection } from "@solana/web3.js";

async function main() {
  // Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Load test creator keypair
  const secretKey = new Uint8Array([232,240,187,193,177,21,218,155,96,130,181,105,107,24,206,199,1,232,6,145,230,76,196,227,92,135,144,238,241,209,154,28,4,162,166,203,22,70,178,230,182,140,2,24,22,223,156,45,80,152,78,133,76,207,223,61,71,20,234,173,83,32,194,45]);
  const creator = Keypair.fromSecretKey(secretKey);

  console.log("Creator Address:", creator.publicKey.toString());

  // Setup anchor provider
  const wallet = new anchor.Wallet(creator);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const PROGRAM_ID = new PublicKey("F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b");
  const idl = require("./target/idl/skill_bounty.json");
  const program = new Program(idl, provider) as Program<SkillBounty>;

  const challengeId = 6;

  // Get challenge PDA
  const [challengePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("challenge"), new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );

  console.log("Challenge PDA:", challengePDA.toString());

  // Fetch challenge
  const challenge = await program.account.challenge.fetch(challengePDA);
  console.log("\nChallenge Info:");
  console.log("  Title:", challenge.title);
  console.log("  Bounty:", challenge.bountyAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
  console.log("  Submission Count:", challenge.submissionCount);
  console.log("  Is Active:", challenge.isActive);

  if (challenge.submissionCount === 0) {
    console.error("\n❌ No submissions yet!");
    process.exit(1);
  }

  // Get submission counter to find latest submission
  const [submissionCounterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("submission_counter")],
    PROGRAM_ID
  );

  const submissionCounter = await program.account.submissionCounter.fetch(submissionCounterPDA);
  const totalSubmissions = Number(submissionCounter.totalSubmissions);

  console.log("\n📋 Finding submissions for Challenge #6...");
  console.log(`  Total submissions globally: ${totalSubmissions}`);

  // Find all submissions for this challenge
  let latestSubmissionId = -1;
  let winnerAddress: PublicKey | null = null;

  // Try to find submissions by checking all possible submission IDs
  for (let i = 0; i < totalSubmissions; i++) {
    const [submissionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("submission"),
        new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(i).toArrayLike(Buffer, "le", 8),  // ✅ Changed from 4 to 8 bytes
      ],
      PROGRAM_ID
    );

    try {
      const accountInfo = await connection.getAccountInfo(submissionPDA);
      if (accountInfo) {
        const submission = await program.account.submission.fetch(submissionPDA);
        console.log(`  Found submission ${i}:`);
        console.log(`    Challenge ID: ${submission.challengeId.toNumber()}`);
        console.log(`    Submitter: ${submission.submitter.toString()}`);
        console.log(`    Proof URL: ${submission.proofUrl}`);

        // Use the latest submission for this challenge
        latestSubmissionId = i;
        winnerAddress = submission.submitter;
      }
    } catch (e) {
      // Skip
    }
  }

  if (latestSubmissionId === -1 || !winnerAddress) {
    console.error("\n❌ Could not find any submission for Challenge #6");
    console.error("This might mean the submission failed or uses a different PDA derivation.");
    process.exit(1);
  }

  console.log(`\n🏆 Selecting submission ${latestSubmissionId} as winner...`);

  const [winningSubmissionPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("submission"),
      new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8),
      new anchor.BN(latestSubmissionId).toArrayLike(Buffer, "le", 8),  // ✅ Changed from 4 to 8 bytes
    ],
    PROGRAM_ID
  );

  // Get winner balance before
  const winnerBalanceBefore = await connection.getBalance(winnerAddress);
  const challengeBalanceBefore = await connection.getBalance(challengePDA);

  console.log("\n💰 Balances Before:");
  console.log(`  Winner: ${winnerBalanceBefore / LAMPORTS_PER_SOL} SOL`);
  console.log(`  Challenge PDA: ${challengeBalanceBefore / LAMPORTS_PER_SOL} SOL`);

  // Select winner
  const tx = await program.methods
    .selectWinner(new anchor.BN(challengeId))
    .accounts({
      creator: creator.publicKey,
      winner: winnerAddress,
    } as any)
    .rpc();

  console.log("\n✅ Winner selected!");
  console.log("Transaction:", tx);

  // Wait for confirmation
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get balances after
  const winnerBalanceAfter = await connection.getBalance(winnerAddress);
  const bountyReceived = winnerBalanceAfter - winnerBalanceBefore;

  console.log("\n💰 Balances After:");
  console.log(`  Winner: ${winnerBalanceAfter / LAMPORTS_PER_SOL} SOL`);
  console.log(`  Bounty Received: ${bountyReceived / LAMPORTS_PER_SOL} SOL`);

  // Check if challenge is closed
  let challengeExists = true;
  try {
    await program.account.challenge.fetch(challengePDA);
  } catch (error) {
    challengeExists = false;
  }

  console.log(`  Challenge Closed: ${!challengeExists}`);

  console.log("\n🔗 View on Explorer:");
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  console.log(`https://explorer.solana.com/address/${winnerAddress.toString()}?cluster=devnet`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
