"use client";
import { ChangeEvent, useState } from "react";
import { Product, ProductPrice, ProductType } from "@/entities/Product";
import { ProductsQuoter } from "@/entities/Quoter";
import { Select, SelectItem, Input, Card, CardHeader, CardBody, Divider, Chip, Button } from "@heroui/react";
import { DocumentPlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import formatCurrency from "@/utils/formatCurrency";

interface ProductFormProps {
  index: number;
  products: Product[];
  productQuoters: ProductsQuoter[];
  setProductQuoters: (products: ProductsQuoter[]) => void;
  onExtrasUpdate: (index: number, extras: ProductPrice[]) => void;
}

export function ProductForm({
  index,
  products,
  productQuoters,
  setProductQuoters,
  onExtrasUpdate,
}: ProductFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [localAvailableExtras, setLocalAvailableExtras] = useState<ProductPrice[]>([]);

  const changeProductSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    try {
      const productId = e.target.value;
      if (!productId) return;

      const product = products.find((p) => p._id === productId);

      if (!product) return;

      setSelectedProduct(product);
      setSelectedType(null);
      setLocalAvailableExtras([]);

      const updatedProducts = [...productQuoters];
      updatedProducts[index].product = productId;
      updatedProducts[index].productType = undefined as any;
      updatedProducts[index].productFinish = undefined;
      updatedProducts[index].price = 0;
      updatedProducts[index].extras = [];
      setProductQuoters(updatedProducts);
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  const handleChangeType = (e: ChangeEvent<HTMLSelectElement>) => {
    const typeIndex = parseInt(e.target.value);
    
    if (!selectedProduct || isNaN(typeIndex)) return;

    const type = selectedProduct.types[typeIndex];
    if (!type) return;

    setSelectedType(type);

    // Combinar extras del tipo + extras generales del producto
    const typeExtras = type.extras || [];
    const generalExtras = selectedProduct.extras || [];
    const allExtras = [...typeExtras, ...generalExtras];
    setLocalAvailableExtras(allExtras);
    
    // Actualizar extras disponibles en el padre
    onExtrasUpdate(index, allExtras);

    const updatedProducts = [...productQuoters];
    updatedProducts[index].productType = {
      description: type.description,
      price: type.price || 0,
    };
    updatedProducts[index].productFinish = undefined;
    
    // Si el tipo tiene precio directo y no tiene acabados, usar ese precio
    if (type.price !== undefined && (!type.finishes || type.finishes.length === 0)) {
      updatedProducts[index].price = type.price;
    } else {
      updatedProducts[index].price = 0;
    }
    
    updatedProducts[index].extras = [];
    setProductQuoters(updatedProducts);
  };

  const handleChangeFinish = (e: ChangeEvent<HTMLSelectElement>) => {
    const finishIndex = parseInt(e.target.value);
    
    if (!selectedType || isNaN(finishIndex)) return;

    const finish = selectedType.finishes?.[finishIndex];
    if (!finish) return;

    const updatedProducts = [...productQuoters];
    updatedProducts[index].productFinish = {
      description: finish.description,
      price: finish.price,
    };
    updatedProducts[index].price = finish.price;
    setProductQuoters(updatedProducts);
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(e.target.value) || 0;
    const updatedProducts = [...productQuoters];
    updatedProducts[index].amount = amount;
    setProductQuoters(updatedProducts);
  };

  const handleAddExtra = () => {
    const updatedProducts = [...productQuoters];
    updatedProducts[index].extras?.push({
      description: "",
      price: 0,
      amount: 0,
    });
    setProductQuoters(updatedProducts);
  };

  const handleRemoveProduct = () => {
    const updatedProducts = [...productQuoters];
    updatedProducts.splice(index, 1);
    setProductQuoters(updatedProducts);
  };

  const hasFinishes = selectedType && selectedType.finishes && selectedType.finishes.length > 0;
  const currentProduct = productQuoters[index];
  const subtotal = currentProduct?.price && currentProduct?.amount 
    ? currentProduct.price * currentProduct.amount 
    : 0;

  return (
    <Card className="mt-3 sm:mt-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex justify-between items-center pb-2 sm:pb-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Chip size="sm" color="primary" variant="flat">
            Producto #{index + 1}
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
          onPress={handleRemoveProduct}
          aria-label="Eliminar producto"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <Divider className="bg-gray-200 dark:bg-gray-700" />
      <CardBody className="gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4">
        {/* Selección de Producto y Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Producto <span className="text-red-500">*</span>
            </label>
            <Select
              variant="bordered"
              placeholder="Seleccione un producto"
              classNames={{
                trigger: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
              }}
              isRequired
              onChange={(e) => {
                const mockEvent = {
                  target: { value: e.target.value }
                } as ChangeEvent<HTMLSelectElement>;
                changeProductSelect(mockEvent);
              }}
            >
              {products.map((product) => (
                <SelectItem key={product._id}>
                  {product.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Tipo <span className="text-red-500">*</span>
            </label>
            <Select
              variant="bordered"
              placeholder="Seleccione un tipo"
              classNames={{
                trigger: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
              }}
              isRequired
              isDisabled={!selectedProduct}
              onChange={(e) => {
                const mockEvent = {
                  target: { value: e.target.value }
                } as ChangeEvent<HTMLSelectElement>;
                handleChangeType(mockEvent);
              }}
            >
              {selectedProduct?.types?.map((type, typeIndex) => (
                <SelectItem key={typeIndex.toString()}>
                  {type.description}
                </SelectItem>
              )) || []}
            </Select>
          </div>
        </div>

        {/* Acabado y Cantidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {hasFinishes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Acabado <span className="text-red-500">*</span>
              </label>
              <Select
                variant="bordered"
                placeholder="Seleccione un acabado"
                classNames={{
                  trigger: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                }}
                isRequired
                onChange={(e) => {
                  const mockEvent = {
                    target: { value: e.target.value }
                  } as ChangeEvent<HTMLSelectElement>;
                  handleChangeFinish(mockEvent);
                }}
              >
                {(selectedType?.finishes || []).map((finish, finishIndex) => (
                  <SelectItem key={finishIndex.toString()} textValue={finish.description}>
                    {finish.description} - {formatCurrency(finish.price)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          <div className={hasFinishes ? "" : "sm:col-span-1"}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              variant="bordered"
              placeholder="Ingrese cantidad"
              classNames={{
                inputWrapper: "bg-white dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
              }}
              value={currentProduct?.amount?.toString() || "0"}
              isRequired
              min="1"
              onChange={handleAmountChange}
            />
          </div>
        </div>

        {/* Botón para agregar extras */}
        {localAvailableExtras.length > 0 && (
          <div className="mt-1 sm:mt-2">
            <Divider className="bg-gray-200 dark:bg-gray-700 mb-3 sm:mb-4" />
            <Button
              color="success"
              variant="flat"
              size="sm"
              startContent={<DocumentPlusIcon className="h-4 w-4" />}
              onPress={handleAddExtra}
              className="w-full sm:w-auto"
            >
              Agregar Extra
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
              {localAvailableExtras.length} extra{localAvailableExtras.length !== 1 ? 's' : ''} disponible{localAvailableExtras.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
