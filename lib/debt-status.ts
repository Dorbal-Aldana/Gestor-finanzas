/** Fecha del próximo vencimiento (ancla + meses ya cubiertos en cuotas). */
export function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function nextDueDate(debt: {
  recurrence: string | null;
  due_date: string;
  installments_done: number | null;
}): string {
  if (debt.recurrence === "monthly") {
    return addMonthsIso(debt.due_date, debt.installments_done ?? 0);
  }
  return debt.due_date;
}

export function computeDebtStatus(input: {
  recurrence: string | null;
  amount_total: number;
  amount_paid: number;
  due_date: string;
  installments_planned: number | null;
  installments_done: number | null;
}): "pending" | "paid" | "overdue" | "cancelled" {
  const total = Number(input.amount_total);
  const paid = Number(input.amount_paid);
  const balance = Math.max(0, total - paid);
  if (balance <= 0) return "paid";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextStr = nextDueDate({
    recurrence: input.recurrence,
    due_date: input.due_date,
    installments_done: input.installments_done ?? 0
  });
  const due = new Date(nextStr + "T12:00:00");
  due.setHours(0, 0, 0, 0);

  if (due < today) return "overdue";
  return "pending";
}
