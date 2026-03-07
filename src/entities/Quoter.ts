import { ProductDoc } from "./Product";

// Extra product added to quotation
export type ExtraProductQuoter = {
  description: string;
  price: number;
  amount: number;
};

// Custom product not from the product catalog
export type CustomProduct = {
  description: string;
  price: number;
  amount: number;
};

export type ProductPrice = {
  _id?: string;
  description: string;
  price: number;
};

// Product item in quotation with selected type and finish
export type ProductsQuoter = {
  product: string | ProductDoc; // Reference to the product
  productType: ProductPrice; // Selected type from product.types (required)
  productFinish?: ProductPrice; // Optional: selected finish from productType.finishes
  amount: number;
  price: number; // Calculated price (type.price or finish.price + selected extras)
  isFinished: boolean;
  extras: ExtraProductQuoter[]; // Selected extras (from type.extras + product.extras)
};

export type StatusChange = {
  status: string;
  date: Date;
};

export type Quoter = {
  _id?: string;
  quoterNumber: number;
  orderNumber?: number;
  invoiceNumber?: string;
  totalAmount: number;
  artist: string;
  active: boolean;
  products: ProductsQuoter[];
  customProducts: CustomProduct[]; // Products not from catalog
  dateLimit: Date;
  fileSended: boolean;
  status: string;
  discount: number; // Percentage discount (0-100)
  statusChanges: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
};
