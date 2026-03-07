"use client";
import { Skeleton } from "@heroui/react";

export default function SkeletonLoading() {
  return (
    <div className="m-6">
      <div className="space-y-6">
        {/* Header skeleton */}
        <Skeleton className="h-8 w-48 rounded-lg" />
        
        {/* Content card skeleton */}
        <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
        </div>
        
        {/* List items skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
