import { supabase } from "./supabase";

// ============ PRODUCTS ============
export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("getProducts error:", error); return []; }
  return data || [];
}

export async function getProductById(id: string) {
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  return data;
}

export async function addProduct(product: Record<string, unknown>) {
  const { data, error } = await supabase.from("products").insert(product).select().single();
  if (error) { console.error("addProduct error:", error.message, error.details, error.hint); return null; }
  return data;
}

export async function updateProduct(id: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from("products").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("updateProduct error:", error);
  return !error;
}

export async function deleteProduct(id: string) {
  // Hard delete — remove from database completely
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) console.error("deleteProduct error:", error);
  return !error;
}

// ============ CUSTOMERS ============
export async function getCustomers() {
  const { data, error } = await supabase.from("customers").select("*").order("name");
  if (error) { console.error("getCustomers error:", error); return []; }
  return data || [];
}

export async function updateCustomerDebt(id: string, newDebt: number) {
  const { error } = await supabase.from("customers").update({ debt: newDebt }).eq("id", id);
  return !error;
}

// ============ DEBT PAYMENTS ============
export async function addDebtPayment(payment: { customer_id: string; amount: number; method: string; note: string }) {
  const { data, error } = await supabase.from("debt_payments").insert(payment).select().single();
  if (error) { console.error("addDebtPayment error:", error); return null; }
  return data;
}

export async function getDebtPayments(customerId?: string) {
  let query = supabase.from("debt_payments").select("*").order("created_at", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  const { data } = await query;
  return data || [];
}

// ============ TRANSACTIONS ============
export async function addTransaction(trx: Record<string, unknown>, items: Record<string, unknown>[]) {
  const { data, error } = await supabase.from("transactions").insert(trx).select().single();
  if (error) { console.error("addTransaction error:", error); return null; }
  if (data && items.length > 0) {
    const itemsWithTrxId = items.map(i => ({ ...i, transaction_id: data.id }));
    await supabase.from("transaction_items").insert(itemsWithTrxId);
  }
  return data;
}

export async function getTransactions() {
  const { data } = await supabase.from("transactions").select("*, transaction_items(*)").order("created_at", { ascending: false });
  return data || [];
}

// ============ SUPPLIERS ============
export async function getSuppliers() {
  const { data } = await supabase.from("suppliers").select("*").order("name");
  return data || [];
}

// ============ STOCK MOVEMENTS ============
export async function addStockMovement(movement: Record<string, unknown>) {
  const { error } = await supabase.from("stock_movements").insert(movement);
  return !error;
}

export async function getStockMovements() {
  const { data } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false });
  return data || [];
}

// ============ PRODUCT UNITS (Multi-level) ============
export async function getProductUnits(productId: string) {
  const { data } = await supabase.from("product_units").select("*").eq("product_id", productId).order("level");
  return data || [];
}

export async function getProductsWithUnits() {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_units(*)")
    .order("created_at", { ascending: false });
  if (error) { console.error("getProductsWithUnits error:", error); return []; }
  return data || [];
}

export async function saveProductUnits(productId: string, units: { level: number; name: string; conversion: number | null; stock: number; buy_price: number; sell_price: number }[]) {
  // Delete existing units for this product
  await supabase.from("product_units").delete().eq("product_id", productId);
  // Insert new units
  if (units.length > 0) {
    const rows = units.map(u => ({ product_id: productId, ...u }));
    const { error } = await supabase.from("product_units").insert(rows);
    if (error) console.error("saveProductUnits error:", error);
  }
}

// ============ USERS ============
export async function getUsers() {
  const { data } = await supabase.from("users").select("*").order("created_at");
  return data || [];
}
