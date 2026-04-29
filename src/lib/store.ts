import { Product, SaleEntry } from './types';
import { seedProducts } from './helpers';
import { supabase } from './supabase';

const KEYS = {
  products: 'smartstock_products',
  sales: 'smartstock_sales',
  auth: 'smartstock_auth',
};

function getLocal<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Products
export const getProducts = (): Product[] => {
  const products = getLocal<Product>(KEYS.products, []);
  if (products.length === 0) {
    const seed = seedProducts();
    saveProducts(seed);
    return seed;
  }
  return products;
};

export const saveProducts = (p: Product[]) => setLocal(KEYS.products, p);

export const addProduct = async (p: Product) => {
  // Save to localStorage
  const all = getProducts();
  all.push(p);
  saveProducts(all);

  // Save to Supabase
  await supabase.from('products').insert({
    id: p.id,
    name: p.name,
    category: p.category,
    sku: p.sku,
    current_stock: p.currentStock,
    unit_price: p.unitPrice,
    min_threshold: p.minThreshold,
    expiry_date: p.expiryDate,
    added_date: p.addedDate,
  });
};

export const deleteProduct = async (id: string) => {
  saveProducts(getProducts().filter(p => p.id !== id));
  await supabase.from('products').delete().eq('id', id);
};

// Sales
export const getSales = (): SaleEntry[] => getLocal<SaleEntry>(KEYS.sales, []);
export const saveSales = (s: SaleEntry[]) => setLocal(KEYS.sales, s);

export const addSale = async (s: SaleEntry) => {
  // Save to localStorage
  const all = getSales();
  all.push(s);
  saveSales(all);

  // Update stock in localStorage
  const products = getProducts();
  const idx = products.findIndex(p => p.id === s.productId);
  if (idx !== -1) {
    products[idx].currentStock = Math.max(0, products[idx].currentStock - s.unitsSold);
    saveProducts(products);
  }

  // Save to Supabase
  await supabase.from('sales').insert({
    id: s.id,
    product_id: s.productId,
    product_name: s.productName,
    units_sold: s.unitsSold,
    date: s.date,
  });
};

// Auth
export const isAuthenticated = (): boolean => localStorage.getItem(KEYS.auth) === 'true';
export const login = () => localStorage.setItem(KEYS.auth, 'true');
export const logout = () => localStorage.removeItem(KEYS.auth);