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
      <div className="border-b border-slate-200/80 pb-7">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200/50">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-600">
            TRANSAKSI TERVERIFIKASI &amp; TERDAFTAR DI DATABASE ERP
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl font-light text-slate-900 tracking-tight leading-none font-display">
          Nota Pembelian &amp; <span className="font-extrabold text-slate-900 bg-gradient-to-r from-accent to-red-500 bg-clip-text text-transparent">Verifikasi QRIS GPN</span>
        </h1>
        <p className="text-sm font-semibold text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Pesanan Anda telah dimasukkan ke pipeline pengiriman pergudangan terdistribusi. Silakan selesaikan pembayaran QRIS resmi di bawah untuk mengaktifkan dispatch kargo logistik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* Left Column: Official Invoice Printable Block (span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
          <div className="h-[6px] w-full bg-gradient-to-r from-accent to-red-500" />
          <div ref={invoiceRef} className="p-5 md:p-8 space-y-6">

            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-200/60 pb-5">
              <div>
                <span className="text-base font-extrabold text-slate-900 tracking-widest uppercase font-display">QHOMEMART</span>
                <p className="text-[10px] font-mono tracking-wider text-slate-400 mt-1">PT QHomeMart Indonesia (Procurement Div)</p>
              </div>
              <div className="text-right">
                <span className={`inline-block text-[9.5px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full mb-2 ${isPaymentConfirmed
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-amber-700 bg-amber-50 border-amber-100'
                  }`}>
                  {isPaymentConfirmed ? 'PEMBAYARAN QRIS SELESAI' : 'PENDING QRIS PAYMENT'}
                </span>
                <p className="text-[11.5px] font-mono text-slate-800 font-extrabold">
                  {orderId}
                </p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm border-b border-slate-200/60 pb-6">
              <div>
                <p className="text-slate-400 font-extrabold uppercase text-[9px] tracking-widest mb-2">Diterbitkan Untuk</p>
                <p className="font-extrabold text-slate-800">{currentUser?.name || 'Mitra Korporat'}</p>
                <p className="text-slate-500 mt-1 font-bold uppercase tracking-wider text-[11px]">{currentUser?.roleDisplay || 'Pelanggan Utama'}</p>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">Wilayah Jarak: {currentUser?.city || 'Sleman'} ({distance} Km)</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-extrabold uppercase text-[9px] tracking-widest mb-2">Rincian Armada Logistik</p>
                <p className="font-extrabold text-slate-850">{activeTruck.name}</p>
                <p className="text-slate-500 mt-1 text-[11px] font-bold">
                  {deliveryDate
                    ? new Date(deliveryDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : '-'}
                </p>
                {notes && (
                  <p className="text-slate-400 text-xs mt-1.5 italic font-semibold">Catatan: "{notes}"</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <p className="text-slate-400 font-extrabold uppercase text-[9px] tracking-widest">Tabel Rincian Material Proyek</p>
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                {approvedItems.map((prod) => (
                  <div key={prod.sku} className="py-4 flex justify-between text-sm items-center hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition-colors duration-200">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-bold text-slate-800 truncate">{prod.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 tracking-wider mt-1">SKU: {prod.sku}</p>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[130px]">
                      <p className="font-extrabold text-slate-900">Rp {prod.total.toLocaleString('id-ID')}</p>
                      <p className="text-[10.5px] text-slate-450 mt-1 font-semibold">{prod.qty} unit &times; Rp {prod.price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Calculation */}
            <div className="border-t border-slate-200/80 pt-5 space-y-3">
              <div className="flex justify-between text-sm items-center">
                <span className="font-semibold text-slate-500">Subtotal Material</span>
                <span className="font-extrabold text-slate-900">Rp {materialsTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="font-semibold text-slate-500">Kargo Armada ({activeTruck.name})</span>
                <span className="font-extrabold text-slate-900">Rp {shippingCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="font-semibold text-slate-500">Biaya Penanganan</span>
                <span className="font-extrabold text-slate-900">Rp {adminFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="font-semibold text-slate-500">PPN (11%)</span>
                <span className="font-extrabold text-slate-900">Rp {ppn.toLocaleString('id-ID')}</span>
              </div>
              <div className="h-px bg-slate-200 my-3" />
              <div className="flex justify-between items-baseline pt-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">GRAND TOTAL INVOICE</span>
                <span className="text-[22px] font-extrabold text-accent">
                  Rp {totalInvoice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-end">
            <button
              onClick={handleDownloadInvoice}
              className="px-6 py-3 bg-slate-950 hover:bg-black text-white rounded-full text-[11px] font-bold tracking-widest uppercase cursor-pointer transition-all duration-200 flex items-center gap-1.5 focus:outline-none shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Download PDF Nota Resmi
            </button>
          </div>
        </div>

        {/* Right Column: Premium GPN QRIS standee (span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 p-5 md:p-8 rounded-3xl flex flex-col items-center shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

          {/* Official QRIS simulated physical standee via SVG */}
          <div className="mb-6 flex justify-center w-full">
            <svg width="220" height="290" viewBox="0 0 220 290" className="shadow-xl rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
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
              <text x="110" y="271" fill="#E11D48" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8" fontFamily="sans-serif">QHOMEMART PROCURE</text>
            </svg>
          </div>

          {/* QRIS Tutorial list */}
          <div className="w-full space-y-4">
            <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest text-center border-b border-slate-200 pb-2.5">
              PANDUAN PROSEDUR PEMBAYARAN
            </p>

            <ol className="text-xs font-semibold text-slate-500 space-y-3.5 list-decimal pl-4.5">
              <li>Buka aplikasi <strong>m-Banking</strong> (BCA, Mandiri, dll.) atau <strong>e-Wallet</strong> (Gopay, OVO, ShopeePay) pada ponsel Anda.</li>
              <li>Klik opsi <strong>Scan / QRIS / Bayar</strong>.</li>
              <li>Arahkan kamera ponsel ke vector QR Code di atas.</li>
              <li>Pastikan nama merchant tertera <strong>QHOMEMART PROCURE</strong> dengan total tagihan tepat <strong>Rp {totalInvoice.toLocaleString('id-ID')}</strong>.</li>
              <li>Masukkan PIN transaksi Anda untuk menyelesaikan pembayaran kargo logistik.</li>
            </ol>

            <div className={`rounded-2xl p-5 mt-4 text-center border transition-all ${isPaymentConfirmed ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200/80 shadow-inner'}`}>
              {isPaymentConfirmed ? (
                <p className="text-sm text-emerald-700 font-extrabold">
                  Pembayaran dikonfirmasi. Mengalihkan ke chat...
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed font-semibold">
                    Setelah proses pindai (scan) dan transfer berhasil, silakan klik tombol di bawah ini untuk mengaktifkan pengiriman kargo dan menerima konfirmasi dari agen kami.
                  </p>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isConfirming}
                    className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-60 cursor-pointer focus:outline-none flex items-center justify-center gap-2 shadow-md shadow-emerald-600/10 hover:shadow-lg"
                  >
                    {isConfirming ? (
                      <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /></svg>
                    ) : (
                      <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 border-t border-slate-200/80 pt-8">
          <button
            onClick={onBack}
            className="px-8 py-3.5 bg-slate-950 hover:bg-black text-white rounded-full text-[11px] font-bold tracking-widest hover:shadow-md transition-all duration-200 cursor-pointer uppercase focus:outline-none active:scale-[0.98]"
          >
            KEMBALI ke Obrolan
          </button>
          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                onBack();
              }
            }}
            className="px-8 py-3.5 border border-slate-250 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-full text-[11px] font-bold tracking-widest hover:shadow-sm transition-all duration-200 cursor-pointer uppercase focus:outline-none active:scale-[0.98]"
          >
            Tutup Halaman Ini
          </button>
        </div>
      )}
    </div>
  );
}
