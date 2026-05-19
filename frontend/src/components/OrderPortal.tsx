import { useState } from 'react';
import { 
  Calendar, 
  Package, 
  Award,
  ChevronRight,
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
  const materialsTotal = products.reduce((acc, p) => acc + (p.price * p.qty), 0);
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
          /* ── Success State ── */
          <div className="max-w-lg mx-auto py-16 animate-scale-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <ChevronRight className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-[22px] font-extrabold text-ink tracking-tight leading-tight">
                  Pesanan Berhasil Dibuat
                </h2>
                <p className="text-[12.5px] text-muted">Faktur dan jadwal armada kargo sedang dipersiapkan.</p>
              </div>
            </div>

            <div className="border-t border-hairline pt-5 space-y-3.5">
              <div className="flex justify-between text-[13px] pb-3 border-b border-hairline/60">
                <span className="text-muted">Metode Pengiriman</span>
                <span className="font-semibold text-ink">{activeTruck.name}</span>
              </div>
              <div className="flex justify-between text-[13px] pb-3 border-b border-hairline/60">
                <span className="text-muted">Tanggal Pengiriman</span>
                <span className="font-semibold text-ink">
                  {new Date(deliveryDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-[14px] font-bold text-ink">Total Faktur</span>
                <span className="text-[22px] font-extrabold text-accent">
                  Rp {totalInvoice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button 
              onClick={onBack}
              className="mt-8 px-6 py-2.5 bg-ink hover:opacity-90 text-white rounded-full text-[13px] font-bold tracking-wide active:scale-[0.97] transition-all cursor-pointer uppercase text-[11px]"
            >
              Kembali ke Portal Konsultasi
            </button>
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
