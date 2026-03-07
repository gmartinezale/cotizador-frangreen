"use client";
import { Product } from "@/entities/Product";
import { useContext, useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, Spinner } from "@heroui/react";
import Table from "@/components/elements/Table/Table";
import { MRT_ColumnDef } from "material-react-table";
import {
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { ProductRepository } from "@/data/products.repository";
import Link from "next/link";
import { ModalData } from "@/types";
import { FormProduct } from "../Modal/Product/form";
import { ToastContext } from "@/components/elements/Toast/ToastComponent";
import formatCurrency from "@/utils/formatCurrency";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface IProductTableProps {
  initialProducts: Product[];
  categoryId?: string;
}

const ProductTable = ({ initialProducts, categoryId }: IProductTableProps) => {
  const { showToast } = useContext(ToastContext);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [updateData, setUpdateData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: "Producto",
    size: "md",
  });
  const [showModal, setShowModal] = useState(false);

  const updateProducts = async () => {
    try {
      setIsLoading(true);
      const repository = ProductRepository.instance();
      if (categoryId) {
        const { products } = await repository.getProductsByCategory(categoryId);
        setProducts(products);
      } else {
        const { products } = await repository.getProducts();
        setProducts(products);
      }
    } catch (error) {
      console.error("Error get products: ", error);
      throw error;
    } finally {
      setUpdateData(false);
      setIsLoading(false);
    }
  };

  const closeProductFormModal = (update?: boolean) => {
    if (update) {
      setUpdateData(true);
    }
    setShowModal(false);
    setModalData({ ...modalData, content: null });
  };

  const openProductModal = (product?: Product) => {
    setShowModal(true);
    if (product) {
      setModalData({
        title: "Editar producto",
        size: "3xl",
        content: (
          <FormProduct
            closeProductFormModal={closeProductFormModal}
            id={product?._id}
            name={product?.name}
          />
        ),
      });
    } else {
      setModalData({
        title: "Agregar producto",
        size: "3xl",
        content: <FormProduct closeProductFormModal={closeProductFormModal} />,
      });
    }
  };

  const deleteProduct = async (id?: string) => {
    if (!id) return;
    try {
      setIsLoading(true);
      const repository = ProductRepository.instance();
      await repository.deleteProduct(id);
      showToast(true, "Producto eliminada");
    } catch (error) {
      console.error("Error delete product: ", error);
      showToast(false, "Ocurrío un error al eliminar el producto");
      throw error;
    } finally {
      setUpdateData(true);
      setIsLoading(false);
    }
  };

  const showModalDetails = async (product: Product) => {
    try {
      setShowModal(true);
      setModalData({
        title: `Detalles - ${product.name}`,
        size: "3xl",
        content: (
          <div className="flex flex-col gap-6 text-gray-900 dark:text-gray-100 p-4">
            {/* Stock and Min Purchase */}
            {(product.stock !== undefined || product.minPurchase !== undefined) && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-semibold mb-3">Información de Inventario</h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.stock !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stock disponible</p>
                      <p className={`text-2xl font-bold ${
                        product.stock === 0 ? "text-red-600 dark:text-red-400" : 
                        product.stock < 10 ? "text-yellow-600 dark:text-yellow-400" : 
                        "text-green-600 dark:text-green-400"
                      }`}>
                        {product.stock} unidades
                      </p>
                    </div>
                  )}
                  {product.minPurchase !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Compra mínima</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{product.minPurchase} unidades</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Types with Nested Finishes and Extras */}
            {product.types && product.types.length > 0 && (
              <div className="pb-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Tipos ({product.types.length})
                </h3>
                <div className="space-y-4">
                  {product.types.map((type, index) => (
                    <div key={`type-${type._id || index}-${index}`} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-lg">{type.description}</span>
                        {type.price !== undefined && (
                          <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                            {formatCurrency(type.price)}
                          </span>
                        )}
                      </div>

                      {/* Finishes dentro del tipo */}
                      {type.finishes && type.finishes.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-orange-500">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Acabados ({type.finishes.length})
                          </h4>
                          <div className="space-y-1">
                            {type.finishes.map((finish, fIndex) => (
                              <div key={`finish-${finish._id || fIndex}-${index}-${fIndex}`} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <span className="text-sm">{finish.description}</span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(finish.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extras dentro del tipo */}
                      {type.extras && type.extras.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-cyan-500">
                          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Extras ({type.extras.length})
                          </h4>
                          <div className="space-y-1">
                            {type.extras.map((extra, eIndex) => (
                              <div key={`type-extra-${extra._id || eIndex}-${index}-${eIndex}`} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <span className="text-sm">{extra.description}</span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(extra.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Extras */}
            {product.extras && product.extras.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Extras Generales ({product.extras.length})
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Aplican a todos los tipos del producto
                </p>
                <div className="space-y-2">
                  {product.extras.map((extra, index) => (
                    <div key={`general-extra-${extra._id || index}-${index}`} className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                      <span className="font-medium">{extra.description}</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(extra.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {(!product.types || product.types.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No hay tipos configurados</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Este producto no tiene variaciones
                </p>
              </div>
            )}
          </div>
        ),
      });
    } catch (error) {
      console.error("Error showing product details: ", error);
      throw error;
    }
  };

  useEffect(() => {
    if (updateData) {
      updateProducts();
    }
  }, [updateData]);

  const columnsProduct: MRT_ColumnDef<Product>[] = [
    {
      header: "Nombre",
      accessorKey: "name",
      size: 200,
      minSize: 150,
    },
    {
      header: "Stock",
      accessorKey: "stock",
      Cell: (row) => {
        const stock = row.cell.getValue<number>();
        if (stock === undefined) return <span className="text-gray-500">-</span>;
        
        const stockClass = stock === 0 ? "text-red-400" : stock < 10 ? "text-yellow-400" : "text-green-400";
        return <span className={stockClass}>{stock} uds</span>;
      },
      size: 100,
    },
    {
      header: "Variaciones",
      id: "variaciones",
      size: 350,
      minSize: 280,
      Cell: (row) => {
        const product = row.row.original as Product;
        const types = product.types || [];
        const generalExtras = product.extras || [];
        
        if (types.length === 0) {
          return <span className="text-gray-500">Sin tipos</span>;
        }
        
        // Contar acabados y extras dentro de todos los tipos
        const totalFinishes = types.reduce((sum, type) => sum + (type.finishes?.length || 0), 0);
        const totalTypeExtras = types.reduce((sum, type) => sum + (type.extras?.length || 0), 0);
        
        return (
          <div className="flex gap-1 text-xs flex-wrap">
            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
              {types.length} {types.length === 1 ? "tipo" : "tipos"}
            </span>
            {totalFinishes > 0 && (
              <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                {totalFinishes} {totalFinishes === 1 ? "acabado" : "acabados"}
              </span>
            )}
            {totalTypeExtras > 0 && (
              <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                {totalTypeExtras} extra{totalTypeExtras === 1 ? "" : "s"} por tipo
              </span>
            )}
            {generalExtras.length > 0 && (
              <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400">
                {generalExtras.length} extra{generalExtras.length === 1 ? "" : "s"} general{generalExtras.length === 1 ? "" : "es"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "Detalles",
      id: "detalles",
      enableSorting: false,
      enableColumnFilter: false,
      Cell: (row) => {
        const product = row.row.original as Product;
        return (
          <MagnifyingGlassIcon
            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-blue-400 transition-colors"
            onClick={() => showModalDetails(product)}
          />
        );
      },
      size: 80,
    },
    {
      header: "Acciones",
      id: "acciones",
      enableSorting: false,
      enableColumnFilter: false,
      Cell: (row) => {
        const product = row.row.original as Product;
        return (
          <div className="flex space-x-2">
            <button
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => openProductModal(product)}
              title="Editar producto"
            >
              <PencilIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={() => deleteProduct(product._id)}
              title="Eliminar producto"
            >
              <XMarkIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        );
      },
      size: 120,
    },
  ];

  return (
    <div className="w-full">
      {!categoryId && (
        <h1 className="text-2xl text-gray-900 dark:text-white font-bold mb-6">Productos</h1>
      )}
      <div className="flex flex-col">
        <div className="justify-between mb-4">
          <div className="w-full pb-2 flex justify-end">
            <Button 
              color="primary" 
              onPress={() => openProductModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
            >
              Agregar Producto
            </Button>
          </div>
          <Table
            columns={columnsProduct}
            data={products}
            isLoading={isLoading}
          />
        </div>
      </div>
      <Modal
        size={modalData.size}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setModalData({ ...modalData, content: null });
        }}
      >
        <ModalContent>
          <ModalHeader className="flex gap-1">
            {modalData.title ?? ""}
            {modalData.link && (
              <Link
                href={modalData.link}
                target="_blank"
                className="font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                <ArrowTopRightOnSquareIcon
                  width="24"
                  height="24"
                  className="mb-1 ml-2 inline"
                />
              </Link>
            )}
          </ModalHeader>
          <ModalBody className="max-h-[90vh] overflow-y-auto">
            {modalData.content ?? ""}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProductTable;
