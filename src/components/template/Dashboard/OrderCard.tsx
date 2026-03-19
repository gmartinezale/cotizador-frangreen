"use client";

import { Quoter, ProductsQuoter, CustomProduct, SHIPPING_LABELS, SHIPPING_OPTIONS, ShippingType } from "@/entities/Quoter";
import { ProductDoc } from "@/entities/Product";
import { QuoterRepository } from "@/data/quoter.repository";
import { SettingsRepository } from "@/data/settings.repository";
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
  CalendarDaysIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useContext, useEffect, useReducer } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { useRouter } from "next/navigation";

interface OrderCardProps {
  quoter: Quoter;
}

// ── Reducer ──────────────────────────────────────────────────────────────────
type OrderCardState = {
  showModal: boolean;
  loading: boolean;
  invoiceInput: string;
  dateValue: string;
  products: ProductsQuoter[];
  customProducts: CustomProduct[];
  shippingType: string | null;
  configuredShipping: number;
};

type OrderCardAction =
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_INVOICE_INPUT"; payload: string }
  | { type: "SET_DATE_VALUE"; payload: string }
  | { type: "SET_PRODUCTS"; payload: ProductsQuoter[] }
  | { type: "TOGGLE_PRODUCT"; index: number }
  | { type: "SET_CUSTOM_PRODUCTS"; payload: CustomProduct[] }
  | { type: "TOGGLE_CUSTOM_PRODUCT"; index: number }
  | { type: "SET_SHIPPING_TYPE"; payload: string | null }
  | { type: "SET_CONFIGURED_SHIPPING"; payload: number };

