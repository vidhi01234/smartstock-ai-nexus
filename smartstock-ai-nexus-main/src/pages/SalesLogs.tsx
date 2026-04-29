import { useState, useCallback } from 'react';
import { getProducts, getSales, addSale } from '@/lib/store';
import { formatDate, generateId, toINR } from '@/lib/helpers';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalesLogs() {
  const [sales, setSales] = useState(getSales);
  const [products] = useState(getProducts);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [units, setUnits] = useState('');

  const refresh = useCallback(() => setSales(getSales()), []);

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProduct);
    if (!product || !units) return;

    addSale({
      id: generateId(),
      productId: product.id,
      productName: product.name,
      unitsSold: Number(units),
      date: formatDate(new Date()),
    });
    setUnits('');
    setSelectedProduct('');
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Sales Logger</h1>
        <p className="text-xs text-muted-foreground mt-1">Log daily sales to improve AI prediction accuracy.</p>
      </div>

      <div className="kpi-card max-w-lg">
        <h2 className="text-sm font-medium tracking-heading mb-4">Log Sale</h2>
        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground">No products in inventory. Add products first.</p>
        ) : (
          <form onSubmit={handleLog} className="space-y-3">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Units Sold</Label>
              <Input type="number" min="1" value={units} onChange={e => setUnits(e.target.value)} className="bg-secondary border-border mt-1 font-mono" placeholder="0" />
            </div>
            <Button type="submit" className="btn-industrial rounded-md text-sm w-full">Log Sale Entry</Button>
          </form>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium tracking-heading mb-3">Recent Sales</h2>
        {sales.length === 0 ? (
          <div className="kpi-card text-center py-8">
            <ShoppingCart size={24} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No sales data logged. Predictive accuracy may decrease.</p>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {[...sales].reverse().map(s => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/30 transition-colors duration-100">
                    <td className="p-3 font-mono text-xs">{s.date}</td>
                    <td className="p-3">{s.productName}</td>
                    <td className="p-3 text-right font-mono">{s.unitsSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
