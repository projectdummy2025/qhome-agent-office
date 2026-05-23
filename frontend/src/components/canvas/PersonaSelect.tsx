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
    desc: 'Evaluasi keselarasan gaya arsitektural, spesifikasi material premium, integrasi visual, dan penyusunan moodboard interior B2B.',
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
        subtitle: "Simulasi fokus pada visual estetika, moodboard premium, and keselarasan desain ruang.",
        presets: [
          {
            title: "Granit Carrara Ruang Keluarga",
            desc: "Kurasi visual & keselarasan ubin granit premium bermotif marmer Carrara (glossy) seluas 35 m² untuk konsep interior modern klasik.",
            prompt: "Rancang konsep interior dan moodboard visual terperinci untuk area ruang tamu utama seluas 35 m² dengan mengusung gaya Modern Klasik Kontemporer yang mewah. Fokus utama adalah mengombinasikan ubin lantai granit premium bermotif marmer Carrara White berukuran 60x60 cm (misalnya Sandimas Tile Polished 60x60 #8 atau sejenisnya) yang memiliki finishing polished/glossy tinggi untuk memaksimalkan pantulan cahaya alami dari jendela besar di sisi barat. Evaluasi keselarasan warna abu-abu urat marmer (veining) pada lantai dengan rencana aplikasi cat tembok interior bertekstur halus warna beige hangat (warm sand) sebagai warna dasar dinding. Tambahkan opsi panel kayu Walnut gelap di sudut ruangan sebagai titik aksen visual (focal point). Berikan ulasan arsitektural komprehensif mengenai transisi visual antar material ini untuk menciptakan suasana ruang yang lapang, anggun, namun tetap terasa hangat."
          },
          {
            title: "Accent Wall Panel Kamar Utama",
            desc: "Integrasi visual panel dinding kayu fluted 3D warna Walnut gelap seluas 20 m² dengan sistem pencahayaan LED tersembunyi.",
            prompt: "Rancang detail arsitektural dan skema estetika untuk dinding aksen (headboard wall) kamar tidur utama seluas 20 m² menggunakan panel kayu fluted 3D (misalnya dari brand Taco atau Duma, seperti Panel Series-5) berwarna Walnut gelap yang hangat. Konsep ini bertujuan untuk menghadirkan kedalaman tekstur tiga dimensi dan menyembunyikan instalasi kabel terintegrasi secara elegan. Harap padukan panel kayu ini dengan skema pencahayaan linier LED tersembunyi (warm white 2700K) di celah atas panel untuk menonjolkan bayangan vertikal yang dramatis. Analisis keselarasan kontras antara tekstur kayu yang pekat dan bergaris tegas ini dengan ubin lantai granit bertekstur matte bernuansa abu-abu muda di bawahnya, serta rekomendasikan elemen furnitur pengisi (seperti nakas melayang) yang serasi untuk melengkapi moodboard kamar tidur bergaya luxury minimalist ini."
          },
          {
            title: "Skema Cat Minimalis Hangat",
            desc: "Perpaduan warna cat tembok interior matte beige hangat dan putih bersih seluas 18 m² untuk ruang makan bertema Japandi.",
            prompt: "Buat panduan palet warna dan spesifikasi estetika cat dinding interior untuk area ruang makan berkonsep Japandi Minimalis seluas 18 m² (dimensi 4.5m x 4m, tinggi dinding 3.2m). Rekomendasikan kombinasi cat premium ramah lingkungan dengan tingkat kilap matte/sheen yang rendah untuk meredam refleksi cahaya yang berlebihan, menggabungkan warna dasar beige hangat (warm sand/earthy beige) untuk tiga sisi dinding utama, dan aksen warna putih bersih (pure alabaster white) pada area lis profil plafon, kusen, dan satu sisi dinding partisi untuk menciptakan kontras bayangan yang dinamis. Evaluasi bagaimana kombinasi cat interior ini berinteraksi dengan pencahayaan buatan menggunakan lampu gantung anyaman bambu berwarna kekuningan, serta jelaskan bagaimana transisi warna ini mendukung suasana makan keluarga yang tenang, hangat, dan alami."
          }
        ]
      };
    case 'contractor':
      return {
        title: "Halo Bapak Joko, mari hitung volume material & anggaran.",
        subtitle: "Simulasi fokus pada kalkulator semen nat pendukung, wastage ubin, and efisiensi anggaran lapangan.",
        presets: [
          {
            title: "RAB Ubin & Perekat Semen Nat",
            desc: "Estimasi presisi ubin granit 60x60 cm pola diagonal untuk lantai 40 m² dengan wastage 10% dan kebutuhan semen perekat instan.",
            prompt: "Lakukan kalkulasi teknis terperinci dan susun Rencana Anggaran Biaya (RAB) terperinci untuk pekerjaan lantai ruang serbaguna seluas 40 m² menggunakan ubin granit berukuran 60x60 cm (misalnya Tile Polished 60x60 #11). Berhubung ubin akan dipasang dengan pola diagonal yang memiliki tingkat kerumitan potong tinggi di sepanjang tepi dinding, terapkan margin toleransi kerusakan/sisa pemotongan (wastage margin) sebesar 10% dari luas bersih. Hitung secara akurat: (1) Total dus ubin granit yang harus dipesan (asumsikan 1 dus berisi 4 keping ubin / 1.44 m²), (2) Jumlah kebutuhan sak semen perekat instan heavy-duty (misalnya Semen Instan QHome dari brand MortarOne atau CemPro dengan daya sebar standar per sak 40 kg untuk ketebalan 3 mm), dan (3) Kebutuhan pengisi nat (tile grout) anti-jamur dan fleksibel untuk mencegah retak akibat pemuaian. Sertakan langkah-langkah pencegahan teknis di lapangan guna menghindari risiko ubin kopong (popping) di kemudian hari akibat kelembapan tanah atau pergerakan struktur bangunan."
          },
          {
            title: "Volume Panel Dinding & Perekat",
            desc: "Hitung volume WPC Wood Panel seluas 25 m² dikurangi bukaan pintu, lengkap dengan sealant konstruksi dan paku beton mini.",
            prompt: "Hitung kebutuhan material secara presisi untuk pemasangan panel dinding kayu WPC (Wood Plastic Composite, misalnya Panel Series-5 Taco atau Duma) pada dinding partisi kantor berukuran lebar 8 meter dan tinggi 3.2 meter (luas total bruto 25.6 m²). Perhitungan harus dikurangi dengan celah bukaan pintu geser kaca berukuran 1.8 meter x 2.1 meter. Tentukan: (1) Jumlah lembaran panel WPC yang harus dibeli jika spesifikasi per lembar panel memiliki lebar efektif 15 cm dan panjang 3 meter, dengan menambahkan wastage margin standar contractor sebesar 5% untuk potongan sisa di bagian atas, (2) Jumlah botol perekat sealant konstruksi heavy-duty (max-strength adhesive) yang dibutuhkan jika asumsi 1 botol sealant dapat mengelem area seluas 2 m², dan (3) Kebutuhan paku beton mini/sekrup klip pengunci stainless steel untuk pemasangan rangka bracket besi hollow di belakangnya agar struktur panel terpasang kokoh tanpa risiko melengkung akibat perubahan suhu ruangan."
          },
          {
            title: "Perhitungan Cat Tembok & Sealer",
            desc: "Estimasi volume cat interior dan cat dasar alkali primer untuk dinding acian baru seluas 60 m² (sistem 2 lapis).",
            prompt: "Lakukan estimasi kebutuhan volume cat secara komprehensif untuk menutupi bidang dinding tembok interior baru seluas 60 m² (luas bersih setelah dikurangi area jendela dan pintu). Dinding dalam kondisi acian semen baru yang berpotensi memiliki kadar alkali tinggi. Spesifikasi pengecatan wajib menggunakan sistem multi-lapisan: (1) 1 lapis cat dasar penahan garam alkali (alkali-resisting primer/sealer) untuk mencegah pengkristalan alkali semen dan kelembaban parah, serta (2) 2 lapis cat tembok interior premium (misalnya dari brand Jotaplast atau sejenisnya). Hitung dengan presisi kebutuhan masing-masing cairan dalam satuan liter atau Pail (asumsi 1 Pail = 20 Liter, 1 Galon = 2.5 Liter atau 5 kg), dengan asumsi daya sebar cat dasar adalah 10 m²/liter per lapis dan daya sebar cat akhir adalah 12 m²/liter per lapis. Berikan rekomendasi waktu jeda pengeringan antar lapisan (curing time) yang optimal di iklim tropis lembab untuk memastikan daya rekat maksimal cat tembok tersebut."
          }
        ]
      };
    case 'retailer':
      return {
        title: "Halo Ibu Santi, mari cek ketersediaan stok pergudangan.",
        subtitle: "Simulasi fokus pada kuantitas stok volume besar, substitusi alternatif barang, and logistik B2B.",
        presets: [
          {
            title: "Bulk Order Ubin Granit Aula",
            desc: "Pengadaan ubin granit lantai 80 m² dalam satu single-batch produksi untuk menjamin kesamaan warna (tonality) dengan harga tier B2B.",
            prompt: "Verifikasi ketersediaan stok pergudangan terdistribusi QHomeMart untuk pengadaan grosir (bulk procurement) ubin granit lantai ukuran 60x60 cm (misalnya Tile Polished 60x60 #8 Sandimas atau Tile Matte 50x50 #12 TileCo) guna merenovasi lantai aula serbaguna seluas 80 m². Berhubung area lantai sangat luas, pembeli menegaskan syarat mutlak bahwa seluruh ubin granit harus berasal dari single-batch produksi yang sama (tonality matching) untuk menghindari perbedaan gradasi warna sekecil apa pun di area terbuka. Tolong cari produk dari brand lokal berkualitas tinggi yang memiliki stok terjamin minimal 65 dus di gudang utama. Berikan rincian perhitungan harga khusus untuk tier mitra B2B (volume discount), masa garansi pecah selama proses pengiriman, dan buatkan draf surat penawaran harga resmi (proforma invoice) yang mencakup diskon volume khusus pengadaan institusi."
          },
          {
            title: "Pengadaan Cat Proyek Perumahan",
            desc: "Pengadaan cat interior volume besar untuk 5 unit rumah (total 200 m²) dengan skema harga khusus di atas Rp 50 Juta.",
            prompt: "Lakukan audit ketersediaan stok inventaris dan formulasikan penawaran harga grosir B2B untuk pengadaan cat tembok interior premium dalam jumlah besar guna menutupi dinding interior 5 unit rumah baru di kompleks perumahan kelas menengah (total luas permukaan dinding pengecatan bruto mencapai 200 m²). Tentukan kebutuhan total cat akhir (misalnya cat akhir dari brand Jotaplast atau sejenisnya) dan cat dasar sealer alkali primer dalam satuan Pail besar (20 kg). Pastikan stok kode warna yang sama (tinting code) tersedia melimpah di gudang utama atau gudang cabang Sleman dan Bantul untuk menghindari keterlambatan proyek. Susun skema penawaran harga dengan diskon kemitraan bertingkat (B2B pricing tier) karena nilai transaksi diproyeksikan melebihi Rp 50 juta rupiah, lengkap dengan opsi ketentuan termin pembayaran kredit (term of payment) selama 30 hari (TOP 30) untuk kontraktor terdaftar."
          },
          {
            title: "Konsolidasi Material Kayu & Cat",
            desc: "Konsolidasi pengiriman campuran panel kayu WPC 20 m² dan cat 10 m² dalam satu armada Colt Diesel Double (CDD) terintegrasi.",
            prompt: "Konsolidasikan rantai pengiriman logistik B2B dan rencanakan distribusi kargo terpadu untuk pesanan campuran multi-material proyek komersil: panel kayu WPC (furniture) seluas 20 m² (berat estimasi 250 kg) dan cat tembok interior beserta cat dasar (building material) seluas 10 m² (berat estimasi 80 kg). Tolong verifikasi ketersediaan stok kedua material tersebut secara real-time di Gudang Pusat QHomeMart Yogyakarta. Hitung total berat kargo keseluruhan, tentukan kubikasi volume barang, dan susun rute pengiriman logistik yang paling efisien menggunakan armada truk Colt Diesel Double (CDD) agar kedua material dapat dikirimkan dalam satu perjalanan tanpa risiko kerusakan cat bocor atau panel kayu patah terhimpit. Jadwalkan waktu tiba yang sinkron di lokasi proyek pada pagi hari sebelum jam operasional pekerja bangunan dimulai."
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
            desc: "Delegasi tugas simultan ke staf Ubin, Kayu, dan Cat untuk estimasi komprehensif ruang kantor 100 m².",
            prompt: "Uji koordinasi antar staf secara simultan: hitung ubin granit lantai untuk area 60 m2, panel dinding kayu WPC untuk partisi 25 m2, dan cat interior Jotaplast untuk dinding seluas 40 m2 dalam satu sesi estimasi terpadu."
          },
          {
            title: "Override Diskon Volume B2B",
            desc: "Pengadaan material bernilai tinggi di atas Rp 50 Juta untuk memicu verifikasi approval diskon khusus admin.",
            prompt: "Simulasikan pengadaan material bernilai tinggi (total di atas Rp 50 Juta) untuk menguji modul approval diskon volume B2B khusus admin pada portal evaluasi."
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
      {/* Subtle Decorative Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-100/20 blur-[120px] pointer-events-none" />

      {/* Sleek Enterprise Top Header Bar */}
      <header className="w-full border-b border-hairline bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-light mt-0.5">Digital Office</span>
          </div>

          {/* Header Navigation Menus (Swiss Editorial Segment) */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setLandingTab('simulation')}
              className={`flex items-baseline text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer focus:outline-none py-1 relative text-accent`}
            >
              <span className="text-[8px] font-mono mr-1 text-accent/80">01 //</span>
              Simulasi Chat
              {landingTab === 'simulation' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent animate-fade-in" />
              )}
            </button>
            <button
              onClick={() => setLandingTab('catalog')}
              className={`flex items-baseline text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer focus:outline-none py-1 relative text-muted hover:text-ink`}
            >
              <span className="text-[8px] font-mono mr-1 text-accent/80">02 //</span>
              Katalog Material
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area — Editorial Layout aligned with max-w-[1400px] */}
      <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-12 relative z-10 justify-start">
        <div className="flex-1 flex flex-col justify-start animate-scale-in max-w-3xl w-full">

          {/* Eyebrow + Headline */}
          <div className="mb-10">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-accent mb-4">
              QHomeMart B2B Enterprise Workspace
            </p>
            <h1 className="text-[42px] font-light text-ink tracking-tight leading-[1.05] mb-5">
              Portal Estimasi &<br />
              <span className="font-extrabold text-ink">Procurement</span>{' '}
              <span className="text-accent font-light">B2B</span>
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
                  className="w-full flex items-start gap-6 py-5 text-left group outline-none hover:bg-surface-soft/40 transition-colors duration-200 cursor-pointer px-4 -mx-4 rounded-full"
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
                      {persona.role === 'admin' ? 'Admin' : 'B2B'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Footer pinned to the absolute bottom of the viewport */}
        <footer className="text-[11px] text-muted-light mt-12 pt-6 border-t border-hairline/60 w-full">
          QHomeMart Multi-Agent System &copy; 2026 · Digital Office B2B Platform · Dev Mode
        </footer>
      </div>
    </div>
  );
}
