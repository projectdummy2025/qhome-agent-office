
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
    <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col space-y-6 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full">
      <div className="border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 tracking-widest uppercase inline-block">
            Operasional Gudang
          </span>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest leading-snug">
            Permintaan Penambahan Stok
          </h2>
          <p className="text-[13px] text-slate-500 leading-normal max-w-md">
            Material proyek yang sedang kritis atau habis di gudang utama Sleman. Lakukan restock kuota logistik master.
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-warm">
        {restockProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <div className="text-4xl font-light text-slate-300 leading-none select-none mb-4">
              00
            </div>
            <span className="text-sm font-bold text-slate-700">Aman Terkendali</span>
            <p className="text-xs text-slate-500 mt-2 max-w-[280px]">
              Semua stok gudang untuk kebutuhan material sesi ini telah tercukupi.
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
                className={`group relative border rounded-2xl p-7 space-y-6 transition-all duration-300 ${
                  restockSuccess[p.sku] 
                    ? 'border-emerald-200 bg-emerald-50/50' 
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-[15px] font-bold text-slate-900 block leading-snug">
                      {p.name.replace('[STOK HABIS] ', '').replace('[STOK TERBATAS] ', '')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium tracking-wide block uppercase">
                      SKU: {p.sku} <span className="mx-1.5 text-slate-300">|</span> {masterItem?.category || 'Bahan Bangunan'}
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase flex-shrink-0 ${
                    isCritical ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {isCritical ? 'Habis (0)' : `Kritis (${currentStock})`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 pt-5 border-t border-slate-100/80">
                  <div className="flex gap-8 flex-1">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Stok Real</span>
                      <span className="text-[15px] font-extrabold text-slate-700">
                        {currentStock} <span className="text-[11px] text-slate-400 font-medium">{getQtyUnit(p.qty)}</span>
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Kebutuhan</span>
                      <span className="text-[15px] font-extrabold text-slate-700">
                        {reqQty} <span className="text-[11px] text-slate-400 font-medium">{getQtyUnit(p.qty)}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-red-400/80 uppercase tracking-widest block font-bold">Kekurangan</span>
                      <span className="text-[15px] font-extrabold text-red-600">
                        {shortfall} <span className="text-[11px] text-red-400 font-medium">{getQtyUnit(p.qty)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-[130px] transition-all focus-within:border-slate-400 focus-within:bg-white focus-within:shadow-sm">
                      <input 
                        type="number" 
                        min="1"
                        value={inputVal}
                        onChange={(e) => setAddedQtys(prev => ({ ...prev, [p.sku]: parseInt(e.target.value, 10) || 1 }))}
                        className="w-full bg-transparent border-none outline-none text-[15px] text-center font-bold text-slate-900 focus:ring-0 p-0"
                      />
                      <span className="text-[11px] text-slate-400 font-semibold ml-2">{getQtyUnit(p.qty)}</span>
                    </div>

                    <button 
                      onClick={() => handleRestock(p.sku)}
                      disabled={restockLoading[p.sku] || restockSuccess[p.sku]}
                      className={`px-6 py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                        restockSuccess[p.sku]
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md'
                      } disabled:opacity-50`}
                    >
                      {restockLoading[p.sku] ? (
                        'Memproses...'
                      ) : restockSuccess[p.sku] ? (
                        'SELESAI'
                      ) : (
                        'RESTOCK'
                      )}
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
