import { Product, ProductStatus } from './types';

export const toINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export const formatDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

export const parseDate = (ddmmyyyy: string): Date => {
  const [d, m, y] = ddmmyyyy.split('/').map(Number);
  return new Date(y, m - 1, d);
};

export const getProductStatus = (product: Product, predictedDemand?: number): ProductStatus => {
  const expiry = parseDate(product.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiry < today) return 'EXPIRED';
  if (product.currentStock < product.minThreshold) return 'LOW_STOCK';
  if (predictedDemand && product.currentStock > predictedDemand * 2) return 'OVERFLOW';
  return 'OK';
};

export const generateId = () => crypto.randomUUID();

// Seed data
export const seedProducts = (): Product[] => [
  { id: generateId(), name: 'Amul Butter 500g', category: 'Dairy', sku: 'DAI-001', currentStock: 45, unitPrice: 270, minThreshold: 20, expiryDate: '25/03/2026', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Mother Dairy Milk 1L', category: 'Dairy', sku: 'DAI-002', currentStock: 12, unitPrice: 60, minThreshold: 30, expiryDate: '20/03/2026', addedDate: '01/03/2026' },
  { id: generateId(), name: 'Amul Paneer 200g', category: 'Dairy', sku: 'DAI-003', currentStock: 18, unitPrice: 90, minThreshold: 10, expiryDate: '22/03/2026', addedDate: '10/03/2026' },
  { id: generateId(), name: 'Aashirvaad Atta 5kg', category: 'Grains', sku: 'GRN-001', currentStock: 120, unitPrice: 325, minThreshold: 30, expiryDate: '15/09/2026', addedDate: '01/01/2026' },
  { id: generateId(), name: 'India Gate Basmati Rice 5kg', category: 'Grains', sku: 'GRN-002', currentStock: 80, unitPrice: 450, minThreshold: 20, expiryDate: '01/12/2026', addedDate: '01/02/2026' },
  { id: generateId(), name: 'Toor Dal 1kg', category: 'Grains', sku: 'GRN-003', currentStock: 4, unitPrice: 160, minThreshold: 15, expiryDate: '01/08/2026', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Britannia Bread', category: 'Bakery', sku: 'BAK-001', currentStock: 8, unitPrice: 45, minThreshold: 15, expiryDate: '20/03/2026', addedDate: '15/03/2026' },
  { id: generateId(), name: 'Britannia Cake Rusk 300g', category: 'Bakery', sku: 'BAK-002', currentStock: 25, unitPrice: 55, minThreshold: 10, expiryDate: '15/05/2026', addedDate: '01/02/2026' },
  { id: generateId(), name: 'Tata Tea Gold 500g', category: 'Beverages', sku: 'BEV-001', currentStock: 200, unitPrice: 285, minThreshold: 25, expiryDate: '01/12/2026', addedDate: '01/02/2026' },
  { id: generateId(), name: 'Nescafe Classic 100g', category: 'Beverages', sku: 'BEV-002', currentStock: 40, unitPrice: 310, minThreshold: 10, expiryDate: '01/06/2027', addedDate: '01/03/2026' },
  { id: generateId(), name: 'Tropicana Orange Juice 1L', category: 'Beverages', sku: 'BEV-003', currentStock: 6, unitPrice: 120, minThreshold: 12, expiryDate: '25/03/2026', addedDate: '01/03/2026' },
  { id: generateId(), name: 'Fortune Sunflower Oil 1L', category: 'Oil & Ghee', sku: 'OIL-001', currentStock: 55, unitPrice: 155, minThreshold: 20, expiryDate: '10/06/2026', addedDate: '01/03/2026' },
  { id: generateId(), name: 'Amul Ghee 500ml', category: 'Oil & Ghee', sku: 'OIL-002', currentStock: 30, unitPrice: 310, minThreshold: 8, expiryDate: '01/11/2026', addedDate: '15/01/2026' },
  { id: generateId(), name: 'Parle-G Biscuits', category: 'Snacks', sku: 'SNK-001', currentStock: 5, unitPrice: 10, minThreshold: 50, expiryDate: '01/03/2026', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Haldiram Namkeen 400g', category: 'Snacks', sku: 'SNK-002', currentStock: 35, unitPrice: 120, minThreshold: 15, expiryDate: '30/07/2026', addedDate: '01/02/2026' },
  { id: generateId(), name: 'Lays Classic Chips 90g', category: 'Snacks', sku: 'SNK-003', currentStock: 60, unitPrice: 30, minThreshold: 20, expiryDate: '15/08/2026', addedDate: '01/03/2026' },
  { id: generateId(), name: 'Maggi Noodles 12-Pack', category: 'Snacks', sku: 'SNK-004', currentStock: 3, unitPrice: 144, minThreshold: 25, expiryDate: '01/10/2026', addedDate: '01/02/2026' },
  { id: generateId(), name: 'MDH Garam Masala 100g', category: 'Spices', sku: 'SPI-001', currentStock: 60, unitPrice: 85, minThreshold: 10, expiryDate: '01/01/2027', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Everest Turmeric 200g', category: 'Spices', sku: 'SPI-002', currentStock: 45, unitPrice: 65, minThreshold: 10, expiryDate: '01/03/2027', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Tata Salt 1kg', category: 'Spices', sku: 'SPI-003', currentStock: 70, unitPrice: 28, minThreshold: 15, expiryDate: '01/06/2027', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Dettol Soap 125g (Pack of 4)', category: 'Personal Care', sku: 'PC-001', currentStock: 40, unitPrice: 199, minThreshold: 10, expiryDate: '01/03/2028', addedDate: '01/01/2026' },
  { id: generateId(), name: 'Colgate MaxFresh 150g', category: 'Personal Care', sku: 'PC-002', currentStock: 55, unitPrice: 110, minThreshold: 15, expiryDate: '01/09/2027', addedDate: '01/02/2026' },
  { id: generateId(), name: 'Fresh Tomatoes 1kg', category: 'Vegetables', sku: 'VEG-001', currentStock: 10, unitPrice: 40, minThreshold: 20, expiryDate: '21/03/2026', addedDate: '18/03/2026' },
  { id: generateId(), name: 'Onions 1kg', category: 'Vegetables', sku: 'VEG-002', currentStock: 50, unitPrice: 35, minThreshold: 15, expiryDate: '28/03/2026', addedDate: '18/03/2026' },
  { id: generateId(), name: 'Fresh Bananas 1 Dozen', category: 'Fruits', sku: 'FRT-001', currentStock: 7, unitPrice: 50, minThreshold: 15, expiryDate: '22/03/2026', addedDate: '18/03/2026' },
  { id: generateId(), name: 'Shimla Apples 1kg', category: 'Fruits', sku: 'FRT-002', currentStock: 20, unitPrice: 180, minThreshold: 10, expiryDate: '30/03/2026', addedDate: '15/03/2026' },
];



