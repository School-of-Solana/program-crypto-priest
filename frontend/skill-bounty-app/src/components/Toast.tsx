"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/50",
          text: "text-green-400",
          icon: "✓",
        };
      case "error":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/50",
          text: "text-red-400",
          icon: "✕",
        };
      case "info":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/50",
          text: "text-blue-400",
          icon: "ℹ",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border ${styles.bg} ${styles.border} backdrop-blur-lg shadow-lg animate-slide-in`}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center font-bold text-lg`}
        >
          {styles.icon}
        </div>
        <div className="flex-1">
          <p className={`${styles.text} font-medium`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
