"use client";
import { Skeleton } from "@heroui/react";

export default function SkeletonProductTable() {
  return (
    <div className="px-4 pt-2">
      {/* Header */}
      <Skeleton className="h-7 w-32 rounded-lg mb-4" />
      
      <div className="flex flex-col">
        <div className="justify-between px-4 py-3">
          {/* Button Agregar */}
          <div className="w-full pb-2 flex justify-end">
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          
          {/* Table Skeleton */}
          <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-4 py-3">
              <div className="flex gap-4">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
            </div>
            
            {/* Table Rows */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 dark:border-gray-700/50"
              >
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-6 rounded" />
                <Skeleton className="h-5 w-28 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Skeleton className="h-5 w-32 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
