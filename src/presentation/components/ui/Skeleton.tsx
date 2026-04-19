'use client';

import React from 'react';

// A versatile skeleton loader with shimmer effect.
// Pass `className` for custom height/width.

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export function Skeleton({ className = '', rounded = 'rounded-2xl' }: SkeletonProps) {
  return <div className={`skeleton ${rounded} ${className}`} />;
}

// Ready-made EventCard skeleton
export function EventCardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-80 w-full" rounded="rounded-3xl" />
      <div className="px-1 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-4 px-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// UserCard skeleton (for friends/search)
export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 animate-pulse">
      <Skeleton className="w-12 h-12 shrink-0" rounded="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ClubCard skeleton (for map popup / search)
export function ClubCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden animate-pulse">
      <Skeleton className="h-36 w-full" rounded="rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
