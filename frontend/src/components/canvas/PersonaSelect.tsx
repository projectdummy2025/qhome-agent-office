import { Palette, HardHat, Store, ShieldCheck } from 'lucide-react';
import MaterialCatalog from '../MaterialCatalog';

export const PERSONAS = [
  {
    role: 'architect',
    roleDisplay: 'Senior Architect & Designer',
    name: 'Ibu Amalia',
    icon: Palette,
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    desc: 'Evaluasi keselarasan gaya arsitektural, spesifikasi material premium, integrasi visual, dan penyusunan moodboard interior.',
    colorClass: 'border-hairline hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(219,234,254,0.3)] hover:bg-blue-50/5 focus:ring-blue-100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-100/60 dark:bg-blue-950/40 dark:text-blue-300',
    distanceKm: 8,
    city: 'Sleman'
  },
  {
    role: 'contractor',
    roleDisplay: 'General Contractor & Engineer',
    name: 'Bapak Joko',
    icon: HardHat,
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    desc: 'Kalkulator volume struktural proyek, perhitungan wastage margin semen/perekat, verifikasi standar teknis, dan rancangan RAB.',
    colorClass: 'border-hairline hover:border-emerald-300 hover:shadow-[0_8px_30px_rgb(209,250,229,0.3)] hover:bg-emerald-50/5 focus:ring-emerald-100',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    distanceKm: 15,
    city: 'Bantul'
  },
  {
    role: 'retailer',
    roleDisplay: 'Retail & Procurement Partner',
    name: 'Ibu Santi',
    icon: Store,
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-100/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    desc: 'Pemesanan volume besar (bulk procurement), koordinasi alokasi stok pergudangan terdistribusi, dan negosiasi pricing tier korporat.',
    colorClass: 'border-hairline hover:border-purple-300 hover:shadow-[0_8px_30px_rgb(243,232,255,0.3)] hover:bg-purple-50/5 focus:ring-purple-100',
    badgeColor: 'bg-purple-50 text-purple-700 border-emerald-100/60 dark:bg-purple-950/40 dark:text-purple-300',
    distanceKm: 35,
    city: 'Kulon Progo'
  },
  {
    role: 'admin',
    roleDisplay: 'Lead System Administrator',
    name: 'Bapak Rudi',
    icon: ShieldCheck,
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    desc: 'Manajemen otorisasi diskon volume, intervensi stok kritis, pemutakhiran master catalog, dan audit log koordinasi antar staf.',
    colorClass: 'border-hairline hover:border-amber-300 hover:shadow-[0_8px_30px_rgb(254,243,199,0.3)] hover:bg-amber-50/5 focus:ring-amber-100',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/40 dark:text-amber-300',
    distanceKm: 0,
    city: 'Yogyakarta (HQ)'
  }
];

