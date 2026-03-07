// generate a component use react-hook-form
import { CategoryRepository } from "@/data/categories.repository";
import { Button, Input } from "@heroui/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";

interface IFormCategoryProps {
  closeAddCategoryModal: (update: boolean) => void;
  name?: string;
  id?: string;
}

export function FormCategory({
  closeAddCategoryModal,
  name,
  id,
}: IFormCategoryProps) {
  const { showToast } = useContext(ToastContext);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      id: "",
      name: "",
    },
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    reset();
    emailInputRef.current?.focus();
    setValue("name", name || "");
    if (id) {
      setValue("id", id || "");
    }
  }, [name, id, reset, setValue]);

  const saveCategory = async (data: any) => {
    try {
      setIsSaving(true);
      const repository = CategoryRepository.instance();
      if (data.id) {
        await repository.editCategory(data);
        showToast(true, "Categoría actualizada correctamente");
      } else {
        await repository.addCategory(data);
        showToast(true, "Categoría agregada correctamente");
      }
    } catch (error) {
      console.error("Error add category: ", error);
      showToast(false, "Ocurrió un error al agregar la categoría");
      throw error;
    } finally {
      setIsSaving(false);
      closeAddCategoryModal(true);
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(saveCategory)}>
      <div className="flex flex-col gap-4">
        <Controller
          name="name"
          control={control}
          defaultValue={name}
          render={({ field }) => (
            <Input
              {...field}
              label="Nombre"
              type="text"
              placeholder="Ingrese nombre de la categoría"
              variant="bordered"
              ref={emailInputRef}
              isRequired
            />
          )}
        />
        <Button 
          type="submit" 
          color="primary"
          isLoading={isSaving}
          className="w-full"
        >
          Guardar
        </Button>
      </div>
    </form>
  );
}
