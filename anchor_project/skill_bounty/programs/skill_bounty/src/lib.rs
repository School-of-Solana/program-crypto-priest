use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b");

#[program]
pub mod skill_bounty {
    use super::*;

    /// Initialize global counters (run once at deployment)
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let challenge_counter = &mut ctx.accounts.challenge_counter;
        challenge_counter.total_challenges = 0;
        challenge_counter.bump = ctx.bumps.challenge_counter;

        let submission_counter = &mut ctx.accounts.submission_counter;
        submission_counter.total_submissions = 0;
        submission_counter.bump = ctx.bumps.submission_counter;

        msg!("Skill Bounty initialized!");
        Ok(())
    }

    /// Create new challenge with SOL bounty escrow
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        title: String,
        description: String,
        bounty_amount: u64,
        deadline_days: u64,
    ) -> Result<()> {
        // Validations
        require!(title.len() > 0 && title.len() <= 100, CustomError::InvalidTitle);
        require!(
            description.len() > 0 && description.len() <= 500,
            CustomError::InvalidDescription
        );
        require!(bounty_amount > 0, CustomError::InvalidBounty);
        require!(deadline_days > 0, CustomError::InvalidDeadline);

        let challenge_counter = &mut ctx.accounts.challenge_counter;
        let challenge = &mut ctx.accounts.challenge;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        // Set challenge data
        challenge.challenge_id = challenge_counter.total_challenges;
        challenge.creator = creator.key();
        challenge.title = title;
        challenge.description = description;
        challenge.bounty_amount = bounty_amount;
        challenge.deadline = clock.unix_timestamp + (deadline_days as i64 * 86400);
        challenge.is_active = true;
        challenge.winner = None;
        challenge.submission_count = 0;
        challenge.created_at = clock.unix_timestamp;
        challenge.bump = ctx.bumps.challenge;

        // Transfer bounty SOL from creator to challenge PDA (escrow)
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: creator.to_account_info(),
                to: challenge.to_account_info(),
            },
        );
        transfer(cpi_context, bounty_amount)?;

        // Increment counter
        challenge_counter.total_challenges += 1;

        msg!(
            "Challenge created! ID: {}, Bounty: {} lamports",
            challenge.challenge_id,
            bounty_amount
        );
        Ok(())
    }

    /// Submit solution to an active challenge
    pub fn submit_solution(
        ctx: Context<SubmitSolution>,
        _challenge_id: u64,
        proof_url: String,
    ) -> Result<()> {
        // Validations
        require!(
            proof_url.len() > 0 && proof_url.len() <= 200,
            CustomError::InvalidProofUrl
        );

        let challenge = &mut ctx.accounts.challenge;
        require!(challenge.is_active, CustomError::ChallengeNotActive);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < challenge.deadline,
            CustomError::DeadlinePassed
        );

        let submission_counter = &mut ctx.accounts.submission_counter;
        let submission = &mut ctx.accounts.submission;
        let submitter = &ctx.accounts.submitter;

        // Set submission data
        submission.submission_id = submission_counter.total_submissions;
        submission.challenge_id = challenge.challenge_id;
        submission.submitter = submitter.key();
        submission.proof_url = proof_url;
        submission.submitted_at = clock.unix_timestamp;
        submission.bump = ctx.bumps.submission;

        // Increment counters
        challenge.submission_count += 1;
        submission_counter.total_submissions += 1;

        msg!(
            "Submission created! ID: {}, Challenge: {}",
            submission.submission_id,
            challenge.challenge_id
        );
        Ok(())
    }

    /// Select winner and transfer bounty
    pub fn select_winner(ctx: Context<SelectWinner>, _challenge_id: u64) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let creator = &ctx.accounts.creator;
        let winner = &ctx.accounts.winner;

        // Validations
        require!(challenge.is_active, CustomError::ChallengeNotActive);
        require!(
            creator.key() == challenge.creator,
            CustomError::UnauthorizedCreator
        );

        // Transfer bounty from challenge PDA to winner
        let challenge_lamports = challenge.to_account_info().lamports();
        let rent_exempt = Rent::get()?.minimum_balance(challenge.to_account_info().data_len());
        let transfer_amount = challenge_lamports.saturating_sub(rent_exempt);

        **challenge.to_account_info().try_borrow_mut_lamports()? -= transfer_amount;
        **winner.to_account_info().try_borrow_mut_lamports()? += transfer_amount;

        // Update challenge
        challenge.winner = Some(winner.key());
        challenge.is_active = false;

        msg!(
            "Winner selected! Challenge: {}, Winner: {}, Bounty: {} lamports",
            challenge.challenge_id,
            winner.key(),
            transfer_amount
        );
        Ok(())
    }
}

