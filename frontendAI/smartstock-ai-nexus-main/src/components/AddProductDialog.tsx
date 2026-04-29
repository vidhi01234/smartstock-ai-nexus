import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CATEGORIES, Product } from '@/lib/types';
import { addProduct } from '@/lib/store';
import { formatDate, generateId } from '@/lib/helpers';

export function AddProductDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', sku: '', currentStock: '', unitPrice: '', minThreshold: '', expiryDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.sku || !form.expiryDate) return;

    const expDate = new Date(form.expiryDate);
    const product: Product = {
      id: generateId(),
      name: form.name,
      category: form.category,
      sku: form.sku,
      currentStock: Number(form.currentStock) || 0,
      unitPrice: Number(form.unitPrice) || 0,
      minThreshold: Number(form.minThreshold) || 0,
      expiryDate: formatDate(expDate),
      addedDate: formatDate(new Date()),
    };
    addProduct(product);
    setForm({ name: '', category: '', sku: '', currentStock: '', unitPrice: '', minThreshold: '', expiryDate: '' });
    setOpen(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-industrial rounded-md text-sm gap-2">
          <Plus size={16} strokeWidth={1.5} />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="tracking-heading">Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Product Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="Amul Butter 500g" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">SKU</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="bg-secondary border-border mt-1" placeholder="DAI-002" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Stock</Label>
              <Input type="number" value={form.currentStock} onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))} className="bg-secondary border-border mt-1 font-mono" placeholder="0" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Unit Price (₹)</Label>
              <Input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} className="bg-secondary border-border mt-1 font-mono" placeholder="0" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Min Threshold</Label>
              <Input type="number" value={form.minThreshold} onChange={e => setForm(f => ({ ...f, minThreshold: e.target.value }))} className="bg-secondary border-border mt-1 font-mono" placeholder="0" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Expiry Date</Label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="bg-secondary border-border mt-1" />
            </div>
          </div>
          <Button type="submit" className="w-full btn-industrial rounded-md text-sm">Add to Inventory</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
