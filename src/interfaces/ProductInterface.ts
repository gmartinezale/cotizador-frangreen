import { Schema } from "mongoose";

// Subdocument interfaces for nested structures
export interface IProductPrice {
  description: string;
  price: number;
}

export interface IProductType {
  description: string;
  price?: number;
  multiplier?: number;
  finishes?: IProductPrice[];
  extras?: IProductPrice[];
}

// Subdocument schemas
const ProductPriceSchema = new Schema<IProductPrice>(
  {
    description: { type: String, required: true },
    price: { type: Number},
    
  },
  { _id: false },
);

const ProductTypeSchema = new Schema<IProductType>(
  {
    description: { type: String, required: true },
    price: { type: Number },
    multiplier: { type: Number, default: 1, min: 1 },
    finishes: { type: [ProductPriceSchema], default: [] },
    extras: { type: [ProductPriceSchema], default: [] },
  },
  { _id: false },
);

export { ProductPriceSchema, ProductTypeSchema };