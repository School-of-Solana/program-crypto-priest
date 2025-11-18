# Skill Bounty - Blockchain-Verified Skill Challenges Platform

**Deployed Frontend URL:** https://skill-bounty-mbie8fvdl-mahavirs-projects-d55f6e01.vercel.app/

**Solana Program ID:** `F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b` (Devnet)

**Repository Structure:**
- `anchor_project/skill_bounty/` - Solana program (Anchor)
- `frontend/skill-bounty-app/` - Next.js frontend application

---

## Project Overview

### Description

Skill Bounty is a decentralized platform for creating and completing skill-based challenges with SOL rewards. Users can create challenges by locking SOL in escrow, challengers submit their work, and creators select winners who receive the bounty automatically through smart contracts.

The platform eliminates middlemen in freelance work by using blockchain for trustless escrow and automatic payouts. All challenge data and submissions are stored on-chain, making the process transparent and verifiable.

### Key Features

- **Create Challenges** - Users can create skill challenges with custom titles, descriptions, deadlines, and SOL bounties locked in escrow
- **Browse & Search** - Advanced filtering (active/completed) and sorting (latest, oldest, highest/lowest bounty) with search functionality
- **Submit Solutions** - Challengers submit proof URLs (GitHub, portfolio, etc.) to compete for bounties
- **Winner Selection** - Challenge creators review submissions and select winners, triggering automatic SOL transfer
- **Dashboard** - Personalized dashboard showing created challenges, submissions, and win statistics
- **Real-time Stats** - Platform statistics displaying total challenges, active count, total bounties, and completions
- **Wallet Integration** - Solana wallet adapter with Phantom, Solflare, and other wallet support

### How to Use the dApp

1. **Connect Wallet**
   - Click "Connect Wallet" button in the top-right corner
   - Select your Solana wallet (Phantom, Solflare, etc.)
   - Approve the connection request
   - Ensure you have SOL on Devnet for testing

2. **Create a Challenge**
   - Navigate to "Create Challenge" page
   - Fill in challenge details:
     - Title: Short, descriptive name
     - Description: Detailed requirements
     - Bounty: SOL amount to lock in escrow
     - Deadline: Number of days until challenge closes
   - Click "Create Challenge" and approve the transaction
   - SOL is locked in escrow automatically

3. **Browse Challenges**
   - Visit "Browse" page to see all challenges
   - Use filters: All, Active, or Completed
   - Sort by: Latest, Oldest, Highest Bounty, Lowest Bounty
   - Search by title or description
   - Click on any challenge to view details

4. **Submit a Solution**
   - Open a challenge detail page
   - Enter your proof URL (GitHub repo, portfolio, live demo, etc.)
   - Click "Submit" and approve the transaction
   - Your submission appears in the submissions list

5. **Select a Winner** (Challenge Creators Only)
   - View submissions on your challenge detail page
   - Click "Select as Winner" on the best submission
   - Approve the transaction
   - Bounty is automatically transferred to the winner
   - Challenge is marked as completed

6. **View Dashboard**
   - Click "Dashboard" to see your activity
   - View challenges you created
   - Check your submissions and wins
   - Track your statistics

---

## Program Architecture

### Overview

The Skill Bounty program is built with the Anchor framework and implements an escrow-based bounty system. When a challenge is created, the bounty amount is locked in the challenge PDA. When a winner is selected, the program transfers the bounty to the winner and marks the challenge as inactive.

```
┌─────────────────────────────────────────────────────────────┐
│                     Skill Bounty Flow                        │
└─────────────────────────────────────────────────────────────┘

1. INITIALIZE
   ┌──────────────┐
   │   Creator    │──► initialize() ──► Create counter PDAs
   └──────────────┘

2. CREATE CHALLENGE
   ┌──────────────┐
   │   Creator    │──► create_challenge(title, desc, bounty, deadline)
   └──────────────┘                │
                                   ▼
                    ┌─────────────────────────────┐
                    │     Challenge PDA           │
                    │  (Holds SOL in escrow)      │
                    │  - challenge_id             │
                    │  - creator                  │
                    │  - bounty_amount (locked)   │
                    │  - is_active: true          │
                    └─────────────────────────────┘

3. SUBMIT SOLUTION
   ┌──────────────┐
   │  Challenger  │──► submit_solution(proof_url)
   └──────────────┘                │
                                   ▼
                    ┌─────────────────────────────┐
                    │    Submission PDA           │
                    │  - submission_id            │
                    │  - challenger               │
                    │  - proof_url                │
                    │  - timestamp                │
                    └─────────────────────────────┘

4. SELECT WINNER
   ┌──────────────┐
   │   Creator    │──► select_winner()
   └──────────────┘                │
                                   ▼
                    ┌─────────────────────────────┐
                    │  Transfer SOL to Winner     │
                    │  Mark challenge inactive    │
                    │  is_active: false           │
                    └─────────────────────────────┘
```

