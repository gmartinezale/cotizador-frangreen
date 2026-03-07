"use client";
import { Category } from "@/entities/Category";
import { useContext, useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, Spinner, Tooltip } from "@heroui/react";
import Table from "@/components/elements/Table/Table";
import { MRT_ColumnDef } from "material-react-table";
import {
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { CategoryRepository } from "@/data/categories.repository";
import Link from "next/link";
import { ModalData } from "@/types";
import { FormCategory } from "../Modal/Category/form";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { ProductRepository } from "@/data/products.repository";
import ProductTable from "../Product/ProductTable";

interface ICategoryTableProps {
  initialCategories: Category[];
}

const CategoryTable = ({ initialCategories }: ICategoryTableProps) => {
  const { showToast } = useContext(ToastContext);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [updateData, setUpdateData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: "Categoría",
    size: "md",
  });
  const [showModal, setShowModal] = useState(false);

  const updateCategories = async () => {
    try {
      setIsLoading(true);
      const repository = CategoryRepository.instance();
      const { categories } = await repository.getCategories();
      setCategories(categories);
    } catch (error) {
      console.error("Error update categories: ", error);
      throw error;
    } finally {
      setUpdateData(false);
      setIsLoading(false);
    }
  };

  const closeAddCategoryModal = (update?: boolean) => {
    if (update) {
      setUpdateData(true);
    }
    setShowModal(false);
    setModalData({ ...modalData, content: null });
  };

  const openCategoryModal = (category?: Category) => {
    setShowModal(true);
    if (category) {
      setModalData({
        title: "Editar categoría",
        size: "2xl",
        content: (
          <FormCategory
            closeAddCategoryModal={closeAddCategoryModal}
            id={category._id}
            name={category.name}
          />
        ),
      });
    } else {
      setModalData({
        title: "Agregar categoría",
        size: "2xl",
        content: <FormCategory closeAddCategoryModal={closeAddCategoryModal} />,
      });
    }
  };

  const openTypeProductModal = async (category: Category) => {
    try {
      setShowModal(true);
      // set loading content
      setModalData({
        title: "Tipos de producto",
        size: "3xl",
        content: (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ),
      });
      const typeRepository = ProductRepository.instance();
      const categoryId: string = category._id ?? "";
      const { products } =
        await typeRepository.getProductsByCategory(categoryId);
      setModalData({
        title: `Tipos de producto de ${category.name}`,
        size: "5xl",
        content: (
          <ProductTable initialProducts={products} categoryId={categoryId} />
        ),
      });
    } catch (error) {
      console.error("Error open type product modal: ", error);
      throw error;
    }
  };

  const deleteCategory = async (id?: string) => {
    if (!id) return;
    try {
      setIsLoading(true);
      const repository = CategoryRepository.instance();
      await repository.deleteCategory(id);
      showToast(true, "Categoría eliminada");
    } catch (error) {
      console.error("Error delete category: ", error);
      showToast(false, "Ocurrío un error al eliminar la categoría");
      throw error;
    } finally {
      setUpdateData(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (updateData) {
      updateCategories();
    }
  }, [updateData]);

  const columnsCategory: MRT_ColumnDef<Category>[] = [
    {
      header: "Nombre",
      accessorKey: "name",
    },
    {
      header: "Acciones",
      accessorKey: "_id",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Cell: (row) => {
        const category = row.row.original as Category;
        return (
          <div className="flex gap-2">
            <Tooltip content="Agregar Tipos" color="foreground">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                color="success"
                onPress={() => openTypeProductModal(category)}
              >
                <DocumentPlusIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="primary"
              onPress={() => openCategoryModal(category)}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="danger"
              onPress={() => deleteCategory(category._id)}
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold">Productos</h1>
      <div className="flex flex-col mt-6 bg-content1 border border-divider rounded-lg">
        <div className="justify-between px-4 py-3">
          <div className="w-full pb-2 flex justify-end">
            <Button color="primary" onPress={() => openCategoryModal()}>
              Agregar
            </Button>
          </div>
          <Table
            columns={columnsCategory}
            data={categories}
            isLoading={isLoading}
          />
        </div>
      </div>
      <Modal
        size={modalData.size as any}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalData({ ...modalData, content: null });
        }}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex gap-1">
            {modalData.title ?? ""}
            {modalData.link && (
              <Link
                href={modalData.link}
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                <ArrowTopRightOnSquareIcon
                  width="24"
                  height="24"
                  className="mb-1 ml-2 inline"
                />
              </Link>
            )}
          </ModalHeader>
          <ModalBody>
            {modalData.content ?? ""}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CategoryTable;
