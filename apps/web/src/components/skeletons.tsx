import React from 'react';

export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="premium-card p-6 rounded-2xl bg-white space-y-4">
          <div className="flex justify-between items-start">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-8 w-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-7 w-28" />
            <SkeletonBox className="h-3 w-32" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="premium-card rounded-2xl bg-white p-6 space-y-4">
      <SkeletonBox className="h-4 w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <SkeletonBox className="h-4 w-1/3" />
            <SkeletonBox className="h-4 w-1/4" />
            <SkeletonBox className="h-4 w-1/6" />
            <SkeletonBox className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBox className="h-6 w-64" />
      <SkeletonBox className="h-3 w-80" />
    </div>
  );
}
