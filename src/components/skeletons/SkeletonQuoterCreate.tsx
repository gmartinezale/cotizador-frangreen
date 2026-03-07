"use client";
import { Skeleton, Card, CardBody } from "@heroui/react";

export default function SkeletonQuoterCreate() {
  return (
    <div className="px-0 sm:px-4 pt-4 sm:pt-6 pb-28 lg:pb-8">
      {/* Title */}
      <Skeleton className="h-8 w-40 rounded-lg mb-4 sm:mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
        {/* Main Form */}
        <div className="flex flex-col bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            {/* Datos de Cotización Section */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-1.5 h-6 rounded-full" />
                <Skeleton className="h-6 w-44 rounded" />
              </div>
              
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Artist Input */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <Skeleton className="h-4 w-40 rounded mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                {/* Date Input */}
                <div>
                  <Skeleton className="h-4 w-32 rounded mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
            
            {/* Products Section */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-1.5 h-6 rounded-full" />
                  <Skeleton className="h-6 w-40 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
              
              {/* Product Forms Skeleton */}
              {[1, 2].map((i) => (
                <Card key={i} className="mb-4">
                  <CardBody className="p-4">
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Skeleton className="h-4 w-20 rounded mb-2" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-16 rounded mb-2" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-20 rounded mb-2" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-20 rounded mb-2" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {/* Discount Section */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-1.5 h-6 rounded-full" />
                <Skeleton className="h-6 w-32 rounded" />
              </div>
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>
        
        {/* Sidebar - Total Summary */}
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <CardBody className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-6 w-32 rounded mb-4" />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-6 w-28 rounded" />
                  </div>
                </div>
              </div>
              
              <Skeleton className="h-12 w-full rounded-lg mt-4" />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
