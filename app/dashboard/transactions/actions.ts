"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function updateTransaction(formData: FormData) {
  const supabase = createSupabaseServerClient();
  
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const rawAmount = formData.get("amount") as string;
  const amount = parseFloat(rawAmount);

  if (isNaN(amount)) {
    throw new Error("El monto debe ser un número válido");
  }

  const type = formData.get("type") as "income" | "expense";
  const currency = formData.get("currency") as string;
  const datetime = formData.get("datetime") as string;
  const notes = formData.get("notes") as string;
  const category_id = formData.get("category_id") as string || null;

  const { error } = await supabase
    .from("transactions")
    .update({
      title,
      amount,
      type,
      currency,
      datetime,
      notes,
      category_id: category_id === "" ? null : category_id,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?tab=movements");
}