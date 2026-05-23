import { Sparkles, CheckCircle2, Check, Info } from 'lucide-react';

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
    <div className="bg-white border border-hairline rounded-3xl p-6.5 flex flex-col space-y-5">
      <div className="border-b border-hairline pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
              2. Konfirmasi &amp; Otorisasi Substitusi
            </h2>
          </div>
          <p className="text-[11.5px] text-muted mt-1 leading-relaxed">
            Usulan alternatif produk pengganti berspesifikasi setara yang memiliki ketersediaan melimpah. Setujui untuk dialihkan.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700">
          {substituteProducts.length} Usulan
        </span>
      </div>

      <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-warm">
        {substituteProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-50 border border-dashed border-hairline rounded-2xl">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-muted flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-[13.5px] font-extrabold text-ink">Tidak Ada Substitusi</span>
            <p className="text-[11.5px] text-muted mt-1 max-w-[280px]">
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
                className={`border rounded-2xl p-4.5 space-y-4 transition-all duration-300 ${
                  isApproved
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-amber-200 bg-amber-50/10 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[13px] font-extrabold text-ink block leading-snug">
                      {p.name.replace(' (Substitusi Disetujui)', '')}
                    </span>
                    <span className="text-[10px] text-muted-light font-medium tracking-wider block">
                      SKU: {p.sku} · Kategori: {masterItem?.category || 'Bahan Bangunan'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase flex-shrink-0 ${
                    isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isApproved ? 'Disetujui' : 'Alternatif'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-hairline/60 text-[11.5px]">
                  <div>
                    <span className="text-[9px] text-muted-light uppercase tracking-wider block">Harga Satuan</span>
                    <span className="font-bold text-ink">Rp {p.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-light uppercase tracking-wider block">Estimasi Qty</span>
                    <span className="font-bold text-ink">{parseQtyNumber(p.qty)} {getQtyUnit(p.qty)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-muted-light uppercase tracking-wider block">Total Harga</span>
                    <span className="font-bold text-accent">Rp {p.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10.5px] text-muted flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5 text-muted-light" />
                    Spesifikasi setara, stok siap kirim.
                  </span>
                  
                  {!isApproved && (
                    <button 
                      onClick={() => handleApproveSubstitution(p.sku)}
                      className="px-4.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Setujui Substitusi
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
