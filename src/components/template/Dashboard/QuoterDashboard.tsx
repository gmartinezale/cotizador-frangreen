"use client";

import { Quoter } from "@/entities/Quoter";
import { Tabs, Tab } from "@heroui/react";
import {
  ClockIcon,
  CogIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import PendingCard from "./PendingCard";
import OrderCard from "./OrderCard";
import CompletedCard from "./CompletedCard";

interface IQuoterDashboardProps {
  quotersPending: Quoter[];
  quotersProcess: Quoter[];
  quotersCompleted: Quoter[];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
      <svg
        className="w-16 h-16 mb-4 opacity-30"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <p className="text-lg font-medium">{message}</p>
    </div>
  );
}

export default function QuoterDashboard({
  quotersPending,
  quotersProcess,
  quotersCompleted,
}: IQuoterDashboardProps) {
  return (
    <div className="mx-auto max-w-7xl px-2 py-6 sm:px-4 lg:px-6">
      <Tabs
        aria-label="Dashboard"
        color="primary"
        variant="solid"
        classNames={{
          tabList: "bg-gray-800/50 border border-gray-700",
          cursor: "bg-[#72b6A3]/20",
          tab: "text-gray-400 data-[selected=true]:text-white",
          tabContent: "group-data-[selected=true]:text-white",
        }}
        size="lg"
      >
        {/* PENDIENTES */}
        <Tab
          key="pending"
          title={
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              <span>Pendientes</span>
              {quotersPending.length > 0 && (
                <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-warning text-white text-xs font-bold flex items-center justify-center">
                  {quotersPending.length}
                </span>
              )}
            </div>
          }
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
            {quotersPending.length === 0 ? (
              <EmptyState message="No hay cotizaciones pendientes" />
            ) : (
              quotersPending.map((quoter) => (
                <PendingCard key={quoter._id} quoter={quoter} />
              ))
            )}
          </div>
        </Tab>

        {/* EN PROCESO */}
        <Tab
          key="process"
          title={
            <div className="flex items-center gap-2">
              <CogIcon className="w-5 h-5" />
              <span>En Proceso</span>
              {quotersProcess.length > 0 && (
                <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {quotersProcess.length}
                </span>
              )}
            </div>
          }
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
            {quotersProcess.length === 0 ? (
              <EmptyState message="No hay órdenes en proceso" />
            ) : (
              quotersProcess.map((quoter) => (
                <OrderCard key={quoter._id} quoter={quoter} />
              ))
            )}
          </div>
        </Tab>

        {/* COMPLETAS */}
        <Tab
          key="completed"
          title={
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Completas</span>
              {quotersCompleted.length > 0 && (
                <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center">
                  {quotersCompleted.length}
                </span>
              )}
            </div>
          }
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
            {quotersCompleted.length === 0 ? (
              <EmptyState message="No hay órdenes completadas" />
            ) : (
              quotersCompleted.map((quoter) => (
                <CompletedCard key={quoter._id} quoter={quoter} />
              ))
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
