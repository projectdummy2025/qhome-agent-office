import { useState } from 'react';
import { 
  Calendar, 
  Package, 
  Award,
  Truck
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
    desc: 'Kapasitas 4–5 Ton. Cocok untuk batch ubin granit, fluted panel, dan semen nat.',
    price: 750000,
    badge: 'Paling Populer'
  },
  {
    id: 'fuso',
    name: 'Truk Fuso Box',
    desc: 'Kapasitas 7–8 Ton. Untuk material semen volume menengah dan fluted panel panjang.',
    price: 1500000,
    badge: 'Kapasitas Sedang'
  },
  {
    id: 'tronton',
    name: 'Tronton Wingbox',
    desc: 'Kapasitas 15–20 Ton. Khusus muatan masif, batu alam andesit, dan proyek komersial.',
    price: 3000000,
    badge: 'Heavy-Duty'
  }
];

export default function OrderPortal({
  currentUser,
  currentSessionId,
  products,
  onBack,
  onPlaceOrder
}: OrderPortalProps) {
  const [selectedTruck, setSelectedTruck] = useState<string>('cdd');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isOrdered, setIsOrdered] = useState(false);

  const activeTruck = TRUCKS.find(t => t.id === selectedTruck) || TRUCKS[0];
  const materialsTotal = products.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const shippingCost = activeTruck.price;
  const totalInvoice = materialsTotal + shippingCost;

  const handleSubmitOrder = async () => {
    if (!deliveryDate) {
      alert("Silakan pilih tanggal pengiriman terlebih dahulu.");
      return;
    }
    const payload = {
      session_id: currentSessionId,
      user_id: currentUser?.role || 'default-user',
      materials_total: materialsTotal,
      shipping_cost: shippingCost,
      total_invoice: totalInvoice,
      truck_type: activeTruck.name,
      delivery_date: deliveryDate,
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
        setIsOrdered(true);
        onPlaceOrder(payload);
      } else {
        alert("Gagal mengirimkan pesanan ke database pergudangan.");
      }
    } catch (e) {
      console.error("Error creating order:", e);
      alert("Terjadi kesalahan koneksi saat mengirimkan pesanan.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">

      {/* Header Bar */}
      <header className="w-full border-b border-hairline bg-canvas sticky top-0 z-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-light mt-0.5">Logistics & Order</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <span className="text-[11.5px] font-bold text-ink">{currentUser.name}</span>
              <span className="text-[9px] font-light text-muted-light">/</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-light font-bold">{currentUser.roleDisplay}</span>
            </div>
            <button 
              onClick={onBack}
              className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors focus:outline-none cursor-pointer border border-hairline/60 px-5 py-1.5 rounded-full hover:border-ink transition-all"
            >
              KEMBALI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-10">

        {isOrdered ? (
          /* ── Success State: B2B Invoice & QRIS Payment Tutorial ── */
          <div className="w-full flex flex-col gap-8 animate-scale-in">
            {/* Header Success */}
            <div className="border-b border-hairline pb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 mb-2 block">TRANSAKSI TELAH DIKONFIRMASI</span>
              <h1 className="text-[32px] font-light text-ink tracking-tight leading-tight">
                Nota Pembelian &amp; <span className="font-extrabold text-ink">Metode Pembayaran</span>
              </h1>
              <p className="text-[13px] text-muted mt-1.5 max-w-xl">
                Pesanan material B2B Anda telah terdaftar di sistem pergudangan terdistribusi QHomeMart. Silakan lakukan pembayaran QRIS di bawah ini untuk mengaktifkan armada logistik.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Official Invoice (Nota) — span 7 */}
              <div className="lg:col-span-7 bg-white border border-hairline rounded-[22px] shadow-sm overflow-hidden">
                {/* Invoice Ribbon */}
                <div className="h-2 w-full bg-ink" />
                
                <div className="p-8">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start border-b border-hairline pb-6 mb-6">
                    <div>
                      <span className="text-[14px] font-black text-ink tracking-widest uppercase">QHOMEMART B2B</span>
                      <p className="text-[10px] text-muted-light mt-0.5">PT QHomeMart Indonesia (Procurement Div)</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-full mb-2">
                        MENUNGGU PEMBAYARAN
                      </span>
                      <p className="text-[11px] font-mono text-muted">INV/QHM-B2B/{currentSessionId?.substring(0, 8).toUpperCase() || 'PROJ-EST'}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-6 text-[12.5px] border-b border-hairline pb-6 mb-6">
                    <div>
                      <p className="text-muted-light font-medium uppercase text-[9px] tracking-wider mb-1">Diterbitkan Untuk</p>
                      <p className="font-bold text-ink">{currentUser?.name || 'Mitra Korporat'}</p>
                      <p className="text-muted mt-0.5 text-[11.5px] uppercase tracking-wide font-medium">{currentUser?.roleDisplay || 'B2B Partner'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-light font-medium uppercase text-[9px] tracking-wider mb-1">Jadwal Pengiriman</p>
                      <p className="font-bold text-ink">{activeTruck.name}</p>
                      <p className="text-muted mt-0.5 text-[11.5px]">
                        {new Date(deliveryDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Material Line Items */}
                  <div className="space-y-4">
                    <p className="text-muted-light font-medium uppercase text-[9px] tracking-wider">Rincian Item Material</p>
                    <div className="divide-y divide-hairline">
                      {products.map((prod) => (
                        <div key={prod.sku} className="py-3 flex justify-between text-[12.5px] items-center">
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="font-semibold text-ink truncate">{prod.name}</p>
                            <p className="text-[11.5px] text-muted-light font-mono mt-0.5">SKU: {prod.sku}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-ink">Rp {prod.total.toLocaleString('id-ID')}</p>
                            <p className="text-[11px] text-muted mt-0.5">{prod.qty} unit &times; Rp {prod.price.toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals Block */}
                  <div className="border-t border-hairline pt-5 mt-6 space-y-2.5">
                    <div className="flex justify-between text-[12.5px]">
                      <span className="text-muted">Subtotal Material</span>
                      <span className="font-semibold text-ink">Rp {materialsTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[12.5px]">
                      <span className="text-muted">Biaya Pengiriman ({activeTruck.name})</span>
                      <span className="font-semibold text-ink">Rp {shippingCost.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-px bg-hairline/60 my-2" />
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[14px] font-black text-ink uppercase tracking-wide">GRAND TOTAL INVOICE</span>
                      <span className="text-[22px] font-extrabold text-accent">
                        Rp {totalInvoice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QRIS Payment Stand & Tutorial — span 5 */}
              <div className="lg:col-span-5 bg-neutral-50 border border-hairline p-8 rounded-[22px] flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                
                {/* Authentic QRIS simulated stand using SVG */}
                <div className="mb-6 flex justify-center">
                  <svg width="220" height="290" viewBox="0 0 220 290" className="shadow-md rounded-xl overflow-hidden border border-neutral-200 bg-white">
                    {/* Header Block QRIS */}
                    <rect x="0" y="0" width="220" height="50" fill="#E11D48" />
                    <text x="110" y="32" fill="#ffffff" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="2" fontFamily="sans-serif">QRIS</text>
                    
                    {/* Body */}
                    <rect x="0" y="50" width="220" height="240" fill="#ffffff" />
                    
                    {/* QR Code Outer Boundary */}
                    <rect x="25" y="65" width="170" height="170" fill="none" stroke="#E11D48" strokeWidth="2" rx="4" />
                    
                    {/* Simulated QR Code Pixels */}
                    <path d="M35 75h30v30H35zm0 10h10v10H35zm10 0h10v10H45zm40-10h10v10H85zm20 0h20v10h-20zm30 0h30v30h-30zm10 10h10v10h-10zm10 0h10v10h-10zM35 125h10v20H35zm20-10h10v10H55zm20 0h10v20H75zm20-10h10v10H95zm10 10h15v10H105zm30-10h10v20h-10zm20 0h10v10h-10zm15 10h10v20h-10zM35 165h35v10H35zm50-10h10v10H85zm20 10h10v10h-10zm15-10h20v10h-20zm30 0h10v20h-10zm-95 30h10v15H85zm20-10h20v10h-20zm30 10h10v10h-10zm15-10h10v20h-10z" fill="#171717" />
                    
                    {/* QR Corners */}
                    <rect x="40" y="80" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                    <rect x="47" y="87" width="6" height="6" fill="#171717" />
                    
                    <rect x="160" y="80" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                    <rect x="167" y="87" width="6" height="6" fill="#171717" />
                    
                    <rect x="40" y="200" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                    <rect x="47" y="207" width="6" height="6" fill="#171717" />
                    
                    <rect x="160" y="200" width="20" height="20" fill="none" stroke="#171717" strokeWidth="4" />
                    <rect x="167" y="207" width="6" height="6" fill="#171717" />

                    {/* Footer merchant label */}
                    <text x="110" y="253" fill="#6B7280" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.5" fontFamily="monospace">NMID: ID102026889271</text>
                    <text x="110" y="270" fill="#E11D48" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="0.5" fontFamily="sans-serif">QHOMEMART PROCURE B2B</text>
                  </svg>
                </div>

                {/* Tutorial Pembayaran */}
                <div className="w-full space-y-4">
                  <p className="text-[13px] font-bold text-ink uppercase tracking-wider text-center border-b border-hairline pb-2.5">
                    PANDUAN PEMBAYARAN QRIS
                  </p>
                  
                  <ol className="text-[12px] text-muted space-y-2.5 list-decimal pl-4">
                    <li>Buka aplikasi <strong>m-Banking</strong> (BCA, Mandiri, dll.) atau <strong>e-Wallet</strong> (GoPay, ShopeePay, OVO) Anda.</li>
                    <li>Pilih menu <strong>Pindai / QRIS / Scan</strong>.</li>
                    <li>Arahkan kamera ponsel Anda ke gambar barcode QRIS di atas.</li>
                    <li>Pastikan nama merchant tertera <strong>QHOMEMART PROCURE B2B</strong> dengan jumlah tagihan tepat <strong>Rp {totalInvoice.toLocaleString('id-ID')}</strong>.</li>
                    <li>Masukkan PIN transaksi Anda untuk menyelesaikan pembayaran.</li>
                  </ol>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 mt-2">
                    <p className="text-[11.5px] text-emerald-800 leading-relaxed text-center font-medium">
                      Verifikasi pembayaran berjalan otomatis dalam 2-3 menit. Status pesanan Anda di portal administrasi akan diperbarui secara real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-center mt-6">
              <button 
                onClick={onBack}
                className="px-8 py-2.5 bg-ink hover:opacity-90 text-white rounded-full text-[11px] font-bold tracking-widest active:scale-[0.97] transition-all cursor-pointer uppercase focus:outline-none"
              >
                KEMBALI KE PORTAL KONSULTASI
              </button>
            </div>
          </div>
        ) : (
          /* ── Checkout Form ── */
          <>
            {/* Page Title */}
            <div className="mb-8">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-accent mb-3">Pemesanan Kargo</p>
              <h1 className="text-[32px] font-light text-ink tracking-tight leading-tight">
                Checkout{' '}
                <span className="font-extrabold">Rencana Material</span>
              </h1>
              <p className="text-[13px] text-muted mt-1">
                Selesaikan jadwal armada pengiriman dan verifikasi data transaksi.
              </p>
            </div>

            <div className="flex gap-12">

              {/* Left: main form */}
              <div className="flex-1 min-w-0 space-y-8">

                {/* 1. Truck selection — horizontal row list, no card wrapper */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">
                      01 — Pilih Armada Kargo
                    </span>
                    <div className="flex-1 h-px bg-hairline" />
                  </div>
                  <div className="divide-y divide-hairline border-y border-hairline">
                    {TRUCKS.map((truck) => {
                      const isSelected = selectedTruck === truck.id;
                      return (
                        <button
                          key={truck.id}
                          onClick={() => setSelectedTruck(truck.id)}
                          className={`w-full flex items-center gap-5 py-4 text-left outline-none transition-colors duration-200 cursor-pointer px-4 -mx-4 rounded-full ${
                            isSelected ? 'bg-surface-soft/60' : 'hover:bg-surface-soft/30'
                          }`}
                        >
                          {/* Selection indicator */}
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-accent bg-accent' : 'border-hairline'
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </div>

                          {/* Truck icon */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-accent/10' : 'bg-surface-soft'
                          }`}>
                            <Truck className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-muted'}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-0.5">
                              <span className={`text-[14px] font-bold leading-none ${isSelected ? 'text-accent' : 'text-ink'}`}>
                                {truck.name}
                              </span>
                              <span className="text-[9.5px] font-bold uppercase tracking-wider text-muted-light border border-hairline/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {truck.badge}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-muted leading-relaxed">{truck.desc}</p>
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-[15px] font-extrabold text-ink block">
                              Rp {truck.price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9.5px] text-muted-light uppercase tracking-wider">Tarif Kirim</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Scheduling + notes — side by side, no card */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">
                      02 — Jadwal & Catatan
                    </span>
                    <div className="flex-1 h-px bg-hairline" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-2">
                        <Calendar className="w-3 h-3" />
                        Tanggal Pengiriman
                      </label>
                      <input 
                        type="date"
                        value={deliveryDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full bg-surface-soft border border-hairline rounded-xl px-4 py-3 text-[13px] text-ink font-semibold focus:outline-none focus:border-accent/60 transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted mb-2">
                        <Package className="w-3 h-3" />
                        Catatan Logistik
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: Gang masuk sempit, letakkan semen di garasi..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-surface-soft border border-hairline rounded-xl px-4 py-3 text-[13px] text-ink focus:outline-none focus:border-accent/60 transition-all placeholder:text-muted-light"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right: invoice summary — minimal, no card box */}
              <div className="w-72 flex-shrink-0 hidden lg:block">
                <div className="sticky top-24">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">Ringkasan Faktur</span>
                    <div className="flex-1 h-px bg-hairline" />
                  </div>

                  <div className="space-y-3 pb-4 border-b border-hairline mb-4">
                    <div className="flex justify-between text-[12.5px]">
                      <span className="text-muted">Total Material ({products.length} item)</span>
                      <span className="font-semibold text-ink">Rp {materialsTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[12.5px]">
                      <span className="text-muted">Pengiriman ({activeTruck.name})</span>
                      <span className="font-semibold text-ink">Rp {shippingCost.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline mb-6">
                    <span className="text-[13px] font-bold text-ink">Total Tagihan</span>
                    <span className="text-[22px] font-extrabold text-accent">
                      Rp {totalInvoice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button 
                    onClick={handleSubmitOrder}
                    className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white rounded-full text-[13px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center focus:outline-none cursor-pointer"
                  >
                    Kirim Pesanan
                  </button>

                  {/* Benefit — border-left accent, no card */}
                  <div className="mt-6 border-l-2 border-accent/30 pl-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Award className="w-3 h-3 text-accent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-light">Mitra Unggulan</span>
                    </div>
                    <p className="text-[11.5px] text-muted leading-relaxed">
                      Material resmi berkualitas tinggi, garansi pengiriman kargo, dan layanan prioritas 24/7.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Mobile: submit button */}
            <div className="lg:hidden mt-8 pt-6 border-t border-hairline">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-[13px] font-bold text-ink">Total Tagihan</span>
                <span className="text-[20px] font-extrabold text-accent">
                  Rp {totalInvoice.toLocaleString('id-ID')}
                </span>
              </div>
              <button 
                onClick={handleSubmitOrder}
                className="w-full py-3.5 bg-accent hover:bg-accent/90 text-white rounded-full text-[13px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center focus:outline-none cursor-pointer"
              >
                Kirim Pesanan
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-[11px] text-muted-light mt-auto pt-6 border-t border-hairline/60">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office B2B Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
