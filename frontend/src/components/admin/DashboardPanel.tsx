import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Clock,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

interface DashboardData {
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  total_revenue: number;
  pending_revenue: number;
  materials_revenue: number;
  shipping_revenue: number;
  avg_order_value: number;
  estimated_cogs: number;
  estimated_margin: number;
  margin_percent: number;
  critical_stock_count: number;
  low_stock_count: number;
  total_products: number;
  recent_orders: RecentOrder[];
  category_breakdown: CategoryItem[];
  top_products: TopProduct[];
  kpi: KpiData;
}

interface RecentOrder {
  id: string;
  client_name: string;
  client_role: string;
  total_invoice: number;
  materials_total: number;
  shipping_cost: number;
  payment_status: string;
  truck_type: string;
  delivery_date: string;
  created_at: string;
}

interface CategoryItem {
  category: string;
  revenue: number;
  order_count: number;
}

interface TopProduct {
  sku: string;
  name: string;
  category: string;
  total_sold: number;
  qty_sold: number;
  order_count: number;
}

interface KpiData {
  total_estimations: number;
  avg_lead_time_seconds: number;
  under_30s_percent: number;
}

const fmtShort = (n: number): string => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} Rb`;
  return `Rp ${n.toFixed(0)}`;
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: 'green' | 'amber' | 'red' | 'blue' | 'default';
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        {sub && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function MiniBar({ value, max, color = 'bg-accent' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DashboardPanel() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/dashboard/summary`);
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Memuat data dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Gagal memuat data. Coba refresh.
      </div>
    );
  }

  const maxCatRevenue = Math.max(...(data.category_breakdown.map(c => c.revenue)), 1);
  const maxProductRevenue = Math.max(...(data.top_products.map(p => p.total_sold)), 1);

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 uppercase tracking-widest">Ringkasan Operasional</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {lastUpdated ? `Diperbarui: ${lastUpdated.toLocaleTimeString('id-ID')}` : ''}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white px-4 py-2 rounded-full transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Pesanan" value={data.total_orders} sub="Semua Status" icon={ShoppingCart} />
        <StatCard label="Pesanan Lunas" value={data.paid_orders} sub="Terkonfirmasi" icon={TrendingUp} accent="green" />
        <StatCard label="Menunggu Bayar" value={data.pending_orders} sub="Belum Lunas" icon={Clock} accent="amber" />
        <StatCard label="Rata-rata Order" value={fmtShort(data.avg_order_value)} sub="Per Transaksi" icon={BarChart2} accent="blue" />
      </div>

      {/* Revenue vs COGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pemasukan */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pemasukan</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Total Pendapatan (Lunas)</p>
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">{fmtShort(data.total_revenue)}</p>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Material</span>
              <span className="font-bold text-slate-700">{fmtShort(data.materials_revenue)}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Pengiriman</span>
              <span className="font-bold text-slate-700">{fmtShort(data.shipping_revenue)}</span>
            </div>
            <div className="flex justify-between text-[12px] pt-1 border-t border-slate-100">
              <span className="text-slate-400">Menunggu Konfirmasi</span>
              <span className="font-bold text-amber-600">{fmtShort(data.pending_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Pengeluaran (COGS) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pengeluaran</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Estimasi HPP Pengadaan</p>
            <p className="text-2xl font-extrabold text-red-500 tracking-tight">{fmtShort(data.estimated_cogs)}</p>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              Dihitung dari harga pokok produk × qty yang terjual.
            </p>
            <div className="flex justify-between text-[12px] pt-1">
              <span className="text-slate-500">Estimasi Margin</span>
              <span className={`font-extrabold ${data.estimated_margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {fmtShort(data.estimated_margin)}
              </span>
            </div>
          </div>
        </div>

        {/* Margin Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Profitabilitas</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Estimasi Margin Kotor</p>
            <p className={`text-2xl font-extrabold tracking-tight ${data.margin_percent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.margin_percent}%
            </p>
          </div>
          {/* Visual margin bar */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${data.margin_percent >= 20 ? 'bg-emerald-500' : data.margin_percent >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, data.margin_percent))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span className={data.margin_percent >= 20 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                {data.margin_percent >= 20 ? 'Sehat' : data.margin_percent >= 5 ? 'Cukup' : 'Perlu Perhatian'}
              </span>
              <span>100%</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Estimasi KPI</span>
              <span className="font-bold text-slate-700">{data.kpi.total_estimations} sesi</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Avg. Lead Time</span>
              <span className="font-bold text-slate-700">{data.kpi.avg_lead_time_seconds}s</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Target &lt;30s</span>
              <span className={`font-extrabold ${data.kpi.under_30s_percent >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {data.kpi.under_30s_percent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Health + Stok Kritis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kesehatan Stok</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[12px] text-slate-600">Stok Kritis (&lt;10)</span>
              </div>
              <span className="text-[15px] font-extrabold text-red-600">{data.critical_stock_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[12px] text-slate-600">Stok Rendah (&lt;25)</span>
              </div>
              <span className="text-[15px] font-extrabold text-amber-600">{data.low_stock_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] text-slate-600">Total SKU</span>
              </div>
              <span className="text-[15px] font-extrabold text-slate-700">{data.total_products}</span>
            </div>
          </div>
          {data.critical_stock_count > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-[11px] font-bold text-red-600">
                {data.critical_stock_count} SKU membutuhkan restok segera
              </span>
            </div>
          )}
        </div>

        {/* Top Produk */}
        <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Produk Terlaris</span>
          </div>
          {data.top_products.length === 0 ? (
            <p className="text-[12px] text-slate-400 italic">Belum ada data penjualan.</p>
          ) : (
            <div className="space-y-3">
              {data.top_products.map((p, i) => (
                <div key={p.sku} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-300 w-4 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[12px] font-bold text-slate-700 truncate">{p.name}</span>
                    </div>
                    <span className="text-[12px] font-extrabold text-slate-900 flex-shrink-0 ml-2">
                      {fmtShort(p.total_sold)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <MiniBar value={p.total_sold} max={maxProductRevenue} color="bg-accent" />
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{p.order_count} order</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {data.category_breakdown.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pendapatan per Kategori</span>
          </div>
          <div className="space-y-3.5">
            {data.category_breakdown.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-slate-700 capitalize">{cat.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{cat.order_count} item</span>
                    <span className="text-[13px] font-extrabold text-slate-900">{fmtShort(cat.revenue)}</span>
                  </div>
                </div>
                <MiniBar value={cat.revenue} max={maxCatRevenue} color="bg-accent" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pesanan Terbaru</span>
        </div>
        {data.recent_orders.length === 0 ? (
          <p className="text-[12px] text-slate-400 italic">Belum ada pesanan masuk.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-warm">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {['ID Pesanan', 'Klien', 'Total Invoice', 'Material', 'Pengiriman', 'Status', 'Tanggal'].map((h) => (
                    <th key={h} className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="text-[11px] font-mono font-bold text-slate-500">{order.id.toUpperCase()}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div>
                        <p className="text-[12.5px] font-bold text-slate-800 leading-none">{order.client_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{order.client_role}</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[13px] font-extrabold text-slate-900">{fmtShort(order.total_invoice)}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-[12px] text-slate-600">{fmtShort(order.materials_total)}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div>
                        <span className="text-[12px] text-slate-600">{fmtShort(order.shipping_cost)}</span>
                        <p className="text-[10px] text-slate-400">{order.truck_type}</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {order.payment_status === 'paid' ? 'Lunas' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-[11px] text-slate-400">{order.created_at}</span>
                    </td>
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
