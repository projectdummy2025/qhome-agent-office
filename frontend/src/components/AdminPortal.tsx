import { useState, useEffect } from 'react';
import { 
  CheckCircle2,
  UserCog, 
  Check,
  Edit2,
  Warehouse,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';

interface Product {
  sku: string;
  name: string;
  price: number;
  qty: any;
  total: number;
  status?: string;
  category?: string;
}

interface MasterProduct {
  sku: string;
  name: string;
  category: string;
  base_price: number;
  coverage_m2: number;
  stock_qty: number;
  image_url: string;
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
  currentSessionId,
  products: initialProducts,
  brief,
  onBack,
  onUpdateProducts
}: AdminPortalProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQty, setEditQty] = useState<number>(0);
  
  // Auto-persist products to the database whenever any admin action mutates the list
  const persistToDb = async (updatedProducts: Product[]) => {
    if (!currentSessionId) return;
    try {
      await fetch(`http://localhost:8000/api/projects/sessions/${currentSessionId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      });
    } catch (err) {
      console.error('Auto-persist failed:', err);
    }
  };

  // Tracks quantity additions per SKU in the restock panel
  const [addedQtys, setAddedQtys] = useState<Record<string, number>>({});
  const [restockLoading, setRestockLoading] = useState<Record<string, boolean>>({});
  const [restockSuccess, setRestockSuccess] = useState<Record<string, boolean>>({});

  // Fetch master products on mount to know the exact database stock & base prices
  const fetchMasterProducts = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/projects/products");
      if (res.ok) {
        const data = await res.json();
        setMasterProducts(data);
      }
    } catch (err) {
      console.error("Error fetching master products:", err);
    }
  };

  useEffect(() => {
    fetchMasterProducts();
  }, []);

  // Sync initialProducts if they change externally
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Utility to parse quantity values and units
  const parseQtyNumber = (qtyStr: string | number): number => {
    if (typeof qtyStr === 'number') return qtyStr;
    const matches = qtyStr.match(/[\d.]+/);
    return matches ? parseFloat(matches[0]) : 0;
  };

  const getQtyUnit = (qtyStr: string | number): string => {
    if (typeof qtyStr === 'number') return 'Unit';
    const cleaned = qtyStr.replace(/[\d.]+/g, '').replace(/\(Est\)/g, '').replace(/\(Substitusi\)/g, '').trim();
    return cleaned || 'Unit';
  };

  const getProductCategory = (sku: string): string => {
    const master = masterProducts.find(mp => mp.sku === sku);
    return master ? master.category : '';
  };

  // 1. TAMBAH STOK GUDANG ACTION (Panel A)
  const handleRestock = async (sku: string) => {
    const qtyToAdd = addedQtys[sku] || 50;
    setRestockLoading(prev => ({ ...prev, [sku]: true }));
    try {
      const res = await fetch(`http://localhost:8000/api/projects/products/${sku}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ added_qty: qtyToAdd })
      });
      
      if (res.ok) {
        // Successful restock in database. Now auto-replenish React state!
        const masterItem = masterProducts.find(mp => mp.sku === sku);
        const originalPrice = masterItem ? masterItem.base_price : 0;
        const originalName = masterItem ? masterItem.name : '';
        const category = masterItem ? masterItem.category : '';

        // Update the products state
        const updatedProducts = products.map(p => {
          if (p.sku === sku) {
            const cleanName = p.name
              .replace('[STOK HABIS] ', '')
              .replace('[STOK TERBATAS] ', '');
            
            const num = parseQtyNumber(p.qty);
            const unit = getQtyUnit(p.qty);
            const finalPrice = originalPrice || p.price || 250000; // safety fallback

            return {
              ...p,
              name: cleanName || originalName || p.name,
              price: finalPrice,
              qty: `${num} ${unit}`,
              total: finalPrice * num,
              status: 'ready'
            };
          }
          return p;
        });

        // Automatically purge any alternative substitute product from the same category
        const finalProducts = updatedProducts.filter(p => {
          const isSub = p.qty.toString().includes('(Substitusi)') || p.name.includes('(Substitusi)') || p.name.includes('Substitusi');
          const itemCategory = getProductCategory(p.sku);
          
          // Filter out if it's a substitute for the same category and has a different SKU
          if (isSub && itemCategory === category && p.sku !== sku) {
            return false;
          }
          return true;
        });

        setProducts(finalProducts);
        onUpdateProducts(finalProducts);
        persistToDb(finalProducts);

        // Update local master stock list to reflect new database stock
        setMasterProducts(prev => prev.map(mp => 
          mp.sku === sku ? { ...mp, stock_qty: mp.stock_qty + qtyToAdd } : mp
        ));

        // Show satisfying success animation
        setRestockSuccess(prev => ({ ...prev, [sku]: true }));
        setTimeout(() => {
          setRestockSuccess(prev => ({ ...prev, [sku]: false }));
        }, 3000);
      }
    } catch (err) {
      console.error("Error restocking product:", err);
    } finally {
      setRestockLoading(prev => ({ ...prev, [sku]: false }));
    }
  };

  // 2. APPROVE SUBSTITUSI ACTION (Panel B)
  const handleApproveSubstitution = (sku: string) => {
    const category = getProductCategory(sku);

    const updated = products.map(p => {
      if (p.sku === sku) {
        const cleanQty = p.qty.toString().replace('(Substitusi)', '').trim();
        return {
          ...p,
          qty: cleanQty,
          name: p.name.replace(" (Substitusi Disetujui)", "") + " (Substitusi Disetujui)",
          status: 'ready'
        };
      }
      return p;
    });

    // Remove the original OOS item of the same category
    const finalProducts = updated.filter(p => {
      const isOOS = p.name.startsWith('[STOK HABIS]') || p.name.startsWith('[STOK TERBATAS]') || p.price === 0;
      const itemCategory = getProductCategory(p.sku);

      if (isOOS && itemCategory === category && p.sku !== sku) {
        return false;
      }
      return true;
    });

    setProducts(finalProducts);
    onUpdateProducts(finalProducts);
    persistToDb(finalProducts);
  };

  // Inline table edits (Power-user feature)
  const handleStartEdit = (p: Product) => {
    setEditingSku(p.sku);
    setEditPrice(p.price);
    setEditQty(parseQtyNumber(p.qty));
  };

  const handleSaveEdit = (sku: string) => {
    const updated = products.map(p => {
      if (p.sku === sku) {
        const unit = getQtyUnit(p.qty);
        return { 
          ...p, 
          price: editPrice, 
          qty: `${editQty} ${unit}`, 
          total: editPrice * editQty 
        };
      }
      return p;
    });
    setProducts(updated);
    onUpdateProducts(updated);
    persistToDb(updated);
    setEditingSku(null);
  };



  // Segregation of products into business categories
  const restockProducts = products.filter(p => 
    p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0
  );

  const substituteProducts = products.filter(p => 
    p.qty.toString().includes('(Substitusi)') || p.name.includes('(Substitusi)') || p.name.includes('Substitusi')
  );

  const finalRAB = products.reduce((acc, p) => acc + (p.price * parseQtyNumber(p.qty)), 0);

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-ink">

      {/* Corporate Minimalist Header */}
      <header className="w-full border-b border-hairline bg-canvas sticky top-0 z-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mt-0.5 animate-pulse">ADMIN LOGISTICS CENTER</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-right">
              <span className="text-[11.5px] font-bold text-ink">{currentUser?.name || "Bapak Rudi"}</span>
              <span className="text-[9px] font-light text-muted-light">/</span>
              <span className="text-[9px] uppercase tracking-wider text-accent font-bold">{currentUser?.roleDisplay || "Staff Admin"}</span>
            </div>
            <button 
              onClick={onBack}
              className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-ink transition-all focus:outline-none cursor-pointer border border-hairline hover:border-ink px-5 py-1.5 rounded-full"
            >
              KEMBALI KE CHAT
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-8 space-y-8 animate-scale-in">
        
        {/* Project Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline pb-6 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider bg-accent/10 text-accent uppercase">
                Aktif Estimasi Sesi
              </span>
              {currentSessionId && (
                <code className="text-[10.5px] font-bold text-muted bg-surface-soft px-2 py-0.5 rounded border border-hairline">
                  {currentSessionId.substring(0, 8).toUpperCase()}
                </code>
              )}
            </div>
            <h1 className="text-[22px] font-extrabold text-ink tracking-tight">
              Pemisahan Penanganan Stok &amp; Otorisasi Substitusi
            </h1>
            <p className="text-[12.5px] text-muted max-w-3xl">
              Logistik portal untuk membagi alur kerja Restock Permintaan Penambahan Barang dan Konfirmasi Ketersediaan Substitusi secara terpisah sebelum checkout.
            </p>
          </div>


        </div>

        {/* Dynamic Client Brief Quote */}
        {brief && (
          <div className="bg-surface-soft border border-hairline rounded-2xl p-4.5 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent-border/40 text-accent flex items-center justify-center flex-shrink-0">
              <UserCog className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-muted-light block mb-0.5">Spesifikasi Brief Klien</span>
              <p className="text-[13px] text-ink leading-relaxed italic">"{brief}"</p>
            </div>
          </div>
        )}

        {/* Real-time KPI Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-hairline rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Permintaan Restok</span>
              <span className="text-[20px] font-black text-ink">{restockProducts.length} Item</span>
            </div>
          </div>

          <div className="bg-white border border-hairline rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Substitusi Usulan</span>
              <span className="text-[20px] font-black text-ink">{substituteProducts.length} Item</span>
            </div>
          </div>

          <div className="bg-white border border-hairline rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Item Siap Kirim</span>
              <span className="text-[20px] font-black text-ink">
                {products.length - restockProducts.length} / {products.length}
              </span>
            </div>
          </div>

          <div className="bg-white border border-hairline rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Estimasi Total Belanja</span>
              <span className="text-[20px] font-black text-indigo-600">
                Rp {finalRAB.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* DUAL BUSINESS LOGICS PANELS SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* PANEL A: PERMINTAAN PENAMBAHAN STOK */}
          <div className="bg-white border border-hairline rounded-3xl p-6.5 flex flex-col space-y-5">
            <div className="border-b border-hairline pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-accent animate-breathe" />
                  <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
                    1. Permintaan Penambahan Stok
                  </h2>
                </div>
                <p className="text-[11.5px] text-muted mt-1 leading-relaxed">
                  Material proyek yang sedang kritis atau habis di gudang utama Sleman. Lakukan restock kuota logistik master.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-accent/10 text-accent">
                {restockProducts.length} Menunggu
              </span>
            </div>

            <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-warm">
              {restockProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-emerald-50/30 border border-dashed border-emerald-200/80 rounded-2xl">
                  <div className="w-11 h-11 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-3">
                    <Check className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[13.5px] font-extrabold text-emerald-950">Aman Terkendali</span>
                  <p className="text-[11.5px] text-emerald-800 mt-1 max-w-[280px]">
                    Semua stok gudang untuk kebutuhan material sesi ini telah tercukupi (&gt; 20 unit).
                  </p>
                </div>
              ) : (
                restockProducts.map(p => {
                  const masterItem = masterProducts.find(mp => mp.sku === p.sku);
                  const currentStock = masterItem ? masterItem.stock_qty : 0;
                  const reqQty = parseQtyNumber(p.qty);
                  const shortfall = Math.max(0, reqQty - currentStock);
                  const isCritical = currentStock === 0;
                  const inputVal = addedQtys[p.sku] || (shortfall > 0 ? shortfall : 50);

                  return (
                    <div 
                      key={p.sku} 
                      className={`border rounded-2xl p-4.5 space-y-4.5 transition-all duration-300 ${
                        restockSuccess[p.sku] 
                          ? 'border-emerald-500 bg-emerald-50/10' 
                          : 'border-hairline bg-surface-soft/40 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[13px] font-extrabold text-ink block leading-snug">
                            {p.name.replace('[STOK HABIS] ', '').replace('[STOK TERBATAS] ', '')}
                          </span>
                          <span className="text-[10px] text-muted-light font-medium tracking-wider block">
                            SKU: {p.sku} · Kategori: {masterItem?.category || 'Bahan Bangunan'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase flex-shrink-0 ${
                          isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isCritical ? 'Habis (0)' : `Kritis (${currentStock})`}
                        </span>
                      </div>

                      {/* Stock Info and Replenish Input row */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-hairline/60">
                        <div className="space-y-0.5">
                          <span className="text-[9.5px] text-muted-light uppercase tracking-wider block">Stok Gudang Real</span>
                          <span className="text-[12.5px] font-bold text-ink flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-muted-light" />
                            {currentStock} {getQtyUnit(p.qty)}
                          </span>
                        </div>
                        
                        <div className="space-y-0.5">
                          <span className="text-[9.5px] text-muted-light uppercase tracking-wider block">Kebutuhan RAB</span>
                          <span className="text-[12.5px] font-bold text-ink">
                            {reqQty} {getQtyUnit(p.qty)}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[9.5px] text-red-500 uppercase tracking-wider block">Selisih (Kurang)</span>
                          <span className="text-[12.5px] font-bold text-red-600">
                            {shortfall} {getQtyUnit(p.qty)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-hairline rounded-lg px-2 py-1 max-w-[120px]">
                            <input 
                              type="number" 
                              min="1"
                              value={inputVal}
                              onChange={(e) => setAddedQtys(prev => ({ ...prev, [p.sku]: parseInt(e.target.value, 10) || 1 }))}
                              className="w-full bg-transparent border-none outline-none text-[12.5px] text-center font-bold text-ink focus:ring-0 p-0"
                            />
                            <span className="text-[10px] text-muted-light font-bold ml-1">{getQtyUnit(p.qty)}</span>
                          </div>

                          <button 
                            onClick={() => handleRestock(p.sku)}
                            disabled={restockLoading[p.sku] || restockSuccess[p.sku]}
                            className={`px-4.5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                              restockSuccess[p.sku]
                                ? 'bg-emerald-600 text-white'
                                : 'bg-ink text-white hover:bg-ink-2'
                            } disabled:opacity-50`}
                          >
                            {restockLoading[p.sku] ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : restockSuccess[p.sku] ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            {restockSuccess[p.sku] ? 'OK!' : 'Restock'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL B: KONFIRMASI KETERSEDIAAN & SUBSTITUSI */}
          <div className="bg-white border border-hairline rounded-3xl p-6.5 flex flex-col space-y-5">
            <div className="border-b border-hairline pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                  <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
                    2. Konfirmasi &amp; Otorisasi Substitusi
                  </h2>
                </div>
                <p className="text-[11.5px] text-muted mt-1 leading-relaxed">
                  Usulan alternatif produk pengganti berspesifikasi setara yang memiliki ketersediaan melimpah. Setujui untuk dialihkan.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700">
                {substituteProducts.length} Usulan
              </span>
            </div>

            <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-warm">
              {substituteProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-50 border border-dashed border-hairline rounded-2xl">
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-muted flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[13.5px] font-extrabold text-ink">Tidak Ada Substitusi</span>
                  <p className="text-[11.5px] text-muted mt-1 max-w-[280px]">
                    Belum ada item alternatif substitusi yang disarankan oleh sistem untuk sesi ini.
                  </p>
                </div>
              ) : (
                substituteProducts.map(p => {
                  const masterItem = masterProducts.find(mp => mp.sku === p.sku);
                  const isApproved = p.name.includes("Disetujui") || p.status === 'ready';

                  return (
                    <div 
                      key={p.sku} 
                      className={`border rounded-2xl p-4.5 space-y-4 transition-all duration-300 ${
                        isApproved
                          ? 'border-emerald-500 bg-emerald-50/10'
                          : 'border-amber-200 bg-amber-50/10 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[13px] font-extrabold text-ink block leading-snug">
                            {p.name.replace(' (Substitusi Disetujui)', '')}
                          </span>
                          <span className="text-[10px] text-muted-light font-medium tracking-wider block">
                            SKU: {p.sku} · Kategori: {masterItem?.category || 'Bahan Bangunan'}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase flex-shrink-0 ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isApproved ? 'Disetujui' : 'Alternatif'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-hairline/60 text-[11.5px]">
                        <div>
                          <span className="text-[9px] text-muted-light uppercase tracking-wider block">Harga Satuan</span>
                          <span className="font-bold text-ink">Rp {p.price.toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-light uppercase tracking-wider block">Estimasi Qty</span>
                          <span className="font-bold text-ink">{parseQtyNumber(p.qty)} {getQtyUnit(p.qty)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-muted-light uppercase tracking-wider block">Total Harga</span>
                          <span className="font-bold text-accent">Rp {p.total.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10.5px] text-muted flex items-center gap-1 font-medium">
                          <Info className="w-3.5 h-3.5 text-muted-light" />
                          Spesifikasi setara, stok siap kirim.
                        </span>
                        
                        {!isApproved && (
                          <button 
                            onClick={() => handleApproveSubstitution(p.sku)}
                            className="px-4.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Setujui Substitusi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* SECTION 3: CONSOLIDATED FINAL RAB SHOPPING CART */}
        <div className="bg-white border border-hairline rounded-3xl p-6.5 space-y-5">
          <div className="border-b border-hairline pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
                3. Daftar Evaluasi Rencana Belanja (RAB) Final
              </h2>
              <p className="text-[11.5px] text-muted mt-1">
                Kompilasi final seluruh item material yang siap untuk dimasukkan ke Nota Transaksi B2B Procurement.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-ink">
              {products.length} Material Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-light w-[40%]">Nama Material</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-light text-center px-4">Harga Satuan</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-light text-center px-4">Volume</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-light text-right">Subtotal</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-light text-center px-4">Status &amp; Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
                {products.map((p) => {
                  const isOOS = p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0;
                  const isSub = p.qty.toString().includes('(Substitusi)') || p.name.includes('(Substitusi)') || p.name.includes('Substitusi');
                  const isEditing = editingSku === p.sku;
                  const numQty = parseQtyNumber(p.qty);

                  return (
                    <tr 
                      key={p.sku} 
                      className={`transition-colors ${
                        isOOS 
                          ? 'bg-red-50/10 hover:bg-red-50/20' 
                          : isSub 
                            ? 'bg-amber-50/10 hover:bg-amber-50/20' 
                            : 'hover:bg-surface-soft/40'
                      }`}
                    >
                      {/* Name column */}
                      <td className="py-4.5">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[13px] font-extrabold text-ink leading-snug">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-muted-light font-medium tracking-wider">
                            SKU: {p.sku}
                          </span>
                          {isOOS && (
                            <span className="inline-flex items-center gap-1 text-[9.5px] text-red-600 font-extrabold uppercase mt-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              MEMBUTUHKAN PENAMBAHAN STOK GUDANG
                            </span>
                          )}
                          {isSub && !p.name.includes("Disetujui") && (
                            <span className="inline-flex items-center gap-1 text-[9.5px] text-amber-600 font-extrabold uppercase mt-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              USULAN ALTERNATIF - MEMBUTUHKAN PERSETUJUAN
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price column */}
                      <td className="py-4.5 text-center px-4">
                        {isEditing ? (
                          <div className="flex items-center justify-center bg-white border border-hairline rounded-lg px-2 py-1 max-w-[120px] mx-auto">
                            <span className="text-[10px] text-muted-light mr-1">Rp</span>
                            <input 
                              type="number" 
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-full bg-transparent border-none outline-none text-[12.5px] text-center font-bold text-ink focus:ring-0 p-0"
                            />
                          </div>
                        ) : (
                          <span className={`text-[13px] font-bold ${p.price === 0 ? 'text-red-500' : 'text-ink'}`}>
                            {p.price === 0 ? 'Rp 0 (Stok Habis)' : `Rp ${p.price.toLocaleString('id-ID')}`}
                          </span>
                        )}
                      </td>

                      {/* Quantity column */}
                      <td className="py-4.5 text-center px-4">
                        {isEditing ? (
                          <div className="flex items-center justify-center bg-white border border-hairline rounded-lg px-2 py-1 max-w-[90px] mx-auto">
                            <input 
                              type="number" 
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              className="w-full bg-transparent border-none outline-none text-[12.5px] text-center font-bold text-ink focus:ring-0 p-0"
                            />
                          </div>
                        ) : (
                          <span className="text-[13px] font-bold text-muted-light">
                            {p.qty}
                          </span>
                        )}
                      </td>

                      {/* Total column */}
                      <td className="py-4.5 text-right font-black text-[13px] text-ink">
                        Rp {(p.price * numQty).toLocaleString('id-ID')}
                      </td>

                      {/* Actions column */}
                      <td className="py-4.5 text-center px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <button 
                              onClick={() => handleSaveEdit(p.sku)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
                              title="Simpan"
                            >
                              <CheckCircle2 className="w-4.5 h-4.5" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 text-muted-light hover:text-ink hover:bg-surface-soft rounded-full transition-colors cursor-pointer"
                              title="Edit Harga &amp; Qty"
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
          </div>

          {/* Table Footer Grand Total Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-hairline pt-5 gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[12.5px] font-semibold text-muted">Akurasi Rencana Anggaran Biaya Terkurasi</span>
            </div>
            <div className="flex items-baseline gap-2.5 text-right">
              <span className="text-[12.5px] font-bold text-muted">Grand Total RAB:</span>
              <span className="text-[22px] font-black text-accent tracking-tight">
                Rp {finalRAB.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <footer className="text-[11px] text-muted-light pt-8 border-t border-hairline/60 flex items-center justify-between flex-wrap gap-4">
          <span>QHomeMart Digital Office Multi-Agent B2B Platform &copy; 2026</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Integrasi Sinkronisasi Database Aktif
          </span>
        </footer>

      </div>
    </div>
  );
}
