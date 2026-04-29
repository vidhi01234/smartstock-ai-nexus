import { useState, useMemo, useCallback } from 'react';
import { getProducts, deleteProduct } from '@/lib/store';
import { getProductStatus, toINR } from '@/lib/helpers';
import { StatusBadge } from '@/components/StatusBadge';
import { AddProductDialog } from '@/components/AddProductDialog';
import { Package, Trash2, ArrowUpDown, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, CATEGORIES } from '@/lib/types';
import { EditStockDialog } from '@/components/EditStockDialog';

type SortKey = 'name' | 'currentStock' | 'expiryDate' | 'status';

export default function Inventory() {
  const [products, setProducts] = useState(getProducts);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const refresh = useCallback(() => setProducts(getProducts()), []);


  const handleDelete = (id: string) => {
    deleteProduct(id);
    refresh();
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const enriched = useMemo(() =>
    products.map(p => ({ ...p, status: getProductStatus(p) })),
    [products]
  );

  const filtered = useMemo(() => {
    let list = enriched;
    if (filterCategory !== 'all') list = list.filter(p => p.category === filterCategory);
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'currentStock') cmp = a.currentStock - b.currentStock;
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [enriched, filterCategory, filterStatus, sortKey, sortAsc]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th className="text-left p-3 font-medium cursor-pointer select-none" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className="text-muted-foreground" />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Inventory</h1>
          <p className="text-xs text-muted-foreground mt-1">{products.length} products tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <AddProductDialog onAdded={refresh} />
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] bg-secondary border-border text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] bg-secondary border-border text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
            <SelectItem value="OVERFLOW">Overflow</SelectItem>
            <SelectItem value="OK">In Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="kpi-card text-center py-12">
          <Package size={32} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No products found. Add products or load sample data to begin.</p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <SortHeader label="Product" field="name" />
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">SKU</th>
                <SortHeader label="Stock" field="currentStock" />
                <th className="text-right p-3 font-medium">Price</th>
                <th className="text-left p-3 font-medium">Expiry</th>
                <SortHeader label="Status" field="status" />
                <th className="p-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-t border-border hover:bg-secondary/30 transition-colors duration-100">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{item.category}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="p-3 font-mono text-right">{item.currentStock}</td>
                  <td className="p-3 font-mono text-right text-xs">{toINR(item.unitPrice)}</td>
                  <td className="p-3 text-xs font-mono">{item.expiryDate}</td>
                  <td className="p-3"><StatusBadge status={item.status} /></td>
                  <td className="p-3 flex gap-2">
                    <button onClick={() => { setEditProduct(item); setEditOpen(true); }} className="text-muted-foreground hover:text-primary transition-colors" title="Edit">
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-status-expired transition-colors" title="Delete">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditStockDialog product={editProduct} open={editOpen} onOpenChange={setEditOpen} onUpdated={refresh} />
    </div>
  );
}
