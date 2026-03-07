import { connectDB } from "@/lib/mongo";
import Quoter from "@/models/quoter";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoterNumber: string }> }
) {
  try {
    const { quoterNumber } = await params;
    const number = parseInt(quoterNumber, 10);

    if (isNaN(number)) {
      return new Response(JSON.stringify({ success: false, message: "Número inválido" }), {
        status: 400,
      });
    }

    await connectDB();

    const quoter = await Quoter.findOne({ quoterNumber: number })
      .populate("products.product", "name")
      .lean();

    if (!quoter) {
      return new Response(JSON.stringify({ success: false, message: "Cotización no encontrada" }), {
        status: 404,
      });
    }

    return Response.json({ success: true, quoter });
  } catch (error) {
    console.error("Error getting quoter by number:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
    });
  }
}
