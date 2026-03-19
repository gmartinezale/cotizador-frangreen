import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongo";
import Quoter from "@/models/quoter";
import { getSession } from "@/lib/dal";
import { generateQuoterPdf } from "@/lib/generateQuoterPdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quoterNumber: string }> }
) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { quoterNumber: qnStr } = await params;
  const quoterNumber = parseInt(qnStr, 10);
  if (isNaN(quoterNumber)) {
    return new Response(JSON.stringify({ error: "Número inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await connectDB();

  const quoter = await Quoter.findOne({ quoterNumber })
    .populate("products.product", "name types")
    .lean();

  if (!quoter) {
    return new Response(JSON.stringify({ error: "Cotización no encontrada" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pdfBytes = await generateQuoterPdf(quoter);
  const buffer = Buffer.from(pdfBytes);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cotizacion_${quoterNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
