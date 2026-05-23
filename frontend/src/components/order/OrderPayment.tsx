import { useRef } from 'react';
import { Check, Download } from 'lucide-react';

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

interface OrderPaymentProps {
  currentUser: any;
  orderId: string | null;
  distance: number;
  materialsTotal: number;
  shippingCost: number;
  adminFee: number;
  ppn: number;
  totalInvoice: number;
  activeTruck: any;
  deliveryDate: string;
  notes: string;
  approvedItems: Product[];
  isPaymentConfirmed: boolean;
  isConfirming: boolean;
  handleDownloadInvoice: () => void;
  handleConfirmPayment: () => void;
  onBack: () => void;
}

export default function OrderPayment({
  currentUser,
  orderId,
  distance,
  materialsTotal,
  shippingCost,
  adminFee,
  ppn,
  totalInvoice,
  activeTruck,
  deliveryDate,
  notes,
  approvedItems,
  isPaymentConfirmed,
  isConfirming,
  handleDownloadInvoice,
  handleConfirmPayment,
  onBack
}: OrderPaymentProps) {
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  return (
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
                {approvedItems.map((prod) => (
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
  );
}
