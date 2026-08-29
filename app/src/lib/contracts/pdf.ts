import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { frameworkLabel } from "@/lib/compliance/frameworks";
import { renderAgreementBody } from "@/lib/contracts/template";
import type { Database } from "@/types/database";

type Contract = Database["public"]["Tables"]["client_contracts"]["Row"];
type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "name" | "compliance_frameworks" | "hipaa_covered_entity" | "compliance_notes" | "payment_terms" | "payment_method"
>;

const MARGIN_X = 56;
const PAGE_SIZE: [number, number] = [612, 792];

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateContractPdf({
  contract,
  client,
  orgName,
}: {
  contract: Contract;
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

  const draw = (text: string, opts: { size?: number; font?: PDFFont; gap?: number } = {}) => {
    ensureRoom();
    page.drawText(text, {
      x: MARGIN_X,
      y,
      size: opts.size ?? 11,
      font: opts.font ?? font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= opts.gap ?? (opts.size ?? 11) + 8;
  };

  const drawParagraph = (text: string, opts: { size?: number; font?: PDFFont } = {}) => {
    for (const line of wrapText(text, 92)) draw(line, opts);
  };

  draw(orgName, { size: 10 });
  y -= 8;
  draw(contract.name, { size: 18, font: bold, gap: 26 });
  draw(`Prepared for: ${client.name}`, { size: 12 });
  if (contract.start_date) draw(`Start date: ${contract.start_date}`);
  if (contract.end_date) draw(`End date: ${contract.end_date}`);
  if (contract.value != null) draw(`Fixed/annual value: $${Number(contract.value).toLocaleString()}`);
  if (contract.hourly_rate != null) draw(`Hourly rate: $${Number(contract.hourly_rate).toLocaleString()}/hr`);

  if (contract.notes) {
    y -= 8;
    const resolvedBody = renderAgreementBody(contract.notes, {
      clientName: client.name,
      clientAddress: contract.client_address,
      orgName,
      contractName: contract.name,
      startDate: contract.start_date,
      endDate: contract.end_date,
      value: contract.value,
      hourlyRate: contract.hourly_rate,
      servicesDescription: contract.services_description,
      paymentTerms: client.payment_terms,
      paymentMethod: client.payment_method,
    });
    for (const paragraph of resolvedBody.split(/\n+/)) {
      if (paragraph.trim()) drawParagraph(paragraph);
      y -= 4;
    }
  }

  const hasCompliance =
    contract && (client.hipaa_covered_entity || client.compliance_frameworks.length > 0 || client.compliance_notes);

  if (hasCompliance) {
    y -= 8;
    draw("Compliance & data handling", { size: 12, font: bold });
    if (client.hipaa_covered_entity) {
      drawParagraph("This engagement involves data subject to HIPAA. Data is handled as protected health information.");
    }
    if (client.compliance_frameworks.length > 0) {
      const labels = client.compliance_frameworks.map(frameworkLabel).join(", ");
      drawParagraph(`Applicable state privacy laws: ${labels}.`);
    }
    if (client.compliance_notes) {
      drawParagraph(client.compliance_notes);
    }
  }

  y -= 20;
  draw("Signature", { size: 12, font: bold });
  if (contract.status === "signed" || contract.status === "active") {
    draw(`Electronically signed by: ${contract.signed_by_name ?? "—"}`);
    draw(`Date: ${contract.signed_at ? new Date(contract.signed_at).toLocaleString() : "—"}`);
    draw(`IP address: ${contract.signer_ip ?? "—"}`);
  } else {
    draw("Not yet signed.");
  }

  return doc.save();
}
