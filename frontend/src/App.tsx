import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, Plus, Search, PanelLeftClose, PanelLeftOpen, ShoppingCart, AlertCircle, Send, Download, FileText, UserCog, Brain, Maximize2 } from 'lucide-react';


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


export default function App() {
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredSession, setHoveredSession] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Fungsi Parser untuk menghasilkan detail proyek B2B mewah secara otomatis
  const getB2BProjectDetails = (text: string) => {
    if (!text) return { title: "Konsultasi Baru", category: "RAB Kustom", desc: "Sesi estimasi material kustom." };
    const lower = text.toLowerCase();
    
    if (lower.includes("wpc") || lower.includes("fluted") || lower.includes("kisi")) {
      return {
        title: "Simulasi Dinding WPC Kisi",
        category: "Dinding & Panel",
        desc: "Rencana estimasi fluted panel WPC dari Panelku untuk panel dinding dekoratif seluas 15 m²."
      };
    }
    if (lower.includes("granit") || lower.includes("indogress") || lower.includes("lantai")) {
      return {
        title: "Lantai Granit Indogress",
        category: "Lantai & Keramik",
        desc: "Analisis kebutuhan volume ubin granit Indogress 60x60 untuk area ruang tamu berdimensi 6x6 m."
      };
    }
    if (lower.includes("cat") || lower.includes("vinilex") || lower.includes("dulux") || lower.includes("pengecatan")) {
      return {
        title: "Pengecatan Interior Kamar",
        category: "Finishing & Cat",
        desc: "RAB volume cat primer & topcoat Vinilex/Dulux untuk kamar ukuran 3x4 m dengan tinggi dinding 3 m."
      };
    }
    
    // Fallback rapi jika input kustom dinamis
    const words = text.replace(/[?.!,]/g, "").split(" ");
    const cleanTitle = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return {
      title: cleanTitle ? `Estimasi ${cleanTitle}` : "Estimasi Material Kustom",
      category: "Material Kustom",
      desc: text.length > 90 ? text.substring(0, 90) + "..." : text
    };
  };

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

    // Helper untuk membulatkan angka desimal pada string quantity
    const formatQty = (qtyStr: string) => {
      if (!qtyStr) return "";
      return qtyStr.replace(/(\d+\.\d+)/g, (match) => {
        const num = parseFloat(match);
        return num.toFixed(2);
      });
    };

 
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


  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAgents]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/projects/sessions");
      const data = await res.json();
      setChatHistory(data);
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSelectSession = async (session: any) => {
    setCurrentSessionId(session.id);
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
  };

  // P3 — Download PDF Estimasi Resmi
  const handleDownloadPdf = async (sessionId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/projects/${sessionId}/generate-pdf`);
      if (!res.ok) throw new Error('Gagal generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Estimasi_QHome_${sessionId.substring(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF download error:', e);
      alert('Gagal mengunduh PDF. Pastikan estimasi telah selesai diproses.');
    }
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
        body: JSON.stringify({ brief, session_id: currentSessionId })
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

  return (
    <div className="flex h-screen bg-canvas font-sans overflow-hidden">
      
      {/* Left Sidebar — Premium B2B Studio List */}
      <div className={`bg-surface-soft text-ink-2 flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out border-r border-hairline/80 ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden border-none'}`}>
        
        {/* Header Sidebar — Elegant & Minimalist */}
        <div className="p-4 flex items-center justify-between min-w-[260px] border-b border-hairline/60">
          <div className="flex items-center gap-2 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-light">
              MAS Studio
            </span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={handleNewChat} className="p-1.5 text-muted hover:text-ink hover:bg-white rounded-lg transition-all border border-hairline/30 shadow-sm" title="Konsultasi Baru">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-muted hover:text-ink hover:bg-white rounded-lg transition-all border border-hairline/30 shadow-sm" title="Tutup Sidebar">
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cari Estimasi Fungsional */}
        <div className="px-4 mt-4 min-w-[260px]">
          <div className="relative flex items-center bg-white border border-hairline rounded-xl px-3 py-2 shadow-sm focus-within:border-accent/40 transition-all">
            <Search className="w-3.5 h-3.5 text-muted-light mr-2 flex-shrink-0" />
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
          <div className="px-4">
            <div className="px-3 mb-2.5 flex items-center justify-between">
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
                  
                  // Tentukan kategori dinamis berdasarkan brief/title
                  const textForCategory = (session.brief || session.title || "").toLowerCase();
                  let category = "Material Kustom";
                  if (textForCategory.includes("wpc") || textForCategory.includes("fluted") || textForCategory.includes("kisi") || textForCategory.includes("kayu")) {
                    category = "Dinding & Panel";
                  } else if (textForCategory.includes("granit") || textForCategory.includes("tile") || textForCategory.includes("lantai") || textForCategory.includes("ubin") || textForCategory.includes("keramik")) {
                    category = "Lantai & Keramik";
                  } else if (textForCategory.includes("cat") || textForCategory.includes("paint") || textForCategory.includes("pengecatan") || textForCategory.includes("tembok") || textForCategory.includes("primer")) {
                    category = "Finishing & Cat";
                  } else if (textForCategory.includes("stone") || textForCategory.includes("batu") || textForCategory.includes("andesit") || textForCategory.includes("candi")) {
                    category = "Batu Alam";
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
                    <div key={session.id || idx} className="py-0.5 group/sidebar-item">
                      {/* Garis Pembatas Atas Memudar (Hanya Muncul Saat Hover - Transisi Halus) */}
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-muted-light/60 to-transparent opacity-0 group-hover/sidebar-item:opacity-100 transition-opacity duration-300" />
                      
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
                        className="w-full flex flex-col justify-center px-4 py-2.5 rounded-none transition-all text-left bg-transparent border-none outline-none"
                      >
                        {/* Kategori Proyek Utama (Biru / Besar) */}
                        <span className={`block text-[12.5px] font-bold uppercase tracking-wider mb-1 transition-colors ${
                          isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'
                        }`}>
                          {category}
                        </span>
                        
                        {/* Judul Proyek / Riwayat (Abu-abu Pekat / Kecil) */}
                        <span className={`block text-[12px] font-medium leading-normal truncate w-full transition-colors ${
                          isSelected ? 'text-muted' : 'text-muted-light group-hover:text-muted'
                        }`}>
                          {titleDisplay}
                        </span>
                      </button>

                      {/* Garis Pembatas Bawah Memudar (Hanya Muncul Saat Hover - Transisi Halus) */}
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-muted-light/60 to-transparent opacity-0 group-hover/sidebar-item:opacity-100 transition-opacity duration-300" />
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
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-ink hover:border-accent group" 
                title="Buka Riwayat Estimasi"
              >
                <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-110 text-accent" />
              </button>
            )}
          
          <div className="flex items-center gap-4 ml-auto">

             {/* Tombol Toggle Sidebar Kanan (Operator Log MAS) — Disembunyikan saat sidebar terbuka */}
             {!isRightSidebarOpen && (
               <button 
                 onClick={() => setIsRightSidebarOpen(true)}
                 className="w-10 h-10 rounded-full border transition-all flex items-center justify-center shadow-sm bg-white border-hairline text-muted hover:text-ink hover:border-accent group"
                 title="Buka Log Proses MAS"
               >
                 <UserCog className="w-5 h-5 transition-transform group-hover:scale-110 text-accent" />
               </button>
             )}



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
                    Konsolidasi Spesifikasi & Perencanaan Material Proyek
                  </h2>
                  <p className="text-[14px] text-muted leading-relaxed max-w-xl mx-auto font-normal">
                    Asisten kolaboratif untuk rekayasa nilai dan estimasi volume material proyek Anda. Sampaikan spesifikasi dimensi atau deskripsi area untuk memulai analisis presisi.
                  </p>
                </div>
                
                {/* Preset Proyek B2B Minimalis - Bersih Tanpa Ikon */}
                <div className="w-full max-w-3xl space-y-3.5 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-light text-center mb-5">
                    CONTOH FORMULASI ESTIMASI MATERIAL
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setBrief("Berapa kebutuhan WPC fluted panel dari Panelku untuk menghias dinding dekoratif dengan luas area 15 meter persegi?")}
                      className="bg-white border border-hairline hover:border-accent/40 rounded-xl p-5 text-left transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-[135px] group"
                    >
                      <span className="font-semibold text-[13px] text-ink group-hover:text-accent transition-colors">
                        Kalkulasi Fluted Panel WPC
                      </span>
                      <span className="text-[11.5px] text-muted-light leading-relaxed font-normal mt-1.5">
                        Estimasi kebutuhan fluted panel WPC untuk dekorasi dinding seluas 15 m²
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => setBrief("Kalkulasi kebutuhan ubin granit Indogress 60x60 untuk lantai ruang tamu dengan luas area 6x6 meter.")}
                      className="bg-white border border-hairline hover:border-accent/40 rounded-xl p-5 text-left transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-[135px] group"
                    >
                      <span className="font-semibold text-[13px] text-ink group-hover:text-accent transition-colors">
                        Analisis Lantai Granit Premium
                      </span>
                      <span className="text-[11.5px] text-muted-light leading-relaxed font-normal mt-1.5">
                        Perhitungan kebutuhan ubin granit 60x60 untuk area lantai komersial 36 m²
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => setBrief("Hitung kebutuhan cat interior Vinilex/Dulux untuk kamar ukuran 3x4 meter dengan tinggi dinding 3 meter.")}
                      className="bg-white border border-hairline hover:border-accent/40 rounded-xl p-5 text-left transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between h-[135px] group"
                    >
                      <span className="font-semibold text-[13px] text-ink group-hover:text-accent transition-colors">
                        Simulasi Pengecatan Interior
                      </span>
                      <span className="text-[11.5px] text-muted-light leading-relaxed font-normal mt-1.5">
                        Kompilasi volume cat dinding primer & topcoat untuk kebutuhan ruang 3x4 m
                      </span>
                    </button>
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
                                  SISTEM MULTI-AGENT SEDANG BEROPERASI
                                </span>
                              </div>

                              {/* Sisi Kanan: Badge Agen Aktif */}
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
                                <>Agen <strong className="font-medium text-ink-2">{currentAgentOnDuty}</strong> sedang memproses perhitungan kebutuhan material, mencocokkan stok pergudangan QHomeMart, serta melakukan kalkulasi volume proyek...</>
                              ) : (
                                <>Kepala Analis <strong className="font-medium text-ink-2">Chief Supervisor</strong> sedang mempersiapkan pembagian tugas estimasi material dan mengoordinasikan agen spesialis...</>
                              )}
                            </p>
                          </div>
                        )}



                        {msg.status === 'completed' && (
                          <div className="space-y-8 pt-2 animate-scale-in">
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

                            
                            {/* Premium Quote/Proposal Card */}
                            {msg.products && msg.products.length > 0 && (() => {
                              const availableProds = msg.products.filter((p: any) => p.price > 0 && p.total > 0 && p.name !== "Menunggu Konfirmasi" && !p.name.toLowerCase().includes("konfirmasi"));
                              const unavailableProds = msg.products.filter((p: any) => p.price === 0 || p.total === 0 || p.name === "Menunggu Konfirmasi" || p.name.toLowerCase().includes("konfirmasi"));
                              return (
                                <div className="bg-white rounded-[14px] border border-hairline shadow-sm overflow-hidden mt-8 relative">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-soft"></div>
                                  <div className="px-7 py-5 border-b border-hairline flex justify-between items-center bg-surface-soft">
                                    <h4 className="font-semibold text-[18px] text-ink">Rencana Anggaran Biaya (RAB)</h4>
                                    <span className="text-[12px] font-semibold tracking-widest uppercase text-muted-light">Estimasi Supermarket</span>
                                  </div>
                                  
                                  {availableProds.length > 0 ? (
                                    <div className="p-7 space-y-5 bg-white">
                                      {availableProds.map((prod: any, pIdx: number) => {
                                        const isSub = prod.qty.toLowerCase().includes("substitusi");
                                        return (
                                          <div key={pIdx} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 bg-surface-soft rounded-lg flex items-center justify-center text-[13px] text-muted font-semibold uppercase group-hover:bg-accent-soft group-hover:text-accent transition-colors shrink-0">
                                                {prod.name.substring(0,2)}
                                              </div>
                                              <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <p className="font-semibold text-[15px] text-ink leading-tight">{prod.name}</p>
                                                  {isSub && (
                                                    <span className="text-[9px] font-bold bg-accent-soft/80 text-accent border border-accent-border/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                      Substitusi Otomatis
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-[13px] text-muted mt-1">Vol: {formatQty(prod.qty)}</p>
                                              </div>
                                            </div>
                                            <p className="font-semibold text-[15px] text-ink shrink-0">Rp {prod.total.toLocaleString('id-ID')}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="p-7 text-center bg-white">
                                      <p className="text-muted text-[14px] italic">Tidak ada material siap beli dalam daftar. Semua item saat ini memerlukan verifikasi stok.</p>
                                    </div>
                                  )}

                                  {/* Regulasi Terkait Barang Kosong / Menunggu Konfirmasi */}
                                  {unavailableProds.length > 0 && (
                                    <div className="px-7 py-5 bg-canvas border-t border-hairline/60 space-y-4">
                                      <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                        <div className="text-[13.5px] text-ink-2 leading-relaxed">
                                          <span className="font-semibold text-ink block mb-0.5">Catatan Ketersediaan Stok Gudang</span>
                                          Terdapat <strong className="text-accent font-bold">{unavailableProds.length} material</strong> yang dialihkan atau ditangguhkan sementara dari daftar utama karena status stok saat ini memerlukan konfirmasi manual oleh tim logistik QHomeMart:
                                        </div>
                                      </div>
                                      
                                      <div className="pl-8 space-y-2">
                                        {unavailableProds.map((prod: any, upIdx: number) => {
                                          const isHabis = prod.name.toLowerCase().includes("habis");
                                          const cleanName = prod.name.replace(/\[.*?\]\s*/g, '');
                                          return (
                                            <div key={upIdx} className="flex justify-between items-center bg-white border border-hairline rounded-lg px-4 py-2.5 text-[13px] shadow-sm">
                                              <span className="text-ink-2 font-medium">{cleanName}</span>
                                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                                isHabis ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                              }`}>
                                                {isHabis ? 'Stok Kosong' : 'Menunggu Konfirmasi'}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <div className="bg-ink p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                                    <div>
                                      <p className="text-[12px] font-medium text-muted-light uppercase tracking-wider mb-1">Total Estimasi Belanja QHomeMart</p>
                                      <p className="text-2xl font-bold text-white">
                                        Rp {availableProds.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                      {/* P3 — Tombol Unduh PDF */}
                                      {currentSessionId && (
                                        <button
                                          onClick={() => handleDownloadPdf(currentSessionId)}
                                          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-lg text-[14px] font-semibold transition-all flex items-center justify-center gap-2"
                                        >
                                          <Download className="w-4 h-4" /> Unduh PDF
                                        </button>
                                      )}
                                      <button className="w-full sm:w-auto bg-accent text-white px-6 py-3.5 rounded-lg text-[15px] font-semibold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <ShoppingCart className="w-4.5 h-4.5" /> Tambahkan ke Keranjang
                                      </button>
                                    </div>
                                  </div>

                                  {/* P6 — Disclaimer Teknis */}
                                  {msg.logs?.find((l: any) => l.event === 'completed')?.disclaimer && (
                                    <div className="px-7 py-5 bg-amber-50/60 border-t border-amber-200/60 flex items-start gap-3">
                                      <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <p className="text-[12px] text-amber-800 leading-relaxed">
                                        {msg.logs.find((l: any) => l.event === 'completed').disclaimer}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
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
                  if(e.key === 'Enter' && !e.shiftKey) {
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
      <div className={`bg-canvas border-l border-hairline flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out ${isRightSidebarOpen ? 'w-[320px]' : 'w-0 overflow-hidden border-none'}`}>
        
        {/* Sidebar Header — Ultra Minimalis */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between min-w-[320px]">
          <div className="flex items-center gap-3">
            <UserCog className="w-4 h-4 text-ink" />
            <span className="text-[11px] font-semibold text-muted-light tracking-[0.18em] uppercase">
              Proses Analisis
            </span>
          </div>
          <button onClick={() => setIsRightSidebarOpen(false)} className="p-1 text-muted-light hover:text-ink transition-colors">
            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
          </button>
        </div>
        <div className="mx-6 h-px bg-hairline" />

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto min-w-[320px] scrollbar-warm">
          {messages.length === 0 || !messages.find(m => m.role === 'system') ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-30">
              <p className="text-[12px] text-muted leading-relaxed">Sistem menunggu permintaan analisis dari Anda.</p>
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
                        <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 transition-all ${
                          isSpinnerActive ? 'bg-accent ring-4 ring-accent/15 animate-pulse' : 'bg-hairline border border-muted-light/40'
                        }`} />
                        {!isLast && <div className="w-px flex-1 bg-hairline mt-1.5 mb-0" />}
                      </div>

                      {/* Konten Timeline Entry */}
                      <div className={`pb-7 flex-1 min-w-0 ${isLast ? '' : ''}`}>
                        {/* Header: Nama Agen + Status */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className={`text-[11.5px] font-semibold uppercase tracking-wider ${
                            isSpinnerActive ? 'text-accent' : 'text-ink'
                          }`}>
                            {agentTitle}
                          </span>
                          {isSpinnerActive ? (
                            <span className="flex items-center gap-1 text-accent flex-shrink-0 pt-1.5" title="Aktif">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-wave-1" />
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-wave-2" />
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-wave-3" />
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
            // Tentukan kategori dinamis berdasarkan brief/title
            const textForCategory = (hoveredSession.brief || hoveredSession.title || "").toLowerCase();
            let category = "Material Kustom";
            if (textForCategory.includes("wpc") || textForCategory.includes("fluted") || textForCategory.includes("kisi") || textForCategory.includes("kayu")) {
              category = "Dinding & Panel";
            } else if (textForCategory.includes("granit") || textForCategory.includes("tile") || textForCategory.includes("lantai") || textForCategory.includes("ubin") || textForCategory.includes("keramik")) {
              category = "Lantai & Keramik";
            } else if (textForCategory.includes("cat") || textForCategory.includes("paint") || textForCategory.includes("pengecatan") || textForCategory.includes("tembok") || textForCategory.includes("primer")) {
              category = "Finishing & Cat";
            } else if (textForCategory.includes("stone") || textForCategory.includes("batu") || textForCategory.includes("andesit") || textForCategory.includes("candi")) {
              category = "Batu Alam";
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
                ✕
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
