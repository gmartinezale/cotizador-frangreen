"use client";

import { Quoter } from "@/entities/Quoter";
import { ProductDoc } from "@/entities/Product";
import formatCurrency from "@/utils/formatCurrency";
import { Card, CardBody, Button, Tooltip, Chip } from "@heroui/react";
import {
  DocumentArrowDownIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface CompletedCardProps {
  quoter: Quoter;
}

export default function CompletedCard({ quoter }: CompletedCardProps) {
  const completedDate = quoter.statusChanges?.find(
    (sc) => sc.status === "COMPLETA"
  );
  const formattedCompletedDate = completedDate
    ? new Date(completedDate.date).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const totalProducts =
    (quoter.products?.length || 0) + (quoter.customProducts?.length || 0);

  const handleDownloadPDF = () => {
    window.open(`/view/cotizacion-${quoter.quoterNumber}`, "_blank");
  };

  return (
    <Card className="border border-success/30 bg-success/5 dark:bg-success/5">
      <CardBody className="p-4 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
              {quoter.artist}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              OT #{quoter.orderNumber}
            </p>
          </div>
          <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
        </div>

        {/* Info */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-gray-900 dark:text-white font-semibold">
              {formatCurrency(quoter.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Productos</span>
            <span className="text-gray-600 dark:text-gray-300">
              {totalProducts}
            </span>
          </div>
          {quoter.invoiceNumber && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Folio</span>
              <span className="text-gray-600 dark:text-gray-300">
                {quoter.invoiceNumber}
              </span>
            </div>
          )}
          {formattedCompletedDate && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Completada
              </span>
              <span className="text-success text-xs font-medium">
                {formattedCompletedDate}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <Chip color="success" variant="flat" size="sm" className="flex-1 justify-center">
            Completada
          </Chip>
          <Tooltip content="Descargar PDF">
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              onPress={handleDownloadPDF}
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </CardBody>
    </Card>
  );
}