### PDA Usage

The program uses Program Derived Addresses (PDAs) to manage state and hold funds in escrow. PDAs are deterministic accounts derived from seeds, ensuring predictable addresses without private keys.

**PDAs Implemented:**

1. **Challenge Counter PDA**
   - **Seeds:** `[b"challenge_counter"]`
   - **Purpose:** Tracks the total number of challenges created globally
   - **Data:** `total_challenges` counter
   - **Why:** Provides unique, sequential IDs for each challenge

2. **Challenge PDA**
   - **Seeds:** `[b"challenge", challenge_id.to_le_bytes()]`
   - **Purpose:** Stores challenge data and holds bounty in escrow
   - **Data:** Challenge metadata (title, description, bounty, deadline, creator, active status)
   - **Why:** Deterministic address allows anyone to derive and fetch challenge data; holds SOL securely until winner selection

3. **Submission Counter PDA**
   - **Seeds:** `[b"submission_counter"]`
   - **Purpose:** Tracks the total number of submissions across all challenges
   - **Data:** `total_submissions` counter
   - **Why:** Provides unique, sequential IDs for each submission

4. **Submission PDA**
   - **Seeds:** `[b"submission", challenge_id.to_le_bytes(), submission_id.to_le_bytes()]`
   - **Purpose:** Stores submission proof and metadata
   - **Data:** Challenger address, proof URL, timestamp, challenge ID
   - **Why:** Links submissions to specific challenges while maintaining unique addresses

### Program Instructions

**1. initialize**
- **Description:** Initializes the global counter accounts for challenges and submissions
- **Accounts:**
  - `challenge_counter` (init, payer): Challenge counter PDA
  - `submission_counter` (init, payer): Submission counter PDA
  - `signer` (signer, mut): Transaction signer who pays for account creation
- **Logic:** Creates and initializes counter PDAs with values set to 0
- **Access:** Can only be called once (first deployment)

**2. create_challenge**
- **Description:** Creates a new challenge and locks bounty SOL in escrow
- **Parameters:**
  - `title: String` - Challenge title (max 100 chars)
  - `description: String` - Challenge description (max 500 chars)
  - `bounty_amount: u64` - SOL amount in lamports
  - `deadline_days: u64` - Days until challenge expires
- **Accounts:**
  - `challenge` (init, payer): New challenge PDA
  - `challenge_counter` (mut): Global challenge counter
  - `creator` (signer, mut): Challenge creator
- **Logic:**
  1. Increments challenge counter
  2. Creates challenge PDA with bounty locked inside
  3. Sets deadline as current timestamp + (days * 86400)
  4. Marks challenge as active
- **Access:** Any wallet with sufficient SOL

**3. submit_solution**
- **Description:** Submit a solution to an active challenge
- **Parameters:**
  - `proof_url: String` - URL to proof of work (max 200 chars)
- **Accounts:**
  - `submission` (init, payer): New submission PDA
  - `challenge` (mut): Target challenge PDA
  - `submission_counter` (mut): Global submission counter
  - `submitter` (signer, mut): Solution submitter
- **Logic:**
  1. Validates challenge is active
  2. Validates deadline not passed
  3. Increments submission counters (global + challenge-specific)
  4. Creates submission PDA with proof URL and timestamp
- **Access:** Any wallet (except challenge creator)
- **Constraints:** Challenge must be active, deadline not passed

**4. select_winner**
- **Description:** Creator selects a winning submission and transfers bounty
- **Accounts:**
  - `challenge` (mut): Challenge PDA holding escrow funds
  - `submission` (readonly): Winning submission PDA
  - `creator` (signer): Challenge creator (must match)
  - `winner` (mut): Winner's wallet (receives bounty)
- **Logic:**
  1. Validates signer is challenge creator
  2. Validates challenge is still active
  3. Transfers entire bounty from challenge PDA to winner
  4. Marks challenge as inactive
  5. Closes challenge account (returns rent to creator)
- **Access:** Only challenge creator
- **Constraints:** Challenge must be active, signer must be creator

### Account Structures

```rust
#[account]
pub struct ChallengeCounter {
    pub total_challenges: u64,  // Global count of challenges
}

#[account]
pub struct Challenge {
    pub challenge_id: u64,       // Unique challenge identifier
    pub creator: Pubkey,          // Challenge creator's wallet
    pub title: String,            // Challenge title (max 100 chars)
    pub description: String,      // Detailed description (max 500 chars)
    pub bounty_amount: u64,       // SOL bounty in lamports
    pub deadline: i64,            // Unix timestamp deadline
    pub is_active: bool,          // Challenge status
    pub submission_count: u32,    // Number of submissions received
    pub winner: Option<Pubkey>,   // Winner's wallet (if selected)
}

#[account]
pub struct SubmissionCounter {
    pub total_submissions: u64,  // Global count of submissions
}

#[account]
pub struct Submission {
    pub submission_id: u64,      // Unique submission identifier
    pub challenge_id: u64,       // Parent challenge ID
    pub submitter: Pubkey,        // Submitter's wallet
    pub proof_url: String,        // URL to proof (max 200 chars)
    pub timestamp: i64,           // Submission time
}
```

