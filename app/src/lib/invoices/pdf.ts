import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type LineItem = Database["public"]["Tables"]["invoice_line_items"]["Row"];
type ClientRow = Pick<Database["public"]["Tables"]["clients"]["Row"], "name" | "payment_terms" | "payment_method">;

const MARGIN_X = 56;
const PAGE_SIZE: [number, number] = [612, 792];
const PAGE_WIDTH = PAGE_SIZE[0];

function money(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateInvoicePdf({
  invoice,
  lineItems,
  client,
  orgName,
}: {
  invoice: Invoice;
  lineItems: LineItem[];
  client: ClientRow;
  orgName: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage(PAGE_SIZE);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 740;

  const ensureRoom = (needed = 20) => {
    if (y < needed + 40) {
      page = doc.addPage(PAGE_SIZE);
      y = 740;
    }
  };

  const draw = (
    text: string,
    x = MARGIN_X,
    opts: { size?: number; font?: PDFFont; gap?: number } = {}
  ) => {
    ensureRoom();
    page.drawText(text, {
      x,
      y,
      size: opts.size ?? 11,
      font: opts.font ?? font,
      color: rgb(0.1, 0.1, 0.1),
    });
    return y;
  };

  const line = (text: string, opts: { size?: number; font?: PDFFont; gap?: number } = {}) => {
    draw(text, MARGIN_X, opts);
    y -= opts.gap ?? (opts.size ?? 11) + 8;
  };

  line(orgName, { size: 10 });
  y -= 6;
  line("INVOICE", { size: 20, font: bold, gap: 28 });

  line(`Invoice #: ${invoice.invoice_number}`, { size: 11 });
  line(`Issue date: ${invoice.issue_date}`);
  if (invoice.due_date) line(`Due date: ${invoice.due_date}`);
  line(`Status: ${invoice.status.toUpperCase()}`, { font: bold });

  y -= 8;
  line("Bill to", { size: 11, font: bold });
  line(client.name);
  if (invoice.billing_contact_name) line(invoice.billing_contact_name);
  if (invoice.billing_contact_email) line(invoice.billing_contact_email);

  y -= 12;

  // Table header
  ensureRoom(24);
  const colDesc = MARGIN_X;
  const colQty = 360;
  const colRate = 430;
  const colAmount = PAGE_WIDTH - MARGIN_X;
  page.drawText("Description", { x: colDesc, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Qty", { x: colQty, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText("Rate", { x: colRate, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  const totalLabelWidth = bold.widthOfTextAtSize("Amount", 10);
  page.drawText("Amount", { x: colAmount - totalLabelWidth, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });
  y -= 16;

  for (const item of lineItems) {
    ensureRoom(20);
    const desc = item.description.length > 55 ? `${item.description.slice(0, 52)}...` : item.description;
    page.drawText(desc, { x: colDesc, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(String(item.quantity), { x: colQty, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(money(item.unit_price), { x: colRate, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
    const amountText = money(item.amount);
    const amountWidth = font.widthOfTextAtSize(amountText, 10);
    page.drawText(amountText, { x: colAmount - amountWidth, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  }

  y -= 6;
  ensureRoom(24);
  page.drawLine({
    start: { x: 340, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });
  y -= 18;

  const summaryRow = (label: string, value: string, opts: { font?: PDFFont } = {}) => {
    ensureRoom(18);
    page.drawText(label, { x: 340, y, size: 11, font: opts.font ?? font, color: rgb(0.1, 0.1, 0.1) });
    const textFont = opts.font ?? font;
    const width = textFont.widthOfTextAtSize(value, 11);
    page.drawText(value, { x: PAGE_WIDTH - MARGIN_X - width, y, size: 11, font: textFont, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  };

  summaryRow("Subtotal", money(invoice.subtotal));
  if (invoice.tax_rate > 0) summaryRow(`Tax (${invoice.tax_rate}%)`, money(invoice.tax_amount));
  summaryRow("Total due", money(invoice.total), { font: bold });

  if (invoice.notes) {
    y -= 16;
    line("Notes", { size: 11, font: bold });
    for (const paragraph of invoice.notes.split(/\n+/)) {
      if (paragraph.trim()) line(paragraph, { size: 10 });
    }
  }

  if (client.payment_terms || client.payment_method) {
    y -= 8;
    line("Payment", { size: 11, font: bold });
    if (client.payment_terms) line(`Terms: ${client.payment_terms}`, { size: 10 });
    if (client.payment_method) line(`Method: ${client.payment_method}`, { size: 10 });
  }

  return doc.save();
}
