"use client";

import { Quoter, ProductsQuoter } from "@/entities/Quoter";
import { ProductDoc } from "@/entities/Product";
import { QuoterRepository } from "@/data/quoter.repository";
import formatCurrency from "@/utils/formatCurrency";
import {
  Card,
  CardBody,
  Button,
  Tooltip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Input,
  Divider,
} from "@heroui/react";
import {
  DocumentArrowDownIcon,
  EyeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { useRouter } from "next/navigation";

interface OrderCardProps {
  quoter: Quoter;
}

export default function OrderCard({ quoter }: OrderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState(quoter.invoiceNumber || "");
  const [products, setProducts] = useState<ProductsQuoter[]>(
    quoter.products || []
  );
  const { showToast } = useContext(ToastContext);
  const router = useRouter();

  const finishedCount = products.filter((p) => p.isFinished).length;
  const totalCount = products.length;
  const progressPercent =
    totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

  const getProductName = (product: string | ProductDoc): string => {
    if (typeof product === "object" && product !== null) {
      return product.name || "";
    }
    return String(product);
  };

  const handleToggleProduct = async (index: number) => {
    setLoading(true);
    try {
      const repo = QuoterRepository.instance();
      const res = await repo.toggleProductFinished(quoter._id!, index);
      if (res.success) {
        // Update local state
        const updated = [...products];
        updated[index] = {
          ...updated[index],
          isFinished: !updated[index].isFinished,
        };
        setProducts(updated);

        if (res.allFinished) {
          showToast(true, "¡Orden completada!", "Todos los productos están listos");
          setShowModal(false);
          router.refresh();
        }
      } else {
        showToast(false, "Error al actualizar producto");
      }
    } catch {
      showToast(false, "Error al actualizar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceInput.trim()) return;
    setLoading(true);
    try {
      const repo = QuoterRepository.instance();
      const res = await repo.setInvoiceNumber(quoter._id!, invoiceInput.trim());
      if (res.success) {
        showToast(true, "Folio guardado");
      } else {
        showToast(false, "Error al guardar folio");
      }
    } catch {
      showToast(false, "Error al guardar folio");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/view/cotizacion-${quoter.quoterNumber}`, "_blank");
  };

  const progressColor =
    progressPercent === 100
      ? "success"
      : progressPercent >= 50
        ? "primary"
        : "warning";

  return (
    <>
      <Card className="border border-gray-700 bg-white dark:bg-gray-800/50 transition-all hover:border-primary/50 cursor-pointer">
        <CardBody className="p-4 space-y-3" onClick={() => setShowModal(true)}>
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
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              En proceso
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Progreso</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                {finishedCount}/{totalCount}
              </span>
            </div>
            <Progress
              value={progressPercent}
              color={progressColor}
              size="sm"
              className="w-full"
            />
          </div>

          {/* Info */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {formatCurrency(quoter.totalAmount)}
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
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              className="flex-1 text-xs"
              onPress={() => setShowModal(true)}
              startContent={<EyeIcon className="w-3.5 h-3.5" />}
            >
              Detalle
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
          </div>
        </CardBody>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        size="3xl"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col">
            <span>Orden de Trabajo #{quoter.orderNumber}</span>
            <span className="text-sm font-normal text-gray-500">
              {quoter.artist} — Cotización #{quoter.quoterNumber}
            </span>
          </ModalHeader>
          <ModalBody>
            {/* Progress summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progreso general
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {progressPercent}%
                </span>
              </div>
              <Progress
                value={progressPercent}
                color={progressColor}
                size="md"
                className="w-full"
              />
            </div>

            <Divider />

            {/* Products checklist */}
            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Productos ({finishedCount}/{totalCount} completados)
              </h4>
              {products.map((product, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    product.isFinished
                      ? "bg-success/5 border-success/30"
                      : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Checkbox
                      isSelected={product.isFinished}
                      onValueChange={() => handleToggleProduct(index)}
                      isDisabled={loading}
                      color="success"
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          product.isFinished
                            ? "line-through text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {getProductName(product.product)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.productType?.description} — Cant: {product.amount}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                    {formatCurrency(product.price * product.amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* Custom Products (read-only) */}
            {quoter.customProducts && quoter.customProducts.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Productos Personalizados
                </h4>
                {quoter.customProducts.map((cp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {cp.description}
                      </p>
                      <p className="text-xs text-gray-500">Cant: {cp.amount}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatCurrency(cp.price * cp.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Divider className="my-4" />

            {/* Invoice/Receipt folio */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" />
                Folio Factura / Boleta
              </h4>
              <div className="flex gap-2">
                <Input
                  size="sm"
                  placeholder="Ej: FAC-001"
                  value={invoiceInput}
                  onValueChange={setInvoiceInput}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  color="primary"
                  isLoading={loading}
                  onPress={handleSaveInvoice}
                >
                  Guardar
                </Button>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mt-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(quoter.totalAmount)}
              </span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowModal(false)}>
              Cerrar
            </Button>
            <Button
              color="primary"
              variant="flat"
              onPress={handleDownloadPDF}
              startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
            >
              Ver PDF
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