---

## Frontend Architecture

### Tech Stack

- **Framework:** Next.js 15.5.6 (React 19)
- **Styling:** Tailwind CSS with custom animations
- **Blockchain:** Solana Web3.js, Anchor, Wallet Adapter
- **State:** React hooks (useState, useEffect)
- **Routing:** Next.js App Router
- **UI Components:** Custom components with Tailwind

### Pages

1. **Home (`/`)** - Landing page with hero, stats, and featured challenges (latest 6)
2. **Browse (`/browse`)** - Full challenge listing with search, filters, and sorting
3. **Challenge Detail (`/challenge/[id]`)** - Challenge details, submissions, winner selection
4. **Create (`/create`)** - Form to create new challenges
5. **Dashboard (`/dashboard`)** - User's challenges and submissions

### Key Frontend Features

- **Wallet Integration:** Multi-wallet support via Solana Wallet Adapter
- **Real-time Data:** Fetches on-chain data on page load
- **Interactive Stats:** Animated stat cards with hover effects
- **Search & Filter:** Client-side filtering and sorting
- **Responsive Design:** Mobile-first, works on all devices
- **Loading States:** Spinners and skeletons during blockchain operations
- **Error Handling:** User-friendly error messages
- **Transaction Feedback:** Toast notifications for success/error

---

## Testing

### Test Coverage

The program includes comprehensive tests for all instructions covering both successful operations and error scenarios.

**Happy Path Tests:**
- ✅ Initialize counters successfully
- ✅ Create challenge with valid inputs
- ✅ Submit solution to active challenge
- ✅ Select winner and transfer bounty
- ✅ Multiple submissions to same challenge
- ✅ Multiple challenges by same creator

**Unhappy Path Tests:**
- ❌ Create challenge with empty title (should fail)
- ❌ Create challenge with excessive title length (should fail)
- ❌ Submit solution to inactive challenge (should fail)
- ❌ Submit solution after deadline (should fail)
- ❌ Non-creator tries to select winner (should fail)
- ❌ Select winner on already completed challenge (should fail)
- ❌ Initialize counters twice (should fail)

### Running Tests

```bash
# Navigate to the Anchor project
cd anchor_project/skill_bounty

# Run all tests
anchor test

# Run tests with logs
anchor test -- --nocapture

# Build program
anchor build

# Deploy to Devnet
anchor deploy --provider.cluster devnet
```

### Test Results

All tests pass successfully:
- 12 passing tests
- 0 failing tests
- Coverage: All instructions tested with happy and unhappy paths

---

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- Rust and Cargo
- Solana CLI (1.18.x)
- Anchor Framework (0.30.x)
- Phantom/Solflare wallet browser extension

### Backend Setup

```bash
# Navigate to Anchor project
cd anchor_project/skill_bounty

# Install dependencies
npm install

# Build program
anchor build

# Run tests
anchor test

# Deploy to Devnet
anchor deploy --provider.cluster devnet
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend/skill-bounty-app

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_SOLANA_NETWORK=devnet" > .env.local
echo "NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com" >> .env.local

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Deployment

### Program Deployment

The program is deployed on **Solana Devnet**:
- **Program ID:** `F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b`
- **Network:** Devnet
- **Explorer:** https://explorer.solana.com/address/F93dsqgFBnMWTkwwgFogygkAozw4s2sDPo1aMQRNc11b?cluster=devnet

### Frontend Deployment

Deploy to Vercel:

```bash
cd frontend/skill-bounty-app
vercel --prod
```

Or use Vercel GitHub integration for automatic deployments.

---

## Additional Notes for Evaluators

### Design Decisions

1. **Escrow Model:** Bounty is locked in the challenge PDA (not a separate escrow account) for simplicity
2. **Single Winner:** Each challenge can have only one winner to avoid complexity
3. **On-chain Storage:** All data stored on-chain for transparency and verifiability
4. **Deadline Enforcement:** Smart contract enforces deadlines to prevent late submissions
5. **Counter Pattern:** Global counters ensure unique IDs for challenges and submissions

### Security Considerations

- Creator authorization checked before winner selection
- Challenge status validated before operations
- Deadline validation prevents late submissions
- Bounty transfer uses secure native SOL transfer
- Account ownership verified through Anchor constraints

### Future Enhancements

- Multiple winner support with prize distribution
- IPFS integration for proof storage
- Reputation system for challengers
- Challenge categories and tags
- NFT badges for winners
- Dispute resolution mechanism

---

## License

MIT License - See LICENSE file for details
