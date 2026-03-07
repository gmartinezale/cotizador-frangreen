import { Document, Schema, model } from "mongoose";
import { IProductPrice, IProductType, ProductPriceSchema, ProductTypeSchema } from "@/interfaces/ProductInterface";
interface IProduct extends Document {
  name: string;
  types: IProductType[]; // Product types
  stock?: number; // Optional stock quantity
  extras?: IProductPrice[]; // Optional extras
  minPurchase?: number; // Optional minimum purchase quantity
  active: boolean;
}

// Main product schema
const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    types: { type: [ProductTypeSchema], default: [] },
    stock: { type: Number, min: 0 },
    extras: { type: [ProductPriceSchema], default: [] },
    minPurchase: { type: Number, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);

let Product: any;
try {
  Product = model("Product");
} catch (error) {
  Product = model<IProduct>("Product", ProductSchema);
}

// Force the model to use the new schema
if (Product.schema !== ProductSchema) {
  Product = model<IProduct>("Product", ProductSchema, "products", { overwriteModels: true });
}

export default Product;
