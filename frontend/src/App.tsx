import { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  UserCog,
  Brain,
  Maximize2,
  Package,
  Palette,
  HardHat,
  Store,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import AdminPortal from './components/AdminPortal';
import OrderPortal from './components/OrderPortal';
import MaterialCatalog from './components/MaterialCatalog';


// Komponen Helper untuk membungkus teks panjang dengan tombol Selengkapnya / Lebih Sedikit
function ExpandableText({ text, limit = 250 }: { text: string, limit?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= limit) {
    return <div className="whitespace-pre-line">{text}</div>;
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className={`whitespace-pre-line transition-all duration-500 ease-in-out overflow-hidden pb-1 ${!isExpanded ? 'max-h-[128px]' : 'max-h-[2000px]'}`}>
          {text}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface-soft via-surface-soft/50 to-transparent pointer-events-none transition-opacity duration-500 ${!isExpanded ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {!isExpanded ? (
        <div className="absolute bottom-1 right-0 bg-gradient-to-l from-surface-soft via-surface-soft via-surface-soft/90 to-transparent pl-14 pr-0.5 py-0.5 flex items-center transition-all duration-300">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-[12.5px] font-bold text-muted hover:text-accent transition-colors focus:outline-none bg-surface-soft px-1"
          >
            Selengkapnya
          </button>
        </div>
      ) : (
        <div className="mt-2 text-right transition-all duration-300">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-[12.5px] font-bold text-muted hover:text-accent transition-colors focus:outline-none"
          >
            Tampilkan Lebih Sedikit
          </button>
        </div>
      )}
    </div>
  );
}


const PERSONAS = [
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activePortal, setActivePortal] = useState<'chat' | 'admin' | 'order' | 'catalog'>('chat');
  const [landingTab, setLandingTab] = useState<'simulation' | 'catalog'>('simulation');
  const [brief, setBrief] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true); // Default open untuk nuansa "Digital Office Canvas" yang premium
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentAgentOnDuty, setCurrentAgentOnDuty] = useState<string | null>(null); // Konsep petugas aktif saat ini
  const [isModalOpen, setIsModalOpen] = useState(false); // State untuk pengeditan prompt skala besar dalam popup modal

  // Shopping cart: selalu hidup, independen dari agent
  const [cartItems, setCartItems] = useState<any[]>([]);
  const addToCart = (product: any) => {
    setCartItems(prev => [...prev, product]);
  };

  const removeFromCart = (idx: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Dapatkan salam dan petunjuk dynamic berdasarkan persona aktif
  const getPersonaGreeting = () => {
    switch (currentUser?.role) {
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredSession, setHoveredSession] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });



  // Auto-expand textarea height secara dinamis saat konten (brief) berubah, dibatasi max-height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Batasi tinggi maksimum demi estetika optimal
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [brief]);

  // Membaca URL Query Parameters untuk transfer state di tab baru (B2B Procurement Cart)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const sessionIdParam = params.get('session_id');
    const userRoleParam = params.get('user_role');

    if (portalParam === 'order' && sessionIdParam && userRoleParam) {
      const matchedPersona = PERSONAS.find(p => p.role === userRoleParam);
      if (matchedPersona) {
        setCurrentUser(matchedPersona);
        setCurrentSessionId(sessionIdParam);
        setActivePortal('order');
        
        // Ambil riwayat pesan untuk mengekstrak daftar material
        fetch(`http://localhost:8000/api/projects/sessions/${sessionIdParam}/messages`)
          .then(res => res.json())
          .then(data => {
            setMessages(data);
          })
          .catch(err => console.error("Error loading cart session messages:", err));
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper untuk mendeteksi dan memisahkan blok <think>
  const parseThinking = (text: string) => {
    if (!text) return { thinking: null, content: "" };
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    const matches = Array.from(text.matchAll(thinkRegex));
    if (matches.length > 0) {
      const thinking = matches.map(match => match[1].trim()).join("\n\n---\n\n");
      const cleanContent = text.replace(thinkRegex, '').trim();
      return { thinking, content: cleanContent };
    }
    return { thinking: null, content: text };
  };

  // Helper untuk merender markdown sederhana seperti teks tebal (**), miring (*), dll
  const renderMarkdown = (text: string) => {
    if (!text) return "";
    let html = text;
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-accent font-medium bg-accent-soft/40 px-1.5 py-0.5 rounded">$1</em>');
    return html;
  };

  // formatQty is unused and removed to prevent TS errors.


  // Sub-komponen Akordeon Berpikir Agen (Premium)
  const ThinkingBlock = ({ text }: { text: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!text) return null;

    return (
      <div className="mb-4 border border-hairline rounded-xl overflow-hidden bg-surface-soft shadow-sm animate-scale-in">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left text-muted hover:text-ink hover:bg-white/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-[12px] font-semibold tracking-wider uppercase">
            <Brain className="w-3.5 h-3.5 text-muted-light animate-pulse" />
            <span>Proses Berpikir Agen</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-light transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-hairline/60 bg-white/40 max-h-[220px] overflow-y-auto scrollbar-warm">
            <p className="text-[12.5px] text-muted-light leading-relaxed whitespace-pre-line italic">
              {text}
            </p>
          </div>
        )}
      </div>
    );
  };


  // Sub-komponen Akordeon Riwayat Aktivitas & Pemikiran Agen (Premium)
  const CollapsibleAgentLogs = ({ logs }: { logs: any[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!logs || logs.length === 0) return null;

    return (
      <div className="mb-4 text-[13px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-muted-light hover:text-ink font-medium transition-colors cursor-pointer select-none"
        >
          <span className="text-[13px]">Thinking completed</span>
          <ChevronRight className={`w-3.5 h-3.5 text-muted-light/60 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-2.5 pl-4 border-l border-hairline/80 py-1 space-y-4 animate-scale-in">
            {logs.map((log: any, idx: number) => {
              const agentTitle = log.title || 'Sistem';
              const logMsg = log.message || '';
              const parsed = parseThinking(logMsg);
              const isWorking = log.event === 'working';

              return (
                <div key={idx} className="text-[12px] leading-relaxed">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`font-semibold uppercase tracking-wider text-[10px] ${isWorking ? 'text-accent' : 'text-ink-2'}`}>
                      {agentTitle}
                    </span>
                    {isWorking ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    ) : (
                      <span className="text-[9px] text-muted-light">selesai</span>
                    )}
                  </div>
                  <div className="text-muted">
                    {parsed.thinking && (
                      <div className="my-1.5 px-3 py-2 bg-surface-soft/80 border border-hairline/60 rounded-xl text-[11px] italic text-muted-light whitespace-pre-line leading-relaxed shadow-sm">
                        {parsed.thinking}
                      </div>
                    )}
                    <p className="text-[11.5px] font-normal leading-relaxed text-muted-light">
                      {parsed.content}
                    </p>
                    {log.hired && log.hired.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-hairline/60 space-y-1">
                        <p className="text-[9px] text-muted-light uppercase tracking-wider mb-1 font-medium">Ditugaskan kepada</p>
                        {log.hired.map((agent: string) => (
                          <div key={agent} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-muted-light/60 flex-shrink-0" />
                            <span className="text-[10px] font-semibold text-ink-2 uppercase tracking-wide">{agent}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAgents]);

  const fetchHistory = async () => {
    try {
      const url = currentUser
        ? `http://localhost:8000/api/projects/sessions?user_id=${currentUser.role}`
        : "http://localhost:8000/api/projects/sessions";
      const res = await fetch(url);
      const data = await res.json();
      setChatHistory(data);
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  useEffect(() => {
    try {
      const channel = new BroadcastChannel('qhome_payment_channel');
      channel.onmessage = async (event) => {
        if (event.data && event.data.event === 'payment_confirmed' && event.data.sessionId) {
          const sid = event.data.sessionId;
          if (sid === currentSessionId) {
            try {
              const res = await fetch(`http://localhost:8000/api/projects/sessions/${sid}/messages`);
              const data = await res.json();
              setMessages(data);
              
              // Smooth scroll to bottom to show the agent's new thank-you response
              setTimeout(() => {
                scrollToBottom();
              }, 300);
            } catch (err) {
              console.error('Failed to reload messages on broadcasted payment confirmation:', err);
            }
          }
        }
      };
      return () => {
        channel.close();
      };
    } catch (err) {
      console.error('Failed to establish BroadcastChannel:', err);
    }
  }, [currentSessionId]);

  const handleSelectSession = async (session: any) => {
    setCurrentSessionId(session.id);
    setActivePortal('chat');
    setIsProcessing(false);
    setCurrentAgentOnDuty(null);
    setActiveAgents([]);


    try {
      const res = await fetch(`http://localhost:8000/api/projects/sessions/${session.id}/messages`);
      const data = await res.json();
      setMessages(data);

      const hasSystemMessage = data.some((m: any) => m.role === 'system');
      setIsRightSidebarOpen(hasSystemMessage);
    } catch (e) {
      console.error("Error loading session:", e);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setBrief("");
    setCurrentSessionId(null);
    setCurrentAgentOnDuty(null);
    setActivePortal('chat');
  };

  const handleHire = async () => {
    if (!brief.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: brief }]);
    setBrief("");
    setIsProcessing(true);
    setCurrentAgentOnDuty("Chief Supervisor"); // Dimulai dari koordinasi Chief Supervisor
    setActiveAgents([]);

    try {
      const res = await fetch("http://localhost:8000/api/projects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          session_id: currentSessionId,
          user_id: currentUser?.role || "default-user"
        })
      });
      const dataInfo = await res.json();
      setCurrentSessionId(dataInfo.session_id);
      fetchHistory(); // Segarkan riwayat di sidebar kiri

      const sse = new EventSource(`http://localhost:8000/api/projects/${dataInfo.session_id}/stream`);

      setMessages(prev => {
        const newIdx = prev.length;
        setIsRightSidebarOpen(true);
        return [...prev, { role: "system", logs: [], status: 'processing', id: newIdx }];
      });

      sse.onmessage = (e) => {
        const data = JSON.parse(e.data);

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === "system") {
            const isDuplicate = lastMsg.logs.find((l: any) => l.message === data.message);
            if (!isDuplicate) {
              lastMsg.logs = [...lastMsg.logs, data];
            }
          }
          return newMessages;
        });

        // Rekam agen spesialis yang saat ini aktif bertugas
        if (data.event === "working" && data.title) {
          setCurrentAgentOnDuty(data.title);
        } else if (data.event === "routing") {
          setCurrentAgentOnDuty("Chief Supervisor");
        } else if (data.event === "report" && data.title) {
          setCurrentAgentOnDuty(data.title);
        }

        if (data.event === "working" && data.agent) {
          setActiveAgents(prev => Array.from(new Set([...prev, data.agent])));
        }

        if (data.event === "completed") {
          sse.close();
          setIsProcessing(false);
          setCurrentAgentOnDuty(null); // Selesai bertugas
          setActiveAgents([]);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === "system") {
              lastMsg.status = 'completed';
              lastMsg.products = data.products || [];
              lastMsg.narrative = data.narrative || "";
            }
            return newMessages;
          });
        }
      };
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  if (!currentUser) {
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
                className={`flex items-baseline text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer focus:outline-none py-1 relative ${(landingTab as string) === 'simulation'
                    ? 'text-accent'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                <span className="text-[8px] font-mono mr-1 text-accent/80">01 //</span>
                Simulasi Chat
                {(landingTab as string) === 'simulation' && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent animate-fade-in" />
                )}
              </button>
              <button
                onClick={() => setLandingTab('catalog')}
                className={`flex items-baseline text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer focus:outline-none py-1 relative ${(landingTab as string) === 'catalog'
                    ? 'text-accent'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                <span className="text-[8px] font-mono mr-1 text-accent/80">02 //</span>
                Katalog Material
                {(landingTab as string) === 'catalog' && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent animate-fade-in" />
                )}
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

  if (currentUser && activePortal === 'catalog') {
    return (
      <MaterialCatalog
        onBack={() => setActivePortal('chat')}
        onSelectProduct={(p) => { addToCart(p); setActivePortal('order'); }}
      />
    );
  }

  if (currentUser && activePortal === 'admin') {
    const systemMsg = messages.filter(m => m.role === 'system').reverse()[0];
    const products = systemMsg?.products || [];
    const userBrief = messages.filter(m => m.role === 'user')[0]?.content || "";

    return (
      <AdminPortal
        currentUser={currentUser}
        currentSessionId={currentSessionId}
        products={products}
        brief={userBrief}
        onBack={() => {
          if (currentSessionId) {
            setActivePortal('chat');
          } else {
            setCurrentUser(null);
          }
        }}
        onUpdateProducts={(newProducts) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastSysIdx = updated.map(m => m.role).lastIndexOf('system');
            if (lastSysIdx !== -1) {
              updated[lastSysIdx] = {
                ...updated[lastSysIdx],
                products: newProducts
              };
            }
            return updated;
          });
        }}
      />
    );
  }

  if (currentUser && activePortal === 'order') {
    const systemMsg = messages.filter(m => m.role === 'system').reverse()[0];
    const products = systemMsg?.products || [];
    const userBrief = messages.filter(m => m.role === 'user')[0]?.content || "";

    return (
      <OrderPortal
        currentUser={currentUser}
        currentSessionId={currentSessionId}
        products={cartItems.length > 0 ? cartItems.map((p: any) => ({
          sku: p.sku,
          name: p.name,
          price: p.base_price || p.price || 0,
          qty: 1,
          total: (p.base_price || p.price || 0) * 1,
          category: p.category
        })) : products}
        brief={userBrief}
        onBack={() => setActivePortal('chat')}
        onPlaceOrder={async (_orderDetails) => {
          // Setelah konfirmasi pembayaran, pindah ke chat dan refresh pesan
          // agar balasan agen langsung terlihat tanpa reload halaman
          setActivePortal('chat');
          if (currentSessionId) {
            try {
              const res = await fetch(`http://localhost:8000/api/projects/sessions/${currentSessionId}/messages`);
              const data = await res.json();
              setMessages(data);
            } catch (err) {
              console.error('Failed to reload messages after payment:', err);
            }
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-canvas font-sans overflow-hidden">

      {/* Left Sidebar — Premium B2B Studio List */}
      <div className={`bg-canvas border-r border-hairline flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden border-none'}`}>

        {/* Header Sidebar — Ultra Minimalis (Harmonis dengan Sidebar Kanan) */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between min-w-[260px]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold text-muted-light tracking-[0.18em] uppercase">
              CHAT
            </span>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setActivePortal('catalog')}
              className="p-1.5 text-muted-light hover:text-accent transition-colors hover:bg-neutral-50 rounded-md"
              title="Lihat Katalog Master"
            >
              <Package className="w-4.5 h-4.5 text-accent animate-pulse" />
            </button>
            <button
              onClick={handleNewChat}
              className="p-1.5 text-muted-light hover:text-ink transition-colors hover:bg-neutral-50 rounded-md"
              title="Konsultasi Baru"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-muted-light hover:text-ink transition-colors hover:bg-neutral-50 rounded-md"
              title="Tutup Sidebar"
            >
              <PanelLeftClose className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
        <div className="mx-6 h-px bg-hairline" />

        {/* Cari Estimasi Fungsional */}
        <div className="px-6 mt-4 min-w-[260px]">
          <div className="relative flex items-center bg-white/50 border border-hairline rounded-xl px-3 py-1.5 shadow-sm focus-within:border-accent/40 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-muted-light mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari simulasi RAB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[12.5px] text-ink placeholder:text-muted-light focus:ring-0 p-0"
            />
          </div>
        </div>

        {/* List RAB */}
        <div className="flex-1 overflow-y-auto scrollbar-warm pb-4 min-w-[260px] mt-6">
          <div className="px-6">
            <div className="px-2 mb-2.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-light uppercase tracking-widest">Daftar Simulasi RAB</span>
            </div>

            <div className="space-y-1">
              {(() => {
                const filteredHistory = chatHistory.filter(session => {
                  const title = (session.title || "").toLowerCase();
                  const brief = (session.brief || "").toLowerCase();
                  const search = searchTerm.toLowerCase();
                  return title.includes(search) || brief.includes(search);
                });

                if (filteredHistory.length === 0) {
                  return (
                    <p className="text-[12.5px] text-muted-light px-3 py-2 italic">Tidak ada riwayat.</p>
                  );
                }

                return filteredHistory.map((session, idx) => {
                  const isSelected = currentSessionId === session.id;

                  // Heuristik kategori selaras dengan taksonomi resmi baru (ditampilkan dalam Bahasa Indonesia)
                  const textForCategory = (session.brief || session.title || "").toLowerCase();
                  let category = "Bahan Bangunan"; // default
                  if (textForCategory.includes("wpc") || textForCategory.includes("fluted") || textForCategory.includes("kisi") || textForCategory.includes("kayu") || textForCategory.includes("panel")) {
                    category = "Furnitur";
                  } else if (textForCategory.includes("granit") || textForCategory.includes("tile") || textForCategory.includes("lantai") || textForCategory.includes("ubin") || textForCategory.includes("keramik")) {
                    category = "Lantai";
                  } else if (textForCategory.includes("cat") || textForCategory.includes("paint") || textForCategory.includes("pengecatan") || textForCategory.includes("tembok") || textForCategory.includes("primer")) {
                    category = "Bahan Bangunan";
                  } else if (textForCategory.includes("stone") || textForCategory.includes("batu") || textForCategory.includes("andesit") || textForCategory.includes("candi")) {
                    category = "Bahan Bangunan";
                  } else if (textForCategory.includes("appliance") || textForCategory.includes("kompor") || textForCategory.includes("kulkas") || textForCategory.includes("mesin cuci") || textForCategory.includes("peralatan rumah")) {
                    category = "Peralatan Rumah Tangga";
                  } else if (textForCategory.includes("sanitary") || textForCategory.includes("toilet") || textForCategory.includes("wc") || textForCategory.includes("wastafel") || textForCategory.includes("pipa") || textForCategory.includes("plumbing") ) {
                    category = "Sanitasi & Perpipaan";
                  } else if (textForCategory.includes("electrical") || textForCategory.includes("lampu") || textForCategory.includes("lighting") || textForCategory.includes("listrik") || textForCategory.includes("saklar") || textForCategory.includes("stopkontak")) {
                    category = "Kelistrikan";
                  } else if (textForCategory.includes("tool") || textForCategory.includes("gerinda") || textForCategory.includes("bor") || textForCategory.includes("mesin") || textForCategory.includes("peralatan") ) {
                    category = "Peralatan & Mesin";
                  }

                  // Gunakan title dinamis spesifik dari DB, bersihkan dari bocoran tag think
                  let titleDisplay = session.title || "";
                  titleDisplay = titleDisplay.replace(/<think>[\s\S]*?<\/think>/gi, "");
                  titleDisplay = titleDisplay.replace(/<think>[\s\S]*/gi, "").trim();

                  // Fallback jika judul kosong setelah dibersihkan
                  if (!titleDisplay) {
                    const briefText = session.brief || "";
                    const cleanedBrief = briefText
                      .replace(/<think>[\s\S]*?<\/think>/gi, "")
                      .replace(/<think>[\s\S]*/gi, "")
                      .trim();
                    titleDisplay = cleanedBrief.substring(0, 30) + (cleanedBrief.length > 30 ? "..." : "");
                  }
                  if (!titleDisplay) {
                    titleDisplay = "Estimasi Baru";
                  }

                  return (
                    <div key={session.id || idx} className="py-0.5">
                      <button
                        onClick={() => handleSelectSession(session)}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredSession(session);
                          setTooltipPos({
                            x: rect.right + 12,
                            y: rect.top
                          });
                        }}
                        onMouseLeave={() => setHoveredSession(null)}
                        className={`w-full flex flex-col justify-center px-3.5 py-2.5 rounded-xl transition-all text-left border-none outline-none ${isSelected
                            ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-hairline/80'
                            : 'bg-transparent hover:bg-white/40'
                          }`}
                      >
                        {/* Kategori Proyek Utama (Biru / Besar) */}
                        <span className={`block text-[12px] font-bold uppercase tracking-wider mb-1 transition-colors ${isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
                          }`}>
                          {category}
                        </span>

                        {/* Judul Proyek / Riwayat (Abu-abu Pekat / Kecil) */}
                        <span className={`block text-[11.5px] font-medium leading-normal truncate w-full transition-colors ${isSelected ? 'text-muted' : 'text-muted-light group-hover:text-muted'
                          }`}>
                          {titleDisplay}
                        </span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 bg-canvas">

        {/* Header */}
        <header className="px-6 py-4 bg-canvas/90 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-ink hover:border-accent group mr-2"
                title="Buka Riwayat Estimasi"
              >
                <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-110 text-accent" />
              </button>
            )}
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-white/80 border border-hairline px-3.5 py-1.5 rounded-full shadow-sm animate-scale-in">
                <span className="text-[14.5px] select-none">{currentUser.avatar}</span>
                <div className="flex items-center gap-2 text-left">
                  <span className="text-[11.5px] font-bold text-ink leading-none">{currentUser.name}</span>
                  <span className="text-[9px] font-light text-muted-light">/</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-light font-bold leading-none mt-0.5">{currentUser.roleDisplay}</span>
                </div>
                <div className="w-px h-4 bg-hairline mx-1.5" />
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    handleNewChat();
                  }}
                  className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors focus:outline-none"
                  title="Keluar / Ganti Akun"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Tombol Keranjang Belanja B2B - selalu tampil di header */}
            <button
              onClick={() => setActivePortal('order')}
              className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-accent hover:border-accent group relative cursor-pointer"
              title="Buka Keranjang Pengadaan B2B"
            >
              <ShoppingBag className="w-4.5 h-4.5 text-accent transition-transform group-hover:scale-110" />
              {(() => {
                const latestSys = messages.filter(m => m.role === 'system').reverse()[0];
                const sysCount = latestSys?.products?.length || 0;
                const displayCount = cartItems.length > 0 ? cartItems.length : sysCount;
                return displayCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm font-sans">{displayCount}</span>
                ) : null;
              })()}
            </button>

            {/* Tombol Toggle Sidebar Kanan (Operator Log MAS) */}
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm ${
                isRightSidebarOpen 
                  ? 'bg-accent/10 border-accent/40 text-accent' 
                  : 'bg-white border-hairline text-muted hover:text-ink hover:border-accent'
              } group cursor-pointer`}
              title={isRightSidebarOpen ? "Tutup Log Proses MAS" : "Buka Log Proses MAS"}
            >
              <UserCog className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </header>

        {/* Chat History */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-warm">
          <div className="p-6 md:p-10 space-y-10 w-full max-w-4xl mx-auto pb-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-float-up min-h-[68vh] px-4">

                {/* Brand Context - Sangat Tenang & Tipis */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                    KONSOLIDASI MATERIAL & REKAYASA ESTIMASI B2B
                  </span>
                  <div className="w-6 h-px bg-hairline mx-auto mt-2.5" />
                </div>

                {/* Greeting & Deskripsi - Menghormati User dengan Nada Konsultan Profesional */}
                <div className="space-y-4 max-w-2xl">
                  <h2 className="text-[28px] font-light text-ink leading-tight tracking-wide">
                    {getPersonaGreeting().title}
                  </h2>
                  <p className="text-[14px] text-muted leading-relaxed max-w-xl mx-auto font-normal">
                    {getPersonaGreeting().subtitle}
                  </p>
                </div>

                {/* Preset Proyek B2B Minimalis - Bersih Tanpa Ikon */}
                <div className="w-full max-w-3xl space-y-3.5 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-light text-center mb-5">
                    CONTOH FORMULASI ESTIMASI MATERIAL
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getPersonaGreeting().presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setBrief(preset.prompt)}
                        className="bg-white border border-hairline hover:border-accent/40 rounded-xl p-5 text-left transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-[135px] group"
                      >
                        <span className="font-semibold text-[13px] text-ink group-hover:text-accent transition-colors">
                          {preset.title}
                        </span>
                        <span className="text-[11.5px] text-muted-light leading-relaxed font-normal mt-1.5">
                          {preset.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-float-up w-full`}>

                  {msg.role === 'user' && (
                    <div className="bg-surface-soft border border-hairline text-ink px-6 py-4 rounded-2xl max-w-2xl text-[15px] leading-relaxed w-full sm:w-auto">
                      <ExpandableText text={msg.content} />
                    </div>
                  )}

                  {msg.role === 'system' && (
                    <div className="w-full mt-6">
                      <div className="max-w-3xl text-[15.5px] text-ink-2 leading-[1.7]">

                        {msg.status !== 'completed' && (
                          <div className="mb-8 space-y-3 animate-scale-in">
                            {/* Baris Status & Agent Aktif (Digabung - Space-Between / Justify-Between) */}
                            <div className="flex items-center justify-between w-full flex-wrap gap-4 border-b border-hairline/40 pb-3.5 mb-3">
                              {/* Sisi Kiri: Spinner & Status Text */}
                              <div className="flex items-center gap-3">
                                {/* Spinner mini */}
                                <div className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center">
                                  <Loader2 className="w-3 h-3 animate-spin text-accent" />
                                </div>

                                {/* Title Kapital bergaya Span */}
                                <span className="text-[11.5px] uppercase tracking-[0.15em] text-muted font-normal">
                                  STAF KANTOR SEDANG BEROPERASI
                                </span>
                              </div>

                              {/* Sisi Kanan: Badge Staf Aktif */}
                              <div className="flex items-center gap-2 bg-accent-soft/40 border border-accent-border/20 px-3 py-1 rounded-full shadow-sm flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="text-[10.5px] font-semibold text-accent uppercase tracking-wider">
                                  {currentAgentOnDuty || 'Chief Supervisor'}
                                </span>
                              </div>
                            </div>

                            {/* Deskripsi Detail Operasi (Tanpa Card, Mengalir Bersih) */}
                            <p className="text-[14px] text-muted-light leading-relaxed pl-8">
                              {currentAgentOnDuty ? (
                                <>Staf <strong className="font-medium text-ink-2">{currentAgentOnDuty}</strong> sedang memproses perhitungan kebutuhan material, mencocokkan stok pergudangan QHomeMart, serta melakukan kalkulasi volume proyek...</>
                              ) : (
                                <>Manajer <strong className="font-medium text-ink-2">Chief Supervisor</strong> sedang mempersiapkan pembagian tugas estimasi material dan mengoordinasikan staf spesialis...</>
                              )}
                            </p>
                          </div>
                        )}



                        {msg.status === 'completed' && (
                          <div className="space-y-8 pt-2 animate-scale-in">
                            <CollapsibleAgentLogs logs={msg.logs} />
                            {msg.narrative ? (() => {
                              const parsed = parseThinking(String(msg.narrative));
                              return (
                                <div className="space-y-5 prose prose-stone max-w-none">
                                  {parsed.thinking && <ThinkingBlock text={parsed.thinking} />}
                                  {parsed.content.split('\n\n').map((para: string, idx: number) => {
                                    if (para.trim().startsWith('-')) {
                                      const listItems = para.split('\n').filter(l => l.trim().startsWith('-'));
                                      return (
                                        <ul key={idx} className="list-none space-y-2 pl-0">
                                          {listItems.map((li, liIdx) => (
                                            <li key={liIdx} className="flex items-start gap-3">
                                              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0"></span>
                                              <span dangerouslySetInnerHTML={{ __html: renderMarkdown(li.replace(/^- /, '')) }} />
                                            </li>
                                          ))}
                                        </ul>
                                      );
                                    }
                                    return <p key={idx} dangerouslySetInnerHTML={{ __html: renderMarkdown(para) }} />;
                                  })}
                                </div>
                              );
                            })() : (
                              <p className="text-muted italic">Menyiapkan kurasi material...</p>
                            )}



                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {/* Spacer fisik agar konten terakhir melayang sempurna di atas input bar absolute */}
            <div className="h-[140px] w-full shrink-0" />
          </div>
        </main>

        {/* B2B Prompt Console — Ultra-Minimalist Bulat Sempurna & Centering Padding Flawless */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-canvas via-canvas/95 to-transparent pt-12 pb-7 px-6 z-10">
          <div className="max-w-3xl mx-auto">
            {/* Wrapper Flex untuk Centering Padding & Margin Presisi Tinggi */}
            <div className="relative flex items-end bg-white border border-hairline rounded-[26px] pl-6 pr-2.5 py-2.5 shadow-sm focus-within:border-accent/50 focus-within:shadow-md transition-all gap-3">
              {/* Textarea Input Utama — Tanpa Border, Padding Tipis Presisi */}
              <textarea
                ref={textareaRef}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Sampaikan spesifikasi area, dimensi ruang, atau kebutuhan material proyek Anda..."
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleHire();
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-[14.5px] leading-relaxed text-ink placeholder:text-muted-light max-h-[120px] scrollbar-none py-1.5 min-h-[22px] disabled:opacity-60"
                rows={1}
              />
              {/* Tombol Expand/Maximize Premium */}
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isProcessing}
                className="w-8.5 h-8.5 rounded-full bg-canvas border border-hairline hover:bg-hairline text-muted hover:text-ink flex items-center justify-center transition-all disabled:opacity-30 shadow-sm flex-shrink-0"
                title="Perluas Konsol Prompt"
                type="button"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {/* Tombol Pesawat Terbang Melayang Selaras Tinggi */}
              <button
                onClick={handleHire}
                disabled={!brief.trim() || isProcessing}
                className="w-8.5 h-8.5 rounded-full bg-ink hover:bg-accent text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:bg-hairline disabled:cursor-not-allowed shadow-sm flex-shrink-0"
                title="Kirim Permintaan"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar — Blueprint Timeline */}
      <div className={`bg-canvas border-l border-hairline flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out ${isRightSidebarOpen ? 'w-[360px]' : 'w-0 overflow-hidden border-none'}`}>

        {/* Sidebar Header — Ultra Minimalis */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between min-w-[360px]">
          <div className="flex items-center gap-3">
            <UserCog className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-semibold text-muted-light tracking-[0.18em] uppercase">
              Aktivitas Staf Kantor
            </span>
          </div>
          <button onClick={() => setIsRightSidebarOpen(false)} className="p-1 text-muted-light hover:text-ink transition-colors cursor-pointer">
            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </button>
        </div>
        <div className="mx-6 h-px bg-hairline" />

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto min-w-[360px] scrollbar-warm">
          {messages.length === 0 || !messages.find(m => m.role === 'system') ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-24 opacity-40">
              <Brain className="w-8 h-8 text-muted-light animate-pulse mb-3" />
              <p className="text-[12px] text-muted leading-relaxed">Staf kantor sedang siaga. Masukkan brief di sebelah kiri untuk melihat log aktivitas kerja.</p>
            </div>
          ) : (
            <div className="px-6 py-5">
              {(() => {
                const systemLogs = messages.filter(m => m.role === 'system').reverse()[0]?.logs || [];
                return systemLogs.map((log: any, idx: number) => {
                  const isSpinnerActive = isProcessing && log.event === 'working' && idx === systemLogs.length - 1;
                  const agentTitle = log.title || 'Sistem';
                  const isLast = idx === systemLogs.length - 1;

                  return (
                    <div key={idx} className="flex gap-4 animate-scale-in">
                      {/* Garis Vertikal Timeline + Dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 transition-all ${isSpinnerActive ? 'bg-accent ring-4 ring-accent/15 animate-pulse' : 'bg-hairline border border-muted-light/40'
                          }`} />
                        {!isLast && <div className="w-px flex-1 bg-hairline mt-1.5 mb-0" />}
                      </div>

                      {/* Konten Timeline Entry */}
                      <div className={`pb-7 flex-1 min-w-0 ${isLast ? '' : ''}`}>
                        {/* Header: Nama Agen + Status */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className={`text-[11.5px] font-semibold uppercase tracking-wider ${isSpinnerActive ? 'text-accent' : 'text-ink'
                            }`}>
                            {agentTitle}
                          </span>
                          {isSpinnerActive ? (
                            <span className="flex items-center gap-1 text-accent flex-shrink-0 pt-1.5 animate-pulse" title="Aktif">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-light flex-shrink-0 pt-0.5">selesai</span>
                          )}
                        </div>

                        {/* Body: Isi Proses */}
                        <div className="text-[12.5px] text-muted leading-relaxed">
                          {(() => {
                            const parsed = parseThinking(log.message || "");
                            return (
                              <>
                                {parsed.thinking && <ThinkingBlock text={parsed.thinking} />}
                                {log.hired && log.hired.length > 0 ? (
                                  <div className="mt-2 space-y-1.5">
                                    <p className="text-[11px] text-muted-light uppercase tracking-wider mb-2">Ditugaskan kepada</p>
                                    {log.hired.map((agent: string) => (
                                      <div key={agent} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-hairline flex-shrink-0" />
                                        <span className="text-[12px] font-medium text-ink-2 uppercase tracking-wide">{agent}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed.content) }} />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
      {/* Floating persistent Cart button removed — header icon is permanent */}

      {/* Floating Hover Card (B2B Tooltip) */}
      {hoveredSession && (
        <div
          className="fixed w-[280px] bg-white border border-hairline rounded-[18px] shadow-2xl p-4.5 z-[9999] animate-scale-in flex flex-col pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`
          }}
        >
          {(() => {
              // Heuristik kategori selaras dengan taksonomi resmi baru (ditampilkan dalam Bahasa Indonesia)
              const textForCategory = (hoveredSession.brief || hoveredSession.title || "").toLowerCase();
              let category = "Bahan Bangunan";
              if (textForCategory.includes("wpc") || textForCategory.includes("fluted") || textForCategory.includes("kisi") || textForCategory.includes("kayu") || textForCategory.includes("panel")) {
                category = "Furnitur";
              } else if (textForCategory.includes("granit") || textForCategory.includes("tile") || textForCategory.includes("lantai") || textForCategory.includes("ubin") || textForCategory.includes("keramik")) {
                category = "Lantai";
              } else if (textForCategory.includes("cat") || textForCategory.includes("paint") || textForCategory.includes("pengecatan") || textForCategory.includes("tembok") || textForCategory.includes("primer")) {
                category = "Bahan Bangunan";
              } else if (textForCategory.includes("stone") || textForCategory.includes("batu") || textForCategory.includes("andesit") || textForCategory.includes("candi")) {
                category = "Bahan Bangunan";
              } else if (textForCategory.includes("appliance") || textForCategory.includes("kompor") || textForCategory.includes("kulkas") || textForCategory.includes("mesin cuci") || textForCategory.includes("peralatan rumah")) {
                category = "Peralatan Rumah Tangga";
              } else if (textForCategory.includes("sanitary") || textForCategory.includes("toilet") || textForCategory.includes("wc") || textForCategory.includes("wastafel") || textForCategory.includes("pipa") || textForCategory.includes("plumbing")) {
                category = "Sanitasi & Perpipaan";
              } else if (textForCategory.includes("electrical") || textForCategory.includes("lampu") || textForCategory.includes("lighting") || textForCategory.includes("listrik") || textForCategory.includes("saklar") || textForCategory.includes("stopkontak")) {
                category = "Kelistrikan";
              } else if (textForCategory.includes("tool") || textForCategory.includes("gerinda") || textForCategory.includes("bor") || textForCategory.includes("mesin") || textForCategory.includes("peralatan")) {
                category = "Peralatan & Mesin";
              }

            // Bersihkan title dari tag think
            let titleDisplay = hoveredSession.title || "";
            titleDisplay = titleDisplay.replace(/<think>[\s\S]*?<\/think>/gi, "");
            titleDisplay = titleDisplay.replace(/<think>[\s\S]*/gi, "").trim();

            if (!titleDisplay) {
              const briefText = hoveredSession.brief || "";
              const cleanedBrief = briefText
                .replace(/<think>[\s\S]*?<\/think>/gi, "")
                .replace(/<think>[\s\S]*/gi, "")
                .trim();
              titleDisplay = cleanedBrief.substring(0, 30) + (cleanedBrief.length > 30 ? "..." : "");
            }
            if (!titleDisplay) {
              titleDisplay = "Estimasi Baru";
            }

            // Bersihkan deskripsi brief
            let descDisplay = hoveredSession.brief || "";
            descDisplay = descDisplay.replace(/<think>[\s\S]*?<\/think>/gi, "");
            descDisplay = descDisplay.replace(/<think>[\s\S]*/gi, "").trim();
            if (descDisplay.length > 120) {
              descDisplay = descDisplay.substring(0, 120) + "...";
            }
            if (!descDisplay) {
              descDisplay = "Belum ada detail deskripsi.";
            }

            return (
              <>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-accent mb-1.5 block">
                  {category}
                </span>
                <h4 className="text-[13.5px] font-bold text-ink leading-tight mb-2">
                  {titleDisplay}
                </h4>
                <p className="text-[12px] text-muted leading-relaxed">
                  {descDisplay}
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* Premium Full-Screen Brief Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-canvas rounded-[24px] shadow-2xl border border-hairline w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all">
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-hairline flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ink/5 text-ink flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-ink leading-tight">Konsol Prompt Premium</h3>
                  <p className="text-[11px] text-muted mt-0.5">Tulis spesifikasi arsitektural dan civil engineering secara leluasa</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-hairline flex items-center justify-center text-muted hover:text-ink transition-all font-semibold"
              >
                X
              </button>
            </div>

            {/* Textarea Modal */}
            <div className="p-6 flex-1 flex flex-col bg-white">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Tuliskan brief proyek secara lengkap (contoh: ukuran ruangan, ketebalan dinding, pola pemasangan ubin, warna aksen cat, ketersediaan gudang dll)..."
                className="w-full flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-[14.5px] leading-relaxed text-ink placeholder:text-muted-light/70 min-h-[250px] scrollbar-thin"
                disabled={isProcessing}
              />
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4.5 border-t border-hairline bg-canvas flex items-center justify-between">
              <div className="text-[11.5px] text-muted-light font-medium">
                {brief.length} karakter terisi
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-hairline text-[13px] font-semibold bg-white hover:bg-hairline text-muted hover:text-ink transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    if (brief.trim()) handleHire();
                  }}
                  disabled={!brief.trim() || isProcessing}
                  className="px-6 py-2 rounded-full bg-ink hover:bg-accent text-white text-[13px] font-semibold transition-all disabled:opacity-20 shadow-sm"
                >
                  Terapkan & Kirim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
