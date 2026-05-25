
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

interface SubstitutePanelProps {
  substituteProducts: Product[];
  masterProducts: MasterProduct[];
  handleApproveSubstitution: (sku: string) => void;
  getQtyUnit: (qtyStr: string | number) => string;
  parseQtyNumber: (qtyStr: string | number) => number;
}

export default function SubstitutePanel({
  substituteProducts,
  masterProducts,
  handleApproveSubstitution,
  getQtyUnit,
  parseQtyNumber
}: SubstitutePanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col space-y-6 shadow-sm hover:shadow-lg transition-shadow duration-300 h-full">
      <div className="border-b border-slate-100 pb-5">
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 tracking-widest uppercase inline-block">
            Otorisasi Manajemen
          </span>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest leading-snug">
            Konfirmasi Substitusi
          </h2>
          <p className="text-[13px] text-slate-500 leading-normal max-w-md">
            Usulan alternatif produk pengganti berspesifikasi setara yang memiliki ketersediaan melimpah. Setujui untuk dialihkan.
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-warm">
        {substituteProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <div className="text-4xl font-light text-slate-300 leading-none select-none mb-4">
              00
            </div>
            <span className="text-sm font-bold text-slate-700">Tidak Ada Substitusi</span>
            <p className="text-xs text-slate-500 mt-2 max-w-[280px]">
              Belum ada item alternatif substitusi yang disarankan oleh sistem untuk sesi ini.
            </p>
          </div>
        ) : (
          substituteProducts.map(p => {
            const masterItem = masterProducts.find(mp => mp.sku === p.sku);
            const isApproved = p.name.includes("Disetujui") || p.status === 'ready';

            return (
              <div 
                key={p.sku} 
                className={`group relative border rounded-2xl p-7 space-y-6 transition-all duration-300 ${
                  isApproved
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-[15px] font-bold text-slate-900 block leading-snug">
                      {p.name.replace(' (Substitusi Disetujui)', '')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium tracking-wide block uppercase">
                      SKU: {p.sku} <span className="mx-1.5 text-slate-300">|</span> {masterItem?.category || 'Bahan Bangunan'}
                    </span>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase flex-shrink-0 ${
                    isApproved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {isApproved ? 'Disetujui' : 'Alternatif'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-6 py-5 border-t border-b border-slate-100/80">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Harga Satuan</span>
                    <span className="text-[15px] font-extrabold text-slate-700">Rp {p.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Estimasi Qty</span>
                    <span className="text-[15px] font-extrabold text-slate-700">
                      {parseQtyNumber(p.qty)} <span className="text-[11px] text-slate-400 font-medium">{getQtyUnit(p.qty)}</span>
                    </span>
                  </div>
                  <div className="text-right space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Total Harga</span>
                    <span className="text-[15px] font-extrabold text-accent">Rp {p.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11.5px] text-slate-500 font-medium italic">
                    Spesifikasi setara, stok siap kirim.
                  </span>
                  
                  {!isApproved && (
                    <button 
                      onClick={() => handleApproveSubstitution(p.sku)}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-extrabold uppercase tracking-widest cursor-pointer transition-all shadow-sm hover:shadow-md"
                    >
                      SETUJUI SUBSTITUSI
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
