"use client";

import { Quoter } from "@/entities/Quoter";
import { ProductDoc } from "@/entities/Product";
import formatCurrency from "@/utils/formatCurrency";

interface ModalDetailQuoterProps {
  quoter: Quoter;
}

function resolveMultiplier(product: Quoter["products"][number]): number {
  if (product.multiplier && product.multiplier > 1) return product.multiplier;
  const doc = product.product;
  if (typeof doc === "object" && doc !== null) {
    const types = (doc as any).types as Array<{ description: string; multiplier?: number }> | undefined;
    const matched = types?.find((t) => t.description === product.productType?.description);
    if (matched?.multiplier && matched.multiplier > 1) return matched.multiplier;
  }
  return 1;
}

export default function ModalDetailQuoter({ quoter }: ModalDetailQuoterProps) {
  const getProductName = (product: string | ProductDoc): string => {
    if (typeof product === "object" && product !== null) {
      return product.name || "";
    }
    return String(product);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Artista</p>
          <p className="text-gray-900 dark:text-white font-semibold">{quoter.artist}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-green-600 dark:text-green-400 font-semibold text-xl">
            {formatCurrency(quoter.totalAmount)}
          </p>
        </div>
      </div>

      {/* Productos del Catálogo */}
      {quoter.products && quoter.products.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Productos del Catálogo</h4>
          {quoter.products.map((product, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Producto</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {getProductName(product.product)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Cantidad</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{product.amount}</p>
                  {resolveMultiplier(product) > 1 && (
                    <p className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                      {product.amount * resolveMultiplier(product)} uds.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Tipo</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {product.productType?.description || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Precio unitario</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </div>

              {product.productFinish && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Acabado</p>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {product.productFinish.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Subtotal</p>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {formatCurrency(product.price * product.amount)}
                    </p>
                  </div>
                </div>
              )}

              {product.extras && product.extras.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <h5 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Extras
                  </h5>
                  {product.extras.map((extra, extraIndex) => (
                    <div
                      key={extraIndex}
                      className="flex justify-between items-center mb-2"
                    >
                      <p className="text-gray-700 dark:text-gray-300">
                        {extra.description} x{extra.amount}
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatCurrency(extra.price * extra.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Productos Personalizados */}
      {quoter.customProducts && quoter.customProducts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-purple-600 dark:text-purple-400">Productos Personalizados</h4>
          {quoter.customProducts.map((product, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Descripción</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{product.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Cantidad</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{product.amount}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Precio unitario</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(product.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Subtotal</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatCurrency(product.price * product.amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
