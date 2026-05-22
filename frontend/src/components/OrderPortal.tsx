import { useState, useRef } from 'react';
import { 
  Calendar, 
  Package, 
  Truck,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Download,
  ShoppingBag,
  Check,
  ShieldAlert,
  Info
} from 'lucide-react';

interface Product {
  sku: string;
  name: string;
  price: number;
  qty: number;
  total: number;
  status?: string;
  category?: string;
}

interface OrderPortalProps {
  currentUser: any;
  currentSessionId: string | null;
  products: Product[];
  brief: string;
  onBack: () => void;
  onPlaceOrder: (orderDetails: any) => void;
}

const TRUCKS = [
  {
    id: 'cdd',
    name: 'Colt Diesel Double (CDD)',
    desc: 'Kapasitas 4–5 Ton. Sangat ideal untuk semen nat, ubin granit standard, dan fluted panel.',
    basePrice: 750000,
    kmRate: 15000,
    badge: 'Paling Populer'
  },
  {
    id: 'fuso',
    name: 'Truk Fuso Box',
    desc: 'Kapasitas 7–8 Ton. Sangat handal untuk semen volume menengah dan fluted panel panjang.',
    basePrice: 1500000,
    kmRate: 25000,
    badge: 'Kapasitas Sedang'
  },
  {
    id: 'tronton',
    name: 'Tronton Wingbox',
    desc: 'Kapasitas 15–20 Ton. Sempurna untuk pengadaan masif, batu alam, dan semen komersial.',
    basePrice: 3000000,
    kmRate: 45000,
    badge: 'Heavy-Duty'
  }
];

const getProductImage = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('paint') || n.includes('cat') || n.includes('jotaplast') || n.includes('interior')) {
    return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=240&auto=format&fit=crop';
  }
  if (n.includes('granit') || n.includes('tile') || n.includes('ceramic') || n.includes('ubin') || n.includes('lantai')) {
    return 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=240&auto=format&fit=crop';
  }
  if (n.includes('fluted') || n.includes('panel') || n.includes('wood') || n.includes('wpc') || n.includes('dinding')) {
    return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=240&auto=format&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=240&auto=format&fit=crop';
};

