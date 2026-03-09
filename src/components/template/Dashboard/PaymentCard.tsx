"use client";

import { Quoter } from "@/entities/Quoter";
import { SHIPPING_LABELS, ShippingType } from "@/entities/Quoter";
import { QuoterRepository } from "@/data/quoter.repository";
import formatCurrency from "@/utils/formatCurrency";
import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import {
  DocumentArrowDownIcon,
  PlayIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { useRouter } from "next/navigation";

interface PaymentCardProps {
  quoter: Quoter;
}

export default function PaymentCard({ quoter }: PaymentCardProps) {
  const [loading, setLoading] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(
    quoter.dateLimit
      ? new Date(quoter.dateLimit).toISOString().split("T")[0]
      : ""
  );
  const [editingInvoice, setEditingInvoice] = useState(false);
  const [invoiceValue, setInvoiceValue] = useState(quoter.invoiceNumber || "");
  const { showToast } = useContext(ToastContext);
  const router = useRouter();

  const totalProducts =
    (quoter.products?.length || 0) + (quoter.customProducts?.length || 0);

  const formattedDate = quoter.dateLimit
    ? new Date(quoter.dateLimit).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await QuoterRepository.instance().startOrder(quoter._id!);
      if (res.success) {
        showToast(true, "Trabajo iniciado", `OT #${quoter.orderNumber}`);
        router.refresh();
      } else {
        showToast(false, "Error al iniciar la orden");
      }
    } catch {
      showToast(false, "Error al iniciar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceValue.trim()) return;
    setLoading(true);
    try {
      const res = await QuoterRepository.instance().setInvoiceNumber(
        quoter._id!,
        invoiceValue.trim()
      );
      if (res.success) {
        showToast(true, "Folio guardado");
        setEditingInvoice(false);
      } else {
        showToast(false, "Error al guardar folio");
      }
    } catch {
      showToast(false, "Error al guardar folio");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDate = async () => {
    if (!dateValue) return;
    setLoading(true);
    try {
      const res = await QuoterRepository.instance().updateDateLimit(
        quoter._id!,
        dateValue
      );
      if (res.success) {
        showToast(true, "Fecha de entrega actualizada");
        setEditingDate(false);
        router.refresh();
      } else {
        showToast(false, "Error al actualizar fecha");
      }
    } catch {
      showToast(false, "Error al actualizar fecha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-amber-400/40 bg-amber-50/20 dark:bg-amber-900/10 transition-all">
      <CardBody className="p-4 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
              {quoter.artist}
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">
              OT #{quoter.orderNumber}
            </p>
          </div>
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full shrink-0">
            Pago confirmado
          </span>
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
            <span className="text-gray-500 dark:text-gray-400">Cot.</span>
            <span className="text-gray-600 dark:text-gray-300">
              #{quoter.quoterNumber}
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
              <span className="text-blue-500 dark:text-blue-400 font-medium">
                {SHIPPING_LABELS[quoter.shippingType as ShippingType]}
              </span>
            </div>
          )}

        </div>

        {/* Editable folio */}
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/30 px-3 py-2">
          {editingInvoice ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={invoiceValue}
                onChange={(e) => setInvoiceValue(e.target.value)}
                placeholder="Ej: FAC-001"
                className="flex-1 text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Tooltip content="Guardar">
                <Button
                  size="sm"
                  isIconOnly
                  color="success"
                  variant="flat"
                  onPress={handleSaveInvoice}
                  isLoading={loading}
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
              <Tooltip content="Cancelar">
                <Button
                  size="sm"
                  isIconOnly
                  variant="flat"
                  onPress={() => setEditingInvoice(false)}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center justify-between w-full"
              onClick={() => setEditingInvoice(true)}
            >
              <span className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1">
                <DocumentTextIcon className="w-3.5 h-3.5" />
                Folio
              </span>
              <span className="text-gray-700 dark:text-gray-200 text-xs flex items-center gap-1">
                {invoiceValue || "Sin folio"}
                <PencilIcon className="w-3 h-3 text-gray-400" />
              </span>
            </button>
          )}
        </div>

        {/* Editable date limit */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 px-3 py-2">
          {editingDate ? (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="flex-1 text-xs bg-transparent border border-amber-300 dark:border-amber-600 rounded px-2 py-1 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <Tooltip content="Guardar">
                <Button
                  size="sm"
                  isIconOnly
                  color="success"
                  variant="flat"
                  onPress={handleSaveDate}
                  isLoading={loading}
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
              <Tooltip content="Cancelar">
                <Button
                  size="sm"
                  isIconOnly
                  variant="flat"
                  onPress={() => setEditingDate(false)}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </Button>
              </Tooltip>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center justify-between w-full"
              onClick={() => setEditingDate(true)}
            >
              <span className="text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                Fecha de entrega
              </span>
              <span className="text-gray-700 dark:text-gray-200 text-xs flex items-center gap-1">
                {formattedDate}
                <PencilIcon className="w-3 h-3 text-gray-400" />
              </span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs bg-amber-500 hover:bg-amber-600 text-white"
            isLoading={loading}
            onPress={handleStart}
            startContent={<PlayIcon className="w-3.5 h-3.5" />}
          >
            Empezar trabajo
          </Button>
          <Tooltip content="Descargar PDF">
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              onPress={() =>
                window.open(`/api/quoter/${quoter.quoterNumber}/pdf`, "_blank")
              }
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </CardBody>
    </Card>
  );
}
