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
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/70 via-white/50 to-slate-50/50 border border-amber-200/50 backdrop-blur-sm rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-300">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-600 ring-4 ring-amber-500/5 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-800 bg-amber-50 border border-amber-200/40 px-2.5 py-1 rounded-md inline-block">
                  Pemberitahuan Alokasi Stok
                </span>
                <p className="text-[13px] text-slate-700 leading-relaxed font-semibold">
                  Mohon maaf atas ketidaknyamanannya. Ketersediaan material <strong className="font-extrabold text-slate-900">{warningItem.name}</strong> saat ini sedang terbatas di area gudang utama {currentUser?.city || 'Sleman'}.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Untuk memastikan kelancaran pemesanan Anda, diperlukan konfirmasi alokasi tambahan. Anda dapat masuk ke panel pengelola gudang untuk memproses verifikasi stok instan.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-200/60 pt-4 md:pt-0 md:pl-5 flex-shrink-0">
              <button 
                onClick={switchToAdminRudi}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-[0.98] outline-none group min-w-[160px]"
              >
                <RefreshCw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" />
                PORTAL ADMIN
              </button>
              <span className="text-[10px] text-slate-400 text-center md:text-right font-medium">
                Untuk replenishment &amp; volume discount
              </span>
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
                className={`bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 hover:shadow-[0_12px_30px_-5px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 ${
                  !isApproved ? 'opacity-55 bg-slate-50/50' : ''
                }`}
              >
                {/* Top Section: Checkbox + Image + Title/SKU */}
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                  {!isProposalApproved && (
                    <div className="flex-shrink-0 pt-1.5 sm:pr-1 flex items-center">
                      <div 
                        onClick={() => toggleProductApproval(prod.sku)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-250 ${
                          isApproved 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                      >
                        {isApproved && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>
                  )}
                  
                  {/* Image with fallback container */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 flex-shrink-0 flex items-center justify-center relative group self-start">
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

                  {/* Title & SKU details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-1">
                      <span className={`text-[14px] sm:text-[15px] font-bold text-slate-800 truncate block max-w-full ${
                        !isApproved ? 'line-through text-slate-400 font-medium' : ''
                      }`}>
                        {prod.name}
                      </span>
                      {prod.category && (
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200 bg-slate-50/50 px-2 py-0.5 rounded-md">
                          {prod.category}
                        </span>
                      )}
                      {!isApproved && (
                        <span className="text-[8px] sm:text-[9px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100/50 uppercase tracking-wider">
                          Ditolak / Ditangguhkan
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-mono tracking-widest text-slate-400">SKU: {prod.sku}</p>
                    
                    {/* Price and Quantity (Desktop-only, left-aligned under SKU) */}
                    <div className="hidden sm:flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-lg border whitespace-nowrap bg-slate-50 text-slate-700 border-slate-200/80 shadow-sm`}>
                        {prod.qty} unit
                      </span>
                      <span className="text-slate-300 text-sm font-light">|</span>
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Rp {prod.price.toLocaleString('id-ID')} / unit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile-only Price, Quantity & Subtotal Section (Vertical Stack, Left Aligned) */}
                <div className="flex sm:hidden flex-col gap-1.5 pt-3 border-t border-slate-100 mt-1 w-full text-left">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Kuantitas: <span className="font-bold text-slate-800">{prod.qty} unit</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Harga Satuan: <span className="font-bold text-slate-800">Rp {prod.price.toLocaleString('id-ID')} / unit</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-950 mt-0.5">
                    Subtotal: <span className="text-sm font-black text-slate-950">Rp {prod.total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Desktop-only Subtotal Section */}
                <div className="hidden sm:flex text-right flex-shrink-0 pl-6 border-l border-slate-200/80 h-12 flex-col justify-center min-w-[140px] self-center">
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
                  
                  const warningItems = approvedItems.filter(p =>
                    /\[STOK HABIS\]|\[STOK TERBATAS\]|\(Estimasi Internet|\(Menunggu /.test(p.name) || p.price === 0
                  );
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
                <div className="p-4 bg-amber-50/70 border border-amber-100/50 rounded-2xl flex gap-3 items-start text-left mb-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 leading-tight">Keranjang Belanja Ditangguhkan Sementara</p>
                    <p className="text-[10px] text-slate-600 mt-1 leading-relaxed font-medium">
                      Mohon kesediaan Bapak/Ibu untuk menunggu pembaruan alokasi oleh tim gudang kami. Tombol pemesanan akan aktif secara otomatis setelah alokasi stok terverifikasi.
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
            <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
              Data tagihan material ini selalu diperbarui secara otomatis sesuai dengan ketersediaan stok di gudang QHomeMart.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
