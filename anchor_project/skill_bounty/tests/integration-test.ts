import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SkillBounty } from "../target/types/skill_bounty";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("Skill Bounty - Integration Test (Full Flow)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SkillBounty as Program<SkillBounty>;

  const creator = Keypair.generate();
  const challenger1 = Keypair.generate();
  const challenger2 = Keypair.generate();
  const challenger3 = Keypair.generate();

  const BOUNTY_AMOUNT = 2 * LAMPORTS_PER_SOL;

  let challengeCounter: PublicKey;
  let submissionCounter: PublicKey;
  let challengePda: PublicKey;
  let challengeId: number;

  before(async () => {
    console.log("\n🔧 Setting up test environment...\n");

    const airdropAmount = 5 * LAMPORTS_PER_SOL;
    await Promise.all([
      provider.connection.requestAirdrop(creator.publicKey, airdropAmount),
      provider.connection.requestAirdrop(challenger1.publicKey, airdropAmount),
      provider.connection.requestAirdrop(challenger2.publicKey, airdropAmount),
      provider.connection.requestAirdrop(challenger3.publicKey, airdropAmount),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("✅ Created test accounts:");
    console.log(`   Creator: ${creator.publicKey.toString()}`);
    console.log(`   Challenger 1: ${challenger1.publicKey.toString()}`);
    console.log(`   Challenger 2: ${challenger2.publicKey.toString()}`);
    console.log(`   Challenger 3: ${challenger3.publicKey.toString()}\n`);

    [challengeCounter] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_counter")],
      program.programId
    );

    [submissionCounter] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission_counter")],
      program.programId
    );
  });

  it("Step 1: Initialize the program", async () => {
    console.log("📝 Initializing program counters...");

    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          challengeCounter,
          submissionCounter,
          signer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Program initialized!");
      console.log(`   Transaction: ${tx}\n`);
    } catch (error) {
      if (error.toString().includes("already in use")) {
        console.log("⚠️  Program already initialized, skipping...\n");
      } else {
        throw error;
      }
    }
  });

  it("Step 2: Creator creates a challenge with 2 SOL bounty", async () => {
    console.log("💰 Creating challenge...");

    const counterAccount = await program.account.challengeCounter.fetch(challengeCounter);
    challengeId = Number(counterAccount.totalChallenges);

    [challengePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const creatorBalanceBefore = await provider.connection.getBalance(creator.publicKey);

    const tx = await program.methods
      .createChallenge(
        "Build a Decentralized Twitter",
        "Create a Twitter clone on Solana with posts, likes, and follows",
        new anchor.BN(BOUNTY_AMOUNT),
        new anchor.BN(7)
      )
      .accounts({
        challenge: challengePda,
        challengeCounter,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const creatorBalanceAfter = await provider.connection.getBalance(creator.publicKey);
    const challenge = await program.account.challenge.fetch(challengePda);
    const challengePdaBalance = await provider.connection.getBalance(challengePda);

    console.log("✅ Challenge created!");
    console.log(`   Challenge ID: ${challengeId}`);
    console.log(`   Title: ${challenge.title}`);
    console.log(`   Bounty: ${challenge.bountyAmount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Challenge PDA Balance: ${challengePdaBalance / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Creator paid: ${(creatorBalanceBefore - creatorBalanceAfter) / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Transaction: ${tx}\n`);

    assert.equal(challenge.isActive, true);
    assert.equal(challenge.bountyAmount.toNumber(), BOUNTY_AMOUNT);
    assert.equal(challenge.submissionCount, 0);
    assert.ok(challengePdaBalance >= BOUNTY_AMOUNT);
  });

  it("Step 3: Challenger 1 submits a solution", async () => {
    console.log("📤 Challenger 1 submitting solution...");

    const counterAccount = await program.account.submissionCounter.fetch(submissionCounter);
    const submissionId = Number(counterAccount.totalSubmissions);

    const [submissionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("submission"),
        new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(submissionId).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    const tx = await program.methods
      .submitSolution("https://github.com/challenger1/decentralized-twitter")
      .accounts({
        submission: submissionPda,
        challenge: challengePda,
        submissionCounter,
        submitter: challenger1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([challenger1])
      .rpc();

    const submission = await program.account.submission.fetch(submissionPda);
    const challenge = await program.account.challenge.fetch(challengePda);

    console.log("✅ Submission 1 created!");
    console.log(`   Submitter: ${submission.submitter.toString()}`);
    console.log(`   Proof URL: ${submission.proofUrl}`);
    console.log(`   Challenge submission count: ${challenge.submissionCount}`);
    console.log(`   Transaction: ${tx}\n`);

    assert.equal(challenge.submissionCount, 1);
  });

  it("Step 4: Challenger 2 submits a solution", async () => {
    console.log("📤 Challenger 2 submitting solution...");

    const counterAccount = await program.account.submissionCounter.fetch(submissionCounter);
    const submissionId = Number(counterAccount.totalSubmissions);

    const [submissionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("submission"),
        new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(submissionId).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    const tx = await program.methods
      .submitSolution("https://github.com/challenger2/solana-twitter")
      .accounts({
        submission: submissionPda,
        challenge: challengePda,
        submissionCounter,
        submitter: challenger2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([challenger2])
      .rpc();

    const submission = await program.account.submission.fetch(submissionPda);
    const challenge = await program.account.challenge.fetch(challengePda);

    console.log("✅ Submission 2 created!");
    console.log(`   Submitter: ${submission.submitter.toString()}`);
    console.log(`   Proof URL: ${submission.proofUrl}`);
    console.log(`   Challenge submission count: ${challenge.submissionCount}`);
    console.log(`   Transaction: ${tx}\n`);

    assert.equal(challenge.submissionCount, 2);
  });

  it("Step 5: Challenger 3 submits a solution", async () => {
    console.log("📤 Challenger 3 submitting solution...");

    const counterAccount = await program.account.submissionCounter.fetch(submissionCounter);
    const submissionId = Number(counterAccount.totalSubmissions);

    const [submissionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("submission"),
        new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(submissionId).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    const tx = await program.methods
      .submitSolution("https://github.com/challenger3/twitter-dapp")
      .accounts({
        submission: submissionPda,
        challenge: challengePda,
        submissionCounter,
        submitter: challenger3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([challenger3])
      .rpc();

    const submission = await program.account.submission.fetch(submissionPda);
    const challenge = await program.account.challenge.fetch(challengePda);

    console.log("✅ Submission 3 created!");
    console.log(`   Submitter: ${submission.submitter.toString()}`);
    console.log(`   Proof URL: ${submission.proofUrl}`);
    console.log(`   Challenge submission count: ${challenge.submissionCount}`);
    console.log(`   Transaction: ${tx}\n`);

    assert.equal(challenge.submissionCount, 3);
  });

  it("Step 6: Creator selects Challenger 2 as winner", async () => {
    console.log("🏆 Selecting winner...");

    const winningSubmissionId = 1;
    const [submissionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("submission"),
        new anchor.BN(challengeId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(winningSubmissionId).toArrayLike(Buffer, "le", 4),
      ],
      program.programId
    );

    const winnerBalanceBefore = await provider.connection.getBalance(challenger2.publicKey);
    const challengePdaBalanceBefore = await provider.connection.getBalance(challengePda);

    console.log(`   Winner balance before: ${winnerBalanceBefore / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Challenge PDA balance before: ${challengePdaBalanceBefore / LAMPORTS_PER_SOL} SOL`);

    const tx = await program.methods
      .selectWinner()
      .accounts({
        challenge: challengePda,
        submission: submissionPda,
        creator: creator.publicKey,
        winner: challenger2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const winnerBalanceAfter = await provider.connection.getBalance(challenger2.publicKey);
    const bountyReceived = winnerBalanceAfter - winnerBalanceBefore;

    let challengeExists = true;
    try {
      await program.account.challenge.fetch(challengePda);
    } catch (error) {
      challengeExists = false;
    }

    console.log("\n✅ Winner selected and bounty transferred!");
    console.log(`   Winner: Challenger 2 (${challenger2.publicKey.toString()})`);
    console.log(`   Winner balance after: ${winnerBalanceAfter / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Bounty received: ${bountyReceived / LAMPORTS_PER_SOL} SOL`);
    console.log(`   Challenge PDA closed: ${!challengeExists}`);
    console.log(`   Transaction: ${tx}\n`);

    expect(bountyReceived).to.be.greaterThan(BOUNTY_AMOUNT * 0.99);
    assert.equal(challengeExists, false);
  });

  it("Step 7: Verify final state", async () => {
    console.log("🔍 Verifying final state...");

    const challengeCounterAccount = await program.account.challengeCounter.fetch(challengeCounter);
    const submissionCounterAccount = await program.account.submissionCounter.fetch(submissionCounter);

    console.log("\n📊 Final Statistics:");
    console.log(`   Total Challenges Created: ${challengeCounterAccount.totalChallenges}`);
    console.log(`   Total Submissions Made: ${submissionCounterAccount.totalSubmissions}`);
    console.log(`   Winner: Challenger 2`);
    console.log(`   Bounty Paid: 2 SOL ✅\n`);

    assert.equal(Number(challengeCounterAccount.totalChallenges), 1);
    assert.equal(Number(submissionCounterAccount.totalSubmissions), 3);
  });
});
