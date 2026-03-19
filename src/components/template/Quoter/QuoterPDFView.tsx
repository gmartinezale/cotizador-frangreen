"use client";

import Image from "next/image";
import formatCurrency from "@/utils/formatCurrency";

interface QuoterProduct {
  product: { _id: string; name: string; types?: { description: string; multiplier?: number }[] } | null;
  productType: { description: string; price: number };
  productFinish?: { description: string; price: number };
  amount: number;
  price: number;
  multiplier?: number;
  isFinished: boolean;
  extras: { description: string; price: number; amount: number }[];
}

interface CustomProduct {
  description: string;
  price: number;
  amount: number;
}

interface QuoterData {
  _id: string;
  quoterNumber: number;
  totalAmount: number;
  artist: string;
  products: QuoterProduct[];
  customProducts: CustomProduct[];
  discount: number;
  shippingCost?: number;
  shippingType?: string | null;
  dateLimit?: string;
  status: string;
  createdAt: string;
}

interface QuoterPDFViewProps {
  quoter: QuoterData;
}

export default function QuoterPDFView({ quoter }: QuoterPDFViewProps) {
  const createdDate = new Date(quoter.createdAt);
  const formattedDate = createdDate.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build line items for the table
  const lineItems: { description: string; quantity: number; unitPrice: number; total: number; multiplier: number }[] = [];

  // Retroactive multiplier: prefers stored field, fallback to product catalog lookup by type description
  function resolveMultiplier(p: QuoterProduct): number {
    if (p.multiplier && p.multiplier > 1) return p.multiplier;
    const types = p.product?.types;
    if (types) {
      const matched = types.find((t) => t.description === p.productType?.description);
      if (matched?.multiplier && matched.multiplier > 1) return matched.multiplier;
    }
    return 1;
  }

  quoter.products.forEach((p) => {
    const productName = p.product?.name || "Producto";
    const typeDesc = p.productType?.description || "";
    const finishDesc = p.productFinish?.description ? ` - ${p.productFinish.description}` : "";
    const description = `${productName} — ${typeDesc}${finishDesc}`;

    lineItems.push({
      description,
      quantity: p.amount,
      unitPrice: p.price,
      total: p.price * p.amount,
      multiplier: resolveMultiplier(p),
    });

    // Extras for this product
    if (p.extras && p.extras.length > 0) {
      p.extras.forEach((extra) => {
        lineItems.push({
          description: `  ↳ Extra: ${extra.description}`,
          quantity: extra.amount,
          unitPrice: extra.price,
          total: extra.price * extra.amount,
          multiplier: 1,
        });
      });
    }
  });

  // Custom products
  if (quoter.customProducts && quoter.customProducts.length > 0) {
    quoter.customProducts.forEach((cp) => {
      lineItems.push({
        description: cp.description,
        quantity: cp.amount,
        unitPrice: cp.price,
        total: cp.price * cp.amount,
        multiplier: 1,
      });
    });
  }

  const grossTotal = lineItems.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = quoter.discount > 0 ? (grossTotal * quoter.discount) / 100 : 0;
  const shippingCost = quoter.shippingCost ?? 0;
  const total = grossTotal - discountAmount + shippingCost;
  // Desglose IVA: los precios ya incluyen 19% IVA
  const neto = Math.round(total / 1.19);
  const iva = total - neto;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print button - hidden on print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* PDF Content */}
      <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
        <div
          className="mx-auto bg-white shadow-xl print:shadow-none"
          style={{
            width: "210mm",
            minHeight: "297mm",
            maxWidth: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Main Content */}
          <div className="flex-1 px-12 pt-10 pb-6" style={{ paddingBottom: "100px" }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-10">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">{formattedDate}</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">
                  Cotización #{quoter.quoterNumber}
                </p>
              </div>
            </div>

            {/* Client info */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-600 mb-1">
                {quoter.artist}
              </h3>
              {quoter.dateLimit && (
                <p className="text-sm text-gray-500">
                  Fecha de entrega:{" "}
                  {new Date(quoter.dateLimit).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Products Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: '#72b6A3' }}>
                    <th className="text-left py-3 px-4 text-sm font-semibold rounded-tl-lg">
                      Descripción
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold w-24">
                      Cantidad
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold w-24">
                      Und
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold rounded-tr-lg w-32">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const isExtra = item.description.startsWith("  ↳");
                    return (
                      <tr
                        key={index}
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td
                          className={`py-3 px-4 text-sm ${
                            isExtra
                              ? "text-gray-500 italic pl-8"
                              : "text-gray-700"
                          }`}
                        >
                          {item.description}
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">
                          <span>{item.quantity}</span>
                          {item.multiplier > 1 && (
                            <span className="block text-xs text-purple-500">
                              ({item.quantity * item.multiplier} uds.)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-center text-gray-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-800">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-72">
                {quoter.discount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-sm text-gray-700">
                      DESCUENTO {quoter.discount}%:
                    </span>
                    <span className="text-sm text-red-600 font-medium">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}                {(shippingCost > 0 || quoter.shippingType) && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-semibold text-sm text-gray-700">
                      {quoter.shippingType === 'PAKET' ? 'ENVÍO POR PAKET'
                        : quoter.shippingType === 'REGION' ? 'ENVÍO A REGIÓN'
                        : quoter.shippingType === 'EVENTO' ? 'ENTREGA EN EVENTO'
                        : 'COSTO DE ENVÍO'}:
                    </span>
                    <span className="text-sm text-gray-800 font-medium">
                      {shippingCost > 0 ? formatCurrency(shippingCost) : 'Sin costo'}
                    </span>
                  </div>
                )}                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold text-sm text-gray-700">NETO:</span>
                  <span className="text-sm text-gray-800 font-medium">{formatCurrency(neto)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-semibold text-sm text-gray-700">IVA (19%):</span>
                  <span className="text-sm text-gray-800 font-medium">{formatCurrency(iva)}</span>
                </div>
                <div className="flex justify-between py-3 text-white px-4 rounded-lg mt-2" style={{ backgroundColor: '#72b6A3' }}>
                  <span className="font-bold text-base">TOTAL:</span>
                  <span className="font-bold text-base">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Note and signature */}
            <div className="flex justify-between items-end mt-8">
              <div className="max-w-md">
                <h4 className="font-bold text-sm text-gray-800 mb-1">Nota:</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  La cotización es válida por 3 días. 
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  La fecha de ejecución del servicio se coordinará según disponibilidad.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="text-white px-12 py-4 flex items-center justify-center gap-8 text-sm"
            style={{
              backgroundColor: '#72b6A3',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0",
            }}
          >
            {/* Phone */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>(+56) 9 9631 7211</span>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>@fran_green_</span>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>imprenta.frangreen@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
