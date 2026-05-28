import { useState, useRef, useEffect } from 'react';
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
  ShoppingBag
} from 'lucide-react';
import { getPersonaGreeting } from './PersonaSelect';

function ExpandableText({ text, limit = 250 }: { text: string, limit?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (text.length <= limit) {
    return (
      <div className="flex flex-col gap-2">
        <div className="whitespace-pre-line">{text}</div>
        <div className="text-[11px] font-medium text-muted-light/60 text-left">
          {wordCount} kata
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className={`whitespace-pre-line transition-all duration-500 ease-in-out overflow-hidden pb-1 ${!isExpanded ? 'max-h-[128px]' : 'max-h-[2000px]'}`}>
          {text}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-surface-soft via-surface-soft/50 to-transparent pointer-events-none transition-opacity duration-500 ${!isExpanded ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-hairline/30">
        <span className="text-[11.5px] font-bold text-muted-light/80">
          {wordCount} kata
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-1.5 bg-white border border-hairline rounded-full text-[12px] font-bold text-muted hover:text-accent transition-all focus:outline-none cursor-pointer"
        >
          {isExpanded ? 'Tampilkan Lebih Sedikit' : 'Selengkapnya'}
        </button>
      </div>
    </div>
  );
}

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

const renderMarkdown = (text: string) => {
  if (!text) return "";
  let html = text;
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-accent font-medium bg-accent-soft/40 px-1.5 py-0.5 rounded">$1</em>');
  return html;
};

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

// Daftar kutipan acak untuk memberikan informasi saat sistem sedang memproses
const loadingQuotes = [
  "Sabar ya, material bangunan terbaik sedang kami pilihkan untuk proyek Anda...",
  "Tahukah Anda? Granit yang bagus tidak hanya kuat, tapi juga memiliki pola yang konsisten.",
  "Sedang mencocokkan spesifikasi ruangan dengan ketersediaan stok di QHomeMart...",
  "Kualitas semen sangat menentukan ketahanan bangunan. Kami sedang memilihkan yang terbaik.",
  "Pemilihan warna cat yang tepat dapat memberikan ilusi ruangan yang lebih luas lho!",
  "Sedang mengkalkulasi volume material agar tidak terjadi pemborosan budget Anda...",
  "Pipa PVC dengan ketebalan standar sangat penting untuk instalasi air jangka panjang.",
  "Mencari kombinasi pencahayaan yang hemat energi namun tetap terang maksimal...",
  "Menyiapkan rencana estimasi harga yang paling efisien untuk kantong Anda..."
];

// Komponen sederhana untuk menampilkan kutipan acak secara bergantian agar sistem tidak terlihat error
function LoadingQuote() {
  // State untuk menyimpan nomor indeks kutipan yang aktif saat ini
  const [activeQuote, setActiveQuote] = useState(0);
  // State untuk mengatur transparansi agar pergantian teks terlihat halus
  const [isVisible, setIsVisible] = useState(true);

  // Efek samping untuk mengganti kutipan secara otomatis setiap 5 detik
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      // Memudarkan teks yang sedang tampil
      setIsVisible(false);
      
      // Menunggu sebentar sebelum mengganti teks (memberikan waktu untuk animasi pudar)
      setTimeout(() => {
        // Membuat angka acak berdasarkan jumlah kutipan yang tersedia
        const randomId = Math.floor(Math.random() * loadingQuotes.length);
        // Memperbarui state dengan angka acak yang baru
        setActiveQuote(randomId);
        // Memunculkan teks yang baru secara perlahan
        setIsVisible(true);
      }, 600); // 600 milidetik memberikan waktu agar animasi pudar selesai
    }, 5000);

    // Membersihkan timer saat komponen sudah tidak digunakan
    return () => clearInterval(quoteTimer);
  }, []);

  return (
    <div className="min-h-[24px]">
      <p 
        className={`text-[13px] text-muted-light italic transition-opacity duration-700 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {loadingQuotes[activeQuote]}
      </p>
    </div>
  );
}

const CollapsibleAgentLogs = ({ logs, onOpenActivityPanel }: { logs: any[], onOpenActivityPanel: () => void }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mb-4 text-[13px]">
      <button
        onClick={onOpenActivityPanel}
        className="flex items-center gap-1.5 text-muted-light hover:text-ink font-medium transition-colors cursor-pointer select-none"
      >
        <span className="text-[13px]">Analisis Staf Selesai</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-light/60" />
      </button>
    </div>
  );
};

interface ChatCanvasProps {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  setActivePortal: (portal: 'chat' | 'admin' | 'order' | 'catalog' | 'history') => void;
  cartItems: any[];
  messages: any[];
  chatHistory: any[];
  isProcessing: boolean;
  currentSessionId: string | null;
  currentAgentOnDuty: string | null;
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (isOpen: boolean) => void;
  handleSelectSession: (session: any) => void;
  handleNewChat: () => void;
  handleHire: (brief: string) => void;
  activeAgents: string[];
  isChatFrozen: boolean;
}

export default function ChatCanvas({
  currentUser,
  setCurrentUser,
  setActivePortal,
  cartItems,
  messages,
  chatHistory,
  isProcessing,
  currentSessionId,
  currentAgentOnDuty,
  isRightSidebarOpen,
  setIsRightSidebarOpen,
  handleSelectSession,
  handleNewChat,
  handleHire,
  activeAgents,
  isChatFrozen
}: ChatCanvasProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredSession, setHoveredSession] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [brief, setBrief] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileViewport = () => isMobile;

  const openLeftSidebar = () => {
    setIsSidebarOpen(true);
    if (isMobileViewport()) setIsRightSidebarOpen(false);
  };

  const toggleRightSidebar = () => {
    if (isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
      return;
    }
    setIsRightSidebarOpen(true);
    if (isMobileViewport()) setIsSidebarOpen(false);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activityPanelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const openActivityPanel = () => {
    setIsRightSidebarOpen(true);
    setTimeout(() => {
      activityPanelRef.current?.scrollTo({ top: activityPanelRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAgents]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [brief]);

  const onHireSubmit = () => {
    if (brief.trim()) {
      handleHire(brief);
      setBrief("");
    }
  };

  return (
    <div className="flex h-screen bg-canvas font-sans overflow-hidden">
      {/* Mobile Backdrop — Left Sidebar (fade in/out, tetap mounted agar transisi halus) */}
      <div
        className={`fixed inset-0 bg-ink/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Left Sidebar — Mobile: fixed drawer dengan translate-x slide; Desktop: in-flow width animation */}
      <div
        className={`bg-canvas border-r border-hairline flex flex-col h-full transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 w-[280px] z-40 shadow-2xl
          md:relative md:inset-auto md:translate-x-0 md:shadow-none md:flex-shrink-0
          ${isSidebarOpen
            ? 'translate-x-0 md:w-[260px]'
            : '-translate-x-full md:w-0 md:border-none md:overflow-hidden'
          }`}
      >
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
                  const briefTxt = (session.brief || "").toLowerCase();
                  const search = searchTerm.toLowerCase();
                  return title.includes(search) || briefTxt.includes(search);
                });

                if (filteredHistory.length === 0) {
                  return (
                    <p className="text-[12.5px] text-muted-light px-3 py-2 italic">Tidak ada riwayat.</p>
                  );
                }

                return filteredHistory.map((session, idx) => {
                  const isSelected = currentSessionId === session.id;

                  const textForCategory = (session.brief || session.title || "").toLowerCase();
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
                  } else if (textForCategory.includes("sanitary") || textForCategory.includes("toilet") || textForCategory.includes("wc") || textForCategory.includes("wastafel") || textForCategory.includes("pipa") || textForCategory.includes("plumbing") ) {
                    category = "Sanitasi & Perpipaan";
                  } else if (textForCategory.includes("electrical") || textForCategory.includes("lampu") || textForCategory.includes("lighting") || textForCategory.includes("listrik") || textForCategory.includes("saklar") || textForCategory.includes("stopkontak")) {
                    category = "Kelistrikan";
                  } else if (textForCategory.includes("tool") || textForCategory.includes("gerinda") || textForCategory.includes("bor") || textForCategory.includes("mesin") || textForCategory.includes("peralatan") ) {
                    category = "Peralatan & Mesin";
                  }

                  let titleDisplay = session.title || "";
                  titleDisplay = titleDisplay.replace(/<think>[\s\S]*?<\/think>/gi, "");
                  titleDisplay = titleDisplay.replace(/<think>[\s\S]*/gi, "").trim();

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
                        <span className={`block text-[12px] font-bold uppercase tracking-wider mb-1 transition-colors ${isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
                          }`}>
                          {category}
                        </span>
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
        <header className="px-4 py-3 md:px-6 md:py-4 bg-canvas/90 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={openLeftSidebar}
                className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-ink hover:border-accent group mr-2 flex-shrink-0"
                title="Buka Riwayat Estimasi"
              >
                <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-110 text-accent" />
              </button>
            )}
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-white/80 border border-hairline px-3.5 py-1.5 rounded-full shadow-sm animate-scale-in min-w-0">
                <div className="flex items-center gap-2 text-left min-w-0">
                  <span className="text-[11.5px] font-bold text-ink leading-none truncate max-w-[120px] sm:max-w-none">{currentUser.name}</span>
                  <span className="hidden sm:inline text-[9px] font-light text-muted-light">/</span>
                  <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider text-muted-light font-bold leading-none mt-0.5">{currentUser.roleDisplay}</span>
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
            <button
              onClick={() => setActivePortal('history')}
              className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-accent hover:border-accent group relative cursor-pointer"
              title="Riwayat Pesanan & Estimasi"
            >
              <svg className="w-4.5 h-4.5 text-accent transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <button
              onClick={() => setActivePortal('order')}
              className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-accent hover:border-accent group relative cursor-pointer"
              title="Buka Keranjang Pengadaan"
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

            <button
              onClick={toggleRightSidebar}
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
        <main className="flex-1 overflow-y-auto w-full scrollbar-warm px-6">
          <div className="pt-6 md:pt-10 space-y-10 w-full max-w-3xl mx-auto pb-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 md:space-y-12 animate-float-up min-h-[55vh] md:min-h-[68vh] px-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                    KONSOLIDASI MATERIAL & REKAYASA ESTIMASI
                  </span>
                  <div className="w-6 h-px bg-hairline mx-auto mt-2.5" />
                </div>

                <div className="space-y-4 max-w-2xl">
                  <h2 className="text-[22px] md:text-[28px] font-light text-ink leading-tight tracking-wide">
                    {getPersonaGreeting(currentUser.role).title}
                  </h2>
                  <p className="text-[14px] text-muted leading-relaxed max-w-xl mx-auto font-normal">
                    {getPersonaGreeting(currentUser.role).subtitle}
                  </p>
                </div>

                <div className="w-full max-w-3xl space-y-3.5 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-light text-center mb-5">
                    CONTOH FORMULASI ESTIMASI MATERIAL
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getPersonaGreeting(currentUser.role).presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setBrief(preset.prompt)}
                        className="bg-white border border-hairline hover:border-accent/40 rounded-xl p-5 text-left transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[155px] h-auto group"
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
                          <div className="mb-8 animate-scale-in">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between w-full flex-wrap gap-4 border-b border-hairline/40 pb-3.5 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-full bg-accent-soft flex items-center justify-center">
                                    <Loader2 className="w-3 h-3 animate-spin text-accent" />
                                  </div>
                                  <span className="text-[11.5px] uppercase tracking-[0.15em] text-muted font-normal">
                                    STAF KANTOR SEDANG BEROPERASI
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 bg-accent-soft/40 border border-accent-border/20 px-3 py-1 rounded-full shadow-sm flex-shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                  <span className="text-[10.5px] font-semibold text-accent uppercase tracking-wider">
                                    {currentAgentOnDuty || 'Chief Supervisor'}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[14px] text-muted-light leading-relaxed pl-8">
                                {currentAgentOnDuty ? (
                                  <>Staf <strong className="font-medium text-ink-2">{currentAgentOnDuty}</strong> sedang memproses perhitungan kebutuhan material, mencocokkan stok pergudangan QHomeMart, serta melakukan kalkulasi volume proyek...</>
                                ) : (
                                  <>Manajer <strong className="font-medium text-ink-2">Chief Supervisor</strong> sedang mempersiapkan pembagian tugas estimasi material dan mengoordinasikan staf spesialis...</>
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {msg.status === 'completed' && (
                          <div className="space-y-8 pt-2 animate-scale-in">
                            <CollapsibleAgentLogs logs={msg.logs} onOpenActivityPanel={openActivityPanel} />
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
            
            {/* Tampilkan LoadingQuote HANYA sesaat setelah user menekan enter dan agen belum memunculkan teks */}
            {isProcessing && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex flex-col items-start animate-float-up w-full mt-6">
                <div className="max-w-3xl text-[15.5px] leading-[1.7]">
                  <LoadingQuote />
                </div>
              </div>
            )}
            
            <div className="h-[140px] w-full shrink-0" ref={messagesEndRef} />
          </div>
        </main>

        {/* Prompt Console */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-canvas via-canvas/95 to-transparent pt-12 pb-7 px-6 z-10">
          <div className="max-w-3xl mx-auto">
            {isChatFrozen ? (
              <div className="text-center animate-scale-in py-2">
                <p className="text-[12px] font-bold text-emerald-700 leading-tight">
                  Terima kasih, sesi ini telah selesai
                </p>
                <p className="text-[11px] text-emerald-600/70 leading-snug mt-1">
                  Pembayaran berhasil dikonfirmasi. Untuk konsultasi baru, silakan buat obrolan baru.
                </p>
              </div>
            ) : (
            <div className="relative flex items-end bg-white border border-hairline rounded-[26px] pl-6 pr-2.5 py-2.5 shadow-sm focus-within:border-accent/50 focus-within:shadow-md transition-all gap-3">
              <textarea
                ref={textareaRef}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={isMobile
                  ? "Spesifikasi material proyek..."
                  : "Sampaikan spesifikasi area, dimensi ruang, atau kebutuhan material proyek Anda..."}
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onHireSubmit();
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-[14.5px] leading-relaxed text-ink placeholder:text-muted-light max-h-[120px] scrollbar-none py-1.5 min-h-[22px] disabled:opacity-60"
                rows={1}
              />
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={isProcessing}
                className="w-8.5 h-8.5 rounded-full bg-canvas border border-hairline hover:bg-hairline text-muted hover:text-ink flex items-center justify-center transition-all disabled:opacity-30 shadow-sm flex-shrink-0"
                title="Perluas Konsol Prompt"
                type="button"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onHireSubmit}
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
            )}
          </div>
        </div>
      </div>

      {/* Mobile Backdrop — Right Sidebar (fade in/out, tetap mounted agar transisi halus) */}
      <div
        className={`fixed inset-0 bg-ink/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ease-in-out ${
          isRightSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsRightSidebarOpen(false)}
      />

      {/* Right Sidebar — Mobile: fixed drawer dengan translate-x slide dari kanan; Desktop: in-flow width animation */}
      <div
        className={`bg-canvas border-l border-hairline flex flex-col h-full transition-all duration-300 ease-in-out
          fixed inset-y-0 right-0 w-[320px] z-40 shadow-2xl
          md:relative md:inset-auto md:translate-x-0 md:shadow-none md:flex-shrink-0
          ${isRightSidebarOpen
            ? 'translate-x-0 md:w-[360px]'
            : 'translate-x-full md:w-0 md:border-none md:overflow-hidden'
          }`}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between min-w-[320px] md:min-w-[360px]">
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

        <div ref={activityPanelRef} className="flex-1 overflow-y-auto min-w-[320px] md:min-w-[360px] scrollbar-warm">
          {messages.length === 0 || !messages.find(m => m.role === 'system') ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 py-24 opacity-40">
              <Brain className="w-8 h-8 text-muted-light animate-pulse mb-3" />
              <p className="text-[12px] text-muted leading-relaxed">Staf kantor sedang siaga. Masukkan brief di sebelah kiri untuk melihat log aktivitas kerja.</p>
            </div>
          ) : (
            <div className="px-6 py-5">
              {(() => {
                const systemLogs = messages
                  .filter(m => m.role === 'system')
                  .flatMap(m => m.logs || []);
                  
                return systemLogs.map((log: any, idx: number) => {
                  const isSpinnerActive = isProcessing && log.event === 'working' && idx === systemLogs.length - 1;
                  const agentTitle = log.title || 'Sistem';
                  const isLast = idx === systemLogs.length - 1;

                  return (
                    <div key={idx} className="flex gap-4 animate-scale-in">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 transition-all ${isSpinnerActive ? 'bg-accent ring-4 ring-accent/15 animate-pulse' : 'bg-hairline border border-muted-light/40'
                          }`} />
                        {!isLast && <div className="w-px flex-1 bg-hairline mt-1.5 mb-0" />}
                      </div>

                      <div className={`pb-7 flex-1 min-w-0 ${isLast ? '' : ''}`}>
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

      {/* Floating Hover Card (Tooltip) — desktop only, hover tidak reliable di touch device */}
      {hoveredSession && (
        <div
          className="hidden md:flex fixed w-[280px] bg-white border border-hairline rounded-[18px] shadow-2xl p-4.5 z-[9999] animate-scale-in flex-col pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`
          }}
        >
          {(() => {
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

            <div className="p-6 flex-1 flex flex-col bg-white">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Tuliskan brief proyek secara lengkap (contoh: ukuran ruangan, ketebalan dinding, pola pemasangan ubin, warna aksen cat, ketersediaan gudang dll)..."
                className="w-full flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-[14.5px] leading-relaxed text-ink placeholder:text-muted-light/70 min-h-[250px] scrollbar-thin"
                disabled={isProcessing}
              />
            </div>

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
                    if (brief.trim()) {
                      handleHire(brief);
                      setBrief("");
                    }
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
