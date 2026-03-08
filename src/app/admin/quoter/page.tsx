export const dynamic = "force-dynamic";

import CreateQuoter from "@/components/template/Quoter/Create";
import { ProductRepository } from "@/data/products.repository";
import { Product } from "@/entities/Product";
import { cookies } from "next/headers";
import { Suspense } from "react";
import SkeletonQuoterCreate from "@/components/skeletons/SkeletonQuoterCreate";

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

export default async function QuoterPage() {
  const products: Product[] = await getProducts();
  return (
    <Suspense fallback={<SkeletonQuoterCreate />}>
      <CreateQuoter initialProducts={products} />
    </Suspense>
  );
}
