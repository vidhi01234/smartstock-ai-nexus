import { useState, useCallback, useMemo } from 'react';
import { getProducts, getSales, addSale } from '@/lib/store';
import { formatDate, generateId, toINR } from '@/lib/helpers';
import { ShoppingCart, TrendingUp, Package, IndianRupee, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

export default function SalesLogs() {
  const [sales, setSales] = useState(getSales);
  const [products] = useState(getProducts);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [units, setUnits] = useState('');
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => setSales(getSales()), []);

  const selectedObj = useMemo(
    () => products.find(p => p.id === selectedProduct),
    [products, selectedProduct]
  );
  const livePreviewTotal = selectedObj && units ? selectedObj.unitPrice * Number(units) : 0;

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProduct);
    if (!product || !units) return;

    const unitsNum = Number(units);
    const total = product.unitPrice * unitsNum;
    addSale({
      id: generateId(),
      productId: product.id,
      productName: product.name,
      unitsSold: unitsNum,
      unitPrice: product.unitPrice,
      totalPrice: total,
      date: formatDate(new Date()),
    });
    toast.success(`Sale logged: ${unitsNum} × ${product.name}`, {
      description: `Revenue: ${toINR(total)}`,
    });
    setUnits('');
    setSelectedProduct('');
    refresh();
  };

  // Compute totals — fallback to product price for legacy sales without stored price
  const enrichedSales = useMemo(() => {
    return sales.map(s => {
      const price = s.unitPrice ?? products.find(p => p.id === s.productId)?.unitPrice ?? 0;
      const total = s.totalPrice ?? price * s.unitsSold;
      return { ...s, unitPrice: price, totalPrice: total };
    });
  }, [sales, products]);

  const stats = useMemo(() => {
    const totalRevenue = enrichedSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalUnits = enrichedSales.reduce((sum, s) => sum + s.unitsSold, 0);
    const avgOrder = enrichedSales.length ? totalRevenue / enrichedSales.length : 0;
    return { totalRevenue, totalUnits, totalOrders: enrichedSales.length, avgOrder };
  }, [enrichedSales]);

  // 7-day sales trend
  const trendData = useMemo(() => {
  const days: { date: string; revenue: number; units: number }[] = [];
  for (let i = 29; i >= 0; i--) {  // changed 6 to 29 for 30 days
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = formatDate(d);
    const dayTotal = enrichedSales
      .filter(s => s.date === key)
      .reduce((acc, s) => ({ rev: acc.rev + s.totalPrice, u: acc.u + s.unitsSold }), { rev: 0, u: 0 });
    days.push({
      date: key.substring(0, 5),
      revenue: dayTotal.rev,
      units: dayTotal.u,
    });
  }
  return days;
}, [enrichedSales]);

  const filteredSales = useMemo(() => {
    const reversed = [...enrichedSales].reverse();
    if (!search) return reversed;
    const q = search.toLowerCase();
    return reversed.filter(s => s.productName.toLowerCase().includes(q) || s.date.includes(q));
  }, [enrichedSales, search]);

  const kpis = [
    { label: 'Total Revenue', value: toINR(stats.totalRevenue), icon: IndianRupee, accent: 'text-status-ok' },
    { label: 'Units Sold', value: stats.totalUnits.toLocaleString('en-IN'), icon: Package, accent: 'text-primary' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, accent: 'text-primary' },
    { label: 'Avg Order Value', value: toINR(stats.avgOrder), icon: TrendingUp, accent: 'text-status-ok' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Sales Logger</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Log daily sales to improve AI prediction accuracy.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            whileHover={{ y: -3 }}
            className="kpi-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
              <kpi.icon size={16} strokeWidth={1.5} className={kpi.accent} />
            </div>
            <p className="text-2xl font-bold tracking-heading font-mono">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="kpi-card"
        >
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
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {toINR(p.unitPrice)} (Stock: {p.currentStock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Units Sold</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedObj?.currentStock}
                  value={units}
                  onChange={e => setUnits(e.target.value)}
                  className="bg-secondary border-border mt-1 font-mono"
                  placeholder="0"
                />
                {selectedObj && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Available: <span className="font-mono">{selectedObj.currentStock}</span>
                  </p>
                )}
              </div>

              <AnimatePresence>
                {livePreviewTotal > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 flex items-center justify-between"
                  >
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Sale</span>
                    <span className="text-lg font-mono font-bold text-primary">{toINR(livePreviewTotal)}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="btn-industrial rounded-md text-sm w-full">Log Sale Entry</Button>
            </form>
          )}
        </motion.div>

        {/* Trend chart */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="kpi-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium tracking-heading">30-Day Revenue Trend</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">₹</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => toINR(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent sales */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-sm font-medium tracking-heading">Recent Sales</h2>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search product or date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 bg-card border-border text-xs"
            />
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="kpi-card text-center py-8">
            <ShoppingCart size={24} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              {sales.length === 0 ? 'No sales data logged. Predictive accuracy may decrease.' : 'No matches for your search.'}
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium">Units</th>
                  <th className="text-right p-3 font-medium">Unit Price</th>
                  <th className="text-right p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filteredSales.map(s => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-border hover:bg-secondary/40 transition-colors duration-100"
                    >
                      <td className="p-3 font-mono text-xs">{s.date}</td>
                      <td className="p-3">{s.productName}</td>
                      <td className="p-3 text-right font-mono">{s.unitsSold}</td>
                      <td className="p-3 text-right font-mono text-muted-foreground">{toINR(s.unitPrice)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-status-ok">{toINR(s.totalPrice)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-secondary/40">
                  <td colSpan={4} className="p-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Total Revenue</td>
                  <td className="p-3 text-right font-mono font-bold text-primary">{toINR(stats.totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
