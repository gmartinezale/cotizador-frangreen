import Product from "@/models/product";
import { connectDB } from "@/lib/mongo";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import { 
  unauthorizedResponse, 
  validateOrigin, 
  safeErrorLog 
} from "@/lib/security";

// Zod schemas for validation
const ProductPriceSchema = z.object({
  _id: z.string().optional(),
  description: z.string().min(1, "La descripción es requerida"),
  price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
});

const ProductTypeSchema = z.object({
  _id: z.string().optional(),
  description: z.string().min(1, "La descripción del tipo es requerida"),
  multiplier: z.number().min(1, "El multiplicador debe ser mayor o igual a 1").optional(),
  price: z.number().optional(),
  finishes: z.array(ProductPriceSchema).default([]).optional(),
  extras: z.array(ProductPriceSchema).default([]).optional(),
}).refine(
  (data) => {
    // If no finishes, price is required
    if (!data.finishes || data.finishes.length === 0) {
      return data.price !== undefined && data.price !== null;
    }
    return true;
  },
  {
    message: "El precio es requerido si no hay acabados definidos",
    path: ["price"],
  }
);

const CreateProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  types: z.array(ProductTypeSchema).min(1, "Debe agregar al menos un tipo"),
  extras: z.array(ProductPriceSchema).default([]).optional(),
  stock: z.number().min(0, "El stock debe ser mayor o igual a 0").optional(),
  minPurchase: z.number().min(1, "La compra mínima debe ser mayor o igual a 1").optional(),
});

const UpdateProductSchema = CreateProductSchema.extend({
  id: z.string().min(1, "El ID es requerido"),
});

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    await connectDB();
    const query = new URL(request.url).searchParams;
    const searchObject: any = {
      active: true,
    };
    
    const products = await Product.find(searchObject)
      .lean();
      
    return Response.json({ success: true, products });
  } catch (error) {
    safeErrorLog("Error fetching products", error);
    return new Response(JSON.stringify({ success: false, message: "Error al obtener productos" }), {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    // Validar origen de la solicitud (CSRF protection)
    if (!await validateOrigin(request)) {
      return new Response(JSON.stringify({ success: false, message: "Origen no válido" }), { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    
    // Validate with Zod
    const validationResult = CreateProductSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        }), 
        { status: 400 }
      );
    }
    
    const { name, types, extras, stock, minPurchase } = validationResult.data;
    
    const product = await Product.create({
      name,
      types,
      extras,
      stock,
      minPurchase,
      active: true,
    });
    
    if (!product) {
      return new Response(JSON.stringify({ success: false, message: "Error al crear el producto" }), {
        status: 500,
      });
    }
    
    return Response.json({ success: true, product });
  } catch (error) {
    safeErrorLog("Error creating product", error);
    return new Response(JSON.stringify({ success: false, message: "Error al crear el producto" }), {
      status: 500,
    });
  }
}

export async function PUT(request: Request) {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    // Validar origen de la solicitud (CSRF protection)
    if (!await validateOrigin(request)) {
      return new Response(JSON.stringify({ success: false, message: "Origen no válido" }), { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    
    // Validate with Zod
    const validationResult = UpdateProductSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        }), 
        { status: 400 }
      );
    }
    
    const { id, name, types, extras, stock, minPurchase } = validationResult.data;
    
    const product = await Product.findOneAndUpdate(
      { _id: id },
      { 
        name, 
        types,
        extras, 
        stock, 
        minPurchase 
      },
      { new: true }
    );
    
    if (!product) {
      return new Response(JSON.stringify({ success: false, message: "Producto no encontrado" }), {
        status: 404,
      });
    }
    
    return Response.json({ success: true, product });
  } catch (error) {
    safeErrorLog("Error updating product", error);
    return new Response(JSON.stringify({ success: false, message: "Error al actualizar el producto" }), {
      status: 500,
    });
  }
}
