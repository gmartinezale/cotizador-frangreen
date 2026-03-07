"use client";

import { Quoter } from "@/entities/Quoter";
import { ProductDoc } from "@/entities/Product";
import { QuoterRepository } from "@/data/quoter.repository";
import formatCurrency from "@/utils/formatCurrency";
import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import {
  TrashIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { useRouter } from "next/navigation";

interface PendingCardProps {
  quoter: Quoter;
}

export default function PendingCard({ quoter }: PendingCardProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useContext(ToastContext);
  const router = useRouter();

  // Calculate if quotation is older than 3 days
  const createdDate = new Date(quoter.createdAt);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = diffDays > 3;

  const formattedDate = createdDate.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
  });

  const totalProducts =
    (quoter.products?.length || 0) + (quoter.customProducts?.length || 0);

  const getProductName = (product: string | ProductDoc): string => {
    if (typeof product === "object" && product !== null) {
      return product.name || "";
    }
    return String(product);
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      const repo = QuoterRepository.instance();
      const res = await repo.markAsPaid(quoter._id!);
      if (res.success) {
        showToast(true, "Cotización marcada como pagada", `OT: ${res.orderNumber}`);
        router.refresh();
      } else {
        showToast(false, "Error al marcar como pagada");
      }
    } catch {
      showToast(false, "Error al marcar como pagada");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar esta cotización?")) return;
    setLoading(true);
    try {
      const repo = QuoterRepository.instance();
      const res = await repo.deleteQuoter(quoter._id!);
      if (res.success) {
        showToast(true, "Cotización eliminada");
        router.refresh();
      } else {
        showToast(false, "Error al eliminar");
      }
    } catch {
      showToast(false, "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/view/cotizacion-${quoter.quoterNumber}`, "_blank");
  };

  return (
    <Card
      className={`border transition-all ${
        isOverdue
          ? "border-red-500/60 bg-red-950/20 dark:bg-red-950/20"
          : "border-gray-700 bg-white dark:bg-gray-800/50"
      }`}
    >
      <CardBody className="p-4 space-y-3">
        {/* Header: Artist + Amount */}
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
              {quoter.artist}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Cot. #{quoter.quoterNumber}
            </p>
          </div>
          {isOverdue && (
            <Tooltip content={`${diffDays} días sin pagar`}>
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
            </Tooltip>
          )}
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
            <span className="text-gray-500 dark:text-gray-400">Fecha</span>
            <span className="text-gray-600 dark:text-gray-300">
              {formattedDate}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Productos</span>
            <span className="text-gray-600 dark:text-gray-300">
              {totalProducts}
            </span>
          </div>
          {quoter.discount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Dcto.</span>
              <span className="text-orange-400 font-medium">
                {quoter.discount}%
              </span>
            </div>
          )}
        </div>

        {/* Product names preview */}
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {quoter.products
            ?.slice(0, 2)
            .map((p) => getProductName(p.product))
            .join(", ")}
          {totalProducts > 2 && ` +${totalProducts - 2} más`}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <Button
            size="sm"
            color="success"
            variant="flat"
            className="flex-1 text-xs"
            isLoading={loading}
            onPress={handleMarkPaid}
            startContent={<CheckIcon className="w-3.5 h-3.5" />}
          >
            Marcar como pagada
          </Button>
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
          <Tooltip content="Eliminar">
            <Button
              size="sm"
              color="danger"
              variant="flat"
              isIconOnly
              isLoading={loading}
              onPress={handleDelete}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </CardBody>
    </Card>
  );
}
