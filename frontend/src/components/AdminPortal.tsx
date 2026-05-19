import { useState } from 'react';
import { 
  CheckCircle2, 
  UserCog, 
  ShieldAlert, 
  Check,
  Edit2
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

interface AdminPortalProps {
  currentUser: any;
  currentSessionId: string | null;
  products: Product[];
  brief: string;
  onBack: () => void;
  onUpdateProducts: (newProducts: Product[]) => void;
}

export default function AdminPortal({
  currentUser,
  currentSessionId: _currentSessionId,
  products: initialProducts,
  brief,
  onBack,
  onUpdateProducts
}: AdminPortalProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQty, setEditQty] = useState<number>(0);
  const [isSaved, setIsSaved] = useState(false);

  const isSubstitutionRequired = (name: string) => {
    return name.toLowerCase().includes("konfirmasi") || name.toLowerCase().includes("menunggu");
  };

  const handleApproveSubstitution = (sku: string) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        return {
          ...p,
          name: p.name.replace("Menunggu Konfirmasi - ", "")
                      .replace("(STOK HABIS) ", "") + " (Substitusi Disetujui)",
          status: 'ready'
        };
      }
      return p;
    });
    setProducts(updated);
  };

  const handleStartEdit = (p: Product) => {
    setEditingSku(p.sku);
    setEditPrice(p.price);
    setEditQty(p.qty);
  };

  const handleSaveEdit = (sku: string) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        return { ...p, price: editPrice, qty: editQty, total: editPrice * editQty };
      }
      return p;
    });
    setProducts(updated);
    setEditingSku(null);
  };

  const handleFinalSave = () => {
    onUpdateProducts(products);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const totalRAB = products.reduce((acc, p) => acc + (p.price * p.qty), 0);
  const substitutionCount = products.filter(p => isSubstitutionRequired(p.name)).length;

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">

      {/* Header Bar — ultra flat */}
      <header className="w-full border-b border-hairline bg-canvas sticky top-0 z-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-light mt-0.5">Admin Workspace</span>
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

        {/* Stats bar — no cards, raw layout */}
        <div className="flex items-center flex-wrap gap-x-8 gap-y-4 pb-6 border-b border-hairline mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">Item Material</span>
            <span className="text-[20px] font-bold text-ink leading-tight mt-0.5">{products.length}</span>
          </div>
          <div className="h-6 w-px bg-hairline" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">Substitusi Butuh Konfirmasi</span>
            <span className="text-[20px] font-bold text-amber-500 leading-tight mt-0.5">
              {products.filter(p => isSubstitutionRequired(p.name)).length}
            </span>
          </div>
          <div className="h-6 w-px bg-hairline" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">Estimasi Total</span>
            <span className="text-[20px] font-bold text-accent leading-tight mt-0.5">
              Rp {products.reduce((acc, p) => acc + p.total, 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex-1" />
          {/* Final save action — inline in stats row */}
          <button 
            onClick={handleFinalSave}
            className={`px-5 py-2 rounded-full text-[12.5px] font-bold tracking-wide transition-all flex items-center gap-2 focus:outline-none cursor-pointer ${
              isSaved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSaved ? 'Tersimpan!' : 'Finalisasi & Kirim'}
          </button>
        </div>

        {/* Two-column layout: main table + right panel */}
        <div className="flex gap-10">

          {/* Main: table — takes up most width */}
          <div className="flex-1 min-w-0">

            {/* Brief — inline, no card */}
            {brief && (
              <div className="mb-6 pb-5 border-b border-hairline">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light block mb-1.5">Permintaan Klien</span>
                <p className="text-[13.5px] text-ink leading-relaxed">"{brief}"</p>
              </div>
            )}

            {/* Section label + count */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">
                Evaluasi Rencana Belanja (RAB)
              </span>
              <span className="text-[10.5px] text-muted-light">{products.length} material</span>
            </div>

            {/* Table — no outer card, pure table structure */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-light w-[42%]">Nama Material</th>
                  <th className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-light text-center px-4">Harga</th>
                  <th className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-light text-center px-4">Qty</th>
                  <th className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-light text-right">Subtotal</th>
                  <th className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-light text-center px-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
                {products.map((p) => {
                  const isSub = isSubstitutionRequired(p.name);
                  const isEditing = editingSku === p.sku;

                  return (
                    <tr key={p.sku} className={`transition-colors hover:bg-surface-soft/40 ${isSub ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-4">
                        <span className="text-[13px] font-bold text-ink leading-snug block">{p.name}</span>
                        <span className="text-[10px] text-muted-light uppercase tracking-wider">{p.sku}</span>
                        {isSub && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold mt-1">
                            <ShieldAlert className="w-3 h-3" />
                            Stok Habis / Perlu Substitusi
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-center px-4">
                        {isEditing ? (
                          <div className="flex items-center justify-center bg-surface-soft border border-hairline rounded-lg px-2 py-1 max-w-[110px] mx-auto">
                            <span className="text-[10.5px] text-muted-light mr-1">Rp</span>
                            <input 
                              type="number" 
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-[12.5px] text-center font-bold text-ink"
                            />
                          </div>
                        ) : (
                          <span className="text-[13px] font-semibold text-ink">
                            Rp {p.price.toLocaleString('id-ID')}
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-center px-4">
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value))}
                            className="w-14 bg-surface-soft border border-hairline rounded-lg px-2 py-1 text-[12.5px] text-center font-bold text-ink focus:ring-0 focus:outline-none"
                          />
                        ) : (
                          <span className="text-[13px] font-medium text-muted">{p.qty}</span>
                        )}
                      </td>

                      <td className="py-4 text-right font-bold text-[13px] text-ink">
                        Rp {(p.price * p.qty).toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 text-center px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {isSub && !p.name.includes("Substitusi") && (
                            <button 
                              onClick={() => handleApproveSubstitution(p.sku)}
                              className="px-3.5 py-1 text-[10.5px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-full focus:outline-none flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                          )}
                          {isEditing ? (
                            <button 
                              onClick={() => handleSaveEdit(p.sku)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                              title="Simpan"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 text-muted-light hover:text-accent hover:bg-surface-soft rounded-full transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total row — part of table flow */}
            <div className="flex items-center justify-between border-t-2 border-ink/10 pt-4 mt-1">
              <span className="text-[12.5px] font-semibold text-muted">Total Nilai RAB</span>
              <span className="text-[20px] font-extrabold text-ink">
                Rp {totalRAB.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Right panel — narrow, no card, just info */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Scenario description */}
              <div className="border-l-2 border-accent/40 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCog className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-light">Skenario Simulasi</span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  Sebagai Staff Admin, klik <strong className="text-ink">Approve</strong> pada item berlabel kuning untuk menyimulasikan persetujuan substitusi material alternatif dari katalog QHomeMart.
                </p>
              </div>

              {/* Substitution alert if any */}
              {substitutionCount > 0 && (
                <div className="border-l-2 border-amber-400 pl-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
                    Perhatian
                  </span>
                  <p className="text-[12px] text-muted">
                    {substitutionCount} material memerlukan persetujuan substitusi sebelum dapat diteruskan ke order.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-[11px] text-muted-light mt-auto pt-6 border-t border-hairline/60">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office B2B Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
