import Link from "next/link";
import { formatSOL, formatAddress, formatDeadline } from "@/utils/format";
import styles from "./ChallengeCard.module.css";

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
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerBadges}>
            <span className={styles.challengeId}>
              Challenge #{challengeId}
            </span>
            <span
              className={`${styles.statusBadge} ${
                isActive ? styles.statusActive : styles.statusCompleted
              }`}
            >
              {isActive ? "Active" : "Completed"}
            </span>
          </div>
          <h3 className={styles.title}>
            {title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className={styles.description}>
        {description}
      </p>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Bounty */}
        <div className={`${styles.statCard} ${styles.statCardBounty}`}>
          <div className={styles.statHeader}>
            <svg className={`${styles.statIcon} ${styles.statIconBounty}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`${styles.statLabel} ${styles.statLabelBounty}`}>Bounty</span>
          </div>
          <p className={`${styles.statValue} ${styles.statValueBounty}`}>
            {formatSOL(bountyAmount)}
          </p>
        </div>

        {/* Submissions */}
        <div className={`${styles.statCard} ${styles.statCardSubmissions}`}>
          <div className={styles.statHeader}>
            <svg className={`${styles.statIcon} ${styles.statIconSubmissions}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className={`${styles.statLabel} ${styles.statLabelSubmissions}`}>Entries</span>
          </div>
          <p className={`${styles.statValue} ${styles.statValueSubmissions}`}>
            {submissionCount}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.creatorInfo}>
          <span className={styles.creatorLabel}>Created by</span>
          <span className={styles.creatorAddress}>
            {formatAddress(creator)}
          </span>
          <div className={styles.deadlineInfo}>
            <svg className={styles.deadlineIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={styles.deadlineText}>
              {formatDeadline(deadline)}
            </span>
          </div>
        </div>

        <Link
          href={`/challenge/${challengeId}`}
          className={styles.viewButton}
        >
          View
          <svg className={styles.viewButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
