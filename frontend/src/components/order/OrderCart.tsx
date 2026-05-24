import { AlertTriangle, RefreshCw, Check, Info, ShoppingBag } from 'lucide-react';

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
        
        {/* Glassmorphic Status Proposal Banner */}
        {!isProposalApproved ? (
          <div className="bg-gradient-to-r from-amber-50/70 to-amber-100/30 backdrop-blur-sm border border-amber-200/50 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.05)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-800 block mb-1">Draft Proposal</span>
                <span className="text-[13px] text-slate-700 font-semibold leading-relaxed">Mohon tinjau rencana material di bawah ini. Anda masih bisa memilih atau menyesuaikan item yang diperlukan sebelum melakukan pemesanan.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 bg-white border border-amber-200/80 px-4 py-1.5 rounded-full flex-shrink-0 self-start sm:self-center shadow-sm">Menunggu Persetujuan</span>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-50/70 to-emerald-100/30 backdrop-blur-sm border border-emerald-200/50 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.05)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-800 block mb-1">Keranjang Belanja Aktif</span>
                <span className="text-[13px] text-slate-700 font-semibold leading-relaxed">Rencana material telah disetujui secara resmi. Anda dapat melangkah ke konfigurasi kargo &amp; logistik.</span>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-700 bg-white border border-emerald-200/80 px-4 py-1.5 rounded-full flex-shrink-0 self-start sm:self-center shadow-sm">Telah Disetujui</span>
          </div>
        )}

        {/* Section Header */}
        <div className="border-b border-slate-200/80 pb-5 mb-4">
          <h2 className="text-xl md:text-2xl font-light text-slate-900 tracking-tight font-display">Daftar Material</h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Daftar produk di bawah ini telah kami pilihkan dan sesuaikan dengan rincian spesifikasi teknis proyek Anda.
          </p>
        </div>

        {/* Critical Stock Warning Banner */}
        {warningItem && (
          <div className="bg-gradient-to-r from-red-50/70 to-amber-50/40 border border-red-200/50 backdrop-blur-sm rounded-3xl p-5 flex items-start gap-4 shadow-md">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-600">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-700 block mb-1">
                Peringatan Stok Kritis
              </span>
              <p className="text-[13px] text-slate-700 leading-relaxed font-bold">
                Permintaan material <strong className="font-extrabold text-slate-900">{warningItem.name}</strong> mendekati batas alokasi gudang utama {currentUser?.city || 'Sleman'}.
              </p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold">
                Dibutuhkan verifikasi administrator untuk penambahan stok instan. Anda dapat berganti peran ke Bapak Rudi untuk penambahan kuota stok atau menyetujui draf proposal sekarang.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button 
                  onClick={switchToAdminRudi}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] outline-none"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Alihkan ke Admin Bapak Rudi
                </button>
                <span className="text-xs text-slate-400 font-semibold">
                  Untuk replenishment instan &amp; override diskon volume.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Product Cards List */}
        <div className="space-y-4">
          {localProducts.map((prod) => {
            const isApproved = prod.approved !== false;
            return (
              <div 
                key={prod.sku} 
                className={`bg-white border border-slate-200/80 rounded-3xl p-5 flex gap-5 items-center hover:shadow-[0_12px_30px_-5px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 ${
                  !isApproved ? 'opacity-55 bg-slate-50/50' : ''
                }`}
              >
                {!isProposalApproved && (
                  <div className="flex-shrink-0 pr-1 flex items-center">
                    <div 
                      onClick={() => toggleProductApproval(prod.sku)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-250 ${
                        isApproved 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                          : 'border-slate-350 bg-white hover:border-slate-400'
                      }`}
                    >
                      {isApproved && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                )}
                
                {/* Image with fallback container */}
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 flex-shrink-0 flex items-center justify-center relative group">
                  <img 
                    src={getProductImage(prod.name)} 
                    alt={prod.name} 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${!isApproved ? 'opacity-40' : ''}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 -z-10">
                    <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <span className={`text-[15px] font-bold text-slate-800 truncate block max-w-sm ${
                      !isApproved ? 'line-through text-slate-400 font-medium' : ''
                    }`}>
                      {prod.name}
                    </span>
                    {prod.category && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200 bg-slate-50/50 px-2 py-0.5 rounded-md">
                        {prod.category}
                      </span>
                    )}
                    {!isApproved && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100/50 uppercase tracking-wider">
                        Ditolak / Ditangguhkan
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono tracking-widest text-slate-450">SKU: {prod.sku}</p>
                  
                  <div className="flex items-center gap-2 mt-3.5">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-lg border ${
                      !isApproved 
                        ? 'bg-slate-100 text-slate-400 border-slate-200' 
                        : 'bg-slate-50 text-slate-700 border-slate-200/80 shadow-sm'
                    }`}>
                      {prod.qty} unit
                    </span>
                    <span className="text-slate-300 text-sm font-light">|</span>
                    <span className="text-xs font-semibold text-slate-500">
                      Rp {prod.price.toLocaleString('id-ID')} / unit
                    </span>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 pl-6 border-l border-slate-200/80 h-12 flex flex-col justify-center min-w-[130px]">
                  <span className={`text-base font-extrabold text-slate-900 block tracking-tight ${
                    !isApproved ? 'line-through text-slate-400 font-medium' : ''
                  }`}>
                    Rp {prod.total.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mt-1">Subtotal</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar receipt card */}
      <div className="lg:col-span-4 lg:sticky lg:top-24">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)] space-y-6">


          <div className="space-y-3.5">
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">Subtotal Material</span>
              <span className="font-extrabold text-slate-900">Rp {materialsTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">Banyak Item</span>
              <span className="font-extrabold text-slate-900">{approvedItems.length} Jenis</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">Total Volume</span>
              <span className="font-extrabold text-slate-900">
                {approvedItems.reduce((acc, p) => acc + (parseFloat(p.qty as any) || 0), 0)} Unit
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

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
              className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none ${
                approvedItems.length === 0
                  ? 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed shadow-none'
                  : warningItem 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 hover:shadow-lg hover:shadow-amber-600/20 active:scale-[0.98]'
                    : 'bg-slate-950 hover:bg-black text-white hover:shadow-lg active:scale-[0.98]'
              }`}
            >
              {approvedItems.length === 0 
                ? 'Pilih Minimal 1 Item' 
                : warningItem 
                  ? 'Setujui & Ajukan Restok' 
                  : 'Setujui Rencana & Masukkan Keranjang'}
            </button>
          ) : (
            <div className="space-y-3">
              {warningItem && (
                <div className="p-4 bg-red-50/70 border border-red-100/50 rounded-2xl flex gap-3 items-start text-left mb-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-700 leading-tight">Keranjang Belanja Dibekukan</p>
                    <p className="text-[10px] text-red-600/90 mt-1 leading-relaxed font-semibold">
                      Mohon kesediaan Anda untuk menunggu pembaruan stok oleh tim gudang kami. Tombol checkout akan segera aktif otomatis setelah stok tersedia.
                    </p>
                  </div>
                </div>
              )}
              <button 
                onClick={() => !warningItem && setCartStep('logistics')}
                disabled={!!warningItem}
                className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none ${
                  warningItem
                    ? 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed shadow-none'
                    : 'bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/15 hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {warningItem ? 'Menunggu Update Stok Admin' : 'Lanjut ke Logistik'}
              </button>
            </div>
          )}
          
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] font-semibold text-slate-450 leading-relaxed">
              Data tagihan material ini selalu diperbarui secara otomatis sesuai dengan ketersediaan stok di gudang QHomeMart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
