"use client";

import { Quoter } from "@/entities/Quoter";
import { ProductDoc } from "@/entities/Product";
import { QuoterRepository } from "@/data/quoter.repository";
import { SettingsRepository } from "@/data/settings.repository";
import { SHIPPING_LABELS, SHIPPING_OPTIONS, ShippingType } from "@/entities/Quoter";
import formatCurrency from "@/utils/formatCurrency";
import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import {
  TrashIcon,
  CheckIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useContext, useState, useEffect } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { useRouter } from "next/navigation";
import EditQuoterModal from "./EditQuoterModal";

interface PendingCardProps {
  quoter: Quoter;
}

function deriveShippingType(quoter: Quoter): ShippingType | null {
  if (quoter.shippingType) return quoter.shippingType as ShippingType;
  // Backward compat: old quotations without shippingType field
  return (quoter.shippingCost ?? 0) > 0 ? 'PAKET' : null;
}

export default function PendingCard({ quoter }: PendingCardProps) {
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shippingType, setShippingType] = useState<ShippingType | null>(deriveShippingType(quoter));
  const [configuredShipping, setConfiguredShipping] = useState<number>(quoter.shippingCost ?? 0);
  const { showToast } = useContext(ToastContext);
  const router = useRouter();

  useEffect(() => {
    SettingsRepository.instance()
      .getSettings()
      .then((data) => {
        if (data.success) setConfiguredShipping(data.settings.shippingCost);
      })
      .catch(() => {});
  }, []);

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
    window.open(`/api/quoter/${quoter.quoterNumber}/pdf`, "_blank");
  };

  const handleToggleShipping = async (newType: ShippingType | null) => {
    const prevType = shippingType;
    setShippingType(newType);
    setLoading(true);
    try {
      const repo = QuoterRepository.instance();
      const newCost = newType === 'PAKET' ? configuredShipping : 0;
      const res = await repo.updateShipping(quoter._id!, newCost, newType);
      if (res.success) {
        showToast(true, newType ? SHIPPING_LABELS[newType] : "Sin envío");
        router.refresh();
      } else {
        setShippingType(prevType);
        showToast(false, "Error al actualizar envío");
      }
    } catch {
      setShippingType(prevType);
      showToast(false, "Error al actualizar envío");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          {quoter.shippingType && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Entrega</span>
              <span className="text-blue-400 font-medium">
                {SHIPPING_LABELS[quoter.shippingType as ShippingType]}
                {quoter.shippingType === 'PAKET' && quoter.shippingCost ? ` (${formatCurrency(quoter.shippingCost)})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Shipping type selector */}
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tipo de entrega</p>
          <div className="grid grid-cols-2 gap-1">
            {SHIPPING_OPTIONS.map((opt) => (
              <button
                key={String(opt.key)}
                type="button"
                disabled={loading}
                onClick={() => handleToggleShipping(opt.key)}
                className={`text-xs px-2 py-1.5 rounded border transition-colors ${
                  shippingType === opt.key
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {opt.key === null ? 'Sin envío'
                  : opt.key === 'PAKET' && configuredShipping > 0
                    ? `PAKET (${formatCurrency(configuredShipping)})`
                    : opt.label}
              </button>
            ))}
          </div>
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
          <Tooltip content="Editar cotización">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              isIconOnly
              onPress={() => setShowEditModal(true)}
            >
              <PencilSquareIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
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

    <EditQuoterModal
      quoter={quoter}
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
    />
    </>
  );
}
