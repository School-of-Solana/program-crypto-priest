import Link from "next/link";
import { formatSOL, formatAddress, formatDeadline } from "@/utils/format";

interface ChallengeCardProps {
  challengeId: number;
  title: string;
  description: string;
  bountyAmount: number;
  deadline: number;
  isActive: boolean;
  creator: string;
  submissionCount: number;
}

export default function ChallengeCard({
  challengeId,
  title,
  description,
  bountyAmount,
  deadline,
  isActive,
  creator,
  submissionCount,
}: ChallengeCardProps) {
  return (
    <div className="group bg-white rounded-2xl p-6 hover:border-accent-purple transition-all duration-300 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.3)] hover:-translate-y-2 border border-gray-200/50">
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Challenge #{challengeId}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-purple-500"}`}></span>
              {isActive ? "Active" : "Completed"}
            </span>
          </div>
          <h3 className="text-xl font-bold text-text-primary line-clamp-2 mb-2 group-hover:text-accent-purple transition-colors">
            {title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm leading-relaxed mb-6 line-clamp-2">
        {description}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border-light">
        {/* Bounty */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-text-muted uppercase">Bounty</span>
          </div>
          <p className="text-2xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            {formatSOL(bountyAmount)}
          </p>
        </div>

        {/* Submissions */}
        <div className="bg-cyan-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-semibold text-text-muted uppercase">Entries</span>
          </div>
          <p className="text-2xl font-bold text-accent-cyan">
            {submissionCount}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted font-medium">Created by</span>
          <span className="text-sm text-accent-purple font-mono font-semibold">
            {formatAddress(creator)}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <svg className="w-4 h-4 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-text-muted">
              {formatDeadline(deadline)}
            </span>
          </div>
        </div>

        <Link
          href={`/challenge/${challengeId}`}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          View
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
