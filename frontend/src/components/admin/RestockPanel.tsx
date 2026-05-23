import { AlertCircle, Check, Warehouse, Plus, RefreshCw } from 'lucide-react';

interface Product {
  sku: string;
  name: string;
  price: number;
  qty: any;
  total: number;
  status?: string;
  category?: string;
}

interface MasterProduct {
  sku: string;
  name: string;
  category: string;
  base_price: number;
  coverage_m2: number;
  stock_qty: number;
  image_url: string;
}

interface RestockPanelProps {
  restockProducts: Product[];
  masterProducts: MasterProduct[];
  addedQtys: Record<string, number>;
  setAddedQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  restockSuccess: Record<string, boolean>;
  restockLoading: Record<string, boolean>;
  handleRestock: (sku: string) => void;
  getQtyUnit: (qtyStr: string | number) => string;
  parseQtyNumber: (qtyStr: string | number) => number;
}

export default function RestockPanel({
  restockProducts,
  masterProducts,
  addedQtys,
  setAddedQtys,
  restockSuccess,
  restockLoading,
  handleRestock,
  getQtyUnit,
  parseQtyNumber
}: RestockPanelProps) {
  return (
    <div className="bg-white border border-hairline rounded-3xl p-6.5 flex flex-col space-y-5">
      <div className="border-b border-hairline pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-accent animate-breathe" />
            <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
              1. Permintaan Penambahan Stok
            </h2>
          </div>
          <p className="text-[11.5px] text-muted mt-1 leading-relaxed">
            Material proyek yang sedang kritis atau habis di gudang utama Sleman. Lakukan restock kuota logistik master.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-accent/10 text-accent">
          {restockProducts.length} Menunggu
        </span>
      </div>

      <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-warm">
        {restockProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-emerald-50/30 border border-dashed border-emerald-200/80 rounded-2xl">
            <div className="w-11 h-11 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-5.5 h-5.5" />
            </div>
            <span className="text-[13.5px] font-extrabold text-emerald-950">Aman Terkendali</span>
            <p className="text-[11.5px] text-emerald-800 mt-1 max-w-[280px]">
              Semua stok gudang untuk kebutuhan material sesi ini telah tercukupi (&gt; 20 unit).
            </p>
          </div>
        ) : (
          restockProducts.map(p => {
            const masterItem = masterProducts.find(mp => mp.sku === p.sku);
            const currentStock = masterItem ? masterItem.stock_qty : 0;
            const reqQty = parseQtyNumber(p.qty);
            const shortfall = Math.max(0, reqQty - currentStock);
            const isCritical = currentStock === 0;
            const inputVal = addedQtys[p.sku] || (shortfall > 0 ? shortfall : 50);

            return (
              <div 
                key={p.sku} 
                className={`border rounded-2xl p-4.5 space-y-4.5 transition-all duration-300 ${
                  restockSuccess[p.sku] 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-hairline bg-surface-soft/40 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[13px] font-extrabold text-ink block leading-snug">
                      {p.name.replace('[STOK HABIS] ', '').replace('[STOK TERBATAS] ', '')}
                    </span>
                    <span className="text-[10px] text-muted-light font-medium tracking-wider block">
                      SKU: {p.sku} · Kategori: {masterItem?.category || 'Bahan Bangunan'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase flex-shrink-0 ${
                    isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isCritical ? 'Habis (0)' : `Kritis (${currentStock})`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-hairline/60">
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-muted-light uppercase tracking-wider block">Stok Gudang Real</span>
                    <span className="text-[12.5px] font-bold text-ink flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5 text-muted-light" />
                      {currentStock} {getQtyUnit(p.qty)}
                    </span>
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-muted-light uppercase tracking-wider block">Kebutuhan RAB</span>
                    <span className="text-[12.5px] font-bold text-ink">
                      {reqQty} {getQtyUnit(p.qty)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9.5px] text-red-500 uppercase tracking-wider block">Selisih (Kurang)</span>
                    <span className="text-[12.5px] font-bold text-red-600">
                      {shortfall} {getQtyUnit(p.qty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-hairline rounded-lg px-2 py-1 max-w-[120px]">
                      <input 
                        type="number" 
                        min="1"
                        value={inputVal}
                        onChange={(e) => setAddedQtys(prev => ({ ...prev, [p.sku]: parseInt(e.target.value, 10) || 1 }))}
                        className="w-full bg-transparent border-none outline-none text-[12.5px] text-center font-bold text-ink focus:ring-0 p-0"
                      />
                      <span className="text-[10px] text-muted-light font-bold ml-1">{getQtyUnit(p.qty)}</span>
                    </div>

                    <button 
                      onClick={() => handleRestock(p.sku)}
                      disabled={restockLoading[p.sku] || restockSuccess[p.sku]}
                      className={`px-4.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        restockSuccess[p.sku]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-ink text-white hover:bg-ink-2'
                      } disabled:opacity-50`}
                    >
                      {restockLoading[p.sku] ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : restockSuccess[p.sku] ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {restockSuccess[p.sku] ? 'OK!' : 'Restock'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
