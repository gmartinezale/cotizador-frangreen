
// Product Price - used for finishes and extras
export type ProductPrice = {
  _id?: string;
  description: string;
  price: number;
};

// Product Type with optional price, finishes and extras
export type ProductType = {
  _id?: string;
  description: string;
  price?: number; // Optional: required only if no finishes
  finishes?: ProductPrice[]; // Acabados/sub-tipos
  extras?: ProductPrice[]; // Extras opcionales para este tipo
};

// Main product entity
export type Product = {
  _id?: string;
  name: string;
  types: ProductType[]; // Product types with nested finishes and extras
  extras?: ProductPrice[]; // General extras (apply to all types)
  stock?: number; // Optional stock quantity
  minPurchase?: number; // Optional minimum purchase quantity
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Simplified product document for references
export type ProductDoc = {
  _id: string;
  name: string;
};
