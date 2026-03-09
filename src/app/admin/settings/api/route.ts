import { connectDB } from "@/lib/mongo";
import Settings from "@/models/settings";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import { unauthorizedResponse, validateOrigin, safeErrorLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    await connectDB();
    let settings = await Settings.findOne().lean();
    if (!settings) {
      // Crear configuración por defecto si no existe
      settings = await Settings.create({ shippingCost: 0 });
    }

    return Response.json({ success: true, settings });
  } catch (error) {
    safeErrorLog("Error getting settings", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    if (!await validateOrigin(request)) {
      return new Response(JSON.stringify({ success: false, message: "Origen no válido" }), { status: 403 });
    }

    await connectDB();
    const body = await request.json();

    const schema = z.object({
      shippingCost: z.number().min(0),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { success: false, msg: "Error en los parámetros", errors: result.error.errors },
        { status: 400 },
      );
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { shippingCost: result.data.shippingCost },
      { upsert: true, new: true },
    );

    return Response.json({ success: true, settings });
  } catch (error) {
    safeErrorLog("Error updating settings", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
