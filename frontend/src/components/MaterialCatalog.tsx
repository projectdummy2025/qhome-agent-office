import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  Search, 
  Package, 
  Layers, 
  RefreshCw, 
  Grid,
  List
} from 'lucide-react';

interface DBProduct {
  sku: string;
  name: string;
  category: string;
  base_price: number;
  coverage_m2: number;
  stock_qty: number;
  image_url: string;
}

interface MaterialCatalogProps {
  onBack: () => void;
  onSelectProduct?: (product: DBProduct) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'Semua' }
];

// High-fidelity fallback SVG for products with missing images
const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f8fafc"/><path d="M70 90h60v20H70zm0-30h60v20H70zm0 60h60v20H70z" fill="%23cbd5e1"/><text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="system-ui, sans-serif" font-weight="700" font-size="12">NO IMAGE</text></svg>';

/**
 * High-end Skeleton loading cards with a pulsing shimmer effect.
 * Implements smooth visual transition states matching the catalog layout.
 */
function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-scale-in">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {/* Shimmer Image Box */}
          <div className="aspect-square w-full shimmer" />
          
          <div className="p-4 pb-0">
            {/* Shimmer Category Label */}
            <div className="h-3 w-1/3 rounded-full bg-slate-100 shimmer mb-2" />
            {/* Shimmer Product Name */}
            <div className="h-4.5 w-5/6 rounded bg-slate-100 shimmer mb-3" />
          </div>

          <div className="p-4 pt-3.5 mt-auto border-t border-slate-50">
            {/* Shimmer Price Tag */}
            <div className="h-5 w-1/2 rounded bg-slate-100 shimmer mb-2.5" />
            {/* Shimmer Extra Metadata */}
            <div className="flex gap-2">
              <div className="h-3 w-1/3 rounded bg-slate-100 shimmer" />
              <div className="h-3 w-1/4 rounded bg-slate-100 shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MaterialCatalog({ onBack, onSelectProduct }: MaterialCatalogProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<{id:string,name:string}[]>(CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Initialize state from search parameters
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get('search') || '');
  const [selectedCat, setSelectedCat] = useState(() => searchParams.get('category') || 'all');

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'name'>('relevance');
  const debounceRef = useRef<number | null>(null);

  // Handle category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCat(catId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (catId === 'all') {
        next.delete('category');
      } else {
        next.set('category', catId);
      }
      return next;
    }, { replace: true });
  };

  // Handle search changes
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!val) {
        next.delete('search');
      } else {
        next.set('search', val);
      }
      return next;
    }, { replace: true });
  };

  // Sync URL search params to local state (for back/forward navigation support)
  useEffect(() => {
    const category = searchParams.get('category') || 'all';
    const query = searchParams.get('search') || '';
    if (category !== selectedCat) {
      setSelectedCat(category);
    }
    if (query !== search) {
      setSearch(query);
      setDebouncedSearch(query);
    }
  }, [searchParams]);

  // Normalize category titles to lowercase matching DB standards
  const mapCategory = (cat: string): string => {
    return (cat || '').toLowerCase();
  };

  // Fetch product list from SQLite backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/products`);
      const data = await res.json();
      const mappedData = data.map((p: any) => ({
        ...p,
        category: mapCategory(p.category)
      }));
      setProducts(mappedData);
      setFilteredProducts(mappedData);
      
      // Derive dynamic categories directly from products to prevent taxonomic issues
      const uniq = Array.from(new Set(mappedData.map((x: any) => (x.category || 'lainnya') as string))).filter(Boolean) as string[];
      const nice = uniq.map((id: string) => ({ 
        id, 
        name: String(id).split(/\s|&|\/|_/).map((w: any) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
      }));
      setCategories([{ id: 'all', name: 'Semua' }, ...nice]);
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      // Simulate slight delay for beautiful loading transition display
      setTimeout(() => {
        setLoading(false);
      }, 350);
    }
  };

  useEffect(() => {
    // Scroll ke atas dengan timeout singkat agar melangkahi scroll restoration otomatis browser
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    // Restore layout selections from local storage on startup
    try {
      const savedView = localStorage.getItem('materialCatalog:viewMode');
      const savedPageSize = localStorage.getItem('materialCatalog:pageSize');
      const savedPage = localStorage.getItem('materialCatalog:currentPage');
      if (savedView === 'list' || savedView === 'card') setViewMode(savedView as 'list' | 'card');
      if (savedPageSize) setPageSize(Number(savedPageSize));
      if (savedPage) setCurrentPage(Math.max(1, Number(savedPage)));
    } catch (e) {
      // Catch possible isolated browser errors
    }
    fetchProducts();
    return () => clearTimeout(timer);
  }, []);

  // Debounce search input dynamically for robust UX
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Synchronize searching, sorting, and category filters
  useEffect(() => {
    let result = products.slice();
    if (selectedCat !== 'all') {
      result = result.filter(p => (p.category || '').toLowerCase() === selectedCat.toLowerCase());
    }
    if (debouncedSearch !== '') {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting filters
    if (sortBy === 'price_asc') result.sort((a, b) => a.base_price - b.base_price);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.base_price - a.base_price);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProducts(result);
    setCurrentPage(1); // Reset page layout to first page when filtering
  }, [debouncedSearch, selectedCat, products, sortBy]);

  // Sync user layout selections to local storage
  useEffect(() => {
    try {
      localStorage.setItem('materialCatalog:viewMode', viewMode);
      localStorage.setItem('materialCatalog:pageSize', String(pageSize));
      localStorage.setItem('materialCatalog:currentPage', String(currentPage));
    } catch (e) {
      // Catch exceptions
    }
  }, [viewMode, pageSize, currentPage]);

  // Calculate pagination boundaries
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfdfe] font-sans relative overflow-x-hidden">
      
      {/* Absolute Ambient Soft Glow Background */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-accent/5 to-sage/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Modern Sticky Glassmorphic Header */}
      <header className="w-full border-b border-slate-100 bg-white/85 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase font-display">QHOMEMART</span>
            <span className="text-[11px] font-light text-slate-300">/</span>
            <span className="text-[9.5px] font-bold uppercase tracking-[0.25em] text-slate-400 mt-0.5 font-display">Showroom</span>
          </div>
          <button 
            onClick={onBack}
            className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 hover:text-accent border border-slate-200 hover:border-accent/40 bg-white px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-sm hover:shadow focus:outline-none cursor-pointer"
          >
            KEMBALI KE CANVAS
          </button>
        </div>
      </header>

      {/* Main Showroom Area */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-12">

        {/* Hero Title & Subtitle */}
        <div className="mb-10 animate-float-up">
          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.3em] text-accent mb-3 font-display">DIREKTORI PRODUK PREMIUM</p>
          <h1 className="text-[34px] font-light text-ink tracking-tight leading-tight mb-2.5 font-display">
            Katalog Material <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-ink to-accent">&amp; Informasi Stok</span>
          </h1>
          <p className="text-[13.5px] text-muted leading-relaxed max-w-2xl">
            Jelajahi portofolio material konstruksi berkualitas tinggi. Gunakan filter presisi untuk menemukan produk terbaik bagi proyek Anda.
          </p>
        </div>

        {/* Modern Clean Showroom Filters Layout */}
        <div className="flex flex-col gap-6 mb-10 animate-float-up">
          
          {/* Search & Actions Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Elegant Search Input */}
            <div className="relative flex items-center flex-1 max-w-md">
              <Search className="absolute left-4 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari material..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                aria-label="Cari material"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredProducts.length > 0 && onSelectProduct) {
                    onSelectProduct(filteredProducts[0]);
                  }
                }}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[13px] font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-400 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
              />
            </div>

            {/* Sorting & Layout Toggles */}
            <div className="flex items-center gap-3">
              {/* Custom Sort Selector */}
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)} 
                  aria-label="Urutkan" 
                  className="text-[12.5px] font-bold text-slate-600 border border-slate-100 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
                >
                  <option value="relevance">Relevansi</option>
                  <option value="price_asc">Harga: Rendah ke Tinggi</option>
                  <option value="price_desc">Harga: Tinggi ke Rendah</option>
                  <option value="name">Nama (A–Z)</option>
                </select>
              </div>

              {/* Vertical Separator */}
              <div className="h-6 w-px bg-slate-200/60 hidden sm:block" />

              {/* Layout Controls */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                <button 
                  onClick={fetchProducts}
                  className="p-2 text-slate-400 hover:text-accent rounded-xl hover:bg-slate-50 transition-all focus:outline-none cursor-pointer"
                  title="Muat Ulang"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list' ? 'text-accent bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Tampilan Tabel"
                >
                  <List className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'card' ? 'text-accent bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Tampilan Grid"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Pill Navigators - Clean & Horizontal Section */}
          <div className="border-t border-b border-slate-100/80 py-4.5">
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none min-w-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-5 py-2.5 rounded-xl text-[12.5px] font-bold transition-all duration-200 whitespace-nowrap focus:outline-none cursor-pointer ${
                    selectedCat === cat.id 
                      ? 'bg-accent text-white shadow-lg shadow-accent/15 border border-accent scale-102' 
                      : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-slate-900 shadow-sm hover:scale-101'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Display Area */}
        {loading ? (
          <CatalogSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-white border border-slate-100 rounded-3xl shadow-sm animate-scale-in">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h3 className="font-extrabold text-[16px] text-ink mb-1.5 font-display">Material Tidak Ditemukan</h3>
            <p className="text-[13px] text-slate-400 max-w-sm mx-auto">
              Tidak ada produk material yang sesuai dengan pencarian atau kategori filter Anda.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          
          /* ── LUXURY EDITORIAL TABLE VIEW ── */
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 overflow-x-auto animate-scale-in">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 pb-3">
                  <th className="pb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-display">Material</th>
                  <th className="pb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center w-28 font-display">Cakupan Area</th>
                  <th className="pb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center w-28 font-display">Status Stok</th>
                  <th className="pb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-right w-36 font-display">Harga Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedProducts.map((product) => {
                  let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-500/10';
                  let dotStyle = 'bg-emerald-500';
                  let stockText = `${product.stock_qty} pcs`;
                  
                  if (product.stock_qty === 0) {
                    badgeStyle = 'bg-rose-50 text-rose-600 border-rose-500/10';
                    dotStyle = 'bg-rose-500';
                    stockText = 'Habis';
                  } else if (product.stock_qty < 10) {
                    badgeStyle = 'bg-amber-50 text-amber-600 border-amber-500/10';
                    dotStyle = 'bg-amber-500';
                  }

                  return (
                    <tr 
                      key={product.sku} 
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                      className={`hover:bg-slate-50/50 transition-colors group ${onSelectProduct ? 'cursor-pointer' : ''}`}
                    >
                      {/* Product identity */}
                      <td className="py-4.5 pr-4 flex items-center gap-4">
                        <img 
                          src={product.image_url || PLACEHOLDER_SVG} 
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER_SVG; }}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0 group-hover:border-accent/30 transition-colors shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13.5px] font-bold text-slate-800 group-hover:text-accent transition-colors leading-tight">
                              {product.name}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 border border-slate-200/40 px-2.5 py-0.5 rounded-full text-slate-500 font-display">
                              {product.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 font-display">{product.sku}</p>
                        </div>
                      </td>

                      {/* Coverage Area */}
                      <td className="py-4.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[13px] font-bold">{product.coverage_m2} m²</span>
                        </div>
                        <span className="text-[9.5px] font-medium text-slate-400 block mt-0.5">per dus</span>
                      </td>

                      {/* Dynamic Stock Status */}
                      <td className="py-4.5 px-4 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${badgeStyle} font-display shadow-sm`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotStyle} animate-pulse`} />
                          {stockText}
                        </div>
                      </td>

                      {/* Pricing Tag & Selection button */}
                      <td className="py-4.5 pl-4 text-right">
                        <span className="text-[14.5px] font-extrabold text-ink block font-display">
                          Rp {product.base_price.toLocaleString('id-ID')}
                        </span>
                        {onSelectProduct && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProduct(product);
                            }}
                            className="mt-1 text-[11px] font-extrabold text-accent hover:text-accent-hover transition-colors focus:outline-none cursor-pointer uppercase tracking-wider font-display"
                          >
                            Pilih Material →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* List Table Footer */}
            <div className="pt-5 border-t border-slate-100 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[11.5px] text-slate-400 font-semibold">{totalItems} material total · menampilkan {((currentPage - 1) * pageSize + 1)} - {Math.min(currentPage * pageSize, totalItems)}</span>
              <div className="flex items-center gap-2">
                <label className="text-[11.5px] text-slate-400 font-semibold">Tampilkan per halaman:</label>
                <select 
                  value={pageSize} 
                  onChange={(e) => setPageSize(Number(e.target.value))} 
                  className="text-[11px] font-bold text-slate-600 border border-slate-200/80 rounded-full px-3 py-1.5 bg-white focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

        ) : (
          
          /* ── PREMIUM ELEVATED GRID VIEW ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-scale-in">
            {pagedProducts.map((product) => {
              let badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-500/10';
              let dotStyle = 'bg-emerald-500';
              let stockText = `${product.stock_qty} pcs`;
              
              if (product.stock_qty === 0) {
                badgeStyle = 'bg-rose-50 text-rose-600 border-rose-500/10';
                dotStyle = 'bg-rose-500';
                stockText = 'Habis';
              } else if (product.stock_qty < 10) {
                badgeStyle = 'bg-amber-50 text-amber-600 border-amber-500/10';
                dotStyle = 'bg-amber-500';
              }

              return (
                <div 
                  key={product.sku} 
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                  className={`group flex flex-col justify-between bg-white border border-slate-100/80 rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-accent/30 transition-all duration-300 relative ${onSelectProduct ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div>
                    {/* Material Image Container */}
                    <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100/60 shadow-inner">
                      <img 
                        src={product.image_url || PLACEHOLDER_SVG} 
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_SVG; }}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Interactive Stock Badge on top of card */}
                      <div className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border bg-white ${badgeStyle} shadow-sm font-display`}>
                        <span className={`w-1 h-1 rounded-full ${dotStyle}`} />
                        {stockText}
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="p-4 pb-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 block font-display">
                        {product.category}
                      </span>
                      <h4 className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {product.name}
                      </h4>
                    </div>
                  </div>

                  <div className="p-4 pt-3.5 mt-4 border-t border-slate-100/60 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block mb-0.5 font-display uppercase tracking-wider">{product.sku.substring(0, 8)}</span>
                      <span className="text-[14.5px] font-black text-slate-900 font-display">
                        Rp {product.base_price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">{product.coverage_m2} m²/dus</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modern Showroom Pagination */}
        {totalItems > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-10">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage((s) => Math.max(1, s - 1))} 
                disabled={currentPage === 1} 
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed shadow-sm bg-white text-slate-600"
              >
                KEMBALI
              </button>
              <span className="text-[12px] font-bold text-slate-500 px-2 font-display">
                Halaman {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage((s) => Math.min(totalPages, s + 1))} 
                disabled={currentPage === totalPages} 
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed shadow-sm bg-white text-slate-600"
              >
                LANJUT
              </button>
            </div>
            <div className="text-[12px] text-slate-400 font-bold tracking-wider font-display uppercase">
              TOTAL: {totalItems} MATERIAL
            </div>
          </div>
        )}

        {/* Corporate Digital Office Footer */}
        <footer className="text-[11px] font-bold tracking-wider text-slate-300/80 mt-16 pt-6 border-t border-slate-100 font-display uppercase">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office Platform
        </footer>
      </div>
    </div>
  );
}
