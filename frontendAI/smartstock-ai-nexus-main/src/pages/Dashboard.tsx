import { useMemo } from 'react';
import { Package, AlertTriangle, TrendingDown, ShieldAlert, ShoppingCart, Layers } from 'lucide-react';
import { getProducts, getSales } from '@/lib/store';
import { getProductStatus, toINR, parseDate } from '@/lib/helpers';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const products = getProducts();
  const sales = getSales();

  const stats = useMemo(() => {
    const totalSKUs = products.length;
    const totalItems = products.reduce((s, p) => s + p.currentStock, 0);
    const totalOrders = sales.length;
    const totalUnitsSold = sales.reduce((s, x) => s + x.unitsSold, 0);
    const totalValue = products.reduce((s, p) => s + p.currentStock * p.unitPrice, 0);
    const expired = products.filter(p => getProductStatus(p) === 'EXPIRED').length;
    const lowStock = products.filter(p => getProductStatus(p) === 'LOW_STOCK').length;
    const alerts = expired + lowStock;
    return { totalSKUs, totalItems, totalOrders, totalUnitsSold, totalValue, alerts, lowStock, expired };
  }, [products, sales]);

  const expiredItems = useMemo(() =>
    products.filter(p => getProductStatus(p) === 'EXPIRED'), [products]);

  const lowStockItems = useMemo(() =>
    products.filter(p => getProductStatus(p) === 'LOW_STOCK'), [products]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) || 0) + p.currentStock));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  const statusData = useMemo(() => {
    const ok = products.filter(p => getProductStatus(p) === 'OK').length;
    return [
      { name: 'Healthy', value: ok },
      { name: 'Low Stock', value: stats.lowStock },
      { name: 'Expired', value: stats.expired },
    ].filter(d => d.value > 0);
  }, [products, stats]);

  const STATUS_COLORS = ['hsl(var(--status-ok))', 'hsl(var(--status-low))', 'hsl(var(--status-expired))'];

  const kpis = [
    { label: 'Total SKUs', value: stats.totalSKUs, icon: Package, sub: 'Unique products' },
    { label: 'Total Items', value: stats.totalItems.toLocaleString('en-IN'), icon: Layers, sub: 'Units in stock' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, sub: `${stats.totalUnitsSold} units sold` },
    { label: 'Inventory Value', value: toINR(stats.totalValue), icon: TrendingDown, sub: 'Current stock worth' },
    { label: 'Active Alerts', value: stats.alerts, icon: AlertTriangle, sub: `${stats.expired} expired · ${stats.lowStock} low`, alert: stats.alerts > 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-heading">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {stats.alerts > 0
            ? `System Status: ${stats.alerts} SKU${stats.alerts > 1 ? 's' : ''} require immediate attention.`
            : 'All systems nominal. No alerts.'}
        </p>
      </div>

      {/* Alerts */}
      {expiredItems.length > 0 && (
        <Alert variant="destructive" className="border-status-expired/30 bg-status-expired/5">
          <ShieldAlert className="h-4 w-4" style={{ color: 'hsl(var(--status-expired))' }} />
          <AlertTitle className="text-sm font-bold" style={{ color: 'hsl(var(--status-expired))' }}>
            {expiredItems.length} Expired Product{expiredItems.length > 1 ? 's' : ''} — Remove Immediately
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1">
            {expiredItems.map(p => p.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {lowStockItems.length > 0 && (
        <Alert className="border-status-low/30 bg-status-low/5">
          <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--status-low))' }} />
          <AlertTitle className="text-sm font-bold" style={{ color: 'hsl(var(--status-low))' }}>
            {lowStockItems.length} Product{lowStockItems.length > 1 ? 's' : ''} Running Low — Restock Now
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground mt-1">
            {lowStockItems.map(p => `${p.name} (${p.currentStock}/${p.minThreshold})`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="kpi-card cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
              <kpi.icon size={16} strokeWidth={1.5} className={kpi.alert ? 'text-status-expired' : 'text-muted-foreground'} />
            </div>
            <p className="text-2xl font-bold tracking-heading font-mono">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.25 }}
          className="kpi-card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium tracking-heading">Stock by Category</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Units</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 5, right: 8, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'hsl(var(--secondary) / 0.4)' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.25 }}
          className="kpi-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium tracking-heading">Inventory Health</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">SKUs</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: STATUS_COLORS[i] }} />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.name}</span>
                <span className="text-[10px] font-mono">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
