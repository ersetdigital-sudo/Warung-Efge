import { Product } from "@/types";
import { products as initialProducts } from "@/data/mock-data";

const STORAGE_KEY = "warung-efge-products";

export function getProducts(): Product[] {
  if (typeof window === "undefined") return initialProducts;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch { return initialProducts; }
  }
  return initialProducts;
}

export function saveProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function addProduct(product: Product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

export function updateProduct(id: string, data: Partial<Product>) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) { products[idx] = { ...products[idx], ...data }; saveProducts(products); }
}

export function deleteProduct(id: string) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}
