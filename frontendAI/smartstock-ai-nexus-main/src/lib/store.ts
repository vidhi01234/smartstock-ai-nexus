import { Product, SaleEntry } from './types';
import { seedProducts } from './helpers';

const KEYS = {
  products: 'smartstock_products',
  sales: 'smartstock_sales',
  auth: 'smartstock_auth',
};

function get<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Products — auto-seed on first load
export const getProducts = (): Product[] => {
  const products = get<Product>(KEYS.products, []);
  if (products.length === 0) {
    const seed = seedProducts();
    saveProducts(seed);
    return seed;
  }
  return products;
};
export const saveProducts = (p: Product[]) => set(KEYS.products, p);
export const addProduct = (p: Product) => {
  const all = getProducts();
  all.push(p);
  saveProducts(all);
};
export const deleteProduct = (id: string) => {
  saveProducts(getProducts().filter(p => p.id !== id));
};

// Sales
export const getSales = (): SaleEntry[] => get<SaleEntry>(KEYS.sales, []);
export const saveSales = (s: SaleEntry[]) => set(KEYS.sales, s);
export const addSale = (s: SaleEntry) => {
  const all = getSales();
  all.push(s);
  saveSales(all);
  const products = getProducts();
  const idx = products.findIndex(p => p.id === s.productId);
  if (idx !== -1) {
    products[idx].currentStock = Math.max(0, products[idx].currentStock - s.unitsSold);
    saveProducts(products);
  }
};

// Auth
export const isAuthenticated = (): boolean => localStorage.getItem(KEYS.auth) === 'true';
export const login = () => localStorage.setItem(KEYS.auth, 'true');
export const logout = () => localStorage.removeItem(KEYS.auth);
