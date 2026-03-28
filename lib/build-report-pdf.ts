import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type TxRow = [string, string, string, string, string, string, string];

type DebtRow = [string, string, string, string, string, string, string, string];

export type BuildReportPdfInput = {
  titleLine: string;
  periodLabel: string;
  includeTransactions: boolean;
  income: number;
  expenses: number;
  net: number;
  transactionRows: TxRow[];
  includeDebts: boolean;
  debtCount: number;
  debtPendingTotal: number;
  debtRows: DebtRow[];
};

export function buildFinanceReportPdf(opts: BuildReportPdfInput): Buffer {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 14;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(opts.titleLine, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periodo: ${opts.periodLabel}`, margin, y);
  y += 8;

  if (opts.includeTransactions) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(
      `Ingresos: ${opts.income.toFixed(2)}   Gastos: ${opts.expenses.toFixed(2)}   Neto: ${opts.net.toFixed(2)}`,
      margin,
      y
    );
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Tipo", "Titulo", "Categoria", "Descripcion", "Monto", "Mon."]],
      body: opts.transactionRows,
      styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 16 },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 38 },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 12 }
      },
      margin: { left: margin, right: margin },
      tableWidth: "auto"
    });
  }

  if (opts.includeDebts) {
    if (opts.includeTransactions) {
      doc.addPage();
      y = 18;
    } else {
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Cuentas por pagar (vencimiento en el periodo)", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Registros: ${opts.debtCount}   Saldo pendiente total: ${opts.debtPendingTotal.toFixed(2)}`,
      margin,
      y
    );
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Titulo", "Descripcion", "Total", "Pagado", "Pendiente", "Mon.", "Vence", "Estado"]],
      body: opts.debtRows,
      styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [120, 53, 15], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 38 },
        2: { cellWidth: 18, halign: "right" },
        3: { cellWidth: 18, halign: "right" },
        4: { cellWidth: 18, halign: "right" },
        5: { cellWidth: 12 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 }
      },
      margin: { left: margin, right: margin },
      tableWidth: "auto"
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Gestor Finanzas · Pagina ${i} / ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 8);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
