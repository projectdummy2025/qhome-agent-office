import { useState, useEffect, useRef } from 'react';
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

const PLACEHOLDER_SVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="140" viewBox="0 0 200 140"><rect width="200" height="140" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial, Helvetica, sans-serif" font-size="14">No Image</text></svg>';

export default function MaterialCatalog({ onBack, onSelectProduct }: MaterialCatalogProps) {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<{id:string,name:string}[]>(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'name'>('relevance');
  const debounceRef = useRef<number | null>(null);

  // Keep category names aligned with the database taxonomy: just normalize to lower-case
  const mapCategory = (cat: string): string => {
    return (cat || '').toLowerCase();
  };

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
      // derive categories from data to avoid taxonomy mismatches
      const uniq = Array.from(new Set(mappedData.map((x: any) => (x.category || 'lainnya') as string))).filter(Boolean) as string[];
      const nice = uniq.map((id: string) => ({ id, name: String(id).split(/\s|&|\/|_/).map((w:any)=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ') }));
      setCategories([{ id: 'all', name: 'Semua' }, ...nice]);
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // load persisted UI state
    try {
      const savedView = localStorage.getItem('materialCatalog:viewMode');
      const savedPageSize = localStorage.getItem('materialCatalog:pageSize');
      const savedPage = localStorage.getItem('materialCatalog:currentPage');
      if (savedView === 'list' || savedView === 'card') setViewMode(savedView as 'list' | 'card');
      if (savedPageSize) setPageSize(Number(savedPageSize));
      if (savedPage) setCurrentPage(Math.max(1, Number(savedPage)));
    } catch (e) {
      // ignore localStorage errors
    }
    fetchProducts();
  }, []);

  // Debounce search input for better UX
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // small debounce to avoid rapid re-filtering
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    debounceRef.current = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

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

    // apply sorting
    if (sortBy === 'price_asc') result.sort((a, b) => a.base_price - b.base_price);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.base_price - a.base_price);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProducts(result);
    // when filters change, reset to first page
    setCurrentPage(1);
  }, [debouncedSearch, selectedCat, products, sortBy]);

  // persist UI state to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('materialCatalog:viewMode', viewMode);
      localStorage.setItem('materialCatalog:pageSize', String(pageSize));
      localStorage.setItem('materialCatalog:currentPage', String(currentPage));
    } catch (e) {
      // ignore
    }
  }, [viewMode, pageSize, currentPage]);

  // compute pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // clamp currentPage
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans">

      {/* Header Bar */}
      <header className="w-full border-b border-hairline bg-canvas sticky top-0 z-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-light mt-0.5">Master Catalog</span>
          </div>
          <button 
            onClick={onBack}
            className="text-[10px] font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors focus:outline-none cursor-pointer border border-hairline/60 px-5 py-1.5 rounded-full hover:border-ink transition-all"
          >
            KEMBALI
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-10">

        {/* Page Title */}
        <div className="mb-8">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-accent mb-3">Direktori Material</p>
          <h1 className="text-[32px] font-light text-ink tracking-tight leading-tight mb-2">
            Katalog Material {' '}
            <span className="font-extrabold">Premium & Stok</span>
          </h1>
          <p className="text-[13px] text-muted">Cari dan filter material kustom berkualitas tinggi dengan informasi stok seketika.</p>
        </div>

        {/* Toolbar: filter + search + view mode — satu baris, no card */}
        <div className="flex flex-wrap items-center gap-3 border-y border-hairline py-3.5 mb-8">
          {/* Category Pills (underline style) */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-1.5 rounded-full text-[11.5px] font-semibold transition-all whitespace-nowrap focus:outline-none cursor-pointer ${
                  selectedCat === cat.id 
                    ? 'bg-ink text-white' 
                    : 'text-muted hover:text-ink hover:bg-surface-soft'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="h-5 w-px bg-hairline hidden sm:block" />

          {/* Search */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-3.5 h-3.5 text-muted-light" />
            <input
              type="text"
              placeholder="Cari material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari material"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length > 0 && onSelectProduct) {
                  onSelectProduct(filteredProducts[0]);
                }
              }}
              className="pl-9 pr-4 py-1.5 bg-surface-soft border border-hairline rounded-full text-[12.5px] focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted-light w-52"
            />
          </div>

          {/* Sort control */}
          <div className="ml-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} aria-label="Urutkan" className="text-[12px] border border-hairline rounded px-2 py-1 bg-white">
              <option value="relevance">Relevansi</option>
              <option value="price_asc">Harga: Rendah → Tinggi</option>
              <option value="price_desc">Harga: Tinggi → Rendah</option>
              <option value="name">Nama (A–Z)</option>
            </select>
          </div>

          {/* Reload + View Mode */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={fetchProducts}
              className="p-1.5 text-muted-light hover:text-ink rounded-full hover:bg-surface-soft transition-all focus:outline-none cursor-pointer"
              title="Muat Ulang"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${viewMode === 'list' ? 'text-ink bg-surface-soft' : 'text-muted-light hover:text-ink'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${viewMode === 'card' ? 'text-ink bg-surface-soft' : 'text-muted-light hover:text-ink'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Catalog Display */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <p className="text-[12.5px] text-muted">Memuat katalog material dari database SQLite...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-8 h-8 text-muted-light mx-auto mb-3" />
            <h3 className="font-bold text-[15px] text-ink mb-1">Material Tidak Ditemukan</h3>
            <p className="text-[12.5px] text-muted">
              Tidak ada produk yang cocok dengan filter atau kata kunci pencarian.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* ── LIST VIEW: Editorial table rows, no card boxing ── */
          <div>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-6 px-2 pb-2 border-b border-hairline">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light">Material</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light text-center w-24">Coverage</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light text-center w-20">Stok</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-light text-right w-32">Harga Satuan</span>
            </div>
            <div className="divide-y divide-hairline/70">
              {pagedProducts.map((p) => (
                <div 
                  key={p.sku} 
                  onClick={() => onSelectProduct && onSelectProduct(p)}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelectProduct) onSelectProduct(p); }}
                  role={onSelectProduct ? 'button' : undefined}
                  tabIndex={onSelectProduct ? 0 : undefined}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-6 items-center py-4 px-2 hover:bg-surface-soft/50 transition-colors group ${onSelectProduct ? 'cursor-pointer' : ''}`}
                >
                  {/* Product identity */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img 
                      src={p.image_url || PLACEHOLDER_SVG} 
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_SVG; }}
                      className="w-11 h-11 rounded-lg object-cover border border-hairline/70 flex-shrink-0 group-hover:border-accent/20 transition-colors"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-bold text-ink group-hover:text-accent transition-colors leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider bg-surface-soft border border-hairline/70 px-2.5 py-0.5 rounded-full text-muted whitespace-nowrap">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-muted-light tracking-wider uppercase mt-0.5">{p.sku}</p>
                    </div>
                  </div>

                  {/* Coverage */}
                  <div className="text-center w-24">
                    <div className="flex items-center justify-center gap-1 text-muted">
                      <Layers className="w-3 h-3 text-muted-light" />
                      <span className="text-[12.5px] font-medium">{p.coverage_m2} m²</span>
                    </div>
                    <span className="text-[9.5px] text-muted-light">/ box</span>
                  </div>

                  {/* Stock */}
                  <div className="text-center w-20">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-[12.5px] font-semibold text-emerald-600">{p.stock_qty}</span>
                    </div>
                    <span className="text-[9.5px] text-muted-light">pcs ready</span>
                  </div>

                  {/* Price + action */}
                  <div className="text-right w-32">
                    <span className="text-[14.5px] font-extrabold text-ink block">
                      Rp {p.base_price.toLocaleString('id-ID')}
                    </span>
                    {onSelectProduct && (
                      <button 
                        onClick={() => onSelectProduct(p)}
                        className="mt-1 text-[10.5px] font-bold text-accent hover:text-accent-hover transition-colors focus:outline-none cursor-pointer"
                      >
                        Pilih →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Count footer */}
            <div className="pt-4 border-t border-hairline mt-2 flex items-center justify-between gap-4">
              <span className="text-[11px] text-muted-light">{totalItems} material · menampilkan {( (currentPage-1)*pageSize + 1)} - {Math.min(currentPage*pageSize, totalItems)}</span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-muted-light">Per halaman:</label>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="text-[11px] border border-hairline rounded px-2 py-1 bg-white">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

        ) : (
          /* ── GRID VIEW: Flat image + info, minimal separation ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
            {pagedProducts.map((p) => (
              <div key={p.sku} className={`group ${onSelectProduct ? 'cursor-pointer' : 'cursor-default'}`} onClick={() => onSelectProduct && onSelectProduct(p)} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelectProduct) onSelectProduct(p); }} role={onSelectProduct ? 'button' : undefined} tabIndex={onSelectProduct ? 0 : undefined}>
                {/* Image — no border radius card, just image */}
                  <div className="relative aspect-square bg-neutral-100 overflow-hidden rounded-xl mb-3">
                  <img 
                    src={p.image_url || PLACEHOLDER_SVG} 
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_SVG; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {p.stock_qty < 10 && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                      LOW STOCK
                    </span>
                  )}
                </div>

                {/* Info — below image, no boxing */}
                <div>
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-accent mb-1 block">
                    {p.category}
                  </span>
                  <h4 className="text-[12.5px] font-bold text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2 mb-1">
                    {p.name}
                  </h4>
                  <span className="text-[13px] font-extrabold text-ink block">
                    Rp {p.base_price.toLocaleString('id-ID')}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10.5px] text-muted">{p.coverage_m2} m²/box</span>
                    <span className="text-[10.5px] text-emerald-600 font-semibold">{p.stock_qty} pcs</span>
                  </div>
                  {onSelectProduct && (
                    <button 
                      onClick={() => onSelectProduct(p)}
                      className="mt-3.5 w-full py-2 border border-accent/20 hover:border-accent bg-accent/5 hover:bg-accent text-accent hover:text-white rounded-full text-[10.5px] font-bold uppercase tracking-wider transition-all text-center focus:outline-none cursor-pointer"
                    >
                      Pilih Material
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalItems > pageSize && (
          <div className="flex items-center justify-between mt-6 mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((s) => Math.max(1, s-1))} disabled={currentPage===1} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Prev</button>
              <span className="text-[11px] text-muted-light">Halaman {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((s) => Math.min(totalPages, s+1))} disabled={currentPage===totalPages} className="px-3 py-1 border rounded bg-white disabled:opacity-50">Next</button>
            </div>
            <div className="text-[11px] text-muted-light">Total: {totalItems}</div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-[11px] text-muted-light mt-auto pt-6 border-t border-hairline/60">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office B2B Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
