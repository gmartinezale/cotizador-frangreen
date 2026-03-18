import { ProductDoc } from "./Product";

// Shipping / delivery types
export type ShippingType = 'PAKET' | 'REGION' | 'EVENTO';

export const SHIPPING_LABELS: Record<ShippingType, string> = {
  PAKET: 'Envío por PAKET',
  REGION: 'Envío a región',
  EVENTO: 'Entrega en evento',
};

export const SHIPPING_OPTIONS: Array<{
  key: ShippingType | null;
  label: string;
  hasCost: boolean;
}> = [
  { key: null, label: 'Sin envío', hasCost: false },
  { key: 'PAKET', label: 'Envío por PAKET', hasCost: true },
  { key: 'REGION', label: 'Envío a región', hasCost: false },
  { key: 'EVENTO', label: 'Entrega en evento', hasCost: false },
];

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
  isFinished?: boolean;
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
  shippingCost?: number; // Shipping cost snapshot from settings
  shippingType?: ShippingType | null; // Delivery/shipping method
  statusChanges: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
};
