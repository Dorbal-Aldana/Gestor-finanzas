"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { computeDebtStatus } from "../../../lib/debt-status";

export async function createDebt(formData: FormData) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: userData } = await supabaseAuth.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const title = String(formData.get("title") || "").trim();
  const descriptionRaw = String(formData.get("description") || "").trim();
  const description = descriptionRaw.length > 0 ? descriptionRaw : null;
  const currency = String(formData.get("currency") || "GTQ");
  const due_date = String(formData.get("due_date") || "").trim();
  const recurrence = String(formData.get("recurrence") || "once") === "monthly" ? "monthly" : "once";

  let amount_total: number;
  let amount_paid = Number(formData.get("amount_paid") || 0);
  let monthly_amount: number | null = null;
  let installments_planned: number | null = null;
  let installments_done = 0;

  if (recurrence === "monthly") {
    const ma = Number(formData.get("monthly_amount") || 0);
    const months = Math.floor(Number(formData.get("installments_planned") || 0));
    if (!title || !due_date || !Number.isFinite(ma) || ma <= 0 || months < 1) {
      redirect("/dashboard/debts?error=invalid_monthly");
    }
    monthly_amount = ma;
    installments_planned = months;
    amount_total = Math.round(ma * months * 100) / 100;
  } else {
    amount_total = Number(formData.get("amount_total") || 0);
    if (!title || !due_date || !Number.isFinite(amount_total) || amount_total <= 0) {
      redirect("/dashboard/debts?error=invalid");
    }
  }

  if (!Number.isFinite(amount_paid) || amount_paid < 0 || amount_paid > amount_total) {
    redirect("/dashboard/debts?error=invalid_paid");
  }

  const status = computeDebtStatus({
    recurrence,
    amount_total,
    amount_paid,
    due_date,
    installments_planned,
    installments_done
  });

  const { error } = await supabaseAuth.from("debts").insert({
    user_id: user.id,
    title,
    description,
    amount_total,
    amount_paid,
    currency,
    due_date,
    status,
    recurrence,
    monthly_amount,
    installments_planned,
    installments_done
  });

  if (error) {
    redirect(`/dashboard/debts?error=save&msg=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/debts");
  redirect("/dashboard/debts");
}

export async function recordDebtPayment(formData: FormData) {
  const supabaseAuth = createSupabaseServerClient();
  const { data: userData } = await supabaseAuth.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/sign-in");

  const debt_id = String(formData.get("debt_id") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const payment_date = String(formData.get("payment_date") || "").trim();
  const noteRaw = String(formData.get("note") || "").trim();
  const note = noteRaw.length > 0 ? noteRaw : null;

  if (!debt_id || !payment_date || !Number.isFinite(amount) || amount <= 0) {
    redirect("/dashboard/debts?tab=payments&error=invalid_payment");
  }

  const { data: debt, error: fetchErr } = await supabaseAuth
    .from("debts")
    .select(
      "id,amount_total,amount_paid,recurrence,due_date,installments_planned,installments_done,currency"
    )
    .eq("id", debt_id)
    .single();

  if (fetchErr || !debt) {
    redirect("/dashboard/debts?tab=payments&error=invalid_debt");
  }

  const total = Number(debt.amount_total);
  const paid = Number(debt.amount_paid);
  const balance = Math.max(0, total - paid);
  if (amount > balance + 0.009) {
    redirect("/dashboard/debts?tab=payments&error=overpay");
  }

  const rec = debt.recurrence === "monthly" ? "monthly" : "once";
  const planned = debt.installments_planned;
  const done = debt.installments_done ?? 0;

  if (rec === "monthly" && planned != null && done >= planned) {
    redirect("/dashboard/debts?tab=payments&error=plan_done");
  }

  const { error: insErr } = await supabaseAuth.from("debt_payments").insert({
    user_id: user.id,
    debt_id,
    amount,
    payment_date,
    note
  });

  if (insErr) {
    redirect(`/dashboard/debts?tab=payments&error=save&msg=${encodeURIComponent(insErr.message)}`);
  }

  const newPaid = Math.round((paid + amount) * 100) / 100;
  const newDone = rec === "monthly" ? done + 1 : done;

  const status = computeDebtStatus({
    recurrence: rec,
    amount_total: total,
    amount_paid: newPaid,
    due_date: debt.due_date,
    installments_planned: planned,
    installments_done: newDone
  });

  const { error: upErr } = await supabaseAuth
    .from("debts")
    .update({
      amount_paid: newPaid,
      installments_done: newDone,
      status
    })
    .eq("id", debt_id);

  if (upErr) {
    redirect(`/dashboard/debts?tab=payments&error=save&msg=${encodeURIComponent(upErr.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/debts");
  redirect("/dashboard/debts?tab=payments");
}
