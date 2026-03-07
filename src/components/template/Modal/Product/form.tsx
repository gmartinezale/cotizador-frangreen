// Product form component using react-hook-form
import { ProductRepository } from "@/data/products.repository";
import { Button, Input, Spinner, Tabs, Tab, Card, CardBody, Accordion, AccordionItem } from "@heroui/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, Control, UseFormWatch } from "react-hook-form";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { MinusIcon, PlusIcon, TrashIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface IFormProductProps {
  closeProductFormModal: (update: boolean) => void;
  name?: string;
  id?: string;
}

interface ProductPrice {
  _id?: string;
  description: string;
  price: number;
}

interface ProductType {
  _id?: string;
  description: string;
  price?: number;
  finishes?: ProductPrice[];
  extras?: ProductPrice[];
}

interface ProductFormData {
  id: string;
  name: string;
  stock?: number;
  minPurchase?: number;
  types: ProductType[];
  extras: ProductPrice[]; // Extras generales del producto
}

// Componente separado para manejar los field arrays anidados de cada tipo
function TypeFieldsSection({ 
  typeIndex, 
  control,
  watch,
  removeType,
  copyType 
}: { 
  typeIndex: number;
  control: Control<ProductFormData>;
  watch: UseFormWatch<ProductFormData>;
  removeType: (index: number) => void;
  copyType: (index: number) => void;
}) {
  const { fields: finishFields, append: appendFinish, remove: removeFinish } = useFieldArray({
    control,
    name: `types.${typeIndex}.finishes` as const,
  });

  const { fields: extraFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control,
    name: `types.${typeIndex}.extras` as const,
  });

  const hasFinishes = (watch(`types.${typeIndex}.finishes`) || []).length > 0;

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          color="primary"
          variant="light"
          onPress={() => copyType(typeIndex)}
          startContent={<DocumentDuplicateIcon className="h-4 w-4" />}
        >
          Copiar tipo
        </Button>
        <Button
          type="button"
          size="sm"
          color="danger"
          variant="light"
          onPress={() => removeType(typeIndex)}
          startContent={<TrashIcon className="h-4 w-4" />}
        >
          Eliminar este tipo
        </Button>
      </div>
      
      <Controller
        name={`types.${typeIndex}.description`}
        control={control}
        rules={{ required: "La descripción es requerida" }}
        render={({ field, fieldState }) => (
          <Input
            {...field}
            label="Nombre del Tipo"
            type="text"
            placeholder="Ej: Talla S, Material Algodón"
            variant="bordered"
            isRequired
            isInvalid={!!fieldState.error}
            errorMessage={fieldState.error?.message}
          />
        )}
      />

      {!hasFinishes && (
        <Controller
          name={`types.${typeIndex}.price`}
          control={control}
          rules={{ 
            min: { value: 0, message: "Debe ser mayor o igual a 0" }
          }}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              value={field.value?.toString() || ""}
              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              label="Precio (solo si no tiene acabados)"
              type="number"
              placeholder="0"
              variant="bordered"
              isInvalid={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              description="Deja vacío si vas a agregar acabados"
              startContent={<span className="text-default-400 text-small">$</span>}
            />
          )}
        />
      )}

      {/* Finishes Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Acabados / Sub-Tipos</p>
            <Button
              type="button"
              size="sm"
              color="warning"
              variant="flat"
              onPress={() => appendFinish({ description: "", price: 0 })}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Agregar Acabado
            </Button>
          </div>
          {finishFields.map((finishField, finishIndex) => (
            <div key={finishField.id} className="flex gap-2 items-end">
              <Controller
                name={`types.${typeIndex}.finishes.${finishIndex}.description`}
                control={control}
                rules={{ required: "Requerido" }}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    label="Descripción"
                    type="text"
                    placeholder="Ej: Mate, Brillante"
                    variant="bordered"
                    size="sm"
                    isRequired
                    isInvalid={!!fieldState.error}
                    className="flex-1"
                  />
                )}
              />
              <Controller
                name={`types.${typeIndex}.finishes.${finishIndex}.price`}
                control={control}
                rules={{ required: "Requerido", min: 0 }}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    label="Precio"
                    type="number"
                    placeholder="0"
                    variant="bordered"
                    size="sm"
                    isRequired
                    isInvalid={!!fieldState.error}
                    className="w-32"
                    startContent={<span className="text-default-400 text-small">$</span>}
                  />
                )}
              />
              <Button
                type="button"
                isIconOnly
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => removeFinish(finishIndex)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Extras Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Extras Opcionales</p>
            <Button
              type="button"
              size="sm"
              color="secondary"
              variant="flat"
              onPress={() => appendExtra({ description: "", price: 0 })}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Agregar Extra
            </Button>
          </div>
          {extraFields.map((extraField, extraIndex) => (
            <div key={extraField.id} className="flex gap-2 items-end">
              <Controller
                name={`types.${typeIndex}.extras.${extraIndex}.description`}
                control={control}
                rules={{ required: "Requerido" }}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    label="Descripción"
                    type="text"
                    placeholder="Ej: Logo personalizado"
                    variant="bordered"
                    size="sm"
                    isRequired
                    isInvalid={!!fieldState.error}
                    className="flex-1"
                  />
                )}
              />
              <Controller
                name={`types.${typeIndex}.extras.${extraIndex}.price`}
                control={control}
                rules={{ required: "Requerido", min: 0 }}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    value={field.value?.toString() || ""}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    label="Precio"
                    type="number"
                    placeholder="0"
                    variant="bordered"
                    size="sm"
                    isRequired
                    isInvalid={!!fieldState.error}
                    className="w-32"
                    startContent={<span className="text-default-400 text-small">$</span>}
                  />
                )}
              />
              <Button
                type="button"
                isIconOnly
                size="sm"
                color="danger"
                variant="flat"
                onPress={() => removeExtra(extraIndex)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormProduct({
  closeProductFormModal,
  name,
  id,
}: IFormProductProps) {
  const { showToast } = useContext(ToastContext);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { control, handleSubmit, reset, setValue, watch } = useForm<ProductFormData>({
    defaultValues: {
      id: "",
      name: "",
      stock: undefined,
      minPurchase: undefined,
      types: [],
      extras: [],
    },
    shouldUnregister: false,
  });
  
  const { fields: typesFields, append: appendType, remove: removeType } = useFieldArray({
    control,
    name: "types",
  });
  
  const { fields: extrasFields, append: appendExtra, remove: removeExtra } = useFieldArray({
    control,
    name: "extras",
  });
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para copiar un tipo
  const copyType = (index: number) => {
    const typeToCopy = watch(`types.${index}`);
    if (typeToCopy) {
      // Crear una copia profunda del tipo
      const copiedType = {
        description: `${typeToCopy.description} (Copia)`,
        price: typeToCopy.price,
        finishes: typeToCopy.finishes ? [...typeToCopy.finishes.map(f => ({ ...f, _id: undefined }))] : [],
        extras: typeToCopy.extras ? [...typeToCopy.extras.map(e => ({ ...e, _id: undefined }))] : [],
      };
      appendType(copiedType);
    }
  };

  const getProduct = async (productId: string) => {
    try {
      const repository = ProductRepository.instance();
      const { product } = await repository.getProduct(productId);
      if (product) {
        setValue("id", product._id || "");
        setValue("name", product.name);
        setValue("stock", product.stock);
        setValue("minPurchase", product.minPurchase);
        setValue("types", product.types || []);
        setValue("extras", product.extras || []);
      }
    } catch (error) {
      console.error("Error get product: ", error);
      showToast(false, "Error al cargar el producto");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      if (id) {
        await getProduct(id);
      } else {
        reset();
        setValue("name", name || "");
      }
      
      setIsLoading(false);
      setTimeout(() => nameInputRef.current?.focus(), 100);
    };
    
    loadData();
  }, [id, name]);

  const saveProduct = async (data: ProductFormData) => {
    try {
      setIsSaving(true);
      const repository = ProductRepository.instance();
      
      if (data.id) {
        await repository.editProduct(data);
        showToast(true, "Producto actualizado correctamente");
      } else {
        await repository.addProduct(data);
        showToast(true, "Producto agregado correctamente");
      }
      
      closeProductFormModal(true);
      reset();
    } catch (error) {
      console.error("Error save product: ", error);
      showToast(false, "Ocurrió un error al guardar el producto");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Spinner size="sm" />
        <span>Cargando información...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(saveProduct)} className="flex flex-col gap-4">
      {/* Basic Information */}
      <Card className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700">
        <CardBody className="gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información Básica</h3>
          
          <Controller
            name="name"
            control={control}
            rules={{ required: "El nombre es requerido" }}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label="Nombre del Producto"
                type="text"
                placeholder="Ej: Camiseta, Taza, etc."
                variant="bordered"
                ref={nameInputRef}
                isRequired
                isInvalid={!!fieldState.error}
                errorMessage={fieldState.error?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="stock"
              control={control}
              rules={{ min: { value: 0, message: "El stock debe ser mayor o igual a 0" } }}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  value={field.value?.toString() || ""}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  label="Stock (Opcional)"
                  type="number"
                  placeholder="0"
                  variant="bordered"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="minPurchase"
              control={control}
              rules={{ min: { value: 1, message: "La compra mínima debe ser mayor a 0" } }}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  value={field.value?.toString() || ""}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  label="Compra Mínima (Opcional)"
                  type="number"
                  placeholder="1"
                  variant="bordered"
                  isInvalid={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          </div>
        </CardBody>
      </Card>

      {/* Product Types with Nested Structure */}
      <Card className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700">
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tipos de Producto</h3>
            <Button
              type="button"
              size="sm"
              color="success"
              variant="flat"
              onPress={() => appendType({ description: "", finishes: [], extras: [] })}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Agregar Tipo
            </Button>
          </div>

          {typesFields.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
              No hay tipos configurados. Agrega al menos un tipo para tu producto.
            </p>
          )}

          <Accordion variant="splitted">
            {typesFields.map((typeField, typeIndex) => (
              <AccordionItem
                key={typeField.id}
                aria-label={`Tipo ${typeIndex + 1}`}
                title={
                  <span className="font-medium">
                    {watch(`types.${typeIndex}.description`) || `Tipo ${typeIndex + 1}`}
                  </span>
                }
                className="bg-gray-50 dark:bg-gray-800/50"
              >
                <TypeFieldsSection 
                  typeIndex={typeIndex}
                  control={control}
                  watch={watch}
                  removeType={removeType}
                  copyType={copyType}
                />
              </AccordionItem>
            ))}
          </Accordion>
        </CardBody>
      </Card>

      {/* General Extras */}
      <Card className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700">
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Extras Generales</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Estos extras aplican a todos los tipos del producto
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              color="secondary"
              variant="flat"
              onPress={() => appendExtra({ description: "", price: 0 })}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              Agregar Extra
            </Button>
          </div>

          {extrasFields.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
              No hay extras generales configurados
            </p>
          )}

          <div className="flex flex-col gap-2">
            {extrasFields.map((extraField, extraIndex) => (
              <div key={extraField.id} className="flex gap-2 items-end">
                <Controller
                  name={`extras.${extraIndex}.description`}
                  control={control}
                  rules={{ required: "La descripción es requerida" }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      label="Descripción"
                      type="text"
                      placeholder="Ej: Empaque especial, Tarjeta de regalo"
                      variant="bordered"
                      size="sm"
                      isRequired
                      isInvalid={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                      className="flex-1"
                    />
                  )}
                />
                <Controller
                  name={`extras.${extraIndex}.price`}
                  control={control}
                  rules={{ 
                    required: "El precio es requerido",
                    min: { value: 0, message: "Debe ser mayor o igual a 0" }
                  }}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      value={field.value?.toString() || ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      label="Precio"
                      type="number"
                      placeholder="0"
                      variant="bordered"
                      size="sm"
                      isRequired
                      isInvalid={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                      className="w-32"
                      startContent={<span className="text-default-400 text-small">$</span>}
                    />
                  )}
                />
                <Button
                  type="button"
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => removeExtra(extraIndex)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        color="primary"
        size="lg"
        isLoading={isSaving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
      >
        {id ? "Actualizar Producto" : "Crear Producto"}
      </Button>
    </form>
  );
}
