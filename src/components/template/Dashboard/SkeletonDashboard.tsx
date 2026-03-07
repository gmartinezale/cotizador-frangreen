"use client";
import { Skeleton, Card, CardBody } from "@heroui/react";

function SkeletonCard() {
  return (
    <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardBody className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
        </div>
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </CardBody>
    </Card>
  );
}

export default function SkeletonDashboard() {
  return (
    <div className="mx-auto max-w-7xl px-2 py-6 sm:px-4 lg:px-6">
      {/* Tabs skeleton */}
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