export const getPersonaGreeting = (role: string) => {
  switch (role) {
    case 'architect':
      return {
        title: "Halo Ibu Amalia, mari ciptakan estetika ruang yang mewah.",
        subtitle: "Simulasi fokus pada visual estetika, moodboard premium, dan keselarasan desain ruang.",
        presets: [
          {
            title: "Granit Carrara Ruang Keluarga",
            desc: "Kurasi ubin granit polished 60x60 cm seluas 35 m² untuk konsep interior modern klasik.",
            prompt: "Rekomendasikan ubin granit polished 60x60 cm bermotif Carrara (gunakan secara eksplisit Granit Carrara White Polished 60x60 Roman, SKU: FL-061, harga: 320432.82) dari katalog untuk ruang tamu 35 m² bergaya modern klasik. Jika merekomendasikan bahan pendukung semen perekat, gunakan secara eksplisit Lemkra FK 206 Perekat Granit 40kg (SKU: BM-007, harga: 121913.7, unit: Sak) untuk memenuhi seluruh kebutuhan semen perekat. Untuk pengisi nat, gunakan secara eksplisit AM 207 Pengisi Nat Keramik 5kg (SKU: BM-008, harga: 407573.77, unit: Sak) untuk memenuhi seluruh kebutuhan nat."
          },
          {
            title: "Estetika Lampu Gantung Hias",
            desc: "Pilih lampu gantung hias minimalis untuk mempercantik area ruang makan bertema Japandi.",
            prompt: "Rekomasikan Lampu Gantung Hias Minimalis DL-805 Supreme (SKU: EL-006, harga: 525612.69) dari katalog QHomeMart untuk pencahayaan ruang makan berkonsep Japandi."
          },
          {
            title: "Saniter Wastafel Kamar Mandi",
            desc: "Kurasi wastafel gantung porselen dan kran air estetik untuk kamar mandi tamu minimalis.",
            prompt: "Rekomendasikan Wastafel Gantung Porselen SA-534 Kohler (SKU: SA-035, harga: 557859.64) dan Kran Angsa Meja Dapur SA-519 Grohe (SKU: SA-020, harga: 265495.4) dari katalog QHomeMart untuk kamar mandi tamu berdesain minimalis mewah."
          }
        ]
      };
    case 'contractor':
      return {
        title: "Halo Bapak Joko, mari hitung volume material & anggaran.",
        subtitle: "Simulasi fokus pada kalkulator semen nat pendukung, wastage ubin, dan efisiensi anggaran lapangan.",
        presets: [
          {
            title: "RAB Ubin & Perekat Semen Nat",
            desc: "Estimasi ubin granit 60x60 cm pola diagonal untuk lantai 40 m² dengan wastage 10% dan kebutuhan semen perekat.",
            prompt: "Hitung kebutuhan ubin granit 60x60 cm untuk lantai 40 m² pola diagonal dengan wastage 10%. Untuk bahan pendukung semen perekat, gunakan secara eksplisit Lemkra FK 206 Perekat Granit 40kg (SKU: BM-007, harga: 121913.7, unit: Sak) untuk memenuhi seluruh kebutuhan semen perekat. Untuk pengisi nat, gunakan secara eksplisit AM 207 Pengisi Nat Keramik 5kg (SKU: BM-008, harga: 407573.77, unit: Sak) untuk memenuhi seluruh kebutuhan nat. Gunakan produk yang tersedia di katalog QHomeMart."
          },
          {
            title: "RAB Lantai SPC Wood Motif",
            desc: "Hitung kebutuhan ubin SPC motif kayu tebal 4mm untuk kamar tidur 25 m² beserta underlayer.",
            prompt: "Hitung kebutuhan lantai SPC Flooring Wood Motif untuk lantai kamar tidur seluas 25 m² lengkap dengan underlayer foam dan perkiraan wastage 5%. Gunakan produk yang tersedia di katalog QHomeMart."
          },
          {
            title: "Waterproofing Dak Beton & Kamar Mandi",
            desc: "Estimasi pelapis kedap air 2 komponen Sika Top untuk area basah seluas 30 m².",
            prompt: "Hitung kebutuhan pelapis kedap air Sika Top 205 Waterproofing 25kg (SKU: BM-006, harga: 111436.26) untuk lantai dak beton atau kamar mandi seluas 30 m². Tambahkan secara eksplisit Floor Drain Stainless Anti-Bau SA-587 Aer (SKU: SA-088, harga: 90478.16, qty: 1 unit) dari katalog QHomeMart."
          }
        ]
      };
    case 'retailer':
      return {
        title: "Halo Ibu Santi, mari cek ketersediaan stok pergudangan.",
        subtitle: "Simulasi fokus pada kuantitas stok volume besar, substitusi alternatif barang, dan logistik.",
        presets: [
          {
            title: "Bulk Order Ubin Granit Aula",
            desc: "Pengadaan ubin granit lantai 80 m² dalam satu batch untuk menjamin kesamaan warna.",
            prompt: "Cek ketersediaan dan hitung kebutuhan ubin granit 60x60 cm untuk lantai aula 80 m² (gunakan secara eksplisit Granit Carrara White Polished 60x60 Roman, SKU: FL-061, harga: 320432.82). Jika merekomendasikan bahan pendukung semen perekat, gunakan secara eksplisit Lemkra FK 206 Perekat Granit 40kg (SKU: BM-007, harga: 121913.7, unit: Sak) untuk memenuhi seluruh kebutuhan semen perekat. Untuk pengisi nat, gunakan secara eksplisit AM 207 Pengisi Nat Keramik 5kg (SKU: BM-008, harga: 407573.77, unit: Sak) untuk memenuhi seluruh kebutuhan nat."
          },
          {
            title: "Elektronik Dapur Apartemen",
            desc: "Pengadaan kompor tanam gas Modena dan cooker hood sebanyak 15 unit untuk dapur apartemen.",
            prompt: "Hitung kebutuhan dan cek stok Kompor Tanam Gas 2 Tungku MX-100 Modena (SKU: AP-001, harga: 32370631.87) serta Cooker Hood Slim MX-110 Modena (SKU: AP-011, harga: 13883978.55) sebanyak 15 unit untuk dapur apartemen. Tampilkan estimasi harga total grosir."
          },
          {
            title: "Konsolidasi Semen & Waterproofing",
            desc: "Pengadaan Semen Portland Tiga Roda 100 sak dan Sika Top Waterproofing 20 set.",
            prompt: "Hitung kebutuhan Semen Portland Composite PCC 40kg Tiga Roda (SKU: BM-001, harga: 27130.22, unit: Sak) sebanyak 100 sak dan Sika Top 205 Waterproofing 25kg (SKU: BM-006, harga: 111436.26, unit: Set) sebanyak 20 set dalam satu pesanan logistik. Tunjukkan estimasi total berat dan biayanya."
          }
        ]
      };
    case 'admin':
    default:
      return {
        title: "Halo Bapak Rudi, selamat datang di Panel Kontrol Admin.",
        subtitle: "Simulasi fokus pada penanganan stok habis, validasi harga manual, and pengawasan log antar staf.",
        presets: [
          {
            title: "Simulasi Stok Habis & Substitusi",
            desc: "Uji coba sistem penanganan stok kritis/habis pada ubin granit impor untuk memicu draf alternatif otomatis.",
            prompt: "Simulasikan pesanan ubin granit premium impor bermotif langka yang stoknya sedang kosong (out of stock) untuk menguji apakah sistem asisten berhasil mencarikan alternatif substitusi setara secara otomatis."
          },
          {
            title: "Integrasi Kolaborasi Staf (RAB)",
            desc: "Delegasi tugas simultan ke staf Ubin, Sanitary, dan Kelistrikan untuk estimasi kantor 100 m².",
            prompt: "Uji koordinasi antar staf secara simultan: hitung ubin granit lantai Roman 60x60 (gunakan secara eksplisit Granit Carrara White Polished 60x60 Roman, SKU: FL-061, harga: 320432.82) untuk area 60 m2. Untuk toilet, gunakan Closet Duduk Monoblok SA-500 Toto (SKU: SA-001, harga: 4016233.16) dan Wastafel Gantung Porselen SA-534 Kohler (SKU: SA-035, harga: 557859.64). Untuk lampu, gunakan Downlight LED Slim Round 19W Philips (SKU: EL-050, harga: 262885.29) sebanyak 15 titik. Jika merekomendasikan bahan pendukung semen perekat, gunakan secara eksplisit Lemkra FK 206 Perekat Granit 40kg (SKU: BM-007, harga: 121913.7, unit: Sak) untuk memenuhi seluruh kebutuhan semen perekat. Untuk pengisi nat, gunakan secara eksplisit AM 207 Pengisi Nat Keramik 5kg (SKU: BM-008, harga: 407573.77, unit: Sak) untuk memenuhi seluruh kebutuhan nat."
          },
          {
            title: "Override Diskon Volume",
            desc: "Pengadaan material bernilai tinggi di atas Rp 50 Juta untuk memicu verifikasi approval diskon khusus admin.",
            prompt: "Simulasikan pengadaan material bernilai tinggi (total di atas Rp 50 Juta) untuk menguji modul approval diskon volume khusus admin pada portal evaluasi."
          }
        ]
      };
  }
};

