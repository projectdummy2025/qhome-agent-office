import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { 
  CheckCircle2,
  UserCog, 
  Edit2,
  Warehouse,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import RestockPanel from './admin/RestockPanel';
import SubstitutePanel from './admin/SubstitutePanel';

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
  
  const persistToDb = async (updatedProducts: Product[]) => {
    if (!currentSessionId) return;
    try {
      await fetch(`${API_BASE_URL}/api/projects/sessions/${currentSessionId}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      });
    } catch (err) {
      console.error('Auto-persist failed:', err);
    }
  };

  const checkAndNotifyCompletion = async (currentProducts: Product[]) => {
    if (!currentSessionId) return;
    const remainingRestock = currentProducts.filter(p => 
      p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0
    );
    
    if (remainingRestock.length === 0) {
      try {
        await fetch(`${API_BASE_URL}/api/projects/sessions/${currentSessionId}/restock-complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: currentProducts })
        });
        
        const channel = new BroadcastChannel('qhome_payment_channel');
        channel.postMessage({ event: 'payment_confirmed', sessionId: currentSessionId });
        channel.close();
      } catch (err) {
        console.error('Failed to notify restock completion:', err);
      }
    }
  };

  const [addedQtys, setAddedQtys] = useState<Record<string, number>>({});
  const [restockLoading, setRestockLoading] = useState<Record<string, boolean>>({});
  const [restockSuccess, setRestockSuccess] = useState<Record<string, boolean>>({});

  const fetchMasterProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/products`);
      if (res.ok) {
        const data = await res.json();
        setMasterProducts(data);
      }
    } catch (err) {
      console.error("Error fetching master products:", err);
    }
  };

  const fetchSessionProducts = async () => {
    if (!currentSessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/sessions/${currentSessionId}/messages`);
      if (res.ok) {
        const messages = await res.json();
        const systemMsgsWithProducts = messages.filter((m: any) => m.role === 'system' && m.products && m.products.length > 0);
        const freshProducts = systemMsgsWithProducts.length > 0 ? systemMsgsWithProducts[systemMsgsWithProducts.length - 1].products : [];
        if (freshProducts.length > 0) {
          setProducts(freshProducts);
        }
      }
    } catch (err) {
      console.error("Error fetching session products in AdminPortal:", err);
    }
  };

  useEffect(() => {
    fetchMasterProducts();
    fetchSessionProducts();
  }, [currentSessionId]);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

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

  const handleRestock = async (sku: string) => {
    const qtyToAdd = addedQtys[sku] || 50;
    setRestockLoading(prev => ({ ...prev, [sku]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/products/${sku}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ added_qty: qtyToAdd })
      });
      
      if (res.ok) {
        const masterItem = masterProducts.find(mp => mp.sku === sku);
        const originalPrice = masterItem ? masterItem.base_price : 0;
        const originalName = masterItem ? masterItem.name : '';
        const category = masterItem ? masterItem.category : '';

        const updatedProducts = products.map(p => {
          if (p.sku === sku) {
            const cleanName = p.name
              .replace('[STOK HABIS] ', '')
              .replace('[STOK TERBATAS] ', '');
            
            const num = parseQtyNumber(p.qty);
            const unit = getQtyUnit(p.qty);
            const finalPrice = originalPrice || p.price || 250000;

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

        const finalProducts = updatedProducts.filter(p => {
          const isSub = p.qty.toString().includes('(Substitusi)') || p.name.includes('(Substitusi)') || p.name.includes('Substitusi');
          const itemCategory = getProductCategory(p.sku);
          
          if (isSub && itemCategory === category && p.sku !== sku) {
            return false;
          }
          return true;
        });

        setProducts(finalProducts);
        onUpdateProducts(finalProducts);
        await persistToDb(finalProducts);
        await checkAndNotifyCompletion(finalProducts);

        setMasterProducts(prev => prev.map(mp => 
          mp.sku === sku ? { ...mp, stock_qty: mp.stock_qty + qtyToAdd } : mp
        ));

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
    persistToDb(finalProducts).then(() => checkAndNotifyCompletion(finalProducts));
  };

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

  const restockProducts = products.filter(p => 
    p.name.includes('[STOK HABIS]') || p.name.includes('[STOK TERBATAS]') || p.price === 0
  );

  const substituteProducts = products.filter(p => 
    p.qty.toString().includes('(Substitusi)') || p.name.includes('(Substitusi)') || p.name.includes('Substitusi')
  );

  const finalRAB = products.reduce((acc, p) => acc + (p.price * parseQtyNumber(p.qty)), 0);

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-ink">
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

      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-8 space-y-8 animate-scale-in">
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <RestockPanel
            restockProducts={restockProducts}
            masterProducts={masterProducts}
            addedQtys={addedQtys}
            setAddedQtys={setAddedQtys}
            restockSuccess={restockSuccess}
            restockLoading={restockLoading}
            handleRestock={handleRestock}
            getQtyUnit={getQtyUnit}
            parseQtyNumber={parseQtyNumber}
          />
          
          <SubstitutePanel
            substituteProducts={substituteProducts}
            masterProducts={masterProducts}
            handleApproveSubstitution={handleApproveSubstitution}
            getQtyUnit={getQtyUnit}
            parseQtyNumber={parseQtyNumber}
          />
        </div>

        <div className="bg-white border border-hairline rounded-3xl p-6.5 space-y-5">
          <div className="border-b border-hairline pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-[16px] font-extrabold text-ink tracking-tight">
                3. Daftar Evaluasi Rencana Belanja (RAB) Final
              </h2>
              <p className="text-[11.5px] text-muted mt-1">
                Kompilasi final seluruh item material yang siap untuk dimasukkan ke Nota Transaksi Pengadaan.
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

                      <td className="py-4.5 text-right font-black text-[13px] text-ink">
                        Rp {(p.price * numQty).toLocaleString('id-ID')}
                      </td>

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

          <div className="flex flex-col sm:flex-row items-center justify-between border-t-2 border-hairline pt-5 gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[11.5px] font-bold text-ink">Analisis Penyesuaian Harga Diskon Grosir: <span className="text-emerald-600">Optimal</span></span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-light uppercase tracking-widest font-extrabold block mb-0.5">Grand Total Material (Draft)</span>
              <span className="text-[20px] font-black text-ink">Rp {finalRAB.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
