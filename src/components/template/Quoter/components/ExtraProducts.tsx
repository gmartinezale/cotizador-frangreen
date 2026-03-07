"use client";
import { ChangeEvent } from "react";
import { ProductsQuoter } from "@/entities/Quoter";
import { Card, CardHeader, CardBody, Select, SelectItem, Input, Divider, Chip, Button } from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProductPrice } from "@/entities/Product";
import formatCurrency from "@/utils/formatCurrency";

interface ExtraProductsProps {
  index: number;
  availableExtras: ProductPrice[]; // Extras disponibles (del tipo + generales)
  productQuoters: ProductsQuoter[];
  setProductQuoters: (products: ProductsQuoter[]) => void;
}

export function ExtraProducts({
  index,
  availableExtras,
  productQuoters,
  setProductQuoters,
}: ExtraProductsProps) {
  const handleAddExtra = () => {
    const updatedProducts = [...productQuoters];
    updatedProducts[index].extras?.push({
      description: "",
      price: 0,
      amount: 0,
    });
    setProductQuoters(updatedProducts);
  };

  const handleExtraChange = (
    e: ChangeEvent<HTMLSelectElement>,
    extraIndex: number,
  ) => {
    const selectedValue = e.target.value;
    const selectedExtra = availableExtras.find(
      (extra) => `${extra.description}-${extra.price}` === selectedValue
    );
    
    if (!selectedExtra) return;

    const updatedProducts = [...productQuoters];
    updatedProducts[index].extras[extraIndex].price = selectedExtra.price;
    updatedProducts[index].extras[extraIndex].description = selectedExtra.description;
    setProductQuoters(updatedProducts);
  };

  const handleExtraAmountChange = (
    e: ChangeEvent<HTMLInputElement>,
    extraIndex: number,
  ) => {
    const amount = parseInt(e.target.value) || 0;
    const updatedProducts = [...productQuoters];
    updatedProducts[index].extras[extraIndex].amount = amount;
    setProductQuoters(updatedProducts);
  };

  const handleRemoveExtra = (extraIndex: number) => {
    const updatedProducts = [...productQuoters];
    updatedProducts[index].extras.splice(extraIndex, 1);
    setProductQuoters(updatedProducts);
  };

  const totalExtras = productQuoters[index].extras.reduce(
    (acc, extra) => acc + (extra.price * extra.amount),
    0
  );

  return (
    <Card className="mt-2 sm:mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50">
      <CardHeader className="flex justify-between items-center pb-2 sm:pb-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Chip size="sm" color="secondary" variant="flat">
            Extras
          </Chip>
          {totalExtras > 0 && (
            <Chip size="sm" color="success" variant="flat">
              Total: {formatCurrency(totalExtras)}
            </Chip>
          )}
        </div>
      </CardHeader>
      <Divider className="bg-indigo-200 dark:bg-indigo-700/30" />
      <CardBody className="gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4">
        {productQuoters[index].extras?.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">
            No hay extras agregados
          </p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {productQuoters[index].extras?.map((extra, extraIndex) => (
              <div
                key={`extra-${extraIndex}`}
                className="p-3 bg-white dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Mobile Layout */}
                <div className="flex flex-col gap-3 sm:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Extra <span className="text-red-500">*</span>
                      </label>
                      <Select
                        variant="bordered"
                        placeholder="Seleccione"
                        size="sm"
                        classNames={{
                          trigger: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600",
                        }}
                        selectedKeys={extra.description && extra.price ? [`${extra.description}-${extra.price}`] : []}
                        onChange={(e) => {
                          const mockEvent = {
                            target: { value: e.target.value }
                          } as ChangeEvent<HTMLSelectElement>;
                          handleExtraChange(mockEvent, extraIndex);
                        }}
                      >
                        {availableExtras?.map((extraOption) => (
                          <SelectItem
                            key={`${extraOption.description}-${extraOption.price}`}
                            textValue={extraOption.description}
                          >
                            {extraOption.description} - {formatCurrency(extraOption.price)}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      isIconOnly
                      onPress={() => handleRemoveExtra(extraIndex)}
                      className="mt-5"
                      aria-label="Eliminar extra"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Cantidad <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        variant="bordered"
                        size="sm"
                        placeholder="0"
                        classNames={{
                          inputWrapper: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600",
                        }}
                        value={extra.amount?.toString() || "0"}
                        min="1"
                        isRequired
                        onChange={(e) => handleExtraAmountChange(e, extraIndex)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        Subtotal
                      </label>
                      <div className="h-8 flex items-center px-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(extra.price * extra.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Extra <span className="text-red-500">*</span>
                    </label>
                    <Select
                      variant="bordered"
                      placeholder="Seleccione extra"
                      size="sm"
                      classNames={{
                        trigger: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                      }}
                      selectedKeys={extra.description && extra.price ? [`${extra.description}-${extra.price}`] : []}
                      onChange={(e) => {
                        const mockEvent = {
                          target: { value: e.target.value }
                        } as ChangeEvent<HTMLSelectElement>;
                        handleExtraChange(mockEvent, extraIndex);
                      }}
                    >
                      {availableExtras?.map((extraOption) => (
                        <SelectItem
                          key={`${extraOption.description}-${extraOption.price}`}
                          textValue={extraOption.description}
                        >
                          {extraOption.description} - {formatCurrency(extraOption.price)}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Cantidad <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      variant="bordered"
                      size="sm"
                      placeholder="0"
                      classNames={{
                        inputWrapper: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                      }}
                      value={extra.amount?.toString() || "0"}
                      min="1"
                      isRequired
                      onChange={(e) => handleExtraAmountChange(e, extraIndex)}
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Subtotal
                    </label>
                    <div className="h-8 flex items-center px-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(extra.price * extra.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      isIconOnly
                      onPress={() => handleRemoveExtra(extraIndex)}
                      aria-label="Eliminar extra"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
