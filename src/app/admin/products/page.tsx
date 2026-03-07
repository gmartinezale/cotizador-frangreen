import ProductTable from "@/components/template/Product/ProductTable";
import { Product } from "@/entities/Product";
import { ProductRepository } from "@/data/products.repository";
import { cookies } from "next/headers";
import SkeletonProductTable from "@/components/skeletons/SkeletonProductTable";
import { Suspense } from "react";

const getProducts = async () => {
  try {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("session")?.value;
    const repository = ProductRepository.instance(token);
    const { products } = await repository.getProducts();
    return products;
  } catch (error) {
    console.error("Error get products: ", error);
    throw error;
  }
};

export default async function ProductPage() {
  const products: Product[] = await getProducts();
  return (
    <Suspense fallback={<SkeletonProductTable />}>
      <ProductTable initialProducts={products} />
    </Suspense>
  );
}
