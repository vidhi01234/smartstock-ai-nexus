import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DollarSign, TrendingDown, AlertTriangle, Package, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProducts, getSales } from '@/lib/store';
import { toINR } from '@/lib/helpers';

interface CostRow {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  unitPrice: number;
  predictedDemand: number;
  stockoutLoss: number;
  holdingCost: number;
  totalImpact: number;
  excessValue: number;
  daysLeft: number;
  recommendedReorder: number;
}

type Urgency = 'CRITICAL' | 'MEDIUM' | 'LOW';

const getUrgency = (daysLeft: number, currentStock: number, _predictedDemand: number): Urgency => {
  if (currentStock <= 0 || daysLeft < 3) return 'CRITICAL';
  if (daysLeft < 7) return 'MEDIUM';
  return 'LOW';
};

const urgencyStyles: Record<Urgency, string> = {
  CRITICAL: 'bg-status-expired/15 text-status-expired border border-status-expired/30',
  MEDIUM: 'bg-status-low/15 text-status-low border border-status-low/30',
  LOW: 'bg-status-ok/15 text-status-ok border border-status-ok/30',
};

const urgencyDot: Record<Urgency, string> = {
  CRITICAL: '🔴',
  MEDIUM: '🟡',
  LOW: '🟢',
};

export default function CostIntelligence() {
  const products = getProducts();
  const sales = getSales();
  const [rows, setRows] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      const HOLDING_RATE = 0.02; // 2% per week of unit price for excess units
      const computed: CostRow[] = products.map((p) => {
        const productSales = sales.filter((s) => s.productId === p.id);
        const totalSold = productSales.reduce((acc, s) => acc + s.unitsSold, 0);
        const avgDaily = productSales.length > 0
          ? totalSold / Math.max(productSales.length, 1)
          : Math.max(1, Math.floor(Math.random() * 8) + 2);
        const predictedDemand = Math.max(1, Math.round(avgDaily * 7 * (0.85 + Math.random() * 0.3)));

        const gap = p.currentStock - predictedDemand;
        const shortageUnits = gap < 0 ? Math.abs(gap) : 0;
        const excessUnits = gap > predictedDemand ? gap - predictedDemand : 0;

        const stockoutLoss = shortageUnits * p.unitPrice;
        const holdingCost = excessUnits * p.unitPrice * HOLDING_RATE;
        const excessValue = excessUnits * p.unitPrice;
        const totalImpact = stockoutLoss + holdingCost;

        const daysLeft = predictedDemand > 0
          ? Math.floor((p.currentStock / predictedDemand) * 7)
          : 99;

        return {
          productId: p.id,
          productName: p.name,
          category: p.category,
          currentStock: p.currentStock,
          unitPrice: p.unitPrice,
          predictedDemand,
          stockoutLoss,
          holdingCost,
          totalImpact,
          excessValue,
          daysLeft,
          recommendedReorder: shortageUnits > 0 ? shortageUnits + Math.round(predictedDemand * 0.2) : 0,
        };
      });
      setRows(computed);
      setLoading(false);
      setHasRun(true);
    }, 1800);
  };

  const understockLoss = rows.reduce((s, r) => s + r.stockoutLoss, 0);
  const overstockLoss = rows.reduce((s, r) => s + r.excessValue, 0);
  const totalLoss = understockLoss + overstockLoss;

  const productLossData = useMemo(() => {
    return [...rows]
      .sort((a, b) => (b.stockoutLoss + b.excessValue) - (a.stockoutLoss + a.excessValue))
      .map((r) => ({
        name: r.productName.length > 16 ? r.productName.slice(0, 16) + '…' : r.productName,
        Understock: Math.round(r.stockoutLoss),
        Overstock: Math.round(r.excessValue),
      }));
  }, [rows]);

  const playbook = useMemo(() => {
    return [...rows]
      .sort((a, b) => a.daysLeft - b.daysLeft || b.totalImpact - a.totalImpact)
      .slice(0, 12);
  }, [rows]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono shadow-md">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {toINR(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const kpiCards = [
    { label: 'Understock Loss', value: toINR(understockLoss), icon: TrendingDown, tone: 'text-status-expired' },
    { label: 'Overstock Loss', value: toINR(overstockLoss), icon: Package, tone: 'text-status-low' },
    { label: 'Total Loss', value: toINR(totalLoss), icon: AlertTriangle, tone: 'text-status-expired' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Cost Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Quantify stockout losses, holding costs, and recoverable savings across your inventory.
          </p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading || products.length === 0}
          className={`btn-industrial rounded-md text-sm gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} strokeWidth={1.5} />}
          {loading ? 'Crunching cost model…' : 'Run Cost Analysis'}
        </Button>
      </div>

      {!hasRun && !loading && (
        <div className="kpi-card text-center py-10">
          <DollarSign size={28} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Run the cost analyzer to surface leakage hotspots.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Combines current stock, predicted demand, and unit price into actionable rupee impact.
          </p>
        </div>
      )}

      {hasRun && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpiCards.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="kpi-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</span>
                  <k.icon size={16} strokeWidth={1.5} className={k.tone} />
                </div>
                <p className={`text-xl font-bold font-mono mt-2 ${k.tone}`}>{k.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="kpi-card">
            <h3 className="text-sm font-medium tracking-heading mb-4">Product Loss Breakdown</h3>
            {productLossData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No loss data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={productLossData} margin={{ left: 20, right: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                    angle={-35} 
                    textAnchor="end" 
                    height={70} 
                    interval={0}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Understock" name="Understock Loss" fill="hsl(var(--status-expired))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Overstock" name="Overstock Loss" fill="hsl(var(--status-low))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="kpi-card overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium tracking-heading">Reorder Playbook</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Sorted by urgency
              </span>
            </div>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-right p-3 font-medium">7D Demand</th>
                    <th className="text-right p-3 font-medium">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> Days Left</span>
                    </th>
                    <th className="text-center p-3 font-medium">Urgency</th>
                    <th className="text-right p-3 font-medium">Impact</th>
                    <th className="text-right p-3 font-medium">Reorder Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {playbook.map((r, i) => {
                    const urgency = getUrgency(r.daysLeft, r.currentStock, r.predictedDemand);
                    return (
                      <motion.tr
                        key={r.productId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-t border-border hover:bg-secondary/40 transition-colors"
                      >
                        <td className="p-3 font-medium">{r.productName}</td>
                        <td className="p-3 text-right font-mono">{r.currentStock}</td>
                        <td className="p-3 text-right font-mono">{r.predictedDemand}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          <span className={urgency === 'CRITICAL' ? 'text-status-expired' : urgency === 'MEDIUM' ? 'text-status-low' : 'text-status-ok'}>
                            {r.daysLeft >= 99 ? '∞' : `${r.daysLeft}d`}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={`${urgencyStyles[urgency]} font-mono text-[10px] tracking-wider rounded-full`}>
                            {urgencyDot[urgency]} {urgency}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-mono">{toINR(r.totalImpact)}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          {r.recommendedReorder > 0 ? `+${r.recommendedReorder}` : '—'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