export default function OrderPortal({
  currentUser,
  currentSessionId,
  products,
  brief,
  onBack,
  onPlaceOrder
}: OrderPortalProps) {
  const [cartStep, setCartStep] = useState<'review' | 'logistics' | 'success'>('review');
  const [selectedTruck, setSelectedTruck] = useState<string>('cdd');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isDoubleVerificationOpen, setIsDoubleVerificationOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  // Dipanggil saat user klik "Konfirmasi Sudah Bayar".
  // Mengirim sinyal ke backend → agent menulis balasan di chat → portal ditutup otomatis.
  const handleConfirmPayment = async () => {
    if (!orderId || !currentSessionId) {
      alert("ID Pesanan atau ID Sesi tidak ditemukan. Harap pastikan pesanan Anda telah berhasil dikirim ke database terlebih dahulu.");
      return;
    }
    setIsConfirming(true);
    try {
      await fetch(`http://localhost:8000/api/projects/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          order_id: orderId,
          client_name: currentUser?.name || 'Klien B2B',
          total_invoice: totalInvoice,
          items_count: products.length,
        }),
      });
      setIsPaymentConfirmed(true);

      // Kirim sinyal ke tab obrolan utama menggunakan BroadcastChannel
      try {
        const channel = new BroadcastChannel('qhome_payment_channel');
        channel.postMessage({ event: 'payment_confirmed', sessionId: currentSessionId });
        channel.close();
      } catch (broadcastErr) {
        console.error('Failed to broadcast payment signal:', broadcastErr);
      }

      // Tutup portal dan kembali ke chat setelah 1.5 detik agar animasi terasa smooth
      setTimeout(() => {
        onPlaceOrder({ order_id: orderId, paid: true });
        onBack();
      }, 1500);
    } catch (err) {
      console.error('Payment confirmation failed:', err);
      alert("Gagal melakukan konfirmasi pembayaran. Silakan periksa koneksi internet Anda atau coba lagi.");
      setIsConfirming(false);
    }
  };

  const activeTruck = TRUCKS.find(t => t.id === selectedTruck) || TRUCKS[0];
  const distance = currentUser?.distanceKm ?? 0;

  // Rumus dynamic logistik berdasarkan jarak persona (e.g. Sleman = 8 Km, Bantul = 15 Km, Kulon Progo = 35 Km)
  const shippingCost = activeTruck.basePrice + (distance * activeTruck.kmRate);
  const materialsTotal = products.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const adminFee = products.length > 0 ? 50000 : 0; // B2B Handling & Dispatch Fee
  const ppn = Math.round((materialsTotal + shippingCost + adminFee) * 0.11);
  const totalInvoice = materialsTotal + shippingCost + adminFee + ppn;

  // Mengalihkan ke admin Bapak Rudi untuk replenish inventori stok katalog
  const switchToAdminRudi = () => {
    if (currentSessionId) {
      window.location.href = `/?portal=order&session_id=${currentSessionId}&user_role=admin`;
    } else {
      window.location.href = `/?portal=order&user_role=admin`;
    }
  };

  const handleSubmitOrder = async () => {
    if (!deliveryDate) {
      alert("Silakan pilih tanggal pengiriman terlebih dahulu.");
      return;
    }
    const payload = {
      session_id: currentSessionId,
      user_id: currentUser?.role || 'default-user',
      client_name: currentUser?.name || 'Klien B2B',
      client_role: currentUser?.roleDisplay || 'Mitra Profesional',
      materials_total: materialsTotal,
      shipping_cost: shippingCost,
      total_invoice: totalInvoice,
      truck_type: activeTruck.name,
      delivery_date: deliveryDate,
      distance_km: distance,
      notes: notes || '',
      items: products.map(p => ({
        product_sku: p.sku,
        qty: parseFloat(p.qty as any) || 0,
        price: p.price,
        total: p.total
      }))
    };

    try {
      const res = await fetch("http://localhost:8000/api/projects/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setOrderId(data.order_id);
        setCartStep('success');
      } else {
        // Read body (if any) to help diagnose server-side validation or errors
        let textBody = '';
        try {
          textBody = await res.text();
        } catch (readErr) {
          console.error('Failed to read error body:', readErr);
        }
        console.error('Order submission failed', { status: res.status, statusText: res.statusText, body: textBody });
        alert(`Gagal mengirimkan pesanan ke database pergudangan. Server responded with ${res.status} ${res.statusText}. Lihat console untuk detail.`);
      }
    } catch (e: any) {
      console.error("Error creating order:", e);
      alert(`Terjadi kesalahan koneksi saat mengirimkan pesanan B2B: ${e?.message || e}`);
    }
  };

  const handleDownloadInvoice = () => {
    if (!currentSessionId) {
      alert("ID Sesi tidak ditemukan. Tidak dapat mengunduh PDF.");
      return;
    }
    window.open(`http://localhost:8000/api/projects/${currentSessionId}/generate-pdf`, '_blank');
  };

  // Mencari produk yang masih memiliki status stok habis/terbatas atau harga 0
  const warningItem = products.find(p => p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0);

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-ink">

      {/* Header Bar */}
      <header className="w-full border-b border-hairline bg-canvas sticky top-0 z-40">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mt-0.5">B2B Procurement Portal</span>
          </div>
          <div className="flex items-center gap-6">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 text-right">
                <span className="text-[11.5px] font-bold text-ink">{currentUser.name}</span>
                <span className="text-[9px] font-light text-muted-light">/</span>
                <span className="text-[9px] uppercase tracking-wider text-muted-light font-bold">{currentUser.roleDisplay}</span>
              </div>
            )}
            <button 
              onClick={onBack}
              className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors focus:outline-none cursor-pointer border border-hairline/60 px-5 py-1.5 rounded-full hover:border-ink transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3 h-3" />
              Kembali ke Chat
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-10">

        {products.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-muted-light mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-[18px] font-bold text-ink tracking-tight">Keranjang Belanja Kosong</h2>
            <p className="text-[12.5px] text-muted max-w-sm mt-1 mb-6 leading-relaxed">
              Belum ada data estimasi material proyek yang dikurasi oleh asisten digital untuk sesi aktif ini.
            </p>
            <button 
              onClick={onBack}
              className="px-6 py-2.5 bg-ink hover:opacity-90 text-white rounded-full text-[11px] font-bold tracking-widest uppercase transition-all"
            >
              Kembali ke Chat Utama
            </button>
          </div>
        ) : (
          /* Main Multi-Step Checkout Flow */
          <div className="flex-1 flex flex-col">
            
            {/* Elegant Progress Tracker */}
            <div className="w-full max-w-3xl mx-auto mb-12">
              <div className="flex items-center justify-between relative">
                {/* Horizontal line connector */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-hairline -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-[2px] bg-accent -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
                  style={{ 
                    width: cartStep === 'review' ? '0%' : cartStep === 'logistics' ? '50%' : '100%' 
                  }}
                />

                {/* Step 1 indicator */}
                <div className="z-10 flex flex-col items-center">
                  <button
                    disabled={cartStep === 'success'}
                    onClick={() => setCartStep('review')}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12.5px] transition-all duration-300 ${
                      cartStep === 'review'
                        ? 'bg-accent text-white ring-4 ring-accent/20 scale-105'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {cartStep !== 'review' ? <Check className="w-4.5 h-4.5" /> : '1'}
                  </button>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2.5 transition-all ${
                    cartStep === 'review' ? 'text-accent' : 'text-muted-light'
                  }`}>Review Material</span>
                </div>

                {/* Step 2 indicator */}
                <div className="z-10 flex flex-col items-center">
                  <button
                    disabled={cartStep === 'review' || cartStep === 'success'}
                    onClick={() => setCartStep('logistics')}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12.5px] transition-all duration-300 ${
                      cartStep === 'logistics'
                        ? 'bg-accent text-white ring-4 ring-accent/20 scale-105'
                        : cartStep === 'success'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-surface-soft border border-hairline text-muted-light'
                    }`}
                  >
                    {cartStep === 'success' ? <Check className="w-4.5 h-4.5" /> : '2'}
                  </button>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2.5 transition-all ${
                    cartStep === 'logistics' ? 'text-accent' : 'text-muted-light'
                  }`}>Logistik &amp; Kargo</span>
                </div>

                {/* Step 3 indicator */}
                <div className="z-10 flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12.5px] transition-all duration-300 ${
                    cartStep === 'success'
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/20 scale-105'
                      : 'bg-surface-soft border border-hairline text-muted-light'
                  }`}>
                    3
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2.5 transition-all ${
                    cartStep === 'success' ? 'text-emerald-600' : 'text-muted-light'
                  }`}>Nota &amp; QRIS</span>
                </div>
              </div>
            </div>

            {/* Step 1: Review Material */}
            {cartStep === 'review' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-scale-in">
                {/* Left side: List of curated products */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="border-b border-hairline pb-4 mb-2">
                    <h2 className="text-[20px] font-light text-ink tracking-tight">
                      Daftar Material <span className="font-extrabold text-ink">Rekomendasi RAG</span>
                    </h2>
                    <p className="text-[12px] text-muted mt-0.5">
                      Daftar produk di bawah ini telah dikurasi dan disesuaikan berdasarkan brief spesifikasi teknis proyek Anda.
                    </p>
                  </div>

                  {/* Out of Stock Warning Banner (Simulated B2B stock surcharge check) */}
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

                  {/* Material Cards */}
                  <div className="space-y-4">
                    {products.map((prod) => (
                      <div 
                        key={prod.sku} 
                        className="bg-white border border-hairline/80 rounded-2xl p-4.5 flex gap-4.5 items-center hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300"
                      >
                        <img 
                          src={getProductImage(prod.name)} 
                          alt={prod.name} 
                          className="w-16 h-16 rounded-xl object-cover border border-hairline/60 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13.5px] font-extrabold text-ink truncate block">{prod.name}</span>
                            {prod.category && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-light border border-hairline/60 px-2 py-0.5 rounded bg-neutral-50/50">
                                {prod.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-light font-mono">SKU: {prod.sku}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-ink bg-surface-soft px-2.5 py-0.5 rounded-full font-bold">
                              {prod.qty} unit
                            </span>
                            <span className="text-[11.5px] text-muted-light font-light">&times;</span>
                            <span className="text-[11px] text-muted font-medium">
                              Rp {prod.price.toLocaleString('id-ID')} / unit
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-5 border-l border-hairline/60 h-10 flex flex-col justify-center">
                          <span className="text-[14.5px] font-black text-ink block">
                            Rp {prod.total.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[9px] text-muted-light uppercase tracking-wider block mt-0.5">Subtotal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: Summary Card */}
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
                        <span className="font-bold text-ink">{products.length} Jenis</span>
                      </div>
                      <div className="flex justify-between text-[12.5px] items-center">
                        <span className="text-muted">Total Volume</span>
                        <span className="font-bold text-ink">
                          {products.reduce((acc, p) => acc + (Number(p.qty) || 0), 0)} Unit
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => !warningItem && setCartStep('logistics')}
                      disabled={!!warningItem}
                      className={`w-full py-3.5 rounded-full text-[12px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none ${
                        warningItem
                          ? 'bg-neutral-200 text-muted-light border border-hairline cursor-not-allowed shadow-none'
                          : 'bg-accent hover:bg-accent/90 text-white shadow-accent/10 active:scale-[0.98]'
                      }`}
                    >
                      {warningItem ? 'Penuhi Stok Terlebih Dahulu' : 'Lanjut ke Logistik'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <div className="border-t border-hairline/60 pt-4 text-center">
                      <p className="text-[11px] text-muted leading-relaxed">
                        Data tagihan material ini tersinkronisasi secara real-time dengan inventori pergudangan QHomeMart.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Logistics Configuration */}
            {cartStep === 'logistics' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-scale-in">
                {/* Left side: Cargo select + form inputs */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="border-b border-hairline pb-4 mb-2">
                    <h2 className="text-[20px] font-light text-ink tracking-tight">
                      Pengaturan <span className="font-extrabold text-ink">Armada &amp; Kargo B2B</span>
                    </h2>
                    <p className="text-[12px] text-muted mt-0.5">
                      Pilih kendaraan kargo berdasarkan volume angkut material dan masukkan tanggal rencana kedatangan logistik.
                    </p>
                  </div>

                  {/* Truck selector */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-light block">
                      01 — Pilih Jenis Armada Kargo
                    </span>
                    <div className="divide-y divide-hairline border-y border-hairline">
                      {TRUCKS.map((truck) => {
                        const isSelected = selectedTruck === truck.id;
                        const cost = truck.basePrice + (distance * truck.kmRate);
                        return (
                          <button
                            key={truck.id}
                            onClick={() => setSelectedTruck(truck.id)}
                            className={`w-full flex items-center gap-5 py-5 text-left outline-none transition-colors duration-200 cursor-pointer px-4 -mx-4 rounded-[20px] ${
                              isSelected ? 'bg-surface-soft/60' : 'hover:bg-surface-soft/30'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'border-accent bg-accent' : 'border-hairline'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </div>

                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'bg-accent/10 text-accent' : 'bg-surface-soft text-muted'
                            }`}>
                              <Truck className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className={`text-[14.5px] font-extrabold leading-none ${isSelected ? 'text-accent' : 'text-ink'}`}>
                                  {truck.name}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-light border border-hairline/60 px-2 py-0.5 rounded bg-white">
                                  {truck.badge}
                                </span>
                              </div>
                              <p className="text-[12px] text-muted leading-relaxed">{truck.desc}</p>
                              <p className="text-[10.5px] text-muted-light font-medium mt-1">
                                Tarif Dasar: Rp {truck.basePrice.toLocaleString('id-ID')} · Jarak: {distance} Km · Tarif Per Km: Rp {truck.kmRate.toLocaleString('id-ID')}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0 pl-4">
                              <span className="text-[16px] font-black text-ink block">
                                Rp {cost.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[9.5px] text-muted-light uppercase tracking-wider font-semibold block mt-0.5">ESTIMASI TARIF</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scheduling + Notes Inputs */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-light block">
                      02 — Tentukan Jadwal &amp; Catatan Khusus
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-muted uppercase tracking-wider mb-2">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          Tanggal Rencana Pengiriman *
                        </label>
                        <input 
                          type="date"
                          value={deliveryDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full bg-surface-soft border border-hairline rounded-xl px-4 py-3 text-[13px] text-ink font-semibold focus:outline-none focus:border-accent/60 transition-all cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-muted uppercase tracking-wider mb-2">
                          <Package className="w-3.5 h-3.5 text-accent" />
                          Catatan Khusus Pengantaran
                        </label>
                        <input 
                          type="text"
                          placeholder="Contoh: Titik taruh garasi depan, harap kabari 1 jam sebelum tiba..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full bg-surface-soft border border-hairline rounded-xl px-4 py-3 text-[13px] text-ink focus:outline-none focus:border-accent/60 transition-all placeholder:text-muted-light"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Detailed Invoice Summary Card */}
                <div className="lg:col-span-4 sticky top-24">
                  <div className="bg-neutral-50 border border-hairline rounded-[22px] p-6.5 space-y-6">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-accent block mb-1">
                        DRAFT INVOICE LOGISTIK
                      </span>
                      <h3 className="text-[14.5px] font-extrabold text-ink">
                        Faktur Rencana Material B2B
                      </h3>
                      <p className="text-[11px] text-muted mt-1 font-medium">
                        Wilayah Pengantaran: <span className="font-semibold text-ink">{currentUser?.city || 'Sleman'} ({distance} Km)</span>
                      </p>
                    </div>

                    <div className="h-px bg-hairline" />

                    <div className="space-y-3.5 pb-2">
                      <div className="flex justify-between text-[12.5px] items-center">
                        <span className="text-muted">Subtotal Material</span>
                        <span className="font-bold text-ink">Rp {materialsTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[12.5px] items-center">
                        <span className="text-muted">Biaya Kargo ({activeTruck.name})</span>
                        <span className="font-bold text-ink">Rp {shippingCost.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[12.5px] items-center">
                        <span className="text-muted">Biaya Penanganan B2B</span>
                        <span className="font-bold text-ink">Rp {adminFee.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-[12.5px] items-center">
                        <span className="text-muted">PPN Terhitung (11%)</span>
                        <span className="font-bold text-ink">Rp {ppn.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="h-px bg-hairline/60" />

                    <div className="flex justify-between items-baseline py-1">
                      <span className="text-[13px] font-extrabold text-ink uppercase tracking-wide">GRAND TOTAL</span>
                      <span className="text-[22px] font-extrabold text-accent">
                        Rp {totalInvoice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        if (!deliveryDate) {
                          alert("Silakan pilih tanggal pengiriman terlebih dahulu.");
                          return;
                        }
                        setIsDoubleVerificationOpen(true);
                      }}
                      className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white rounded-full text-[12.5px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
                    >
                      Konfirmasi Pembayaran
                    </button>
                    
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-light font-medium">
                      <span>Secured QHomeMart ERP Sync Gateway</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen (Nota & QRIS) */}
            {cartStep === 'success' && (
              <div className="w-full flex flex-col gap-10 animate-scale-in">
                {/* Success Banner */}
                <div className="border-b border-hairline pb-7">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-600">
                      TRANSAKSI B2B TERVERIFIKASI &amp; TERDAFTAR DI DATABASE ERP
                    </span>
                  </div>
                  <h1 className="text-[32px] font-light text-ink tracking-tight leading-none">
                    Nota Pembelian &amp; <span className="font-extrabold text-ink">Verifikasi QRIS GPN</span>
                  </h1>
                  <p className="text-[13.5px] text-muted mt-2 max-w-xl leading-relaxed">
                    Pesanan Anda telah dimasukkan ke pipeline pengiriman pergudangan terdistribusi. Silakan selesaikan pembayaran QRIS resmi di bawah untuk mengaktifkan dispatch kargo logistik.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  
                  {/* Left Column: Official Invoice Printable Block (span 7) */}
                  <div className="lg:col-span-7 bg-white border border-hairline rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                    <div className="h-[6px] w-full bg-neutral-900" />
                    <div ref={invoiceRef} className="p-8 space-y-6">
                      
                      {/* Invoice Header */}
                      <div className="flex justify-between items-start border-b border-hairline pb-5">
                        <div>
                          <span className="text-[15px] font-black text-ink tracking-widest uppercase">QHOMEMART B2B</span>
                          <p className="text-[10.5px] text-muted-light mt-0.5">PT QHomeMart Indonesia (Procurement Div)</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-full mb-1.5">
                            PENDING QRIS PAYMENT
                          </span>
                          <p className="text-[11.5px] font-mono text-muted font-bold">
                            {orderId || 'INV-QHM-B2B-PROJ'}
                          </p>
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-6 text-[12.5px] border-b border-hairline pb-6">
                        <div>
                          <p className="text-muted-light font-extrabold uppercase text-[9px] tracking-wider mb-1.5">Diterbitkan Untuk</p>
                          <p className="font-extrabold text-ink">{currentUser?.name || 'Mitra Korporat'}</p>
                          <p className="text-muted mt-0.5 font-medium uppercase tracking-wide text-[11.5px]">{currentUser?.roleDisplay || 'B2B Partner'}</p>
                          <p className="text-muted-light text-[11px] mt-1">Wilayah Jarak: {currentUser?.city || 'Sleman'} ({distance} Km)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-light font-extrabold uppercase text-[9px] tracking-wider mb-1.5">Rincian Armada Logistik</p>
                          <p className="font-extrabold text-ink">{activeTruck.name}</p>
                          <p className="text-muted mt-0.5 text-[11.5px] font-semibold">
                            {deliveryDate 
                              ? new Date(deliveryDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                              : '-'}
                          </p>
                          {notes && (
                            <p className="text-muted-light text-[11px] mt-1 italic">Catatan: "{notes}"</p>
                          )}
                        </div>
                      </div>

                      {/* Line Items Table */}
                      <div className="space-y-3.5">
                        <p className="text-muted-light font-extrabold uppercase text-[9px] tracking-wider">Tabel Rincian Material Proyek</p>
                        <div className="divide-y divide-hairline">
                          {products.map((prod) => (
                            <div key={prod.sku} className="py-3 flex justify-between text-[12.5px] items-center">
                              <div className="min-w-0 flex-1 pr-4">
                                <p className="font-bold text-ink truncate">{prod.name}</p>
                                <p className="text-[11px] text-muted-light font-mono mt-0.5">SKU: {prod.sku}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-ink">Rp {prod.total.toLocaleString('id-ID')}</p>
                                <p className="text-[11px] text-muted mt-0.5">{prod.qty} unit &times; Rp {prod.price.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals Calculation */}
                      <div className="border-t border-hairline pt-5 space-y-2.5">
                        <div className="flex justify-between text-[12.5px] items-center">
                          <span className="text-muted">Subtotal Material</span>
                          <span className="font-bold text-ink">Rp {materialsTotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-[12.5px] items-center">
                          <span className="text-muted">Kargo Armada ({activeTruck.name})</span>
                          <span className="font-bold text-ink">Rp {shippingCost.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-[12.5px] items-center">
                          <span className="text-muted">Biaya Penanganan B2B</span>
                          <span className="font-bold text-ink">Rp {adminFee.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-[12.5px] items-center">
                          <span className="text-muted">PPN (11% Terhitung B2B)</span>
                          <span className="font-bold text-ink">Rp {ppn.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="h-px bg-hairline/60 my-2" />
                        <div className="flex justify-between items-baseline pt-1.5">
                          <span className="text-[13px] font-black text-ink uppercase tracking-wide">GRAND TOTAL INVOICE</span>
                          <span className="text-[22px] font-extrabold text-accent">
                            Rp {totalInvoice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                    </div>
                    <div className="p-8 border-t border-hairline/60 flex items-center justify-end">
                      <button
                        onClick={handleDownloadInvoice}
                        className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-[11px] font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center gap-1.5 focus:outline-none"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF Nota Resmi
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Premium GPN QRIS standee (span 5) */}
                  <div className="lg:col-span-5 bg-neutral-50 border border-hairline p-8 rounded-[24px] flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                    
                    {/* Official QRIS simulated physical standee via SVG */}
                    <div className="mb-6 flex justify-center w-full">
                      <svg width="220" height="290" viewBox="0 0 220 290" className="shadow-lg rounded-2xl overflow-hidden border border-neutral-200 bg-white">
                        {/* QRIS Red Header */}
                        <rect x="0" y="0" width="220" height="52" fill="#E11D48" />
                        <text x="110" y="34" fill="#ffffff" fontSize="20" fontWeight="900" textAnchor="middle" letterSpacing="2.5" fontFamily="sans-serif">QRIS</text>
                        
                        <rect x="0" y="52" width="220" height="238" fill="#ffffff" />
                        
                        {/* Red border for QR area */}
                        <rect x="25" y="66" width="170" height="170" fill="none" stroke="#E11D48" strokeWidth="2.5" rx="5" />
                        
                        {/* QR Code Pixel Matrix Stand */}
                        <path d="M35 76h30v30H35zm0 10h10v10H35zm10 0h10v10H45zm40-10h10v10H85zm20 0h20v10h-20zm30 0h30v30h-30zm10 10h10v10h-10zm10 0h10v10h-10zM35 126h10v20H35zm20-10h10v10H55zm20 0h10v20H75zm20-10h10v10H95zm10 10h15v10H105zm30-10h10v20h-10zm20 0h10v10h-10zm15 10h10v20h-10zM35 166h35v10H35zm50-10h10v10H85zm20 10h10v10h-10zm15-10h20v10h-20zm30 0h10v20h-10zm-95 30h10v15H85zm20-10h20v10h-20zm30 10h10v10h-10zm15-10h10v20h-10z" fill="#171717" />
                        
                        {/* 4 classic QR corners */}
                        <rect x="40" y="81" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                        <rect x="47" y="88" width="6" height="6" fill="#171717" />
                        
                        <rect x="160" y="81" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                        <rect x="167" y="88" width="6" height="6" fill="#171717" />
                        
                        <rect x="40" y="201" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                        <rect x="47" y="208" width="6" height="6" fill="#171717" />
                        
                        <rect x="160" y="201" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                        <rect x="167" y="208" width="6" height="6" fill="#171717" />

                        {/* Mid-bottom merchant text labels */}
                        <text x="110" y="253" fill="#6B7280" fontSize="8.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.8" fontFamily="monospace">NMID: ID102026889271</text>
                        <text x="110" y="271" fill="#E11D48" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8" fontFamily="sans-serif">QHOMEMART PROCURE B2B</text>
                      </svg>
                    </div>

                    {/* QRIS Tutorial list */}
                    <div className="w-full space-y-4">
                      <p className="text-[12px] font-extrabold text-ink uppercase tracking-wider text-center border-b border-hairline pb-2.5">
                        PANDUAN PROSEDUR PEMBAYARAN
                      </p>
                      
                      <ol className="text-[12px] text-muted space-y-3.5 list-decimal pl-4.5">
                        <li>Buka aplikasi <strong>m-Banking</strong> (BCA, Mandiri, dll.) atau <strong>e-Wallet</strong> (Gopay, OVO, ShopeePay) pada ponsel Anda.</li>
                        <li>Klik opsi <strong>Scan / QRIS / Bayar</strong>.</li>
                        <li>Arahkan kamera ponsel ke vector QR Code di atas.</li>
                        <li>Pastikan nama merchant tertera <strong>QHOMEMART PROCURE B2B</strong> dengan total tagihan tepat <strong>Rp {totalInvoice.toLocaleString('id-ID')}</strong>.</li>
                        <li>Masukkan PIN transaksi Anda untuk menyelesaikan pembayaran kargo logistik.</li>
                      </ol>

                      <div className={`rounded-xl p-4 mt-3 text-center transition-all ${isPaymentConfirmed ? 'bg-emerald-50 border border-emerald-200' : 'bg-surface-soft border border-hairline'}`}>
                        {isPaymentConfirmed ? (
                          <p className="text-[13px] text-emerald-700 font-extrabold">
                            Pembayaran dikonfirmasi. Mengalihkan ke chat...
                          </p>
                        ) : (
                          <>
                            <p className="text-[11px] text-muted mb-3 leading-relaxed">
                              Setelah scan dan transfer berhasil, klik tombol di bawah untuk mengaktifkan kargo dan mendapatkan konfirmasi dari agen.
                            </p>
                            <button
                              onClick={handleConfirmPayment}
                              disabled={isConfirming}
                              className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold tracking-wider uppercase transition-all disabled:opacity-60 cursor-pointer focus:outline-none flex items-center justify-center gap-2"
                            >
                              {isConfirming ? (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                              )}
                              {isConfirming ? 'Memproses...' : 'Konfirmasi Sudah Bayar'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!isPaymentConfirmed && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 border-t border-hairline pt-8">
                    <button 
                      onClick={onBack}
                      className="px-8 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-[11px] font-bold tracking-widest active:scale-[0.97] transition-all cursor-pointer uppercase focus:outline-none"
                    >
                      Kembali ke Obrolan Utama
                    </button>
                    <button
                      onClick={() => {
                        if (window.opener) {
                          window.close();
                        } else {
                          onBack();
                        }
                      }}
                      className="px-8 py-3 border border-hairline/80 hover:bg-neutral-50 text-muted hover:text-ink rounded-full text-[11px] font-bold tracking-widest active:scale-[0.97] transition-all cursor-pointer uppercase focus:outline-none"
                    >
                      Tutup Halaman Ini
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Double Verification Glassmorphic Modal */}
        {isDoubleVerificationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-neutral-900/40 animate-fade-in">
            <div className="bg-white border border-hairline rounded-[26px] shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
              
              {/* Graphic Banner Header */}
              <div className="bg-neutral-900 text-white px-8 py-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-accent block mb-1">
                    OTORISASI KEAMANAN TINGKAT GANDA (DOUBLE VERIFICATION)
                  </span>
                  <h2 className="text-[18px] font-black tracking-tight leading-none">
                    Konfirmasi &amp; Lock Rencana Material
                  </h2>
                </div>
              </div>
              
              {/* Verification Checklist Items */}
              <div className="p-8 space-y-5">
                <p className="text-[12.5px] text-muted leading-relaxed">
                  Sebelum mengirimkan detail logistik ke database pergudangan terdistribusi QHomeMart, harap verifikasi ulang aspek kelayakan pengantaran berikut:
                </p>
                
                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ink leading-tight">Verifikasi Aksesibilitas Kargo</p>
                      <p className="text-[11.5px] text-muted leading-snug">Jalan menuju proyek di <span className="font-semibold text-ink">{currentUser?.city || 'HQ'}</span> sanggup dilalui oleh armada <span className="font-semibold text-ink">{activeTruck.name}</span>.</p>
                    </div>
                  </div>
                  
                  {/* Item 2 */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ink leading-tight">Reservasi Alokasi Inventori</p>
                      <p className="text-[11.5px] text-muted leading-snug">Item material sebanyak <span className="font-semibold text-ink">{products.length} jenis</span> akan dipotong secara real-time dari stok katalog QHomeMart.</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ink leading-tight">Validitas Invoice</p>
                      <p className="text-[11.5px] text-muted leading-snug">Total tagihan logistik &amp; material sebesar <span className="font-semibold text-accent">Rp {totalInvoice.toLocaleString('id-ID')}</span> telah disepakati.</p>
                    </div>
                  </div>
                </div>
                
                {/* Information Banner */}
                <div className="bg-neutral-50 border border-hairline rounded-xl p-4 text-[11.5px] text-muted leading-relaxed flex gap-2.5">
                  <Info className="w-4 h-4 text-muted-light flex-shrink-0 mt-0.5" />
                  <span>
                    Penyelesaian transaksi ini akan secara otomatis memicu proses pengemasan kargo di pergudangan terdistribusi QHomeMart.
                  </span>
                </div>
              </div>
              
              {/* Actions Footer */}
              <div className="bg-neutral-50 px-8 py-5 border-t border-hairline flex items-center justify-end gap-3.5">
                <button 
                  onClick={() => setIsDoubleVerificationOpen(false)}
                  className="px-5 py-2 hover:bg-neutral-100 border border-hairline/60 rounded-full text-[11px] font-bold tracking-wider text-muted uppercase cursor-pointer focus:outline-none"
                >
                  Batalkan
                </button>
                <button 
                  onClick={() => {
                    setIsDoubleVerificationOpen(false);
                    handleSubmitOrder();
                  }}
                  className="px-6 py-2 bg-accent hover:bg-accent/90 text-white rounded-full text-[11px] font-bold tracking-wider uppercase cursor-pointer focus:outline-none shadow-md shadow-accent/15 active:scale-[0.98] transition-all"
                >
                  Setujui &amp; Kirim Pesanan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-[11px] text-muted-light mt-auto pt-6 border-t border-hairline/60">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office B2B Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
