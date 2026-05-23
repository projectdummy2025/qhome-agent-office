import { AlertTriangle, RefreshCw, Check, ArrowRight } from 'lucide-react';

interface Product {
  sku: string;
  name: string;
  price: number;
  qty: number;
  total: number;
  status?: string;
  category?: string;
  approved?: boolean;
}

interface OrderCartProps {
  currentUser: any;
  currentSessionId: string | null;
  brief: string;
  localProducts: Product[];
  approvedItems: Product[];
  isProposalApproved: boolean;
  setIsProposalApproved: (val: boolean) => void;
  toggleProductApproval: (sku: string) => void;
  warningItem: Product | undefined;
  materialsTotal: number;
  switchToAdminRudi: () => void;
  syncApprovedItemsToSession: (items: Product[]) => Promise<void>;
  sendRestockRequestToAdmin: (items: Product[], approvedItems: Product[]) => Promise<void>;
  setCartStep: (step: 'review' | 'logistics' | 'success') => void;
  getProductImage: (name: string) => string;
}

export default function OrderCart({
  currentUser,
  currentSessionId,
  brief,
  localProducts,
  approvedItems,
  isProposalApproved,
  setIsProposalApproved,
  toggleProductApproval,
  warningItem,
  materialsTotal,
  switchToAdminRudi,
  syncApprovedItemsToSession,
  sendRestockRequestToAdmin,
  setCartStep,
  getProductImage
}: OrderCartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-scale-in">
      <div className="lg:col-span-8 space-y-6">
        {!isProposalApproved ? (
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-extrabold text-sm">!</div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">STATUS: DRAFT PROPOSAL</span>
                <span className="text-[12px] text-amber-900 font-medium">Tinjau rencana material di bawah. Hilangkan centang untuk menolak/mengeluarkan item dari keranjang aktif.</span>
              </div>
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100/50 px-3 py-1 rounded-full border border-amber-200 flex-shrink-0 ml-4">Menunggu Persetujuan</span>
          </div>
        ) : (
          <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-sm">✓</div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">STATUS: KERANJANG B2B AKTIF</span>
                <span className="text-[12px] text-emerald-900 font-medium">Rencana material telah disetujui. Anda dapat melanjutkan ke konfigurasi logistik kargo sekarang.</span>
              </div>
            </div>
            <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200 flex-shrink-0 ml-4">Telah Disetujui</span>
          </div>
        )}

        <div className="border-b border-hairline pb-4 mb-2">
          <h2 className="text-[20px] font-light text-ink tracking-tight">
            Daftar Material <span className="font-extrabold text-ink">Rekomendasi RAG</span>
          </h2>
          <p className="text-[12px] text-muted mt-0.5">
            Daftar produk di bawah ini telah dikurasi dan disesuaikan berdasarkan brief spesifikasi teknis proyek Anda.
          </p>
        </div>

        {warningItem && (
          <div className="bg-amber-50/90 border border-amber-200/80 backdrop-blur-sm rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 block mb-1">
                PERINGATAN STOK CRITICAL (B2B ALLOCATION LIMIT)
              </span>
              <p className="text-[12.5px] text-amber-950 leading-relaxed font-semibold">
                Permintaan material <strong className="font-extrabold">{warningItem.name}</strong> mendekati batas alokasi gudang utama {currentUser?.city || 'Sleman'}.
              </p>
              <p className="text-[11.5px] text-amber-800 mt-1 leading-relaxed">
                Dibutuhkan verifikasi admin untuk memastikan ketersediaan batch logistik instan. Anda dapat berpindah persona ke Bapak Rudi sebagai Administrator untuk otorisasi replenishing kuota stok.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-3">
                <button 
                  onClick={switchToAdminRudi}
                  className="px-4.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-full text-[10.5px] font-extrabold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-700/10 active:scale-[0.98] outline-none"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  Alihkan ke Admin Bapak Rudi
                </button>
                <span className="text-[11px] text-amber-700/80 font-medium">
                  Untuk replenishment instan &amp; override diskon volume.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {(isProposalApproved ? approvedItems : localProducts).map((prod) => {
            const isApproved = prod.approved !== false;
            return (
              <div 
                key={prod.sku} 
                className={`bg-white border border-hairline/80 rounded-2xl p-4.5 flex gap-4.5 items-center hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 ${
                  !isApproved ? 'opacity-55 bg-neutral-50/50' : ''
                }`}
              >
                {!isProposalApproved && (
                  <div className="flex-shrink-0 pr-1 flex items-center">
                    <input 
                      type="checkbox" 
                      id={`chk-${prod.sku}`}
                      checked={isApproved} 
                      onChange={() => toggleProductApproval(prod.sku)}
                      className="w-5 h-5 accent-emerald-600 cursor-pointer rounded-md border-hairline focus:ring-0 focus:ring-offset-0"
                    />
                  </div>
                )}
                <img 
                  src={getProductImage(prod.name)} 
                  alt={prod.name} 
                  className={`w-16 h-16 rounded-xl object-cover border border-hairline/60 flex-shrink-0 transition-opacity ${
                    !isApproved ? 'opacity-40' : ''
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[13.5px] font-extrabold text-ink truncate block ${
                      !isApproved ? 'line-through text-muted-light' : ''
                    }`}>
                      {prod.name}
                    </span>
                    {prod.category && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-light border border-hairline/60 px-2 py-0.5 rounded bg-neutral-50/50">
                        {prod.category}
                      </span>
                    )}
                    {!isApproved && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50 uppercase tracking-wide">
                        Ditolak / Draf Ditangguhkan
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-light font-mono">SKU: {prod.sku}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      !isApproved ? 'bg-neutral-100 text-muted-light' : 'bg-surface-soft text-ink'
                    }`}>
                      {prod.qty}
                    </span>
                    <span className="text-[11.5px] text-muted-light font-light">&times;</span>
                    <span className="text-[11px] text-muted font-medium">
                      Rp {prod.price.toLocaleString('id-ID')} / unit
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 pl-5 border-l border-hairline/60 h-10 flex flex-col justify-center">
                  <span className={`text-[14.5px] font-black text-ink block ${
                    !isApproved ? 'line-through text-muted-light' : ''
                  }`}>
                    Rp {prod.total.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] text-muted-light uppercase tracking-wider block mt-0.5">Subtotal</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-4 sticky top-24">
        <div className="bg-neutral-50 border border-hairline rounded-[22px] p-6.5 space-y-6">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-accent block mb-1">
              DOKUMEN RUJUKAN PROYEK
            </span>
            <h3 className="text-[14.5px] font-extrabold text-ink line-clamp-2 leading-snug">
              {brief || "Procurement Estimasi Logistik B2B"}
            </h3>
            <p className="text-[11.5px] text-muted mt-1 font-medium italic">
              Session ID: {currentSessionId?.substring(0, 8).toUpperCase() || 'N/A'}
            </p>
          </div>

          <div className="h-px bg-hairline" />

          <div className="space-y-3">
            <div className="flex justify-between text-[12.5px] items-center">
              <span className="text-muted">Subtotal Material</span>
              <span className="font-bold text-ink">Rp {materialsTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[12.5px] items-center">
              <span className="text-muted">Banyak Item</span>
              <span className="font-bold text-ink">{approvedItems.length} Jenis</span>
            </div>
            <div className="flex justify-between text-[12.5px] items-center">
              <span className="text-muted">Total Volume</span>
              <span className="font-bold text-ink">
                {approvedItems.reduce((acc, p) => acc + (parseFloat(p.qty as any) || 0), 0)} Unit
              </span>
            </div>
          </div>

          {!isProposalApproved ? (
            <button 
              onClick={async () => {
                if (approvedItems.length > 0) {
                  await syncApprovedItemsToSession(approvedItems);
                  
                  const warningItems = approvedItems.filter(p => p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0);
                  if (warningItems.length > 0) {
                    await sendRestockRequestToAdmin(warningItems, approvedItems);
                  }
                  setIsProposalApproved(true);
                }
              }}
              disabled={approvedItems.length === 0}
              className={`w-full py-3.5 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none ${
                approvedItems.length === 0
                  ? 'bg-neutral-200 text-muted-light border border-hairline cursor-not-allowed shadow-none'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10 active:scale-[0.98]'
              }`}
            >
              {approvedItems.length === 0 
                ? 'Pilih Minimal 1 Item' 
                : warningItem 
                  ? 'Setujui & Ajukan Restok' 
                  : 'Setujui Rencana & Masukkan Keranjang'}
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <div className="space-y-3">
              {warningItem && (
                <div className="p-3 bg-red-50 border border-red-100/50 rounded-xl flex gap-2 items-start text-left mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-red-700 leading-tight">Keranjang Belanja Dibekukan</p>
                    <p className="text-[9.5px] text-red-600/90 mt-0.5 leading-snug">
                      Menunggu Admin Gudang memperbarui stok untuk item bermasalah. Tombol checkout akan aktif otomatis setelah stok diperbarui.
                    </p>
                  </div>
                </div>
              )}
              <button 
                onClick={() => !warningItem && setCartStep('logistics')}
                disabled={!!warningItem}
                className={`w-full py-3.5 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none ${
                  warningItem
                    ? 'bg-neutral-100 text-muted-light border border-hairline cursor-not-allowed shadow-none'
                    : 'bg-accent hover:bg-accent/90 text-white shadow-accent/10 active:scale-[0.98]'
                }`}
              >
                {warningItem ? 'Menunggu Update Stok Admin' : 'Lanjut ke Logistik'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="border-t border-hairline/60 pt-4 text-center">
            <p className="text-[11px] text-muted leading-relaxed">
              Data tagihan material ini tersinkronisasi secara real-time dengan inventori pergudangan QHomeMart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
