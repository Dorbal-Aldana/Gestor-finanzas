/**
 * Crea 2 usuarios de prueba con perfil, cuentas, categorías y transacciones.
 * Ejecutar: npm run seed
 * Requiere: .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_CATEGORIES = [
  { name: "Clínica", type: "income" },
  { name: "Alquileres", type: "income" },
  { name: "Inversiones", type: "income" },
  { name: "Otros ingresos", type: "income" },
  { name: "Gastos fijos", type: "expense" },
  { name: "Suministros", type: "expense" },
  { name: "Personal", type: "expense" },
  { name: "Servicios", type: "expense" },
  { name: "Otros gastos", type: "expense" }
];

const USERS = [
  { email: "demo1@gestor-finanzas.local", password: "Demo123456!", full_name: "Usuario Demo 1" },
  { email: "demo2@gestor-finanzas.local", password: "Demo123456!", full_name: "Usuario Demo 2" }
];

async function ensureProfile(admin, userId, fullName) {
  const { error } = await admin.from("profiles").upsert(
    { id: userId, full_name: fullName },
    { onConflict: "id" }
  );
  if (error) console.warn("Profile upsert:", error.message);
}

async function seedUser(admin, { email, password, full_name }) {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);
  let userId;

  if (found) {
    userId = found.id;
    console.log("Usuario ya existe:", email);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });
    if (error) {
      console.error("Error creando usuario", email, error.message);
      return;
    }
    userId = data.user.id;
    console.log("Usuario creado:", email);
  }

  await ensureProfile(admin, userId, full_name);

  const { data: accounts } = await admin.from("accounts").select("id").eq("user_id", userId);
  if (!accounts?.length) {
    const { data: insAccount } = await admin
      .from("accounts")
      .insert({
        user_id: userId,
        name: "Registro personal",
        type: "cash",
        currency: "GTQ",
        initial_balance: 0
      })
      .select("id")
      .single();
    const accountId = insAccount?.id;
    if (accountId) {
      await admin.from("accounts").insert({
        user_id: userId,
        name: "Cuenta banco",
        type: "bank",
        currency: "GTQ",
        initial_balance: 5000
      });
      console.log("  Cuentas creadas");
    }
  }

  const { data: categories } = await admin.from("categories").select("id").eq("user_id", userId);
  if (!categories?.length) {
    await admin.from("categories").insert(
      DEFAULT_CATEGORIES.map((c) => ({ user_id: userId, name: c.name, type: c.type }))
    );
    console.log("  Categorías creadas");
  }

  const { data: accs } = await admin.from("accounts").select("id").eq("user_id", userId).limit(1);
  const accountId = accs?.[0]?.id;
  if (!accountId) {
    console.warn("  Sin cuenta, no se crean transacciones");
    return;
  }

  const { count: txCount } = await admin
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (!txCount || txCount === 0) {
    const now = new Date();
    const base = [
      { title: "Consulta dental", amount: 350, type: "income", currency: "GTQ" },
      { title: "Alquiler Casa Amatitlán", amount: 2500, type: "income", currency: "GTQ" },
      { title: "Suministros clínica", amount: 420, type: "expense", currency: "GTQ" },
      { title: "Servicios", amount: 180, type: "expense", currency: "GTQ" }
    ];
    await admin.from("transactions").insert(
      base.map((t) => ({
        user_id: userId,
        account_id: accountId,
        title: t.title,
        amount: t.amount,
        type: t.type,
        currency: t.currency,
        datetime: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
      }))
    );
    console.log("  Transacciones de ejemplo creadas");
  }
}

async function main() {
  console.log("Iniciando seed...\n");
  for (const u of USERS) {
    await seedUser(supabase, u);
  }
  console.log("\nSeed terminado. Puedes iniciar sesión con:");
  USERS.forEach((u) => console.log("  ", u.email, " / ", u.password));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
