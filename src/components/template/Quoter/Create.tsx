"use client";
import { Product, ProductPrice } from "@/entities/Product";
import { ProductsQuoter, CustomProduct, ShippingType, SHIPPING_LABELS, SHIPPING_OPTIONS } from "@/entities/Quoter";
import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { Controller, useForm } from "react-hook-form";
import { Button, Input, DatePicker, Spinner } from "@heroui/react";
import { PlusIcon, SparklesIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { QuoterRepository } from "@/data/quoter.repository";
import { SettingsRepository } from "@/data/settings.repository";
import { ProductForm } from "./components/ProductForm";
import { ExtraProducts } from "./components/ExtraProducts";
import { CustomProductForm } from "./components/CustomProductForm";
import { TotalAmount } from "./components/TotalAmount";
import formatCurrency from "@/utils/formatCurrency";

interface ICreateQuoterProps {
  initialProducts: Product[];
}

// ── Reducer ────────────────────────────────────────────────────────────────────
const emptyProduct: ProductsQuoter = {
  amount: 0,
  price: 0,
  isFinished: false,
  extras: [],
  product: "",
  productType: { description: "", price: 0 },
};

type QuoterFormState = {
  productQuoters: ProductsQuoter[];
  customProducts: CustomProduct[];
  availableExtras: Record<number, ProductPrice[]>;
  discount: number;
  shippingType: ShippingType | null;
  shippingCost: number;
  /** Incremented on RESET to force remount of child form components */
  formKey: number;
};

type QuoterFormAction =
  | { type: "SET_PRODUCT_QUOTERS"; payload: ProductsQuoter[] }
  | { type: "ADD_PRODUCT" }
  | { type: "SET_CUSTOM_PRODUCTS"; payload: CustomProduct[] }
  | { type: "ADD_CUSTOM_PRODUCT" }
  | { type: "SET_EXTRAS"; index: number; extras: ProductPrice[] }
  | { type: "SET_DISCOUNT"; payload: number }
  | { type: "SET_SHIPPING_TYPE"; payload: ShippingType | null }
  | { type: "SET_SHIPPING_COST"; payload: number }
  | { type: "RESET" };

const initialFormState: QuoterFormState = {
  productQuoters: [{ ...emptyProduct }],
  customProducts: [],
  availableExtras: {},
  discount: 0,
  shippingType: null,
  shippingCost: 0,
  formKey: 0,
};

function quoterFormReducer(state: QuoterFormState, action: QuoterFormAction): QuoterFormState {
  switch (action.type) {
    case "SET_PRODUCT_QUOTERS":
      return { ...state, productQuoters: action.payload };
    case "ADD_PRODUCT":
      return { ...state, productQuoters: [...state.productQuoters, { ...emptyProduct }] };
    case "SET_CUSTOM_PRODUCTS":
      return { ...state, customProducts: action.payload };
    case "ADD_CUSTOM_PRODUCT":
      return {
        ...state,
        customProducts: [...state.customProducts, { description: "", price: 0, amount: 1 }],
      };
    case "SET_EXTRAS":
      return { ...state, availableExtras: { ...state.availableExtras, [action.index]: action.extras } };
    case "SET_DISCOUNT":
      return { ...state, discount: action.payload };
    case "SET_SHIPPING_TYPE":
      return { ...state, shippingType: action.payload };
    case "SET_SHIPPING_COST":
      return { ...state, shippingCost: action.payload };
    case "RESET":
      // Preserve shippingCost from settings; increment formKey to force remount of child components
      return { ...initialFormState, shippingCost: state.shippingCost, formKey: state.formKey + 1 };
    default:
      return state;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CreateQuoter({
  initialProducts,
}: ICreateQuoterProps) {
  const { showToast } = useContext(ToastContext);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      totalAmount: 0,
      artist: "",
      dateLimit: "",
      discount: 0,
    },
  });

  const [formState, dispatch] = useReducer(quoterFormReducer, initialFormState);
  const { productQuoters, customProducts, availableExtras, discount, shippingType, shippingCost, formKey } = formState;
  const [ui, setUI] = useState<{ isLoading: boolean; savedQuoterNumber: number | null }>({
    isLoading: false,
    savedQuoterNumber: null,
  });

  // Fetch shipping cost from settings
  useEffect(() => {
    SettingsRepository.instance()
      .getSettings()
      .then((data) => {
        if (data.success) {
          dispatch({ type: "SET_SHIPPING_COST", payload: data.settings.shippingCost ?? 0 });
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = useMemo(() => {
    const catalogTotal = productQuoters.reduce((acc, item) => {
      if (!item) return acc;
      const extrasTotal = item.extras.reduce((a, e) => a + e.price * e.amount, 0);
      return acc + (item.price ?? 0) * (item.amount ?? 0) + extrasTotal;
    }, 0);
    const customTotal = customProducts.reduce((acc, item) => acc + item.price * item.amount, 0);
    return catalogTotal + customTotal;
  }, [productQuoters, customProducts]);

  const totalCalculate = useMemo(() => {
    const afterDiscount = subtotal - (subtotal * discount) / 100;
    return afterDiscount + (shippingType === 'PAKET' ? shippingCost : 0);
  }, [subtotal, discount, shippingType, shippingCost]);

  const saveQuoter = async (data: any) => {
    try {
      setUI((prev) => ({ ...prev, isLoading: true }));
      const payload = {
        totalAmount: totalCalculate,
        artist: data.artist,
        dateLimit: data.dateLimit,
        products: productQuoters,
        customProducts,
        discount,
        shippingCost: shippingType === 'PAKET' ? shippingCost : 0,
        shippingType: shippingType ?? null,
      };
      const repository = QuoterRepository.instance();
      const { success, quoterNumber } = await repository.saveQuoter(payload);
      if (!success) {
        showToast(false, "Ocurrió un error al guardar la cotización");
        return;
      }
      showToast(true, `Cotización #${quoterNumber} guardada correctamente`);
      setUI({ isLoading: false, savedQuoterNumber: quoterNumber });
      reset();
      dispatch({ type: "RESET" });
    } catch (error) {
      console.error("Error save quoter: ", error);
      showToast(false, "Error al guardar la cotización");
    } finally {
      setUI((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleAddProduct = () => dispatch({ type: "ADD_PRODUCT" });
  const handleAddCustomProduct = () => dispatch({ type: "ADD_CUSTOM_PRODUCT" });
  const handleExtrasUpdate = (index: number, extras: ProductPrice[]) =>
    dispatch({ type: "SET_EXTRAS", index, extras });
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), 100);
    dispatch({ type: "SET_DISCOUNT", payload: value });
  };

  return (
    <div className="px-0 sm:px-4 pt-4 sm:pt-6 pb-28 lg:pb-8">
      <h1 className="text-xl sm:text-2xl text-gray-900 dark:text-white font-bold mb-4 sm:mb-6">Cotizador</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
        {/* Formulario principal */}
        <div className="flex flex-col bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="space-y-4 sm:space-y-6">
            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(saveQuoter)}>
            {/* Datos de Cotización */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1 sm:w-1.5 h-5 sm:h-6 bg-blue-500 rounded-full"></span>
                Datos de Cotización
              </h2>
              
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-2">
                  <label
                    htmlFor="artist"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                  >
                    Artista (nombre y email) <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="artist"
                    control={control}
                    defaultValue={""}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="text"
                        variant="bordered"
                        placeholder="Ej: Juan Pérez - juan@email.com"
                        classNames={{
                          inputWrapper: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                        }}
                        isRequired
                      />
                    )}
                  />
                </div>
                <div>
                  <label
                    htmlFor="discount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                  >
                    Descuento (%)
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    placeholder="0"
                    classNames={{
                      inputWrapper: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                    }}
                    value={discount.toString()}
                    min="0"
                    max="100"
                    step="0.01"
                    onChange={handleDiscountChange}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 mt-3 sm:mt-4">
                <div>
                  <label
                    htmlFor="dateLimit"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2"
                  >
                    Fecha Entrega (opcional)
                  </label>
                  <Controller
                    name="dateLimit"
                    control={control}
                    defaultValue={""}
                    render={({ field }) => (
                      <DatePicker
                        variant="bordered"
                        label="Fecha de entrega"
                        classNames={{
                          inputWrapper: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                        }}
                        onChange={(date) => {
                          field.onChange(date ? date.toString() : "");
                        }}
                      />
                    )}
                  />
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 p-3 sm:p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de entrega</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SHIPPING_OPTIONS.map((opt) => (
                      <button
                        key={String(opt.key)}
                        type="button"
                        onClick={() => dispatch({ type: "SET_SHIPPING_TYPE", payload: opt.key })}
                        className={`text-left p-2.5 rounded-lg border transition-colors ${
                          shippingType === opt.key
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <p className={`text-xs font-medium ${shippingType === opt.key ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {opt.hasCost ? (shippingCost > 0 ? formatCurrency(shippingCost) : "Sin costo configurado") : "Sin costo"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-1 sm:w-1.5 h-5 sm:h-6 bg-green-500 rounded-full"></span>
                  Productos ({productQuoters.length})
                </h2>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    color="secondary"
                    variant="shadow"
                    size="sm"
                    onPress={handleAddCustomProduct}
                    startContent={<SparklesIcon className="h-4 w-4" />}
                    className="w-full sm:w-auto text-sm"
                  >
                    <span className="sm:hidden">Personalizado</span>
                    <span className="hidden sm:inline">Producto Personalizado</span>
                  </Button>
                  <Button
                    type="button"
                    color="success"
                    variant="shadow"
                    size="sm"
                    onPress={handleAddProduct}
                    startContent={<PlusIcon className="h-4 w-4" />}
                    className="w-full sm:w-auto text-sm"
                  >
                    <span className="sm:hidden">Catálogo</span>
                    <span className="hidden sm:inline">Producto del Catálogo</span>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {productQuoters.map((item, index) => (
                  <div key={`${formKey}-${index}`}>
                    <ProductForm
                      index={index}
                      products={initialProducts}
                      productQuoters={productQuoters}
                      setProductQuoters={(v) => dispatch({ type: "SET_PRODUCT_QUOTERS", payload: v })}
                      onExtrasUpdate={handleExtrasUpdate}
                    />
                    {productQuoters[index].extras.length > 0 && (
                      <ExtraProducts
                        index={index}
                        availableExtras={availableExtras[index] || []}
                        productQuoters={productQuoters}
                        setProductQuoters={(v) => dispatch({ type: "SET_PRODUCT_QUOTERS", payload: v })}
                      />
                    )}
                  </div>
                ))}

                {/* Custom Products */}
                {customProducts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-purple-400 mb-3 flex items-center gap-2">
                      <SparklesIcon className="h-5 w-5" />
                      Productos Personalizados ({customProducts.length})
                    </h3>
                    {customProducts.map((_, index) => (
                      <CustomProductForm
                        key={`${formKey}-${index}`}
                        index={index}
                        customProducts={customProducts}
                        setCustomProducts={(v) => dispatch({ type: "SET_CUSTOM_PRODUCTS", payload: v })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                <span className="text-red-500">*</span> Campos obligatorios
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                {ui.savedQuoterNumber && (
                  <Button
                    as="a"
                    href={`/api/quoter/${ui.savedQuoterNumber}/pdf`}
                    target="_blank"
                    color="primary"
                    size="lg"
                    variant="shadow"
                    startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
                    className="font-semibold w-full sm:w-auto"
                  >
                    Descargar Cotización #{ui.savedQuoterNumber}
                  </Button>
                )}
                <Button
                  type="submit"
                  color="success"
                  size="lg"
                  variant="shadow"
                  isLoading={ui.isLoading}
                  className="font-semibold w-full sm:w-auto"
                  onPress={() => setUI((prev) => ({ ...prev, savedQuoterNumber: null }))}
                >
                  {ui.savedQuoterNumber ? "Nueva Cotización" : "Guardar Cotización"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Panel de Total - Sticky (Desktop) */}
      <div className="hidden lg:block">
        <TotalAmount subtotal={subtotal} discount={discount} totalCalculate={totalCalculate} shippingCost={shippingType === 'PAKET' ? shippingCost : 0} shippingLabel={shippingType ? SHIPPING_LABELS[shippingType] : undefined} />
      </div>
      
      {/* Total móvil - Fixed bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-20 shadow-lg dark:shadow-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Desc. ({discount}%):</span>
                <span className="text-red-500 dark:text-red-400">-{formatCurrency((subtotal * discount) / 100)}</span>
              </div>
            )}
            {shippingType && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{SHIPPING_LABELS[shippingType]}:</span>
                <span className="text-gray-900 dark:text-white">
                  {shippingType === 'PAKET' && shippingCost > 0 ? formatCurrency(shippingCost) : 'Sin costo'}
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-xs text-gray-500 dark:text-gray-400">Total</span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCalculate)}</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
