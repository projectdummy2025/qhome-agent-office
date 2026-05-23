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
        <div className="border-b border-hairline pb-4 mb-2">
          <h2 className="text-[20px] font-light text-ink tracking-tight">
            Pengaturan <span className="font-extrabold text-ink">Armada &amp; Kargo B2B</span>
          </h2>
          <p className="text-[12px] text-muted mt-0.5">
            Pilih kendaraan kargo berdasarkan volume angkut material dan masukkan tanggal rencana kedatangan logistik.
          </p>
        </div>

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
  );
}
