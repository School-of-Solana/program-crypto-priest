"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500
});

function ProgressBarImpl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // Start progress on link clicks
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const targetUrl = new URL(target.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.pathname !== currentUrl.pathname && target.target !== '_blank') {
        NProgress.start();
      }
    };

    const handleMutation = () => {
      const links = document.querySelectorAll('a[href]');
      links.forEach((link) => {
        link.addEventListener('click', handleAnchorClick as EventListener);
      });
    };

    // Initial setup
    handleMutation();

    // Watch for new links being added to DOM
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const links = document.querySelectorAll('a[href]');
      links.forEach((link) => {
        link.removeEventListener('click', handleAnchorClick as EventListener);
      });
    };
  }, []);

  return null;
}

export default function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarImpl />
    </Suspense>
  );
}
