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

  // Check balance
  const balance = await connection.getBalance(creator.publicKey);
  console.log("Creator Balance:", balance / LAMPORTS_PER_SOL, "SOL");

  if (balance < 5.1 * LAMPORTS_PER_SOL) {
    console.error("❌ Insufficient balance! Need at least 5.1 SOL");
    process.exit(1);
  }

  // Setup anchor provider
  const wallet = new anchor.Wallet(creator);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const PROGRAM_ID = new PublicKey("F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b");
  const idl = require("./target/idl/skill_bounty.json");
  const program = new Program(idl, provider) as Program<SkillBounty>;

  // Get PDAs
  const [challengeCounterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("challenge_counter")],
    PROGRAM_ID
  );

  // Get next challenge ID
  const counterAccount = await program.account.challengeCounter.fetch(challengeCounterPDA);
  const nextChallengeId = Number(counterAccount.totalChallenges);

  console.log("\nNext Challenge ID:", nextChallengeId);

  const [challengePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("challenge"), new anchor.BN(nextChallengeId).toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );

  console.log("Challenge PDA:", challengePDA.toString());

  // Create challenge with 5 SOL bounty
  const bountyAmount = 5 * LAMPORTS_PER_SOL;
  const deadlineDays = 7;

  console.log("\n🚀 Creating challenge with 5 SOL bounty...");

  const tx = await program.methods
    .createChallenge(
      "Test Challenge - Full Stack Solana DApp",
      "Build a complete Solana DApp with wallet integration, program interaction, and a beautiful UI. This is a test challenge to verify the bounty escrow mechanism works correctly.",
      new anchor.BN(bountyAmount),
      new anchor.BN(deadlineDays)
    )
    .accounts({
      challengeCounter: challengeCounterPDA,
      creator: creator.publicKey,
    } as any)
    .rpc();

  console.log("\n✅ Challenge created successfully!");
  console.log("Transaction:", tx);
  console.log("Challenge ID:", nextChallengeId);
  console.log("Challenge PDA:", challengePDA.toString());

  // Verify bounty was locked
  await new Promise(resolve => setTimeout(resolve, 2000));

  const challengePDABalance = await connection.getBalance(challengePDA);
  const creatorBalanceAfter = await connection.getBalance(creator.publicKey);

  console.log("\n💰 Balances After Creation:");
  console.log("Challenge PDA Balance:", challengePDABalance / LAMPORTS_PER_SOL, "SOL");
  console.log("Creator Balance:", creatorBalanceAfter / LAMPORTS_PER_SOL, "SOL");
  console.log("\n🔗 View on Explorer:");
  console.log(`https://explorer.solana.com/address/${challengePDA.toString()}?cluster=devnet`);
  console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
