"use client";

import { useContext, useEffect, useMemo, useReducer } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Divider,
  Chip,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import { PlusIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Quoter, ProductsQuoter, CustomProduct, SHIPPING_LABELS, SHIPPING_OPTIONS, ShippingType } from "@/entities/Quoter";
import { Product, ProductDoc, ProductPrice } from "@/entities/Product";
import { ProductRepository } from "@/data/products.repository";
import { QuoterRepository } from "@/data/quoter.repository";
import { ProductForm } from "@/components/template/Quoter/components/ProductForm";
import { ExtraProducts } from "@/components/template/Quoter/components/ExtraProducts";
import { CustomProductForm } from "@/components/template/Quoter/components/CustomProductForm";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import formatCurrency from "@/utils/formatCurrency";
import { useRouter } from "next/navigation";

interface EditQuoterModalProps {
  quoter: Quoter;
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyNewProduct: ProductsQuoter = {
  amount: 0,
  price: 0,
  isFinished: false,
  extras: [],
  product: "",
  productType: { description: "", price: 0 },
};

function getProductName(product: string | ProductDoc): string {
  return typeof product === "object" && product !== null ? product.name ?? "" : String(product);
}

// ── Existing product row (simplified — amount-only editable) ──────────────────

interface ExistingProductRowProps {
  product: ProductsQuoter;
  index: number;
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
}

function ExistingProductRow({ product, index, onAmountChange, onRemove }: ExistingProductRowProps) {
  const extrasTotal = product.extras?.reduce((a, e) => a + e.price * e.amount, 0) ?? 0;
  const subtotal = (product.price ?? 0) * (product.amount ?? 0) + extrasTotal;
  const typeLabel = [product.productType?.description, product.productFinish?.description]
    .filter(Boolean)
    .join(" / ");

  return (
    <Card className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardBody className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip size="sm" color="primary" variant="flat">#{index + 1}</Chip>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getProductName(product.product)}
              </p>
            </div>
            {typeLabel && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{typeLabel}</p>
            )}
            {subtotal > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Subtotal: {formatCurrency(subtotal)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24">
              <Input
                type="number"
                size="sm"
                variant="bordered"
                label="Cant."
                value={product.amount.toString()}
                min="1"
                onChange={(e) => onAmountChange(Math.max(1, parseInt(e.target.value) || 1))}
                classNames={{
                  inputWrapper: "bg-white dark:bg-gray-900/50",
                }}
              />
            </div>
            <Button
              size="sm"
              color="danger"
              variant="light"
              isIconOnly
              onPress={onRemove}
              aria-label="Eliminar producto"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Reducer ──────────────────────────────────────────────────────────────────

type EditState = {
  existingProducts: ProductsQuoter[];
  newCatalogProducts: ProductsQuoter[];
  newProductExtras: Record<number, ProductPrice[]>;
  customProducts: CustomProduct[];
  discount: number;
  shippingType: ShippingType | null;
  configuredShipping: number;
  catalog: Product[];
  formKey: number;
  loadingCatalog: boolean;
  saving: boolean;
};

type EditAction =
  | { type: "OPEN"; quoter: Quoter }
  | { type: "SET_CATALOG"; payload: Product[] }
  | { type: "SET_LOADING_CATALOG"; payload: boolean }
  | { type: "SET_EXISTING_AMOUNT"; index: number; amount: number }
  | { type: "REMOVE_EXISTING"; index: number }
  | { type: "ADD_NEW_CATALOG" }
  | { type: "SET_NEW_CATALOG"; payload: ProductsQuoter[] }
  | { type: "SET_NEW_EXTRAS"; index: number; extras: ProductPrice[] }
  | { type: "ADD_CUSTOM" }
  | { type: "SET_CUSTOM"; payload: CustomProduct[] }
  | { type: "SET_DISCOUNT"; payload: number }
  | { type: "SET_SHIPPING_TYPE"; payload: ShippingType | null }
  | { type: "SET_CONFIGURED_SHIPPING"; payload: number }
  | { type: "SET_SAVING"; payload: boolean };

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case "OPEN":
      return {
        ...state,
        existingProducts: (action.quoter.products || []).map((p) => ({ ...p })),
        newCatalogProducts: [],
        newProductExtras: {},
        customProducts: (action.quoter.customProducts || []).map((c) => ({ ...c })),
        discount: action.quoter.discount ?? 0,
        shippingType: (action.quoter.shippingType
          ? action.quoter.shippingType as ShippingType
          : (action.quoter.shippingCost ?? 0) > 0 ? 'PAKET' : null),
        formKey: state.formKey + 1,
      };
    case "SET_CATALOG":
      return { ...state, catalog: action.payload };
    case "SET_LOADING_CATALOG":
      return { ...state, loadingCatalog: action.payload };
    case "SET_EXISTING_AMOUNT": {
      const updated = [...state.existingProducts];
      updated[action.index] = { ...updated[action.index], amount: action.amount };
      return { ...state, existingProducts: updated };
    }
    case "REMOVE_EXISTING":
      return { ...state, existingProducts: state.existingProducts.filter((_, i) => i !== action.index) };
    case "ADD_NEW_CATALOG":
      return { ...state, newCatalogProducts: [...state.newCatalogProducts, { ...emptyNewProduct }] };
    case "SET_NEW_CATALOG":
      return { ...state, newCatalogProducts: action.payload };
    case "SET_NEW_EXTRAS":
      return { ...state, newProductExtras: { ...state.newProductExtras, [action.index]: action.extras } };
    case "ADD_CUSTOM":
      return { ...state, customProducts: [...state.customProducts, { description: "", price: 0, amount: 1 }] };
    case "SET_CUSTOM":
      return { ...state, customProducts: action.payload };
    case "SET_DISCOUNT":
      return { ...state, discount: action.payload };
    case "SET_SHIPPING_TYPE":
      return { ...state, shippingType: action.payload };
    case "SET_CONFIGURED_SHIPPING":
      return { ...state, configuredShipping: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    default:
      return state;
  }
}

const initialState: EditState = {
  existingProducts: [],
  newCatalogProducts: [],
  newProductExtras: {},
  customProducts: [],
  discount: 0,
  shippingType: null,
  configuredShipping: 0,
  catalog: [],
  formKey: 0,
  loadingCatalog: false,
  saving: false,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditQuoterModal({ quoter, isOpen, onClose }: EditQuoterModalProps) {
  const [state, dispatch] = useReducer(editReducer, initialState);
  const {
    existingProducts,
    newCatalogProducts,
    newProductExtras,
    customProducts,
    discount,
    shippingType,
    configuredShipping,
    catalog,
    formKey,
    loadingCatalog,
    saving,
  } = state;

  const { showToast } = useContext(ToastContext);
  const router = useRouter();

  // Load catalog & reset form on open
  useEffect(() => {
    if (!isOpen) return;
    dispatch({ type: "OPEN", quoter });

    ProductRepository.instance()
      .getProducts()
      .then((res: any) => {
        if (res.success) dispatch({ type: "SET_CATALOG", payload: res.products || [] });
      })
      .catch(() => {})
      .finally(() => dispatch({ type: "SET_LOADING_CATALOG", payload: false }));

    import("@/data/settings.repository")
      .then(({ SettingsRepository }) => SettingsRepository.instance().getSettings())
      .then((data: any) => {
        if (data.success) dispatch({ type: "SET_CONFIGURED_SHIPPING", payload: data.settings.shippingCost });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const totalCalculate = useMemo(() => {
    const existingTotal = existingProducts.reduce((acc, p) => {
      const extrasT = p.extras?.reduce((a, e) => a + e.price * e.amount, 0) ?? 0;
      return acc + (p.price ?? 0) * (p.amount ?? 0) + extrasT;
    }, 0);
    const newTotal = newCatalogProducts.reduce((acc, p) => {
      const extrasT = p.extras?.reduce((a, e) => a + e.price * e.amount, 0) ?? 0;
      return acc + (p.price ?? 0) * (p.amount ?? 0) + extrasT;
    }, 0);
    const customTotal = customProducts.reduce((acc, c) => acc + c.price * c.amount, 0);
    const subtotal = existingTotal + newTotal + customTotal;
    const afterDiscount = subtotal - (subtotal * discount) / 100;
    return afterDiscount + (shippingType === 'PAKET' ? configuredShipping : 0);
  }, [existingProducts, newCatalogProducts, customProducts, discount, shippingType, configuredShipping]);

  const handleSave = async () => {
    // Normalize existing products: product must be ID string for DB
    const allProducts = [
      ...existingProducts.map((p) => ({
        ...p,
        product: typeof p.product === "object" ? (p.product as ProductDoc)._id : p.product,
      })),
      ...newCatalogProducts,
    ];

    dispatch({ type: "SET_SAVING", payload: true });
    try {
      const res = await QuoterRepository.instance().editQuoter(quoter._id!, {
        products: allProducts,
        customProducts,
        discount,
        shippingType,
        shippingCost: shippingType === 'PAKET' ? configuredShipping : 0,
        totalAmount: totalCalculate,
      });

      if (res.success) {
        showToast(true, `Cotización #${quoter.quoterNumber} actualizada`);
        router.refresh();
        onClose();
      } else {
        showToast(false, res.message || "Error al actualizar");
      }
    } catch {
      showToast(false, "Error al actualizar cotización");
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  };

  const totalCatalogProducts = existingProducts.length + newCatalogProducts.length;

  return (
    <Modal size="3xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-0.5">
          <span>Editar Cotización #{quoter.quoterNumber}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {quoter.artist}
          </span>
        </ModalHeader>

        <ModalBody className="gap-5">
          {/* ── Catálogo ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Productos del catálogo ({totalCatalogProducts})
              </h3>
              <Button
                size="sm"
                color="success"
                variant="flat"
                onPress={() => dispatch({ type: "ADD_NEW_CATALOG" })}
                startContent={<PlusIcon className="h-4 w-4" />}
                isDisabled={loadingCatalog}
              >
                Agregar
              </Button>
            </div>

            {loadingCatalog ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" label="Cargando catálogo..." />
              </div>
            ) : (
              <div className="space-y-2">
                {existingProducts.map((p, idx) => (
                  <ExistingProductRow
                    key={`existing-${formKey}-${idx}`}
                    product={p}
                    index={idx}
                    onAmountChange={(amount) =>
                      dispatch({ type: "SET_EXISTING_AMOUNT", index: idx, amount })
                    }
                    onRemove={() => dispatch({ type: "REMOVE_EXISTING", index: idx })}
                  />
                ))}

                {newCatalogProducts.map((_, idx) => (
                  <div key={`new-${formKey}-${idx}`}>
                    <ProductForm
                      index={idx}
                      products={catalog}
                      productQuoters={newCatalogProducts}
                      setProductQuoters={(v) =>
                        dispatch({ type: "SET_NEW_CATALOG", payload: v })
                      }
                      onExtrasUpdate={(i, extras) =>
                        dispatch({ type: "SET_NEW_EXTRAS", index: i, extras })
                      }
                    />
                    {newCatalogProducts[idx]?.extras?.length > 0 && (
                      <ExtraProducts
                        index={idx}
                        availableExtras={newProductExtras[idx] || []}
                        productQuoters={newCatalogProducts}
                        setProductQuoters={(v) =>
                          dispatch({ type: "SET_NEW_CATALOG", payload: v })
                        }
                      />
                    )}
                  </div>
                ))}

                {totalCatalogProducts === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Sin productos del catálogo
                  </p>
                )}
              </div>
            )}
          </div>

          <Divider />

          {/* ── Personalizados ───────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Productos personalizados ({customProducts.length})
              </h3>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={() => dispatch({ type: "ADD_CUSTOM" })}
                startContent={<SparklesIcon className="h-4 w-4" />}
              >
                Agregar
              </Button>
            </div>

            <div className="space-y-2">
              {customProducts.map((_, idx) => (
                <CustomProductForm
                  key={`custom-${formKey}-${idx}`}
                  index={idx}
                  customProducts={customProducts}
                  setCustomProducts={(v) => dispatch({ type: "SET_CUSTOM", payload: v })}
                />
              ))}
              {customProducts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Sin productos personalizados
                </p>
              )}
            </div>
          </div>

          <Divider />

          {/* ── Tipo de entrega ───────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tipo de entrega</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SHIPPING_OPTIONS.map((opt) => (
                <button
                  key={String(opt.key)}
                  type="button"
                  onClick={() => dispatch({ type: "SET_SHIPPING_TYPE", payload: opt.key })}
                  className={`text-xs px-2 py-2 rounded border transition-colors ${
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

          <Divider />

          {/* ── Descuento ─────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
              Descuento (%)
            </label>
            <Input
              type="number"
              size="sm"
              variant="bordered"
              className="max-w-30"
              value={discount.toString()}
              min="0"
              max="100"
              step="0.01"
              onChange={(e) =>
                dispatch({
                  type: "SET_DISCOUNT",
                  payload: Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 100),
                })
              }
            />
            {shippingType && (
              <span className="text-xs text-blue-500 dark:text-blue-400">
                + {shippingType === 'PAKET' ? `PAKET ${formatCurrency(configuredShipping)}` : SHIPPING_LABELS[shippingType]}
              </span>
            )}
          </div>

          {/* ── Total ─────────────────────────────────────────── */}
          <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total estimado</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalCalculate)}
            </span>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={saving}>
            Cancelar
          </Button>
          <Button color="primary" isLoading={saving} onPress={handleSave}>
            Guardar cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
