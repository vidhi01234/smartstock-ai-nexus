import { useState, useMemo } from 'react';
import { getProducts } from '@/lib/store';
import { ForecastEntry } from '@/lib/types';
import {
  DollarSign, TrendingDown, TrendingUp, Loader2,
  AlertTriangle, PackageCheck, Zap, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toINR } from '@/lib/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface CostEntry extends ForecastEntry {
  unitPrice: number;
  stockoutLoss: number;
  holdingCost: number;
  netImpact: number;
  action: string;
  reorderQty: number;
  savingsIfActed: number;
}

export default function CostIntelligence() {
  const products = getProducts();
  const [costData, setCostData] = useState<CostEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runCostAnalysis = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const categoryMap: Record<string, string> = {
        'Dairy': 'item_1',
        'Grains': 'item_2',
        'Bakery': 'item_3',
        'Beverages': 'item_4',
        'Oil & Ghee': 'item_5',
        'Snacks': 'item_6',
        'Spices': 'item_7',
        'Personal Care': 'item_8',
        'Vegetables': 'item_9',
        'Fruits': 'item_10',
      };

      const results: CostEntry[] = await Promise.all(
        products.map(async (p) => {
          const response = await fetch('http://10.205.123.236:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_id: categoryMap[p.category] || 'item_1',
              price: p.unitPrice ?? 100,
              promo: 0,
              weekday: now.getDay(),
              month: now.getMonth() + 1,
            }),
          });

          const data = await response.json();
          const predicted = Math.round(data.forecast[0]);
          const gap = p.currentStock - predicted;
          const price = p.unitPrice ?? 100;

          // Stockout loss: units short × selling price (lost revenue)
          const stockoutLoss = gap < 0 ? Math.abs(gap) * price : 0;

          // Overstock holding cost: surplus units × price × 2% daily holding rate
          const holdingCost = gap > 0 ? gap * price * 0.02 : 0;

          // Net financial impact (negative = loss, positive = holding cost)
          const netImpact = stockoutLoss + holdingCost;

          // Reorder recommendation
          const reorderQty = gap < 0 ? Math.abs(gap) + Math.round(predicted * 0.2) : 0;

          // Savings if action is taken immediately
          const savingsIfActed = gap < 0
            ? Math.abs(gap) * price * 0.8   // recover 80% of lost revenue
            : gap * price * 0.015;           // reduce holding by 1.5%

          const action = gap < 0
            ? `Reorder ${reorderQty} units immediately`
            : gap > predicted * 0.5
            ? `Reduce procurement by ${Math.round(gap * 0.4)} units`
            : 'Stock level optimal';

          return {
            productId: p.id,
            productName: p.name,
            currentStock: p.currentStock,
            predictedDemand: predicted,
            gap,
            unitPrice: price,
            stockoutLoss,
            holdingCost,
            netImpact,
            action,
            reorderQty,
            savingsIfActed,
          };
        })
      );

      setCostData(results);
      setHasRun(true);
    } catch (error) {
      console.error('Cost analysis failed:', error);
      alert('Could not connect to AI backend. Make sure FastAPI is running!');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!costData.length) return null;
    const totalStockoutLoss = costData.reduce((s, c) => s + c.stockoutLoss, 0);
    const totalHoldingCost = costData.reduce((s, c) => s + c.holdingCost, 0);
    const totalImpact = totalStockoutLoss + totalHoldingCost;
    const totalSavings = costData.reduce((s, c) => s + c.savingsIfActed, 0);
    const criticalSKUs = costData.filter(c => c.stockoutLoss > 0).length;
    const overstockedSKUs = costData.filter(c => c.holdingCost > 0).length;
    return { totalStockoutLoss, totalHoldingCost, totalImpact, totalSavings, criticalSKUs, overstockedSKUs };
  }, [costData]);

  const chartData = useMemo(() => {
    return costData
      .filter(c => c.netImpact > 0)
      .sort((a, b) => b.netImpact - a.netImpact)
      .slice(0, 8)
      .map(c => ({
        name: c.productName.length > 14 ? c.productName.slice(0, 14) + '…' : c.productName,
        stockoutLoss: Math.round(c.stockoutLoss),
        holdingCost: Math.round(c.holdingCost),
      }));
  }, [costData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {toINR(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">Cost Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Financial impact analysis — quantifies losses from stockouts and overstock holding costs.
          </p>
        </div>
        <Button
          onClick={runCostAnalysis}
          disabled={loading || products.length === 0}
          className={`btn-industrial rounded-md text-sm gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {loading
            ? <Loader2 size={16} className="animate-spin" />
            : <Zap size={16} strokeWidth={1.5} />}
          {loading ? 'Analysing Cost Impact...' : 'Run Cost Analysis'}
        </Button>
      </div>

      {products.length === 0 && (
        <div className="kpi-card text-center py-8">
          <DollarSign size={24} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No inventory data. Add products to run cost analysis.</p>
        </div>
      )}

      {/* KPI Summary Cards */}
      {hasRun && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Stockout Loss',
                value: toINR(summary.totalStockoutLoss),
                icon: TrendingDown,
                alert: summary.totalStockoutLoss > 0,
                sub: `${summary.criticalSKUs} SKUs understocked`,
              },
              {
                label: 'Holding Cost (Daily)',
                value: toINR(summary.totalHoldingCost),
                icon: PackageCheck,
                alert: false,
                sub: `${summary.overstockedSKUs} SKUs overstocked`,
              },
              {
                label: 'Total Financial Impact',
                value: toINR(summary.totalImpact),
                icon: AlertTriangle,
                alert: summary.totalImpact > 0,
                sub: 'Combined cost leakage',
              },
              {
                label: 'Recoverable If Acted',
                value: toINR(summary.totalSavings),
                icon: TrendingUp,
                alert: false,
                sub: 'Potential savings today',
              },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="kpi-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {kpi.label}
                  </span>
                  <kpi.icon
                    size={16}
                    strokeWidth={1.5}
                    className={kpi.alert ? 'text-status-expired' : 'text-muted-foreground'}
                  />
                </div>
                <p className="text-2xl font-bold tracking-heading">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="kpi-card">
              <h3 className="text-sm font-medium tracking-heading mb-4">
                Cost Leakage by Product
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 20%)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="stockoutLoss" name="Stockout Loss" stackId="a" radius={[0, 0, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill="hsl(0 72% 51%)" />
                    ))}
                  </Bar>
                  <Bar dataKey="holdingCost" name="Holding Cost" stackId="a" radius={[2, 2, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill="hsl(30 90% 56%)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'hsl(0 72% 51%)' }} />
                  Stockout Loss
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-3 h-2 rounded-sm" style={{ background: 'hsl(30 90% 56%)' }} />
                  Holding Cost
                </span>
              </div>
            </div>
          )}

          {/* Reorder Playbook Table */}
          <div>
            <h2 className="text-sm font-medium tracking-heading mb-3">
              Reorder Playbook — Autonomous Action Recommendations
            </h2>
            <div className="border border-border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-right p-3 font-medium">Demand</th>
                    <th className="text-right p-3 font-medium">Financial Impact</th>
                    <th className="text-right p-3 font-medium">Savings if Acted</th>
                    <th className="text-left p-3 font-medium">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {costData
                    .sort((a, b) => b.netImpact - a.netImpact)
                    .map((c) => (
                      <motion.tr
                        key={c.productId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-t border-border hover:bg-secondary/30 transition-colors duration-100"
                      >
                        <td className="p-3 font-medium">{c.productName}</td>
                        <td className="p-3 text-right font-mono">{c.currentStock}</td>
                        <td className="p-3 text-right font-mono">{c.predictedDemand}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          {c.netImpact > 0 ? (
                            <span className="text-status-expired">{toINR(Math.round(c.netImpact))}</span>
                          ) : (
                            <span className="text-status-ok">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-status-ok">
                          {c.savingsIfActed > 0 ? toINR(Math.round(c.savingsIfActed)) : '—'}
                        </td>
                        <td className="p-3 text-xs">
                          <span className={`inline-flex items-center gap-1 ${
                            c.gap < 0
                              ? 'text-status-expired'
                              : c.action.includes('Reduce')
                              ? 'text-status-low'
                              : 'text-status-ok'
                          }`}>
                            <ArrowRight size={12} />
                            {c.action}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}