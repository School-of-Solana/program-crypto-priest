import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SkillBounty } from "../target/types/skill_bounty";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";

describe("skill_bounty", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SkillBounty as Program<SkillBounty>;
  const provider = anchor.AnchorProvider.env();

  // Derive PDA addresses
  const [challengeCounterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("challenge_counter")],
    program.programId
  );

  const [submissionCounterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("submission_counter")],
    program.programId
  );

  // Store submitter wallet for use across tests
  let submitterWallet: anchor.web3.Keypair;

  it("Initialize program and create counters", async () => {
    // Call initialize instruction
    const tx = await program.methods
      .initialize()
      .accounts({
        challengeCounter: challengeCounterPDA,
        submissionCounter: submissionCounterPDA,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Fetch challenge counter account
    const challengeCounter = await program.account.challengeCounter.fetch(
      challengeCounterPDA
    );

    // Fetch submission counter account
    const submissionCounter = await program.account.submissionCounter.fetch(
      submissionCounterPDA
    );

    // Verify challenge counter
    assert.equal(
      challengeCounter.totalChallenges.toNumber(),
      0,
      "Challenge counter should start at 0"
    );
    assert.isNumber(challengeCounter.bump, "Bump seed should be stored");

    // Verify submission counter
    assert.equal(
      submissionCounter.totalSubmissions.toNumber(),
      0,
      "Submission counter should start at 0"
    );
    assert.isNumber(submissionCounter.bump, "Bump seed should be stored");

    console.log("✅ Counters initialized successfully!");
    console.log("Challenge Counter:", challengeCounter.totalChallenges.toNumber());
    console.log("Submission Counter:", submissionCounter.totalSubmissions.toNumber());
  });

  it("Create challenge with valid inputs", async () => {
    // Test data
    const title = "Design a Solana Logo";
    const description = "Create a modern logo for my Solana project";
    const bountyAmount = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL); // 0.5 SOL
    const deadlineDays = new anchor.BN(7); // 7 days

    // Get current challenge counter to determine challenge ID
    const counterBefore = await program.account.challengeCounter.fetch(
      challengeCounterPDA
    );
    const challengeId = counterBefore.totalChallenges.toNumber();

    // Derive challenge PDA
    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    // Get creator's balance before
    const creatorBalanceBefore = await provider.connection.getBalance(
      provider.wallet.publicKey
    );

    // Create challenge
    const tx = await program.methods
      .createChallenge(title, description, bountyAmount, deadlineDays)
      .accounts({
        challenge: challengePDA,
        challengeCounter: challengeCounterPDA,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create challenge transaction signature:", tx);

    // Fetch the created challenge
    const challenge = await program.account.challenge.fetch(challengePDA);

    // Verify challenge fields
    assert.equal(
      challenge.challengeId.toNumber(),
      challengeId,
      "Challenge ID should match"
    );
    assert.equal(
      challenge.creator.toString(),
      provider.wallet.publicKey.toString(),
      "Creator should match"
    );
    assert.equal(challenge.title, title, "Title should match");
    assert.equal(challenge.description, description, "Description should match");
    assert.equal(
      challenge.bountyAmount.toNumber(),
      bountyAmount.toNumber(),
      "Bounty amount should match"
    );
    assert.isTrue(challenge.isActive, "Challenge should be active");
    assert.isNull(challenge.winner, "Winner should be null initially");
    assert.equal(
      challenge.submissionCount,
      0,
      "Submission count should be 0"
    );

    // Verify challenge PDA received the bounty SOL
    const challengeBalance = await provider.connection.getBalance(challengePDA);
    assert.isAtLeast(
      challengeBalance,
      bountyAmount.toNumber(),
      "Challenge PDA should have at least the bounty amount"
    );

    // Verify counter incremented
    const counterAfter = await program.account.challengeCounter.fetch(
      challengeCounterPDA
    );
    assert.equal(
      counterAfter.totalChallenges.toNumber(),
      challengeId + 1,
      "Challenge counter should increment"
    );

    console.log("✅ Challenge created successfully!");
    console.log("Challenge ID:", challenge.challengeId.toNumber());
    console.log("Bounty:", challenge.bountyAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL, "SOL");
    console.log("Deadline:", new Date(challenge.deadline.toNumber() * 1000).toISOString());
  });

  it("Submit solution to active challenge", async () => {
    // Use challenge ID 0 from previous test
    const challengeId = 0;
    const proofUrl = "https://figma.com/mydesign123";

    // Create a new wallet for the submitter (different from creator)
    submitterWallet = anchor.web3.Keypair.generate();
    const submitter = submitterWallet;

    // Airdrop SOL to submitter for transaction fees
    const airdropSignature = await provider.connection.requestAirdrop(
      submitter.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    // Derive challenge PDA
    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    // Get current submission counter to determine submission ID
    const submissionCounterBefore = await program.account.submissionCounter.fetch(
      submissionCounterPDA
    );
    const submissionId = submissionCounterBefore.totalSubmissions.toNumber();

    // Derive submission PDA
    const submissionIdBuffer = Buffer.alloc(8);
    submissionIdBuffer.writeBigUInt64LE(BigInt(submissionId));
    const [submissionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("submission"),
        challengeIdBuffer,
        submissionIdBuffer,
      ],
      program.programId
    );

    // Get challenge submission count before
    const challengeBefore = await program.account.challenge.fetch(challengePDA);
    const submissionCountBefore = challengeBefore.submissionCount;

    // Submit solution
    const tx = await program.methods
      .submitSolution(new anchor.BN(challengeId), proofUrl)
      .accounts({
        submission: submissionPDA,
        challenge: challengePDA,
        submissionCounter: submissionCounterPDA,
        submitter: submitter.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([submitter])
      .rpc();

    console.log("Submit solution transaction signature:", tx);

    // Fetch the created submission
    const submission = await program.account.submission.fetch(submissionPDA);

    // Verify submission fields
    assert.equal(
      submission.submissionId.toNumber(),
      submissionId,
      "Submission ID should match"
    );
    assert.equal(
      submission.challengeId.toNumber(),
      challengeId,
      "Challenge ID should match"
    );
    assert.equal(
      submission.submitter.toString(),
      submitter.publicKey.toString(),
      "Submitter should match"
    );
    assert.equal(submission.proofUrl, proofUrl, "Proof URL should match");

    // Verify challenge submission count incremented
    const challengeAfter = await program.account.challenge.fetch(challengePDA);
    assert.equal(
      challengeAfter.submissionCount,
      submissionCountBefore + 1,
      "Challenge submission count should increment"
    );

    // Verify global submission counter incremented
    const submissionCounterAfter = await program.account.submissionCounter.fetch(
      submissionCounterPDA
    );
    assert.equal(
      submissionCounterAfter.totalSubmissions.toNumber(),
      submissionId + 1,
      "Global submission counter should increment"
    );

    console.log("✅ Solution submitted successfully!");
    console.log("Submission ID:", submission.submissionId.toNumber());
    console.log("Submitter:", submission.submitter.toString().slice(0, 8) + "...");
    console.log("Proof URL:", submission.proofUrl);
  });

  it("Select winner and transfer bounty", async () => {
    // Use challenge ID 0 from previous test
    const challengeId = 0;

    // Derive challenge PDA
    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    // Get challenge and winner balances before
    const challengeBalanceBefore = await provider.connection.getBalance(challengePDA);
    const winnerBalanceBefore = await provider.connection.getBalance(
      submitterWallet.publicKey
    );

    // Fetch challenge to get bounty amount
    const challengeBefore = await program.account.challenge.fetch(challengePDA);
    const expectedBounty = challengeBefore.bountyAmount.toNumber();

    // Select winner (creator selects the submitter as winner)
    const tx = await program.methods
      .selectWinner(new anchor.BN(challengeId))
      .accounts({
        challenge: challengePDA,
        creator: provider.wallet.publicKey,
        winner: submitterWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Select winner transaction signature:", tx);

    // Fetch updated challenge
    const challengeAfter = await program.account.challenge.fetch(challengePDA);

    // Verify challenge is marked inactive
    assert.isFalse(challengeAfter.isActive, "Challenge should be inactive");

    // Verify winner is set
    assert.equal(
      challengeAfter.winner.toString(),
      submitterWallet.publicKey.toString(),
      "Winner should be set to submitter"
    );

    // Get balances after
    const winnerBalanceAfter = await provider.connection.getBalance(
      submitterWallet.publicKey
    );

    // Verify winner received the bounty (approximately, accounting for rent)
    const winnerBalanceIncrease = winnerBalanceAfter - winnerBalanceBefore;
    assert.isAtLeast(
      winnerBalanceIncrease,
      expectedBounty * 0.9, // Allow 10% margin for rent
      "Winner should receive approximately the bounty amount"
    );

    console.log("✅ Winner selected and bounty transferred!");
    console.log("Winner:", submitterWallet.publicKey.toString().slice(0, 8) + "...");
    console.log("Bounty transferred:", winnerBalanceIncrease / anchor.web3.LAMPORTS_PER_SOL, "SOL");
    console.log("Challenge is now inactive");
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  it("Error: Cannot create challenge with empty title", async () => {
    const emptyTitle = "";
    const description = "Valid description";
    const bountyAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
    const deadlineDays = new anchor.BN(7);

    // Get current challenge counter
    const counter = await program.account.challengeCounter.fetch(
      challengeCounterPDA
    );
    const challengeId = counter.totalChallenges.toNumber();

    // Derive challenge PDA
    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    try {
      await program.methods
        .createChallenge(emptyTitle, description, bountyAmount, deadlineDays)
        .accounts({
          challenge: challengePDA,
          challengeCounter: challengeCounterPDA,
          creator: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown error for empty title");
    } catch (error) {
      assert.include(
        error.toString(),
        "Title must be 1-100 characters",
        "Error message should mention invalid title"
      );
      console.log("✅ Correctly rejected empty title");
    }
  });

  it("Error: Cannot create challenge with zero bounty", async () => {
    const title = "Valid title";
    const description = "Valid description";
    const zeroBounty = new anchor.BN(0); // Invalid: bounty = 0
    const deadlineDays = new anchor.BN(7);

    // Get current challenge counter
    const counter = await program.account.challengeCounter.fetch(
      challengeCounterPDA
    );
    const challengeId = counter.totalChallenges.toNumber();

    // Derive challenge PDA
    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    try {
      await program.methods
        .createChallenge(title, description, zeroBounty, deadlineDays)
        .accounts({
          challenge: challengePDA,
          challengeCounter: challengeCounterPDA,
          creator: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown error for zero bounty");
    } catch (error) {
      assert.include(
        error.toString(),
        "Bounty amount must be greater than 0",
        "Error message should mention invalid bounty"
      );
      console.log("✅ Correctly rejected zero bounty");
    }
  });

  it("Error: Cannot submit to inactive challenge", async () => {
    // Challenge ID 0 is now inactive (winner was selected in previous test)
    const challengeId = 0;
    const proofUrl = "https://figma.com/newdesign";

    // Create another submitter
    const newSubmitter = anchor.web3.Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      newSubmitter.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    // Derive PDAs
    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    const submissionCounter = await program.account.submissionCounter.fetch(
      submissionCounterPDA
    );
    const submissionId = submissionCounter.totalSubmissions.toNumber();

    const submissionIdBuffer = Buffer.alloc(8);
    submissionIdBuffer.writeBigUInt64LE(BigInt(submissionId));
    const [submissionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), challengeIdBuffer, submissionIdBuffer],
      program.programId
    );

    try {
      await program.methods
        .submitSolution(new anchor.BN(challengeId), proofUrl)
        .accounts({
          submission: submissionPDA,
          challenge: challengePDA,
          submissionCounter: submissionCounterPDA,
          submitter: newSubmitter.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newSubmitter])
        .rpc();
      assert.fail("Should have thrown error for inactive challenge");
    } catch (error) {
      assert.include(
        error.toString(),
        "Challenge is not active",
        "Error message should mention challenge not active"
      );
      console.log("✅ Correctly rejected submission to inactive challenge");
    }
  });

  it("Error: Only creator can select winner", async () => {
    // Create a new challenge
    const title = "Another Challenge";
    const description = "Test authorization";
    const bountyAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
    const deadlineDays = new anchor.BN(7);

    const counter = await program.account.challengeCounter.fetch(
      challengeCounterPDA
    );
    const challengeId = counter.totalChallenges.toNumber();

    const challengeIdBuffer = Buffer.alloc(8);
    challengeIdBuffer.writeBigUInt64LE(BigInt(challengeId));
    const [challengePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), challengeIdBuffer],
      program.programId
    );

    // Creator creates challenge
    await program.methods
      .createChallenge(title, description, bountyAmount, deadlineDays)
      .accounts({
        challenge: challengePDA,
        challengeCounter: challengeCounterPDA,
        creator: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Try to select winner with a different wallet (unauthorized)
    const unauthorizedWallet = anchor.web3.Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      unauthorizedWallet.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);

    try {
      await program.methods
        .selectWinner(new anchor.BN(challengeId))
        .accounts({
          challenge: challengePDA,
          creator: unauthorizedWallet.publicKey, // Wrong creator!
          winner: submitterWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([unauthorizedWallet])
        .rpc();
      assert.fail("Should have thrown error for unauthorized creator");
    } catch (error) {
      assert.include(
        error.toString(),
        "UnauthorizedCreator",
        "Error should mention unauthorized creator"
      );
      console.log("✅ Correctly rejected unauthorized winner selection");
    }
  });
});
