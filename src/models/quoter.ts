import { Document, Schema, model, models } from "mongoose";
import "./product";
import { Product } from "@/entities/Product";
import { IProductPrice, ProductPriceSchema } from "@/interfaces/ProductInterface";

// Extra products added to the quotation
interface IExtraProductQuoter {
  description: string;
  price: number;
  amount: number;
}

// Custom product not from the product catalog
interface ICustomProduct {
  description: string;
  price: number;
  amount: number;
  isFinished?: boolean;
}

// Product item in quotation with selected type, finish and extras
interface IProductsQuoter {
  product: string | Product; // Reference to the product
  productType: IProductPrice; // Selected type from product.types (required)
  productFinish?: IProductPrice; // Optional: selected finish from productType.finishes
  amount: number;
  price: number; // Calculated price (type.price or finish.price + selected extras)
  multiplier: number; // Units produced per input unit (e.g., A5=2, A6=4); default 1
  isFinished: boolean;
  extras: IExtraProductQuoter[]; // Selected extras (from productType.extras + product.extras)
}

interface IQuoter extends Document {
  quoterNumber: number;
  orderNumber?: number;
  invoiceNumber?: string;
  totalAmount: number;
  artist: string;
  active: boolean;
  products: IProductsQuoter[];
  customProducts: ICustomProduct[]; // Products not from catalog
  dateLimit: Date;
  fileSended: boolean;
  discount: number; // Percentage discount (0-100)
  shippingCost?: number; // Shipping cost from settings
  shippingType?: string; // 'PAKET' | 'REGION' | 'EVENTO' | null
  status: string;
  statusChanges: { status: string; date: Date }[];
}

const QuoterSchema = new Schema<IQuoter>(
  {
    quoterNumber: { type: Number, unique: true, required: true },
    orderNumber: { type: Number, unique: true, sparse: true },
    invoiceNumber: { type: String },
    totalAmount: Number,
    artist: String,
    active: Boolean,
    products: [
      {
        _id: false,
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productType: { type: ProductPriceSchema, required: true }, // Selected type from product.types
        productFinish: { type: ProductPriceSchema }, // Optional: selected finish from type.finishes
        amount: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        multiplier: { type: Number, default: 1, min: 1 }, // Units per input (e.g., A5=2, A6=4)
        isFinished: { type: Boolean, default: false },
        extras: [
          {
            _id: false,
            description: { type: String, required: true },
            price: { type: Number, required: true, min: 0 },
            amount: { type: Number, required: true, min: 1 },
          },
        ],
      },
    ],
    customProducts: [
      {
        _id: false,
        description: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 1 },
        isFinished: { type: Boolean, default: false },
      },
    ],
    dateLimit: Date,
    fileSended: { type: Boolean, default: false },
    discount: { type: Number }, // Percentage discount
    shippingCost: { type: Number, default: 0 }, // Shipping cost snapshot from settings
    shippingType: { type: String, enum: ['PAKET', 'REGION', 'EVENTO', null], default: null }, // Delivery/shipping type
    status: {
      type: String,
      default: "PENDIENTE",
      enum: ["PENDIENTE", "PAGADO", "EN PROCESO", "COMPLETA", "ANULADO"],
    },
    statusChanges: [
      {
        _id: false,
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Always rebuild the model so schema changes are picked up on hot-reload in dev.
// In production the connection is established once and this module runs once too.
if (models["Quoter"]) {
  delete (models as any)["Quoter"];
}
const Quoter = model<IQuoter>("Quoter", QuoterSchema);

export default Quoter;
