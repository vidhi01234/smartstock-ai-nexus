import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/lib/types';
import { getProducts, saveProducts } from '@/lib/store';

export function EditStockDialog({ product, open, onOpenChange, onUpdated }: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [threshold, setThreshold] = useState('');

  const handleOpen = (v: boolean) => {
    if (v && product) {
      setStock(String(product.currentStock));
      setPrice(String(product.unitPrice));
      setThreshold(String(product.minThreshold));
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const products = getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    if (idx !== -1) {
      products[idx] = {
        ...products[idx],
        currentStock: Number(stock) || 0,
        unitPrice: Number(price) || 0,
        minThreshold: Number(threshold) || 0,
      };
      saveProducts(products);
      onOpenChange(false);
      onUpdated();
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="tracking-heading">Update — {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Stock</Label>
            <Input type="number" value={stock} onChange={e => setStock(e.target.value)} className="bg-secondary border-border mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Unit Price (₹)</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-secondary border-border mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Min Threshold</Label>
            <Input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="bg-secondary border-border mt-1 font-mono" />
          </div>
          <Button type="submit" className="w-full btn-industrial rounded-md text-sm">Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
