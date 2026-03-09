import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";

// ── Colors ────────────────────────────────────────────────────────────────────
const BRAND = rgb(114 / 255, 182 / 255, 163 / 255); // #72b6A3
const WHITE = rgb(1, 1, 1);
const DARK = rgb(0.15, 0.15, 0.15);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.97, 0.97, 0.97);
const RED = rgb(0.75, 0.15, 0.15);
const SEP = rgb(0.85, 0.85, 0.85);

// ── Page constants ────────────────────────────────────────────────────────────
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_H = 22;
const FOOTER_H = 45;
const MIN_Y = FOOTER_H + 90; // Minimum y before adding a new page

// ── Helpers ───────────────────────────────────────────────────────────────────
function clp(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Replace characters outside WinAnsiEncoding (used by Helvetica) with safe equivalents */
function sanitize(s: string): string {
  return (s || "")
    .replace(/[\u2014\u2013\u2012\u2015]/g, "-") // dashes → hyphen
    .replace(/\u2026/g, "...")                    // ellipsis
    .replace(/[\u201C\u201D\u201E]/g, '"')        // smart double quotes
    .replace(/[\u2018\u2019\u201A]/g, "'")        // smart single quotes
    .replace(/\u00A0/g, " ")                      // non-breaking space
    .replace(/[^\x00-\xFF]/g, "?");               // anything outside Latin-1 → ?
}

function trunc(s: string, max: number): string {
  const clean = sanitize(s);
  return clean.length > max ? clean.slice(0, max - 1) + "." : clean;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateQuoterPdf(quoter: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ── Footer (drawn on every page) ──────────────────────────────────────────
  function drawFooter(p: PDFPage) {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: FOOTER_H, color: BRAND });
    const text = "(+56) 9 9631 7211   |   @imprentafrangreen";
    const tw = font.widthOfTextAtSize(text, 9);
    p.drawText(text, { x: (PAGE_W - tw) / 2, y: (FOOTER_H - 9) / 2, font, size: 9, color: WHITE });
  }

  // ── Page overflow check ───────────────────────────────────────────────────
  function ensureSpace(needed: number) {
    if (y - needed < MIN_Y) {
      drawFooter(page);
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────────

  // Logo
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdfDoc.embedPng(logoBytes);
      const maxH = 65;
      const scale = maxH / logo.height;
      page.drawImage(logo, {
        x: MARGIN,
        y: y - maxH,
        width: logo.width * scale,
        height: maxH,
      });
    }
  } catch { /* no logo, continue */ }

  // Title + date (right-aligned)
  const titleText = `Cotizacion #${quoter.quoterNumber}`;
  const titleW = fontBold.widthOfTextAtSize(titleText, 18);
  page.drawText(titleText, { x: PAGE_W - MARGIN - titleW, y: y - 20, font: fontBold, size: 18, color: BRAND });

  const createdDate = new Date(quoter.createdAt).toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
  const dateW = font.widthOfTextAtSize(sanitize(createdDate), 10);
  page.drawText(sanitize(createdDate), {
    x: PAGE_W - MARGIN - dateW, y: y - 38, font, size: 10, color: GRAY,
  });

  y -= 78;

  // Divider
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.8, color: SEP });
  y -= 18;

  // ─────────────────────────────────────────────────────────────────────────
  // CLIENT INFO
  // ─────────────────────────────────────────────────────────────────────────
  page.drawText(trunc(quoter.artist || "", 60), { x: MARGIN, y, font: fontBold, size: 13, color: BRAND });
  y -= 18;

  if (quoter.dateLimit) {
    const dl = sanitize(
      new Date(quoter.dateLimit).toLocaleDateString("es-CL", {
        day: "numeric", month: "long", year: "numeric",
      })
    );
    page.drawText(`Fecha de entrega: ${dl}`, { x: MARGIN, y, font, size: 10, color: GRAY });
    y -= 15;
  }
  y -= 16;

  // ─────────────────────────────────────────────────────────────────────────
  // TABLE
  // ─────────────────────────────────────────────────────────────────────────
  const COL_W = [CONTENT_W - 65 - 88 - 82, 65, 88, 82] as const;
  const COL_X = [
    MARGIN,
    MARGIN + COL_W[0],
    MARGIN + COL_W[0] + COL_W[1],
    MARGIN + COL_W[0] + COL_W[1] + COL_W[2],
  ] as const;

  const HEADER_H = 26;
  page.drawRectangle({ x: MARGIN, y: y - HEADER_H, width: CONTENT_W, height: HEADER_H, color: BRAND });

  const headers = ["Descripcion", "Cantidad", "Valor Und.", "Total"];
  const hAligns = ["left", "center", "right", "right"] as const;
  headers.forEach((h, i) => {
    const sz = 9;
    const hw = fontBold.widthOfTextAtSize(h, sz);
    const hx =
      hAligns[i] === "left"   ? COL_X[i] + 8 :
      hAligns[i] === "center" ? COL_X[i] + (COL_W[i] - hw) / 2 :
                                COL_X[i] + COL_W[i] - hw - 8;
    page.drawText(h, { x: hx, y: y - HEADER_H + (HEADER_H - sz) / 2, font: fontBold, size: sz, color: WHITE });
  });
  y -= HEADER_H;

  // Line items
  interface LineItem { description: string; quantity: number; unitPrice: number; total: number; isExtra: boolean; }
  const lineItems: LineItem[] = [];

  (quoter.products || []).forEach((p: any) => {
    const name = p.product?.name || "Producto";
    const type = p.productType?.description || "";
    const finish = p.productFinish?.description ? ` - ${p.productFinish.description}` : "";
    lineItems.push({ description: `${name} ${type}${finish}`, quantity: p.amount, unitPrice: p.price, total: p.price * p.amount, isExtra: false });
    (p.extras || []).forEach((e: any) => {
      lineItems.push({ description: `Extra: ${e.description}`, quantity: e.amount, unitPrice: e.price, total: e.price * e.amount, isExtra: true });
    });
  });
  (quoter.customProducts || []).forEach((cp: any) => {
    lineItems.push({ description: cp.description, quantity: cp.amount, unitPrice: cp.price, total: cp.price * cp.amount, isExtra: false });
  });

  lineItems.forEach((item, idx) => {
    ensureSpace(ROW_H + 5);
    const rowBg = idx % 2 === 0 ? WHITE : LIGHT_GRAY;
    page.drawRectangle({ x: MARGIN, y: y - ROW_H, width: CONTENT_W, height: ROW_H, color: rowBg });
    page.drawLine({ start: { x: MARGIN, y: y - ROW_H }, end: { x: MARGIN + CONTENT_W, y: y - ROW_H }, thickness: 0.3, color: SEP });

    const sz = 9;
    const ry = y - ROW_H + (ROW_H - sz) / 2;
    const tcolor = item.isExtra ? GRAY : DARK;
    const prefix = item.isExtra ? "  " : "";
    page.drawText(prefix + trunc(item.description, item.isExtra ? 58 : 63), { x: COL_X[0] + 8, y: ry, font, size: sz, color: tcolor });

    const qStr = String(item.quantity);
    page.drawText(qStr, { x: COL_X[1] + (COL_W[1] - font.widthOfTextAtSize(qStr, sz)) / 2, y: ry, font, size: sz, color: DARK });

    const uStr = clp(item.unitPrice);
    page.drawText(uStr, { x: COL_X[2] + COL_W[2] - font.widthOfTextAtSize(uStr, sz) - 8, y: ry, font, size: sz, color: DARK });

    const tStr = clp(item.total);
    page.drawText(tStr, { x: COL_X[3] + COL_W[3] - font.widthOfTextAtSize(tStr, sz) - 8, y: ry, font, size: sz, color: DARK });

    y -= ROW_H;
  });

  y -= 24;

  // ─────────────────────────────────────────────────────────────────────────
  // TOTALS
  // ─────────────────────────────────────────────────────────────────────────
  const grossTotal = lineItems.reduce((s, i) => s + i.total, 0);
  const discountAmount = quoter.discount > 0 ? (grossTotal * quoter.discount) / 100 : 0;
  const shippingCost = quoter.shippingCost ?? 0;
  const total = grossTotal - discountAmount + shippingCost;
  const neto = Math.round(total / 1.19);
  const iva = total - neto;

  const TOT_W = 220;
  const TOT_X = PAGE_W - MARGIN - TOT_W;
  const TOT_ROW_H = 22;

  function drawTotalsRow(label: string, value: string, bold: boolean, vColor: ReturnType<typeof rgb>) {
    ensureSpace(TOT_ROW_H + 5);
    page.drawLine({ start: { x: TOT_X, y: y - TOT_ROW_H }, end: { x: TOT_X + TOT_W, y: y - TOT_ROW_H }, thickness: 0.4, color: SEP });
    const f = bold ? fontBold : font;
    const sz = 9;
    const ty = y - TOT_ROW_H + (TOT_ROW_H - sz) / 2;
    page.drawText(label, { x: TOT_X + 8, y: ty, font: f, size: sz, color: DARK });
    const vw = f.widthOfTextAtSize(value, sz);
    page.drawText(value, { x: TOT_X + TOT_W - vw - 8, y: ty, font: f, size: sz, color: vColor });
    y -= TOT_ROW_H;
  }

  if (quoter.discount > 0) {
    drawTotalsRow(`DESCUENTO ${quoter.discount}%:`, `-${clp(discountAmount)}`, false, RED);
  }
  if (shippingCost > 0 || quoter.shippingType) {
    const shLabel =
      quoter.shippingType === "PAKET" ? "ENVIO POR PAKET" :
      quoter.shippingType === "REGION" ? "ENVIO A REGION" :
      quoter.shippingType === "EVENTO" ? "ENTREGA EN EVENTO" :
      "COSTO DE ENVIO";
    drawTotalsRow(`${shLabel}:`, shippingCost > 0 ? clp(shippingCost) : "Sin costo", false, DARK);
  }
  drawTotalsRow("NETO:", clp(neto), false, DARK);
  drawTotalsRow("IVA (19%):", clp(iva), false, DARK);

  // Total highlighted row
  const TOTAL_H = 28;
  ensureSpace(TOTAL_H + 10);
  page.drawRectangle({ x: TOT_X, y: y - TOTAL_H, width: TOT_W, height: TOTAL_H, color: BRAND });
  const tsz = 11;
  const totalStr = clp(total);
  const tsw = fontBold.widthOfTextAtSize(totalStr, tsz);
  const tty = y - TOTAL_H + (TOTAL_H - tsz) / 2;
  page.drawText("TOTAL:", { x: TOT_X + 10, y: tty, font: fontBold, size: tsz, color: WHITE });
  page.drawText(totalStr, { x: TOT_X + TOT_W - tsw - 10, y: tty, font: fontBold, size: tsz, color: WHITE });
  y -= TOTAL_H + 28;

  // ─────────────────────────────────────────────────────────────────────────
  // NOTES
  // ─────────────────────────────────────────────────────────────────────────
  ensureSpace(50);
  page.drawText("Nota:", { x: MARGIN, y, font: fontBold, size: 9, color: DARK });
  page.drawText("La cotizacion es valida por 3 dias.", { x: MARGIN, y: y - 14, font, size: 8, color: GRAY });
  page.drawText("La fecha de ejecucion del servicio se coordinara segun disponibilidad.", {
    x: MARGIN, y: y - 26, font, size: 8, color: GRAY,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER (last page)
  // ─────────────────────────────────────────────────────────────────────────
  drawFooter(page);

  return pdfDoc.save();
}
