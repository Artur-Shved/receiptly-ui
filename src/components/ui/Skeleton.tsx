'use client';

import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Shimmering placeholder block (web-design-refresh.md §3). Replaces spinners
 * on lists/tables/stat cards; size it via className/style.
 */
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-lg bg-[#F0F0F3] ${className}`}
      style={style}
    >
      <div className="shimmer absolute inset-0" />
    </div>
  );
}
