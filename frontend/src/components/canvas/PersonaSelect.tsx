import { Palette, ShieldCheck } from 'lucide-react';
import MaterialCatalog from '../MaterialCatalog';

export const PERSONAS = [
  {
    role: 'user',
    roleDisplay: 'Mitra B2B / Professional',
    name: 'Mitra QHomeMart',
    icon: Palette,
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    desc: 'Melakukan estimasi material proyek (Granit, Cat, Kayu, Batu), waterproofing area basah, saniter toilet, serta bulk order grosir.',
    colorClass: 'border-hairline hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(219,234,254,0.3)] hover:bg-blue-50/5 focus:ring-blue-100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-100/60 dark:bg-blue-950/40 dark:text-blue-300',
    distanceKm: 8,
    city: 'Sleman'
  },
  {
    role: 'admin',
    roleDisplay: 'Lead Warehouse Administrator',
    name: 'Admin Gudang',
    icon: ShieldCheck,
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    desc: 'Manajemen ketersediaan stok kritis, intervensi dan persetujuan restok, pemutakhiran katalog produk gudang.',
    colorClass: 'border-hairline hover:border-amber-300 hover:shadow-[0_8px_30px_rgb(254,243,199,0.3)] hover:bg-amber-50/5 focus:ring-amber-100',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100/60 dark:bg-amber-950/40 dark:text-amber-300',
    distanceKm: 0,
    city: 'Yogyakarta (HQ)'
  }
];

export const getPersonaGreeting = (role: string) => {
  switch (role) {
    case 'user':
      return {
        title: "Halo Mitra B2B, mari rencanakan kebutuhan material proyek Anda.",
        subtitle: "Simulasi fokus pada visual estetika, kalkulasi teknis volume RAB, dan ketersediaan stok grosir.",
        presets: [
          {
            title: "Desain Kamar Mandi (Arsitek)",
            desc: "Kalkulasi ubin granit polished 60x60 cm seluas 10 m² untuk konsep lantai kamar mandi minimalis.",
            prompt: "Tolong carikan di katalog QHomeMart ubin granit polished motif Carrara White 60x60 Roman untuk area kamar mandi seluas 10 m² dengan pola standard. Cek juga ketersediaan semen perekat Lemkra FK 206 dan pengisi nat AM 207 dari katalog toko untuk pemasangannya."
          },
          {
            title: "Konsultasi Tren Interior (Desainer)",
            desc: "Analisis singkat mengenai tren material interior dan kombinasi palet warna modern kontemporer di Indonesia saat ini.",
            prompt: "Tolong berikan analisis singkat mengenai tren material interior dan kombinasi palet warna modern kontemporer yang sedang populer di Indonesia saat ini untuk ruang keluarga minimalis."
          },
          {
            title: "Bulk Order Semen (Ritel - Memicu Restok)",
            desc: "Pemesanan semen perekat MU-203 sebanyak 80 sak untuk memicu alur restok gudang oleh Admin.",
            prompt: "Selamat siang, kami sedang mengerjakan proyek di Sleman. Tolong cek stok MU-203 Perekat Keramik 50kg dari katalog QHomeMart untuk pemesanan sebanyak 80 sak. Hitung biaya logistik kargo CDD ke Sleman dan total biayanya."
          }
        ]
      };
    default:
      return {
        title: "",
        subtitle: "",
        presets: []
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
