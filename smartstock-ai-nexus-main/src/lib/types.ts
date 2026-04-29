export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  unitPrice: number;
  minThreshold: number;
  expiryDate: string; // DD/MM/YYYY
  addedDate: string;
}

export interface SaleEntry {
  id: string;
  productId: string;
  productName: string;
  unitsSold: number;
  date: string; // DD/MM/YYYY
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  category: string;
  rating: number;
}

export interface ForecastEntry {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  gap: number;
}

export type ProductStatus = 'EXPIRED' | 'LOW_STOCK' | 'OVERFLOW' | 'OK';

export const CATEGORIES = ['Dairy', 'Grains', 'Beverages', 'Snacks', 'Fruits', 'Vegetables', 'Bakery', 'Spices', 'Oil & Ghee', 'Personal Care'] as const;
