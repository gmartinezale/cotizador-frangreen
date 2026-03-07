"use server";

import QuoterDashboard from "@/components/template/Dashboard/QuoterDashboard";
import SkeletonDashboard from "@/components/template/Dashboard/SkeletonDashboard";
import { QuoterRepository } from "@/data/quoter.repository";
import { Quoter } from "@/entities/Quoter";
import { cookies } from "next/headers";
import { Suspense } from "react";

async function QuoterDashboardWrapper() {
  try {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("session")?.value;
    const repository = QuoterRepository.instance(token);
    const {
      success,
      quotersPending,
      quotersProcess,
      quotersCompleted,
    }: {
      success: boolean;
      quotersPending: Quoter[];
      quotersProcess: Quoter[];
      quotersCompleted: Quoter[];
    } = await repository.getQuoters();
  
    if (!success) {
      throw new Error("Error getting quoters");
    }
  
    return (
      <QuoterDashboard
        quotersPending={quotersPending}
        quotersProcess={quotersProcess}
        quotersCompleted={quotersCompleted}
      />
    );
  }
  catch (error) {
    console.error("Error in QuoterDashboardWrapper:", error);
    return <div className="text-red-500">Failed to load dashboard data.</div>;
  }
}

export default async function DashboardPage() {
  return (
    <div className="px-4 pt-6">
      <Suspense fallback={<SkeletonDashboard />}>
        <QuoterDashboardWrapper />
      </Suspense>
    </div>
  );
}
