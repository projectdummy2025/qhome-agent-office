import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { ArrowLeft, Check, ShieldAlert, Info, ShoppingBag } from 'lucide-react';
import OrderCart from './order/OrderCart';
import OrderShipping from './order/OrderShipping';
import OrderPayment from './order/OrderPayment';

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

  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isProposalApproved, setIsProposalApproved] = useState(false);

  useEffect(() => {
    setLocalProducts(products.map(p => ({ ...p, approved: true })));
  }, [products]);

  useEffect(() => {
    if (currentSessionId) {
      fetch(`${API_BASE_URL}/api/projects/sessions/${currentSessionId}/messages`)
        .then(res => res.json())
        .then(data => {
          const hasRestock = data.some((m: any) => m.content && m.content.includes("Persetujuan sudah diterima"));
          if (hasRestock) {
            setIsProposalApproved(true);
          } else {
            setIsProposalApproved(false);
          }
        })
        .catch(err => console.error(err));
    } else {
      setIsProposalApproved(false);
    }
  }, [currentSessionId]);

  const approvedItems = localProducts.filter(p => p.approved !== false);

  const toggleProductApproval = (sku: string) => {
    setLocalProducts(prev => prev.map(p => p.sku === sku ? { ...p, approved: !p.approved } : p));
  };

  const handleConfirmPayment = async () => {
    if (!orderId || !currentSessionId) {
      alert("ID Pesanan atau ID Sesi tidak ditemukan. Harap pastikan pesanan Anda telah berhasil dikirim ke database terlebih dahulu.");
      return;
    }
    setIsConfirming(true);
    try {
      await fetch(`${API_BASE_URL}/api/projects/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          order_id: orderId,
          client_name: currentUser?.name || 'Klien B2B',
          total_invoice: totalInvoice,
          items_count: approvedItems.length,
        }),
      });
      setIsPaymentConfirmed(true);

      try {
        const channel = new BroadcastChannel('qhome_payment_channel');
        channel.postMessage({ event: 'payment_confirmed', sessionId: currentSessionId });
        channel.close();
      } catch (broadcastErr) {
        console.error('Failed to broadcast payment signal:', broadcastErr);
      }

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

  const shippingCost = activeTruck.basePrice + (distance * activeTruck.kmRate);
  const materialsTotal = approvedItems.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  const adminFee = approvedItems.length > 0 ? 50000 : 0;
  const ppn = Math.round((materialsTotal + shippingCost + adminFee) * 0.11);
  const totalInvoice = materialsTotal + shippingCost + adminFee + ppn;

  const switchToAdminRudi = () => {
    if (currentSessionId) {
      window.location.href = `/?portal=admin&session_id=${currentSessionId}&user_role=admin`;
    } else {
      window.location.href = `/?portal=admin&user_role=admin`;
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
      items: approvedItems.map(p => ({
        product_sku: p.sku,
        qty: parseFloat(p.qty as any) || 0,
        price: p.price,
        total: p.total
      }))
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setOrderId(data.order_id);
        setCartStep('success');
      } else {
        alert(`Gagal mengirimkan pesanan ke database pergudangan. Server responded with ${res.status} ${res.statusText}.`);
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
    window.open(`${API_BASE_URL}/api/projects/${currentSessionId}/generate-pdf`, '_blank');
  };

  const sendRestockRequestToAdmin = async (items: Product[], approvedItems: Product[]) => {
    if (!currentSessionId) return;
    try {
      await fetch(`${API_BASE_URL}/api/projects/sessions/${currentSessionId}/request-restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            sku: item.sku,
            name: item.name,
            qty: item.qty,
            price: item.price,
            stock_qty: 0,
          })),
          products: approvedItems
        }),
      });
      try {
        const channel = new BroadcastChannel('qhome_payment_channel');
        channel.postMessage({ event: 'payment_confirmed', sessionId: currentSessionId });
        channel.close();
      } catch (broadcastErr) {
        console.error('Failed to broadcast restock signal:', broadcastErr);
      }
    } catch (e) {
      console.error("Failed to send restock request to admin:", e);
    }
  };

  const syncApprovedItemsToSession = async (items: Product[]) => {
    if (!currentSessionId) return;
    try {
      await fetch(`${API_BASE_URL}/api/projects/sessions/${currentSessionId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: items })
      });
    } catch (e) {
      console.error("Failed to sync approved products to session:", e);
    }
  };

  const warningItem = approvedItems.find(p => p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0);

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-ink">
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

      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-10">
        {localProducts.length === 0 ? (
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
          <div className="flex-1 flex flex-col">
            <div className="w-full max-w-3xl mx-auto mb-12">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-hairline -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-[2px] bg-accent -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
                  style={{ 
                    width: cartStep === 'review' ? '0%' : cartStep === 'logistics' ? '50%' : '100%' 
                  }}
                />

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

            {cartStep === 'review' && (
              <OrderCart
                currentUser={currentUser}
                currentSessionId={currentSessionId}
                brief={brief}
                localProducts={localProducts}
                approvedItems={approvedItems}
                isProposalApproved={isProposalApproved}
                setIsProposalApproved={setIsProposalApproved}
                toggleProductApproval={toggleProductApproval}
                warningItem={warningItem}
                materialsTotal={materialsTotal}
                switchToAdminRudi={switchToAdminRudi}
                syncApprovedItemsToSession={syncApprovedItemsToSession}
                sendRestockRequestToAdmin={sendRestockRequestToAdmin}
                setCartStep={setCartStep}
                getProductImage={getProductImage}
              />
            )}

            {cartStep === 'logistics' && (
              <OrderShipping
                currentUser={currentUser}
                distance={distance}
                materialsTotal={materialsTotal}
                adminFee={adminFee}
                shippingCost={shippingCost}
                ppn={ppn}
                totalInvoice={totalInvoice}
                activeTruck={activeTruck}
                TRUCKS={TRUCKS}
                selectedTruck={selectedTruck}
                setSelectedTruck={setSelectedTruck}
                deliveryDate={deliveryDate}
                setDeliveryDate={setDeliveryDate}
                notes={notes}
                setNotes={setNotes}
                setIsDoubleVerificationOpen={setIsDoubleVerificationOpen}
              />
            )}

            {cartStep === 'success' && (
              <OrderPayment
                currentUser={currentUser}
                orderId={orderId}
                distance={distance}
                materialsTotal={materialsTotal}
                shippingCost={shippingCost}
                adminFee={adminFee}
                ppn={ppn}
                totalInvoice={totalInvoice}
                activeTruck={activeTruck}
                deliveryDate={deliveryDate}
                notes={notes}
                approvedItems={approvedItems}
                isPaymentConfirmed={isPaymentConfirmed}
                isConfirming={isConfirming}
                handleDownloadInvoice={handleDownloadInvoice}
                handleConfirmPayment={handleConfirmPayment}
                onBack={onBack}
              />
            )}
          </div>
        )}

        {isDoubleVerificationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-neutral-900/40 animate-fade-in">
            <div className="bg-white border border-hairline rounded-[26px] shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
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
              <div className="p-8 space-y-5">
                <p className="text-[12.5px] text-muted leading-relaxed">
                  Sebelum mengirimkan detail logistik ke database pergudangan terdistribusi QHomeMart, harap verifikasi ulang aspek kelayakan pengantaran berikut:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ink leading-tight">Verifikasi Aksesibilitas Kargo</p>
                      <p className="text-[11.5px] text-muted leading-snug">Jalan menuju proyek di <span className="font-semibold text-ink">{currentUser?.city || 'HQ'}</span> sanggup dilalui oleh armada <span className="font-semibold text-ink">{activeTruck.name}</span>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ink leading-tight">Reservasi Alokasi Inventori</p>
                      <p className="text-[11.5px] text-muted leading-snug">Item material sebanyak <span className="font-semibold text-ink">{approvedItems.length} jenis</span> akan dipotong secara real-time dari stok katalog QHomeMart.</p>
                    </div>
                  </div>
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
                <div className="bg-neutral-50 border border-hairline rounded-xl p-4 text-[11.5px] text-muted leading-relaxed flex gap-2.5">
                  <Info className="w-4 h-4 text-muted-light flex-shrink-0 mt-0.5" />
                  <span>
                    Penyelesaian transaksi ini akan secara otomatis memicu proses pengemasan kargo di pergudangan terdistribusi QHomeMart.
                  </span>
                </div>
              </div>
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

        <footer className="text-[11px] text-muted-light mt-auto pt-6 border-t border-hairline/60">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office B2B Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
