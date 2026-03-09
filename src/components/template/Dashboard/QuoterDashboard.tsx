"use client";

import { Quoter } from "@/entities/Quoter";
import { useState } from "react";
import {
  ClockIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import PendingCard from "./PendingCard";
import PaymentCard from "./PaymentCard";
import OrderCard from "./OrderCard";
import CompletedCard from "./CompletedCard";

interface IQuoterDashboardProps {
  quotersPending: Quoter[];
  quotersPayment: Quoter[];
  quotersProcess: Quoter[];
  quotersCompleted: Quoter[];
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-400">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

interface StageSectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  count: number;
  accentClass: string;
  badgeClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function StageSection({
  icon,
  title,
  subtitle,
  count,
  accentClass,
  badgeClass,
  defaultOpen = true,
  children,
}: StageSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800/30">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* colored accent bar */}
          <div className={`w-1 h-7 rounded-full ${accentClass}`} />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500">{icon}</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {title}
              </span>
              {count > 0 && (
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-bold text-white flex items-center justify-center ${badgeClass}`}
                >
                  {count}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-6">
              {subtitle}
            </p>
          </div>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible grid */}
      {open && (
        <div className="px-4 pb-5">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuoterDashboard({
  quotersPending,
  quotersPayment,
  quotersProcess,
  quotersCompleted,
}: IQuoterDashboardProps) {
  return (
    <div className="mx-auto max-w-7xl px-2 py-6 sm:px-4 lg:px-6 space-y-4">

      {/* PENDIENTES */}
      <StageSection
        icon={<ClockIcon className="w-4.5 h-4.5" />}
        title="Pendientes"
        subtitle="Cotizaciones enviadas — esperando confirmación de pago"
        count={quotersPending.length}
        accentClass="bg-warning"
        badgeClass="bg-warning"
        defaultOpen={true}
      >
        {quotersPending.length === 0 ? (
          <EmptyState message="Sin cotizaciones pendientes" />
        ) : (
          quotersPending.map((q) => <PendingCard key={q._id} quoter={q} />)
        )}
      </StageSection>

      {/* PAGADAS — Órdenes de Pago */}
      <StageSection
        icon={<BanknotesIcon className="w-4.5 h-4.5" />}
        title="Órdenes de Pago"
        subtitle="Pago confirmado — aún no se ha iniciado el trabajo"
        count={quotersPayment.length}
        accentClass="bg-amber-400"
        badgeClass="bg-amber-500"
        defaultOpen={true}
      >
        {quotersPayment.length === 0 ? (
          <EmptyState message="Sin órdenes de pago" />
        ) : (
          quotersPayment.map((q) => <PaymentCard key={q._id} quoter={q} />)
        )}
      </StageSection>

      {/* EN PROCESO */}
      <StageSection
        icon={<WrenchScrewdriverIcon className="w-4.5 h-4.5" />}
        title="En Proceso"
        subtitle="Trabajos en curso — marcá los items al completarlos"
        count={quotersProcess.length}
        accentClass="bg-primary"
        badgeClass="bg-primary"
        defaultOpen={true}
      >
        {quotersProcess.length === 0 ? (
          <EmptyState message="Sin órdenes en proceso" />
        ) : (
          quotersProcess.map((q) => <OrderCard key={q._id} quoter={q} />)
        )}
      </StageSection>

      {/* COMPLETADAS */}
      <StageSection
        icon={<CheckCircleIcon className="w-4.5 h-4.5" />}
        title="Completadas"
        subtitle="Trabajos finalizados al 100%"
        count={quotersCompleted.length}
        accentClass="bg-success"
        badgeClass="bg-success"
        defaultOpen={quotersCompleted.length <= 8}
      >
        {quotersCompleted.length === 0 ? (
          <EmptyState message="Sin órdenes completadas" />
        ) : (
          quotersCompleted.map((q) => <CompletedCard key={q._id} quoter={q} />)
        )}
      </StageSection>

    </div>
  );
}
