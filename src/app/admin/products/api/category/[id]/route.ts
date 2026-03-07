import { connectDB } from "@/lib/mongo";
import Product from "@/models/product";
import { getSession } from "@/lib/dal";
import { 
  isValidObjectId, 
  invalidIdResponse, 
  unauthorizedResponse,
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

    const { id: CategoryId } = await params;
    
    // Validar ObjectId
    if (!isValidObjectId(CategoryId)) return invalidIdResponse();

    await connectDB();

    const seacrhObject: any = {
      active: true,
      category: CategoryId,
    };
    const products = await Product.find(seacrhObject)
      .populate("category")
      .lean();
    return Response.json({ success: true, products });
  } catch (error) {
    safeErrorLog("Error fetching products", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
    });
  }
}