interface PersonaSelectProps {
  landingTab: 'simulation' | 'catalog';
  setLandingTab: (tab: 'simulation' | 'catalog') => void;
  setCurrentUser: (user: any) => void;
  setActivePortal: (portal: 'chat' | 'admin' | 'order' | 'catalog' | 'history') => void;
  addToCart: (product: any) => void;
}

export default function PersonaSelect({
  landingTab,
  setLandingTab,
  setCurrentUser,
  setActivePortal,
  addToCart
}: PersonaSelectProps) {
  if (landingTab === 'catalog') {
    return (
      <MaterialCatalog
        onBack={() => setLandingTab('simulation')}
        onSelectProduct={(p) => { addToCart(p); setActivePortal('order'); }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-slate-50 via-white to-slate-50 font-sans relative overflow-hidden">
      {/* Subtle Decorative Ambient Background Glows — desktop only agar tidak overlap teks di mobile */}
      <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100/20 blur-[120px] pointer-events-none" />

      {/* Sleek Enterprise Top Header Bar */}
      <header className="w-full border-b border-hairline bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="hidden sm:inline text-[11px] font-light text-muted-light">/</span>
            <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-[0.25em] text-muted-light mt-0.5">Digital Office</span>
          </div>

          {/* Header Navigation Menus (Swiss Editorial Segment) */}
          <div className="flex items-center gap-4 sm:gap-8">
            <button
              onClick={() => setLandingTab('simulation')}
              className={`flex items-baseline text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer focus:outline-none py-1 relative text-accent`}
            >
              <span className="hidden sm:inline text-[8px] font-mono mr-1 text-accent/80">01 //</span>
              Simulasi Chat
              {landingTab === 'simulation' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent animate-fade-in" />
              )}
            </button>
            <button
              onClick={() => setLandingTab('catalog')}
              className={`flex items-baseline text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer focus:outline-none py-1 relative text-muted hover:text-ink`}
            >
              <span className="hidden sm:inline text-[8px] font-mono mr-1 text-accent/80">02 //</span>
              Katalog Material
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area — Editorial Layout aligned with max-w-[1400px] */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-8 md:py-12 relative z-10 justify-start">
        <div className="flex-1 flex flex-col justify-start animate-scale-in max-w-3xl w-full">

          {/* Eyebrow + Headline */}
          <div className="mb-8 md:mb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-accent mb-4">
              QHomeMart Enterprise Workspace
            </p>
            <h1 className="text-[30px] sm:text-[36px] md:text-[42px] font-light text-ink tracking-tight leading-[1.05] mb-5">
              Portal Estimasi &<br />
              <span className="font-extrabold text-ink">Procurement</span>{' '}
              <span className="text-accent font-light">Grosir</span>
            </h1>
            <p className="text-[14px] text-muted leading-relaxed max-w-lg font-normal border-l-2 border-accent/40 pl-4">
              Sistem staf terintegrasi untuk otomatisasi kalkulasi volume material proyek, sinkronisasi stok gudang real-time, dan kurasi spesifikasi arsitektural bagi mitra profesional.
            </p>
          </div>

          {/* Divider with label */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-light">Pilih Persona Simulasi</span>
            <div className="flex-1 h-px bg-hairline" />
            <span className="text-[10px] text-muted-light">{PERSONAS.length} tersedia</span>
          </div>

          {/* Editorial Persona List — no cards, dividers only */}
          <div className="divide-y divide-hairline">
            {PERSONAS.map((persona, idx) => {
              const IconComponent = persona.icon;
              return (
                <button
                  key={persona.role}
                  onClick={() => {
                    setCurrentUser(persona);
                    if (persona.role === 'admin') {
                      setActivePortal('admin');
                    } else {
                      setActivePortal('chat');
                    }
                  }}
                  className="w-full flex items-start gap-4 sm:gap-6 py-5 text-left group outline-none hover:bg-surface-soft/40 transition-colors duration-200 cursor-pointer px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-full"
                >
                  {/* Index number */}
                  <span className="text-[12px] font-bold text-muted-light w-5 flex-shrink-0 group-hover:text-accent transition-colors tabular-nums mt-2.5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Icon — minimal, flat */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-soft border border-hairline group-hover:border-accent/30 transition-colors mt-0.5">
                    <IconComponent className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                  </div>

                  {/* Text block */}
                  <div className="flex-1 min-w-0 mt-1">
                    <div className="flex items-baseline gap-2.5 mb-1">
                      <span className="text-[15.5px] font-bold text-ink group-hover:text-accent transition-colors leading-none">
                        {persona.name}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-light uppercase tracking-wider">
                        {persona.roleDisplay}
                      </span>
                    </div>
                    <div className="overflow-hidden max-h-[1.6em] group-hover:max-h-[4.5em] transition-[max-height] duration-300 ease-in-out">
                      <p className="text-[12.5px] text-muted leading-relaxed truncate group-hover:whitespace-normal">
                        {persona.desc}
                      </p>
                    </div>
                  </div>

                  {/* Right — badge */}
                  <div className="flex items-center gap-3 flex-shrink-0 mt-2">
                    <span className="hidden sm:inline-block text-[9.5px] font-bold uppercase tracking-wider text-muted-light border border-hairline/60 px-3 py-0.5 rounded-full">
                      {persona.role === 'admin' ? 'Admin' : 'Mitra'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Footer pinned to the absolute bottom of the viewport */}
        <footer className="text-[11px] text-muted-light mt-12 pt-6 border-t border-hairline/60 w-full">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
