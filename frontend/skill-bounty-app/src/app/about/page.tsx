"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-primary-bg">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-muted-teal/10 border-2 border-muted-teal/30">
            <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-muted-teal">
              About Skill Bounty
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-charcoal">
            Skills matter,
            <br />
            <span className="text-deep-teal">
              prove it
            </span>
          </h1>

          <p className="text-lg md:text-xl text-dark-slate mb-10 max-w-3xl mx-auto leading-relaxed">
            A decentralized platform where developers prove their skills through real challenges and earn instant SOL rewards
          </p>
        </div>

        {/* What is Skill Bounty */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="bg-white border-2 border-border-light rounded-2xl p-12 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-deep-teal/10 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h2 className="text-3xl font-bold text-charcoal">What is Skill Bounty?</h2>
            </div>

            <p className="text-dark-slate text-lg leading-relaxed mb-6">
              Skill Bounty is a decentralized platform built on Solana that revolutionizes how developers prove their skills and earn rewards. Unlike traditional freelancing platforms with high fees and slow payments, we use smart contracts to ensure instant, trustless bounty distribution.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-deep-teal/5 rounded-xl p-6 border-2 border-deep-teal/20">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-xl font-bold text-deep-teal mb-2">Trustless</h3>
                <p className="text-dark-slate text-sm">Smart contracts hold bounties in escrow. No middlemen, no disputes.</p>
              </div>

              <div className="bg-muted-teal/5 rounded-xl p-6 border-2 border-muted-teal/20">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-xl font-bold text-muted-teal mb-2">Instant</h3>
                <p className="text-dark-slate text-sm">Winners receive SOL payments instantly when selected by creators.</p>
              </div>

              <div className="bg-dark-slate/5 rounded-xl p-6 border-2 border-dark-slate/20">
                <div className="text-3xl mb-3">🌐</div>
                <h3 className="text-xl font-bold text-dark-slate mb-2">Transparent</h3>
                <p className="text-dark-slate text-sm">All challenges and submissions are recorded on-chain for transparency.</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-charcoal mb-4">How It Works</h2>
            <p className="text-dark-slate text-lg">Three simple steps to earn or find talent</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Developers */}
            <div className="bg-white border-2 border-muted-teal/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-xl bg-muted-teal/10 flex items-center justify-center">
                  <span className="text-3xl">👨‍💻</span>
                </div>
                <h3 className="text-2xl font-bold text-charcoal">For Developers</h3>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted-teal/20 flex items-center justify-center text-muted-teal font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-1">Browse Challenges</h4>
                    <p className="text-dark-slate text-sm">Explore active challenges that match your skills and interests</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted-teal/20 flex items-center justify-center text-muted-teal font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-1">Submit Your Solution</h4>
                    <p className="text-dark-slate text-sm">Work on the challenge and submit proof (GitHub repo, deployed link, etc.)</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted-teal/20 flex items-center justify-center text-muted-teal font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-1">Get Paid Instantly</h4>
                    <p className="text-dark-slate text-sm">If selected as the winner, receive SOL bounty directly to your wallet</p>
                  </div>
                </div>
              </div>

              <Link
                href="/browse"
                className="mt-8 block w-full py-3 bg-muted-teal text-white font-semibold text-center rounded-lg hover:bg-deep-teal transition-all"
              >
                Browse Challenges →
              </Link>
            </div>

            {/* For Challenge Creators */}
            <div className="bg-white border-2 border-deep-teal/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-xl bg-deep-teal/10 flex items-center justify-center">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-charcoal">For Creators</h3>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-deep-teal/20 flex items-center justify-center text-deep-teal font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-1">Create a Challenge</h4>
                    <p className="text-dark-slate text-sm">Define your challenge, set a bounty, and specify a deadline</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-deep-teal/20 flex items-center justify-center text-deep-teal font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-1">Review Submissions</h4>
                    <p className="text-dark-slate text-sm">Developers submit their solutions and you review the quality</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-deep-teal/20 flex items-center justify-center text-deep-teal font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-charcoal mb-1">Select the Winner</h4>
                    <p className="text-dark-slate text-sm">Choose the best submission and the smart contract transfers the bounty</p>
                  </div>
                </div>
              </div>

              <Link
                href="/create"
                className="mt-8 block w-full py-3 bg-deep-teal text-white font-semibold text-center rounded-lg hover:bg-dark-slate transition-all"
              >
                Create Challenge →
              </Link>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-charcoal mb-4">Key Features</h2>
            <p className="text-dark-slate text-lg">Everything you need for skill-based bounties</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-white hover:bg-ash-grey/50 border-2 border-border-light hover:border-deep-teal rounded-xl p-6 transition-all">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">SOL Bounties</h3>
              <p className="text-dark-slate text-sm">Set bounties in SOL that are automatically held in escrow by the smart contract until a winner is selected.</p>
            </div>

            <div className="group bg-white hover:bg-ash-grey/50 border-2 border-border-light hover:border-muted-teal rounded-xl p-6 transition-all">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Deadline Management</h3>
              <p className="text-dark-slate text-sm">Set deadlines for challenges. Developers know exactly how much time they have to submit.</p>
            </div>

            <div className="group bg-white hover:bg-ash-grey/50 border-2 border-border-light hover:border-deep-teal rounded-xl p-6 transition-all">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Proof Submission</h3>
              <p className="text-dark-slate text-sm">Submit GitHub repos, deployed links, or any proof URL to showcase your work.</p>
            </div>

            <div className="group bg-white hover:bg-ash-grey/50 border-2 border-border-light hover:border-muted-teal rounded-xl p-6 transition-all">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Winner Selection</h3>
              <p className="text-dark-slate text-sm">Challenge creators review submissions and select the best one with a single click.</p>
            </div>

            <div className="group bg-white hover:bg-ash-grey/50 border-2 border-border-light hover:border-deep-teal rounded-xl p-6 transition-all">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Dashboard</h3>
              <p className="text-dark-slate text-sm">Track your created challenges, submissions, and wins all in one place.</p>
            </div>

            <div className="group bg-white hover:bg-ash-grey/50 border-2 border-border-light hover:border-muted-teal rounded-xl p-6 transition-all">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-charcoal mb-3">On-Chain Records</h3>
              <p className="text-dark-slate text-sm">Every challenge and submission is recorded on Solana for full transparency.</p>
            </div>
          </div>
        </div>

        {/* Why Skill Bounty */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="bg-white border-2 border-deep-teal/30 rounded-2xl p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-charcoal mb-4">Why Skill Bounty?</h2>
              <p className="text-dark-slate text-lg">The future of skill verification and rewards</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal mb-1">No Platform Fees</h4>
                    <p className="text-dark-slate text-sm">Only pay Solana network fees. No middleman taking a cut of your bounty.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal mb-1">Instant Payments</h4>
                    <p className="text-dark-slate text-sm">Winners get paid immediately when selected. No waiting weeks for payment processing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal mb-1">Trustless & Secure</h4>
                    <p className="text-dark-slate text-sm">Smart contracts ensure bounties are paid. No disputes, no chargebacks.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal mb-1">Global Access</h4>
                    <p className="text-dark-slate text-sm">Anyone with a Solana wallet can participate. No geographic restrictions.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal mb-1">Build Reputation</h4>
                    <p className="text-dark-slate text-sm">Your on-chain submission history proves your skills better than any resume.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-teal/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-teal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-charcoal mb-1">Low Barriers</h4>
                    <p className="text-dark-slate text-sm">No interviews, no applications. Just prove your skills and get rewarded.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="bg-deep-teal/5 border-2 border-deep-teal/30 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-charcoal mb-6">Ready to Get Started?</h2>
            <p className="text-dark-slate text-lg mb-8">
              Connect your Solana wallet and start earning or finding top talent today
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/browse"
                className="px-8 py-4 bg-deep-teal text-white font-semibold text-lg rounded-lg hover:bg-dark-slate transition-all"
              >
                Browse Challenges
              </Link>
              <Link
                href="/create"
                className="px-8 py-4 bg-white border-2 border-deep-teal text-deep-teal font-semibold text-lg rounded-lg hover:bg-deep-teal hover:text-white transition-all"
              >
                Create Challenge
              </Link>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-charcoal mb-4">Technical Details</h2>
            <p className="text-dark-slate text-lg">Built on Solana for speed and low fees</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-border-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-charcoal mb-4 flex items-center gap-3">
                <span>⛓️</span>
                Blockchain
              </h3>
              <p className="text-dark-slate mb-4">
                Built on <span className="text-muted-teal font-semibold">Solana</span> for fast transactions and minimal fees
              </p>
              <ul className="space-y-2 text-dark-slate text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-muted-teal">✓</span>
                  Sub-second transaction finality
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-teal">✓</span>
                  Network fees typically under $0.01
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-teal">✓</span>
                  Devnet for testing, Mainnet ready
                </li>
              </ul>
            </div>

            <div className="bg-white border-2 border-border-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-charcoal mb-4 flex items-center gap-3">
                <span>🔐</span>
                Smart Contracts
              </h3>
              <p className="text-dark-slate mb-4">
                Powered by <span className="text-deep-teal font-semibold">Anchor Framework</span> for secure, auditable code
              </p>
              <ul className="space-y-2 text-dark-slate text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-muted-teal">✓</span>
                  Automatic bounty escrow
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-teal">✓</span>
                  Trustless winner selection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-muted-teal">✓</span>
                  Open-source and verifiable
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