// ============================================================================
// ACCOUNT STRUCTS
// ============================================================================

#[account]
pub struct Challenge {
    pub challenge_id: u64,       // 8 bytes
    pub creator: Pubkey,          // 32 bytes
    pub title: String,            // 4 + 100 bytes
    pub description: String,      // 4 + 500 bytes
    pub bounty_amount: u64,       // 8 bytes
    pub deadline: i64,            // 8 bytes
    pub is_active: bool,          // 1 byte
    pub winner: Option<Pubkey>,   // 1 + 32 bytes
    pub submission_count: u32,    // 4 bytes
    pub created_at: i64,          // 8 bytes
    pub bump: u8,                 // 1 byte
}

impl Challenge {
    pub const MAX_SIZE: usize = 8 + 32 + (4 + 100) + (4 + 500) + 8 + 8 + 1 + (1 + 32) + 4 + 8 + 1;
}

#[account]
pub struct Submission {
    pub submission_id: u64,      // 8 bytes
    pub challenge_id: u64,       // 8 bytes
    pub submitter: Pubkey,       // 32 bytes
    pub proof_url: String,       // 4 + 200 bytes
    pub submitted_at: i64,       // 8 bytes
    pub bump: u8,                // 1 byte
}

impl Submission {
    pub const MAX_SIZE: usize = 8 + 8 + 32 + (4 + 200) + 8 + 1;
}

#[account]
pub struct ChallengeCounter {
    pub total_challenges: u64,   // 8 bytes
    pub bump: u8,                // 1 byte
}

impl ChallengeCounter {
    pub const MAX_SIZE: usize = 8 + 1;
}

#[account]
pub struct SubmissionCounter {
    pub total_submissions: u64,  // 8 bytes
    pub bump: u8,                // 1 byte
}

impl SubmissionCounter {
    pub const MAX_SIZE: usize = 8 + 1;
}

// ============================================================================
// CONTEXT STRUCTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + ChallengeCounter::MAX_SIZE,
        seeds = [b"challenge_counter"],
        bump
    )]
    pub challenge_counter: Account<'info, ChallengeCounter>,

    #[account(
        init,
        payer = payer,
        space = 8 + SubmissionCounter::MAX_SIZE,
        seeds = [b"submission_counter"],
        bump
    )]
    pub submission_counter: Account<'info, SubmissionCounter>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateChallenge<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Challenge::MAX_SIZE,
        seeds = [b"challenge", challenge_counter.total_challenges.to_le_bytes().as_ref()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,

    #[account(
        mut,
        seeds = [b"challenge_counter"],
        bump = challenge_counter.bump
    )]
    pub challenge_counter: Account<'info, ChallengeCounter>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct SubmitSolution<'info> {
    #[account(
        init,
        payer = submitter,
        space = 8 + Submission::MAX_SIZE,
        seeds = [
            b"submission",
            challenge_id.to_le_bytes().as_ref(),
            submission_counter.total_submissions.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub submission: Account<'info, Submission>,

    #[account(
        mut,
        seeds = [b"challenge", challenge_id.to_le_bytes().as_ref()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,

    #[account(
        mut,
        seeds = [b"submission_counter"],
        bump = submission_counter.bump
    )]
    pub submission_counter: Account<'info, SubmissionCounter>,

    #[account(mut)]
    pub submitter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(challenge_id: u64)]
pub struct SelectWinner<'info> {
    #[account(
        mut,
        seeds = [b"challenge", challenge_id.to_le_bytes().as_ref()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Winner account - validated by creator selection
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum CustomError {
    #[msg("Title must be 1-100 characters")]
    InvalidTitle,

    #[msg("Description must be 1-500 characters")]
    InvalidDescription,

    #[msg("Bounty amount must be greater than 0")]
    InvalidBounty,

    #[msg("Deadline must be in the future")]
    InvalidDeadline,

    #[msg("Proof URL must be 1-200 characters")]
    InvalidProofUrl,

    #[msg("Challenge is not active")]
    ChallengeNotActive,

    #[msg("Deadline has passed")]
    DeadlinePassed,

    #[msg("Only the challenge creator can select winner")]
    UnauthorizedCreator,
}