function orderCardReducer(state: OrderCardState, action: OrderCardAction): OrderCardState {
  switch (action.type) {
    case "OPEN_MODAL":
      return { ...state, showModal: true };
    case "CLOSE_MODAL":
      return { ...state, showModal: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_INVOICE_INPUT":
      return { ...state, invoiceInput: action.payload };
    case "SET_DATE_VALUE":
      return { ...state, dateValue: action.payload };
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "TOGGLE_PRODUCT": {
      const updated = [...state.products];
      updated[action.index] = { ...updated[action.index], isFinished: !updated[action.index].isFinished };
      return { ...state, products: updated };
    }
    case "SET_CUSTOM_PRODUCTS":
      return { ...state, customProducts: action.payload };
    case "TOGGLE_CUSTOM_PRODUCT": {
      const updated = [...state.customProducts];
      updated[action.index] = { ...updated[action.index], isFinished: !updated[action.index].isFinished };
      return { ...state, customProducts: updated };
    }
    case "SET_SHIPPING_TYPE":
      return { ...state, shippingType: action.payload };
    case "SET_CONFIGURED_SHIPPING":
      return { ...state, configuredShipping: action.payload };
    default:
      return state;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function OrderCard({ quoter }: OrderCardProps) {
  const [state, dispatch] = useReducer(orderCardReducer, {
    showModal: false,
    loading: false,
    invoiceInput: quoter.invoiceNumber || "",
    dateValue: quoter.dateLimit
      ? new Date(quoter.dateLimit).toISOString().split("T")[0]
      : "",
    products: quoter.products || [],
    customProducts: quoter.customProducts || [],
    shippingType: (quoter.shippingType ?? ((quoter.shippingCost ?? 0) > 0 ? 'PAKET' : null)) as string | null,
    configuredShipping: quoter.shippingCost ?? 0,
  });
  const { showModal, loading, invoiceInput, dateValue, products, customProducts, shippingType, configuredShipping } = state;
  const { showToast } = useContext(ToastContext);
  const router = useRouter();

  const formattedDate = quoter.dateLimit
    ? new Date(quoter.dateLimit).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";

  useEffect(() => {
    SettingsRepository.instance()
      .getSettings()
      .then((data) => {
        if (data.success) dispatch({ type: "SET_CONFIGURED_SHIPPING", payload: data.settings.shippingCost });
      })
      .catch(() => {});
  }, []);

  const finishedCount =
    products.filter((p) => p.isFinished).length +
    customProducts.filter((p) => p.isFinished).length;
  const totalCount = products.length + customProducts.length;
  const progressPercent =
    totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

  const getProductName = (product: string | ProductDoc): string => {
    if (typeof product === "object" && product !== null) {
      return product.name || "";
    }
    return String(product);
  };

  // Retroactive multiplier: prefers stored value; falls back to matching type by description in product catalog
  const getProductMultiplier = (item: typeof products[number]): number => {
    if (item.multiplier && item.multiplier > 1) return item.multiplier;
    const productObj = item.product as any;
    if (productObj?.types) {
      const matched = productObj.types.find((t: any) => t.description === item.productType?.description);
      if (matched?.multiplier && matched.multiplier > 1) return matched.multiplier;
    }
    return 1;
  };

  const handleToggleProduct = async (index: number) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const repo = QuoterRepository.instance();
      const res = await repo.toggleProductFinished(quoter._id!, index);
      if (res.success) {
        dispatch({ type: "TOGGLE_PRODUCT", index });
        if (res.allFinished) {
          showToast(true, "¡Orden completada!", "Todos los productos están listos");
          dispatch({ type: "CLOSE_MODAL" });
          router.refresh();
        }
      } else {
        showToast(false, "Error al actualizar producto");
      }
    } catch {
      showToast(false, "Error al actualizar producto");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleToggleCustomProduct = async (index: number) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const repo = QuoterRepository.instance();
      const res = await repo.toggleCustomProductFinished(quoter._id!, index);
      if (res.success) {
        dispatch({ type: "TOGGLE_CUSTOM_PRODUCT", index });
        if (res.allFinished) {
          showToast(true, "¡Orden completada!", "Todos los productos están listos");
          dispatch({ type: "CLOSE_MODAL" });
          router.refresh();
        }
      } else {
        showToast(false, "Error al actualizar producto");
      }
    } catch {
      showToast(false, "Error al actualizar producto");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleSaveDate = async () => {
    if (!dateValue.trim()) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await QuoterRepository.instance().updateDateLimit(
        quoter._id!,
        dateValue
      );
      if (res.success) {
        showToast(true, "Fecha de entrega actualizada");
        router.refresh();
      } else {
        showToast(false, "Error al actualizar fecha");
      }
    } catch {
      showToast(false, "Error al actualizar fecha");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceInput.trim()) return;
    dispatch({ type: "SET_LOADING", payload: true });
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
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleDownloadPDF = () => {
    window.open(`/api/quoter/${quoter.quoterNumber}/pdf`, "_blank");
  };

  const handleChangeShipping = async (newType: string | null) => {
    const prevType = shippingType;
    dispatch({ type: "SET_SHIPPING_TYPE", payload: newType });
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const repo = QuoterRepository.instance();
      const newCost = newType === 'PAKET' ? configuredShipping : 0;
      const res = await repo.updateShipping(quoter._id!, newCost, newType);
      if (res.success) {
        showToast(true, newType ? SHIPPING_LABELS[newType as ShippingType] : "Sin envío");
        router.refresh();
      } else {
        dispatch({ type: "SET_SHIPPING_TYPE", payload: prevType });
        showToast(false, "Error al actualizar envío");
      }
    } catch {
      dispatch({ type: "SET_SHIPPING_TYPE", payload: prevType });
      showToast(false, "Error al actualizar envío");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
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
        <CardBody className="p-4 space-y-3" onClick={() => dispatch({ type: "OPEN_MODAL" })}>
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
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full shrink-0">
            {quoter.shippingType ? SHIPPING_LABELS[quoter.shippingType as ShippingType] : "Sin envío"}
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
            {formattedDate && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Fecha de entrega</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {formattedDate}
                </span>
              </div>
            )}
            {shippingType && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Entrega</span>
                <span className="text-blue-500 dark:text-blue-400 font-medium">
                  {SHIPPING_LABELS[shippingType as ShippingType]}
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
              onPress={() => dispatch({ type: "OPEN_MODAL" })}
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
        onClose={() => dispatch({ type: "CLOSE_MODAL" })}
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
                      <p className="text-sm text-gray-400">
                        {product.productType?.description} {product.productFinish?.description} — Cant: {product.amount}
                        {getProductMultiplier(product) > 1 && (
                          <span className="ml-1 text-purple-500 dark:text-purple-400">
                            ({product.amount * getProductMultiplier(product)} uds.)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                    {formatCurrency(product.price * product.amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* Custom Products checklist */}
            {customProducts.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Productos Personalizados
                </h4>
                {customProducts.map((cp, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      cp.isFinished
                        ? "bg-success/5 border-success/30"
                        : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Checkbox
                        isSelected={!!cp.isFinished}
                        onValueChange={() => handleToggleCustomProduct(idx)}
                        isDisabled={loading}
                        color="success"
                        size="lg"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            cp.isFinished
                              ? "line-through text-gray-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {cp.description}
                        </p>
                        <p className="text-xs text-gray-500">Cant: {cp.amount}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                      {formatCurrency(cp.price * cp.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Divider className="my-4" />

            {/* Date limit */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4" />
                Fecha de entrega
              </h4>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) =>
                    dispatch({ type: "SET_DATE_VALUE", payload: e.target.value })
                  }
                  className="flex-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="sm"
                  color="primary"
                  isLoading={loading}
                  onPress={handleSaveDate}
                  startContent={<PencilSquareIcon className="w-3.5 h-3.5" />}
                >
                  Guardar
                </Button>
              </div>
            </div>

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
                  onValueChange={(v) => dispatch({ type: "SET_INVOICE_INPUT", payload: v })}
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

            {/* Shipping type selector */}
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Tipo de entrega</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SHIPPING_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.key)}
                    type="button"
                    disabled={loading}
                    onClick={() => handleChangeShipping(opt.key)}
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
            <Button variant="light" onPress={() => dispatch({ type: "CLOSE_MODAL" })}>
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
