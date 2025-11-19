"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.navContent}>
          {/* Logo */}
          <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
            <div className={styles.logoIcon}>
              <svg className={styles.logoSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className={styles.logoText}>
              Skill Bounty
            </span>
          </Link>

          {/* Navigation Links */}
          <div className={styles.navLinks}>
            <Link
              href="/"
              className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : styles.navLinkInactive}`}
            >
              Home
            </Link>
            <Link
              href="/browse"
              className={`${styles.navLink} ${isActive("/browse") ? styles.navLinkActive : styles.navLinkInactive}`}
            >
              Browse
            </Link>
            <Link
              href="/about"
              className={`${styles.navLink} ${isActive("/about") ? styles.navLinkActive : styles.navLinkInactive}`}
            >
              About
            </Link>
            <Link
              href="/dashboard"
              className={`${styles.navLink} ${isActive("/dashboard") ? styles.navLinkActive : styles.navLinkInactive}`}
            >
              Dashboard
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className={styles.actions}>
            <Link href="/create" className={styles.createButton}>
              Create Challenge
            </Link>
            <WalletMultiButton className={styles.walletButton} />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={styles.mobileMenuButton}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuLinks}>
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`${styles.mobileNavLink} ${isActive("/") ? styles.mobileNavLinkActive : ""}`}
              >
                Home
              </Link>
              <Link
                href="/browse"
                onClick={closeMobileMenu}
                className={`${styles.mobileNavLink} ${isActive("/browse") ? styles.mobileNavLinkActive : ""}`}
              >
                Browse
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className={`${styles.mobileNavLink} ${isActive("/about") ? styles.mobileNavLinkActive : ""}`}
              >
                About
              </Link>
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className={`${styles.mobileNavLink} ${isActive("/dashboard") ? styles.mobileNavLinkActive : ""}`}
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                onClick={closeMobileMenu}
                className={styles.mobileCreateButton}
              >
                Create Challenge
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
