import { connectDB } from "@/lib/mongo";
import Quoter from "@/models/quoter";
import Sequence from "@/models/sequence";
import { PipelineStage } from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/dal";
import {
  unauthorizedResponse,
  validateOrigin,
  safeErrorLog,
  safeLog,
  isValidObjectId,
  invalidIdResponse,
} from "@/lib/security";

const VALID_ACTIONS = [
  "MARK_PAID",
  "START_ORDER",
  "UPDATE_DATE_LIMIT",
  "DELETE",
  "TOGGLE_PRODUCT",
  "TOGGLE_CUSTOM_PRODUCT",
  "SET_INVOICE",
  "UPDATE_SHIPPING",
  "EDIT_QUOTER",
] as const;
type QuoterAction = (typeof VALID_ACTIONS)[number];

function basePopulateQuoter(pipeline: PipelineStage[]) {
  // Lookup para productos
  pipeline.push({
    $lookup: {
      from: "products",
      localField: "products.product",
      foreignField: "_id",
      as: "productDetails",
      pipeline: [
        {
          $project: {
            name: 1,
            types: 1,
            extras: 1,
          },
        },
      ],
    },
  });

  // Proyectar los campos necesarios con los detalles
  pipeline.push({
    $project: {
      quoterNumber: 1,
      orderNumber: 1,
      invoiceNumber: 1,
      totalAmount: 1,
      artist: 1,
      active: 1,
      dateLimit: 1,
      fileSended: 1,
      discount: 1,
      shippingCost: 1,
      shippingType: 1,
      status: 1,
      statusChanges: 1,
      customProducts: 1,
      createdAt: 1,
      updatedAt: 1,
      products: {
        $map: {
          input: "$products",
          as: "product",
          in: {
            _id: "$$product._id",
            amount: "$$product.amount",
            price: "$$product.price",
            isFinished: "$$product.isFinished",
            extras: "$$product.extras",
            productType: "$$product.productType",
            productFinish: "$$product.productFinish",
            product: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$productDetails",
                    as: "pd",
                    cond: { $eq: ["$$pd._id", "$$product.product"] },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    },
  });
}

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    await connectDB();
    const pipeline: PipelineStage[] = [
      {
        $match: {
          status: { $nin: ["ANULADO"] },
          active: true,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    basePopulateQuoter(pipeline);

    const quoters = await Quoter.aggregate(pipeline);

    if (!quoters) {
      return new Response(JSON.stringify({ success: false }), {
        status: 500,
      });
    }

    const quotersPending = quoters.filter((q: any) => q.status === "PENDIENTE");
    const quotersPayment = quoters.filter((q: any) => q.status === "PAGADO");
    const quotersProcess = quoters.filter((q: any) => q.status === "EN PROCESO");
    const quotersCompleted = quoters.filter((q: any) => q.status === "COMPLETA");
    return Response.json({ success: true, quotersPending, quotersPayment, quotersProcess, quotersCompleted });
  } catch (error) {
    safeErrorLog("Error getting quoters", error);
    return new Response(JSON.stringify({ success: false }), {
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
    const { totalAmount, artist, dateLimit, products, customProducts, discount, shippingCost, shippingType } = await request.json();
    const validationSchema = z.object({
      totalAmount: z.number(),
      artist: z.string(),
      dateLimit: z.string().optional(),
      discount: z.number().min(0).max(100).optional().default(0),
      shippingCost: z.number().min(0).optional().default(0),
      shippingType: z.enum(['PAKET', 'REGION', 'EVENTO']).nullable().optional(),
      products: z.array(
        z.object({
          product: z.string(), // Product ID
          productType: z.object({
            description: z.string(),
            price: z.number(),
          }),
          productFinish: z.object({
            description: z.string(),
            price: z.number(),
          }).optional(),
          amount: z.number(),
          price: z.number(),
          multiplier: z.number().min(1).default(1),
          isFinished: z.boolean(),
          extras: z.array(
            z.object({
              amount: z.number(),
              description: z.string(),
              price: z.number(),
            }),
          ),
        }),
      ),
      customProducts: z.array(
        z.object({
          description: z.string(),
          price: z.number().min(0),
          amount: z.number().min(1),
        }),
      ).optional().default([]),
    });
    const validation = validationSchema.safeParse({
      totalAmount,
      artist,
      dateLimit,
      products,
      customProducts,
      discount,
      shippingCost,
      shippingType,
    });
    if (!validation.success) {
      return new Response(
        JSON.stringify({ success: false, msg: "Error en los parámetros", errors: validation.error.errors }),
        {
          status: 400,
        },
      );
    }
    safeLog("Creating quoter", validation.data);

    // Increment quoter sequence number
    const { sequence } = await Sequence.findOneAndUpdate(
      {},
      { $inc: { "sequence.quoter": 1 } },
      { new: true, upsert: true }
    );
    const quoterNumber = sequence.quoter;

    const quoter = await Quoter.create({
      quoterNumber,
      totalAmount,
      artist,
      dateLimit,
      products,
      customProducts: customProducts || [],
      discount: discount || 0,
      shippingCost: shippingCost || 0,
      shippingType: shippingType ?? null,
      active: true,
      status: "PENDIENTE",
    });

    if (!quoter) {
      return new Response(JSON.stringify({ success: false }), {
        status: 500,
      });
    }
    return Response.json({ success: true, quoterNumber });
  } catch (error) {
    safeErrorLog("Error creating quoter", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorizedResponse();

    if (!await validateOrigin(request)) {
      return new Response(JSON.stringify({ success: false, message: "Origen no válido" }), { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { action, quoterId, productIndex, invoiceNumber } = body;

    if (!action || !quoterId) {
      return new Response(JSON.stringify({ success: false, message: "Parámetros requeridos" }), { status: 400 });
    }

    // Validate action is one of the allowed values
    if (!VALID_ACTIONS.includes(action as QuoterAction)) {
      return new Response(JSON.stringify({ success: false, message: "Acción no válida" }), { status: 400 });
    }

    // Validate quoterId is a valid MongoDB ObjectId
    if (!isValidObjectId(quoterId)) return invalidIdResponse();

    // Mark as paid: PENDIENTE → PAGADO + assign orderNumber
    if (action === "MARK_PAID") {
      const { sequence } = await Sequence.findOneAndUpdate(
        {},
        { $inc: { "sequence.order": 1 } },
        { new: true, upsert: true }
      );
      safeLog("New order sequence", sequence);
      const orderNumber = sequence.order;

      const quoter = await Quoter.findByIdAndUpdate(
        quoterId,
        {
          status: "PAGADO",
          orderNumber,
          $push: { statusChanges: { status: "PAGADO", date: new Date() } },
        },
        { new: true }
      );

      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }
      return Response.json({ success: true, orderNumber });
    }

    // Start order: PAGADO → EN PROCESO
    if (action === "START_ORDER") {
      const quoter = await Quoter.findById(quoterId);
      if (!quoter) return new Response(JSON.stringify({ success: false }), { status: 404 });
      if (quoter.status !== "PAGADO") {
        return new Response(JSON.stringify({ success: false, message: "La orden debe estar en estado PAGADO" }), { status: 400 });
      }
      quoter.status = "EN PROCESO";
      quoter.statusChanges.push({ status: "EN PROCESO", date: new Date() });
      await quoter.save();
      return Response.json({ success: true });
    }

    // Update date limit (allowed while PAGADO)
    if (action === "UPDATE_DATE_LIMIT") {
      const { dateLimit } = body;
      const dateLimitSchema = z.string().datetime({ offset: true }).nullable().optional();
      const parsed = dateLimitSchema.safeParse(dateLimit ?? null);
      if (!parsed.success) {
        return new Response(JSON.stringify({ success: false, message: "dateLimit inválida" }), { status: 400 });
      }
      const quoter = await Quoter.findByIdAndUpdate(
        quoterId,
        { dateLimit: parsed.data ? new Date(parsed.data) : null },
        { new: true }
      );
      if (!quoter) return new Response(JSON.stringify({ success: false }), { status: 404 });
      return Response.json({ success: true });
    }

    // Delete (soft): set active to false
    if (action === "DELETE") {
      const quoter = await Quoter.findByIdAndUpdate(
        quoterId,
        {
          active: false,
          status: "ANULADO",
          $push: { statusChanges: { status: "ANULADO", date: new Date() } },
        },
        { new: true }
      );
      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }
      return Response.json({ success: true });
    }

    // Toggle product isFinished
    if (action === "TOGGLE_PRODUCT") {
      if (typeof productIndex !== "number" || productIndex < 0) {
        return new Response(JSON.stringify({ success: false, message: "productIndex requerido" }), { status: 400 });
      }

      const quoter = await Quoter.findById(quoterId);
      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }

      if (productIndex >= quoter.products.length) {
        return new Response(JSON.stringify({ success: false, message: "productIndex fuera de rango" }), { status: 400 });
      }

      quoter.products[productIndex].isFinished = !quoter.products[productIndex].isFinished;

      // Check if all products AND custom products are finished — only auto-complete from EN PROCESO
      const allFinished =
        quoter.products.every((p: any) => p.isFinished) &&
        (quoter.customProducts ?? []).every((p: any) => p.isFinished);
      if (allFinished && quoter.status === "EN PROCESO") {
        quoter.status = "COMPLETA";
        quoter.statusChanges.push({ status: "COMPLETA", date: new Date() });
      }

      await quoter.save();
      return Response.json({ success: true, allFinished });
    }

    // Toggle custom product isFinished
    if (action === "TOGGLE_CUSTOM_PRODUCT") {
      if (typeof productIndex !== "number" || productIndex < 0) {
        return new Response(JSON.stringify({ success: false, message: "productIndex requerido" }), { status: 400 });
      }

      const quoter = await Quoter.findById(quoterId);
      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }

      if (productIndex >= quoter.customProducts.length) {
        return new Response(JSON.stringify({ success: false, message: "productIndex fuera de rango" }), { status: 400 });
      }

      quoter.customProducts[productIndex].isFinished = !quoter.customProducts[productIndex].isFinished;

      // Check if all products AND custom products are finished
      const allFinished =
        quoter.products.every((p: any) => p.isFinished) &&
        quoter.customProducts.every((p: any) => p.isFinished);
      if (allFinished && quoter.status === "EN PROCESO") {
        quoter.status = "COMPLETA";
        quoter.statusChanges.push({ status: "COMPLETA", date: new Date() });
      }

      await quoter.save();
      return Response.json({ success: true, allFinished });
    }

    // Assign invoice/receipt number
    if (action === "SET_INVOICE") {
      const invoiceSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9\-]+$/);
      const parsedInvoice = invoiceSchema.safeParse(invoiceNumber);
      if (!parsedInvoice.success) {
        return new Response(JSON.stringify({ success: false, message: "invoiceNumber inválido" }), { status: 400 });
      }

      const quoter = await Quoter.findByIdAndUpdate(
        quoterId,
        { invoiceNumber: parsedInvoice.data },
        { new: true }
      );
      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }
      return Response.json({ success: true });
    }

    // Update shipping cost
    if (action === "UPDATE_SHIPPING") {
      const { shippingCost, shippingType } = body;
      if (typeof shippingCost !== "number" || shippingCost < 0) {
        return new Response(JSON.stringify({ success: false, message: "shippingCost inválido" }), { status: 400 });
      }
      const validShippingTypes = ['PAKET', 'REGION', 'EVENTO', null];
      if (!validShippingTypes.includes(shippingType ?? null)) {
        return new Response(JSON.stringify({ success: false, message: "shippingType inválido" }), { status: 400 });
      }

      const quoter = await Quoter.findById(quoterId);
      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }

      const prevShipping = quoter.shippingCost ?? 0;
      const delta = shippingCost - prevShipping;
      quoter.shippingCost = shippingCost;
      quoter.shippingType = shippingType ?? null;
      quoter.totalAmount = (quoter.totalAmount ?? 0) + delta;
      await quoter.save();

      return Response.json({ success: true, shippingCost, shippingType: quoter.shippingType, totalAmount: quoter.totalAmount });
    }

    // Edit pending quotation (products, quantities, custom products, discount)
    if (action === "EDIT_QUOTER") {
      const { products, customProducts, discount, shippingCost, shippingType, totalAmount } = body;

      const editSchema = z.object({
        totalAmount: z.number(),
        discount: z.number().min(0).max(100).default(0),
        shippingCost: z.number().min(0).default(0),
        shippingType: z.enum(['PAKET', 'REGION', 'EVENTO']).nullable().optional(),
        products: z.array(z.object({
          product: z.string(),
          productType: z.object({ description: z.string(), price: z.number() }),
          productFinish: z.object({ description: z.string(), price: z.number() }).optional(),
          amount: z.number().min(0),
          price: z.number().min(0),
          multiplier: z.number().min(1).default(1),
          isFinished: z.boolean(),
          extras: z.array(z.object({ amount: z.number(), description: z.string(), price: z.number() })),
        })),
        customProducts: z.array(z.object({
          description: z.string(),
          price: z.number().min(0),
          amount: z.number().min(0),
          isFinished: z.boolean().optional(),
        })).default([]),
      });

      const validation = editSchema.safeParse({ totalAmount, discount, shippingCost, shippingType, products, customProducts });
      if (!validation.success) {
        return new Response(JSON.stringify({ success: false, message: "Parámetros inválidos", errors: validation.error.errors }), { status: 400 });
      }

      const quoter = await Quoter.findById(quoterId);
      if (!quoter) {
        return new Response(JSON.stringify({ success: false }), { status: 404 });
      }
      if (quoter.status !== "PENDIENTE") {
        return new Response(JSON.stringify({ success: false, message: "Solo se pueden editar cotizaciones pendientes" }), { status: 400 });
      }

      quoter.products = validation.data.products;
      quoter.customProducts = validation.data.customProducts;
      quoter.discount = validation.data.discount;
      quoter.shippingCost = validation.data.shippingCost;
      quoter.shippingType = validation.data.shippingType ?? undefined;
      quoter.totalAmount = validation.data.totalAmount;
      await quoter.save();

      return Response.json({ success: true });
    }

    return new Response(JSON.stringify({ success: false, message: "Acción no válida" }), { status: 400 });
  } catch (error) {
    safeErrorLog("Error updating quoter", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
}
