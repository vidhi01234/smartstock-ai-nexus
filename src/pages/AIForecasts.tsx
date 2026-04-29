import { useState, useMemo } from 'react';
import { getProducts, getSales } from '@/lib/store';
import { ForecastEntry } from '@/lib/types';
import { Brain, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, Cell,
} from 'recharts';
import { parseDate } from '@/lib/helpers';

export default function AIForecasts() {
  const products = getProducts();
  const sales = getSales();
  const [forecasts, setForecasts] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runPrediction = async () => {
  setLoading(true);
  try {
    const now = new Date();
    const results: ForecastEntry[] = await Promise.all(
      products.map(async (p) => {
        const response = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: (() => {
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
  return categoryMap[p.category] || 'item_1';
})(),
            price: p.unitPrice ?? 100,
            promo: 0,
            weekday: now.getDay(),
            month: now.getMonth() + 1,
          }),
        });

        const data = await response.json();
        const predicted = Math.round(data.forecast[0]);

        return {
          productId: p.id,
          productName: p.name,
          currentStock: p.currentStock,
          predictedDemand: predicted,
          gap: p.currentStock - predicted,
        };
      })
    );
    setForecasts(results);
    setHasRun(true);
  } catch (error) {
    console.error("Prediction failed:", error);
    alert("Could not connect to AI backend. Make sure FastAPI is running!");
  } finally {
    setLoading(false);
  }
};

  // Chart data: simulated historical + predicted
  const demandChartData = useMemo(() => {
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    return days.map((d, i) => ({
      day: d,
      historical: Math.floor(Math.random() * 40) + 20,
      predicted: Math.floor(Math.random() * 50) + 25,
    }));
  }, [hasRun]);

  // Expiry timeline data
  const expiryData = useMemo(() => {
    return products.map(p => {
      const exp = parseDate(p.expiryDate);
      const now = new Date();
      const daysLeft = Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name, daysLeft };
    }).sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10);
  }, [products]);

  const shortages = forecasts.filter(f => f.gap < 0).length;
  const surpluses = forecasts.filter(f => f.gap > 0).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-md p-2 text-xs font-mono">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-heading">AI Demand Forecasting</h1>
          <p className="text-xs text-muted-foreground mt-1">Neural model analysis of inventory demand patterns.</p>
        </div>
        <Button
          onClick={runPrediction}
          disabled={loading || products.length === 0}
          className={`btn-industrial rounded-md text-sm gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} strokeWidth={1.5} />}
          {loading ? 'Processing FastAPI Neural Model...' : 'Run AI Prediction'}
        </Button>
      </div>

      {products.length === 0 && (
        <div className="kpi-card text-center py-8">
          <Brain size={24} strokeWidth={1.5} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">No inventory data. Add products to run predictions.</p>
        </div>
      )}

      {hasRun && forecasts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="kpi-card">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total SKUs Analyzed</span>
              <p className="text-2xl font-bold font-mono mt-1">{forecasts.length}</p>
            </div>
            <div className="kpi-card">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Shortages Detected</span>
              <p className="text-2xl font-bold font-mono mt-1 text-status-expired">{shortages}</p>
            </div>
            <div className="kpi-card">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Surplus Items</span>
              <p className="text-2xl font-bold font-mono mt-1 text-status-ok">{surpluses}</p>
            </div>
          </div>

          <div className="border border-border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium">Current Stock</th>
                  <th className="text-right p-3 font-medium">AI Predicted (7D)</th>
                  <th className="text-right p-3 font-medium">The Gap</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map(f => (
                  <motion.tr
                    key={f.productId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-border hover:bg-secondary/30 transition-colors duration-100"
                  >
                    <td className="p-3 font-medium">{f.productName}</td>
                    <td className="p-3 text-right font-mono">{f.currentStock}</td>
                    <td className="p-3 text-right font-mono">{f.predictedDemand}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {f.gap < 0 ? (
                        <span className="text-status-expired inline-flex items-center gap-1">
                          <TrendingDown size={14} /> Shortage of {Math.abs(f.gap)}
                        </span>
                      ) : (
                        <span className="text-status-ok inline-flex items-center gap-1">
                          <TrendingUp size={14} /> Surplus of {f.gap}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="kpi-card">
          <h3 className="text-sm font-medium tracking-heading mb-4">Demand Trend</h3>
          {products.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={demandChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 20%)" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="historical" stroke="hsl(240 5% 55%)" strokeDasharray="5 5" name="Historical Sales" dot={false} />
                <Line type="monotone" dataKey="predicted" stroke="hsl(0 0% 98%)" strokeWidth={2} name="Predicted Demand" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="kpi-card">
          <h3 className="text-sm font-medium tracking-heading mb-4">Expiry Timeline</h3>
          {expiryData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={expiryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 20%)" />
                <XAxis type="number" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 10 }} label={{ value: 'Days Left', position: 'insideBottom', offset: -5, fill: 'hsl(240 5% 55%)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(240 5% 55%)', fontSize: 9 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="daysLeft" name="Days Until Expiry" radius={[0, 2, 2, 0]}>
                  {expiryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.daysLeft <= 0 ? 'hsl(0 72% 51%)' : entry.daysLeft <= 7 ? 'hsl(30 90% 56%)' : 'hsl(240 5% 40%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
