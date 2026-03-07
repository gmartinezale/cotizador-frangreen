"use client";
import { ChangeEvent } from "react";
import { CustomProduct } from "@/entities/Quoter";
import { Card, CardHeader, CardBody, Divider, Chip, Button, Input } from "@heroui/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import formatCurrency from "@/utils/formatCurrency";

interface CustomProductFormProps {
  index: number;
  customProducts: CustomProduct[];
  setCustomProducts: (products: CustomProduct[]) => void;
}

export function CustomProductForm({
  index,
  customProducts,
  setCustomProducts,
}: CustomProductFormProps) {
  const currentProduct = customProducts[index];

  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const updatedProducts = [...customProducts];
    updatedProducts[index].description = e.target.value;
    setCustomProducts(updatedProducts);
  };

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    const updatedProducts = [...customProducts];
    updatedProducts[index].price = price;
    setCustomProducts(updatedProducts);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(e.target.value) || 0;
    const updatedProducts = [...customProducts];
    updatedProducts[index].amount = amount;
    setCustomProducts(updatedProducts);
  };

  const handleRemove = () => {
    const updatedProducts = [...customProducts];
    updatedProducts.splice(index, 1);
    setCustomProducts(updatedProducts);
  };

  const subtotal = currentProduct?.price && currentProduct?.amount 
    ? currentProduct.price * currentProduct.amount 
    : 0;

  return (
    <Card className="mt-3 sm:mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50">
      <CardHeader className="flex justify-between items-center pb-2 sm:pb-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Chip size="sm" color="secondary" variant="flat">
            Personalizado #{index + 1}
          </Chip>
          {subtotal > 0 && (
            <Chip size="sm" color="success" variant="flat">
              Subtotal: {formatCurrency(subtotal)}
            </Chip>
          )}
        </div>
        <Button
          size="sm"
          color="danger"
          variant="light"
          isIconOnly
          onPress={handleRemove}
          aria-label="Eliminar producto personalizado"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <Divider className="bg-purple-200 dark:bg-purple-700/50" />
      <CardBody className="gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4">
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            Descripción <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            variant="bordered"
            placeholder="Descripción del producto"
            classNames={{
              inputWrapper: "bg-white dark:bg-gray-900/50 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500",
            }}
            value={currentProduct?.description || ""}
            isRequired
            onChange={handleDescriptionChange}
          />
        </div>

        {/* Precio y Cantidad */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Precio <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              variant="bordered"
              placeholder="0.00"
              classNames={{
                inputWrapper: "bg-white dark:bg-gray-900/50 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500",
              }}
              value={currentProduct?.price?.toString() || "0"}
              isRequired
              min="0"
              step="0.01"
              onChange={handlePriceChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              variant="bordered"
              placeholder="0"
              classNames={{
                inputWrapper: "bg-white dark:bg-gray-900/50 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500",
              }}
              value={currentProduct?.amount?.toString() || "0"}
              isRequired
              min="1"
              onChange={handleAmountChange}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
