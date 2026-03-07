import { connectDB } from "@/lib/mongo";
import Product from "@/models/product";
import { getSession } from "@/lib/dal";
import { 
  isValidObjectId, 
  invalidIdResponse, 
  unauthorizedResponse, 
  validateOrigin,
  safeErrorLog 
} from "@/lib/security";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    
    // Validar ObjectId
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return new Response(JSON.stringify({ success: false, message: "Producto no encontrado" }), {
        status: 404,
      });
    }
    
    return Response.json({ success: true, product });
  } catch (error) {
    safeErrorLog("Error fetching product", error);
    return new Response(JSON.stringify({ success: false, message: "Error al obtener el producto" }), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    // Validar origen de la solicitud (CSRF protection)
    if (!await validateOrigin(request)) {
      return new Response(JSON.stringify({ success: false, message: "Origen no válido" }), { status: 403 });
    }

    const { id } = await params;
    
    // Validar ObjectId
    if (!isValidObjectId(id)) return invalidIdResponse();

    await connectDB();
    const product = await Product.findOneAndUpdate(
      { _id: id },
      { active: false },
    );
    if (!product) {
      return new Response(JSON.stringify({ success: false, message: "Producto no encontrado" }), {
        status: 404,
      });
    }
    return Response.json({ success: true });
  } catch (error) {
    safeErrorLog("Error deleting product", error);
    return new Response(JSON.stringify({ success: false, message: "Error al eliminar el producto" }), {
      status: 500,
    });
  }
}
