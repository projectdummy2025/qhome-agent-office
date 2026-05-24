import { Truck, Calendar, Package } from 'lucide-react';

interface OrderShippingProps {
  currentUser: any;
  distance: number;
  materialsTotal: number;
  adminFee: number;
  shippingCost: number;
  ppn: number;
  totalInvoice: number;
  activeTruck: any;
  TRUCKS: any[];
  selectedTruck: string;
  setSelectedTruck: (truckId: string) => void;
  deliveryDate: string;
  setDeliveryDate: (date: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  setIsDoubleVerificationOpen: (val: boolean) => void;
}

export default function OrderShipping({
  currentUser,
  distance,
  materialsTotal,
  adminFee,
  shippingCost,
  ppn,
  totalInvoice,
  activeTruck,
  TRUCKS,
  selectedTruck,
  setSelectedTruck,
  deliveryDate,
  setDeliveryDate,
  notes,
  setNotes,
  setIsDoubleVerificationOpen
}: OrderShippingProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-scale-in">
      <div className="lg:col-span-8 space-y-8">
        
        {/* Section Header */}
        <div className="border-b border-slate-200/80 pb-5 mb-4">
          <h2 className="text-xl md:text-2xl font-light text-slate-900 tracking-tight font-display">
            Pengaturan <span className="font-extrabold text-slate-900 bg-gradient-to-r from-accent to-red-500 bg-clip-text text-transparent">Armada &amp; Kargo </span>
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Pilih kendaraan kargo berdasarkan volume angkut material dan masukkan tanggal rencana kedatangan logistik.
          </p>
        </div>

        {/* Stepper Step 01 */}
        <div className="space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-accent block">
            01 — Pilih Jenis Armada Kargo
          </span>
          <div className="divide-y divide-slate-100 border-y border-slate-200/80">
            {TRUCKS.map((truck) => {
              const isSelected = selectedTruck === truck.id;
              const cost = truck.basePrice + (distance * truck.kmRate);
              return (
                <button
                  key={truck.id}
                  onClick={() => setSelectedTruck(truck.id)}
                  className={`w-full flex items-center gap-5 py-5 text-left outline-none transition-all duration-300 cursor-pointer px-4 -mx-4 rounded-3xl ${
                    isSelected 
                      ? 'bg-slate-50 border border-slate-200/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  {/* Custom Radio Button */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'border-accent bg-accent shadow-md shadow-accent/15' : 'border-slate-300'
                  }`}>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                  </div>

                  {/* Truck Icon Container */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors border ${
                    isSelected 
                      ? 'bg-accent/10 border-accent/20 text-accent shadow-sm' 
                      : 'bg-slate-50 border-slate-200/60 text-slate-400'
                  }`}>
                    <Truck className="w-5.5 h-5.5 stroke-[1.75]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <span className={`text-[15px] font-bold leading-none ${isSelected ? 'text-accent' : 'text-slate-800'}`}>
                        {truck.name}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200/80 px-2 py-0.5 rounded-md bg-white">
                        {truck.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed">{truck.desc}</p>
                    <p className="text-[10px] font-mono tracking-widest text-slate-400 mt-2">
                      TARIF DASAR: RP {truck.basePrice.toLocaleString('id-ID')} · JARAK: {distance} KM · TARIF/KM: RP {truck.kmRate.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 pl-4 min-w-[140px]">
                    <span className="text-base font-extrabold text-slate-900 block tracking-tight">
                      Rp {cost.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mt-1">ESTIMASI TARIF</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stepper Step 02 */}
        <div className="space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-accent block">
            02 — Tentukan Jadwal &amp; Catatan Khusus
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
                <Calendar className="w-4 h-4 text-accent" />
                Tanggal Rencana Pengiriman *
              </label>
              <input 
                type="date"
                value={deliveryDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-800 font-bold focus:outline-none focus:border-accent/60 transition-all cursor-pointer shadow-inner"
              />
            </div>
            
            <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
              <label className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
                <Package className="w-4 h-4 text-accent" />
                Catatan Khusus Pengantaran
              </label>
              <input 
                type="text"
                placeholder="Contoh: Titik taruh garasi depan, hubungi 1 jam sebelum tiba..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-sm text-slate-850 font-bold focus:outline-none focus:border-accent/60 transition-all placeholder:text-slate-400 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar receipt card */}
      <div className="lg:col-span-4 lg:sticky lg:top-24">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.08)] space-y-6">
          <div>
            <div className="mb-3 bg-red-50 border border-red-100/50 text-[9px] tracking-[0.2em] uppercase font-bold text-accent px-3 py-1 rounded-full w-max select-none">
              Draft Invoice Logistik
            </div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Faktur Rencana Material
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1.5">
              Wilayah Pengantaran: <span className="font-extrabold text-slate-800">{currentUser?.city || 'Sleman'} ({distance} Km)</span>
            </p>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="space-y-3.5 pb-2">
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">Subtotal Material</span>
              <span className="font-extrabold text-slate-900">Rp {materialsTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">Biaya Kargo ({activeTruck.name})</span>
              <span className="font-extrabold text-slate-900">Rp {shippingCost.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">Biaya Penanganan</span>
              <span className="font-extrabold text-slate-900">Rp {adminFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="font-semibold text-slate-500">PPN Terhitung (11%)</span>
              <span className="font-extrabold text-slate-900">Rp {ppn.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="h-px bg-slate-200" />

          <div className="flex justify-between items-baseline py-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">GRAND TOTAL</span>
            <span className="text-[22px] font-extrabold text-accent tracking-tight">
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
            className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer shadow-md shadow-accent/15 hover:shadow-lg"
          >
            Konfirmasi Pembayaran
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            <span>Secured QHomeMart ERP Sync Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
