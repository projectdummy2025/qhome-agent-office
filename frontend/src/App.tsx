import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, Cpu, ChevronDown, Plus, Search, MessageSquare, PanelLeftClose, PanelLeftOpen, Sparkles, ShoppingBag, ShoppingCart, AlertCircle, ArrowRight, Download, FileText } from 'lucide-react';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      
      {/* Left Sidebar */}
      <div className={`bg-surface-soft text-ink-2 flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out border-r border-hairline ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden border-none'}`}>
        <div className="p-4 flex items-center justify-between min-w-[260px]">
          <button onClick={handleNewChat} className="p-2 text-muted hover:text-ink rounded-xl hover:bg-white/80 transition-all" title="Konsultasi Baru">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-muted hover:text-ink rounded-xl hover:bg-white/80 transition-all" title="Tutup Sidebar">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-warm pb-4 min-w-[260px]">
          <div className="px-4 space-y-1 mt-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/80 transition-all text-[14px] font-medium text-ink-2">
              <Search className="w-4 h-4 text-muted" /> Cari Estimasi
            </button>
          </div>

          <div className="mt-8 px-4">
            <div className="px-4 mb-3">
              <span className="text-[11px] font-semibold text-muted-light uppercase tracking-widest">Daftar Simulasi RAB</span>
            </div>
            <div className="space-y-1">
              {chatHistory.length === 0 ? (
                <p className="text-[13px] text-muted px-4 py-2">Belum ada riwayat.</p>
              ) : (
                chatHistory.map((session, idx) => (
                  <button 
                    key={session.id || idx} 
                    onClick={() => handleSelectSession(session)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/80 transition-all text-sm text-left group ${currentSessionId === session.id ? 'bg-white shadow-sm border border-hairline text-accent font-medium' : 'text-ink-2'}`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 group-hover:text-accent transition-colors ${currentSessionId === session.id ? 'text-accent' : 'text-muted-light'}`} />
                    <span className="truncate font-medium">{session.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 bg-canvas">
        
        {/* Header */}
        <header className="px-6 py-4 bg-canvas/90 backdrop-blur-xl border-b border-hairline flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-1 text-muted hover:text-ink rounded-xl hover:bg-surface-soft transition-all" title="Buka Sidebar">
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            {/* Mengganti ke Kalkulator RAB yang modern dan berskala supermarket */}
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="flex items-center gap-2 hover:opacity-85 transition-all text-left group"
              title={isRightSidebarOpen ? "Tutup Log Proses Estimasi" : "Buka Log Proses Estimasi"}
            >
              <div className="w-8 h-8 rounded-lg bg-accent-soft group-hover:bg-accent-border/40 flex items-center justify-center transition-colors">
                <Cpu className="w-4 h-4 text-accent" />
              </div>
              <h1 className="text-[18px] font-semibold text-ink tracking-wide flex items-center gap-1.5">
                Kalkulator <span className="text-[15px] text-muted font-normal">RAB MAS</span>
              </h1>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Konsep Siapa yang bertugas sekarang (Modul Aktif) - Desain Tenang Tanpa Flicker */}
            {isProcessing && currentAgentOnDuty && (
              <div className="flex items-center gap-2.5 bg-sage-soft px-4 py-2 rounded-full border border-sage-border/30 text-[13px] font-medium text-sage shadow-sm">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sage font-semibold">{currentAgentOnDuty}</span>
              </div>
            )}
            
            {activeAgents.length > 0 && (
               <div className="flex -space-x-1.5">
                 {activeAgents.map(a => {
                   const isCurrent = currentAgentOnDuty && currentAgentOnDuty.toLowerCase().includes(a.toLowerCase());
                   return (
                     <div 
                       key={a} 
                       className={`w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center text-[10px] font-bold shadow-sm transition-all duration-300 ${isCurrent ? 'border-accent text-accent scale-110 z-10 bg-accent-soft' : 'border-hairline text-muted-light bg-white'}`}
                       title={a}
                     >
                       {a.substring(0,2).toUpperCase()}
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </header>

        {/* Chat History */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-warm">
          <div className="p-6 md:p-10 space-y-10 w-full max-w-4xl mx-auto pb-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-float-up min-h-[65vh]">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-soft rounded-full blur-3xl opacity-40"></div>
                  <div className="w-24 h-24 bg-gradient-to-br from-accent-soft to-surface-strong rounded-[2rem] flex items-center justify-center shadow-sm relative rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Sparkles className="w-10 h-10 text-accent" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="space-y-4 max-w-xl">
                  <h2 className="text-4xl md:text-5xl font-bold text-ink leading-tight tracking-tight">
                    Kalkulator RAB &<br />Estimator QHomeMart
                  </h2>
                  <p className="text-muted text-[15px] leading-relaxed">
                    Masukkan detail kebutuhan atau spesifikasi proyek renovasi Anda (misal: luas dinding untuk cat, kebutuhan lantai keramik). Multi-Agent System (MAS) kami akan mengevaluasi katalog produk, memperkirakan volume, dan menyusun Rencana Anggaran Biaya (RAB) belanja secara otomatis.
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  {[
                    { label: "Cat Tembok Kamar 3x4m", brief: "Hitung kebutuhan cat interior Vinilex/Dulux untuk kamar ukuran 3x4 meter dengan tinggi dinding 3 meter." },
                    { label: "Lantai Granit 6x6m", brief: "Kalkulasi kebutuhan ubin granit Indogress 60x60 untuk lantai ruang tamu dengan luas area 6x6 meter." },
                    { label: "Kisi-Kisi Dinding WPC 15m²", brief: "Berapa kebutuhan WPC fluted panel dari Panelku untuk menghias dinding dekoratif dengan luas area 15 meter persegi?" }
                  ].map((item, i) => (
                    <button key={i} onClick={() => setBrief(item.brief)} className="px-4 py-2 rounded-full bg-white border border-hairline text-[13px] text-ink-2 hover:border-accent hover:text-accent transition-all shadow-sm">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-float-up w-full`}>
                  
                  {msg.role === 'user' && (
                    <div className="bg-surface-soft border border-hairline text-ink px-6 py-4 rounded-[14px] rounded-tr-sm max-w-2xl text-[15px] leading-relaxed">
                      {msg.content}
                    </div>
                  )}

                  {msg.role === 'system' && (
                    <div className="w-full flex gap-5 mt-6">
                      <div className="w-10 h-10 bg-white border border-hairline rounded-2xl flex items-center justify-center text-accent flex-shrink-0 mt-1 shadow-sm">
                        <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 max-w-3xl text-[15.5px] text-ink-2 leading-[1.7]">
                        
                        {msg.status !== 'completed' && (
                          <div className="mb-6 bg-sage-soft/30 border border-sage-border/30 rounded-[14px] p-6 space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 text-accent text-[14.5px] font-semibold">
                                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                <span>Sistem Multi-Agent Sedang Berjalan...</span>
                              </div>
                              {currentAgentOnDuty && (
                                <span className="text-[11px] uppercase tracking-widest bg-accent text-white px-3.5 py-1.5 rounded-full font-bold">
                                  {currentAgentOnDuty.toUpperCase()}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              <p className="text-[14px] text-ink-2 leading-relaxed">
                                {currentAgentOnDuty ? (
                                  <><strong>{currentAgentOnDuty}</strong> sedang memproses data material, mencocokkan stok pergudangan, dan mengalkulasi volume kebutuhan proyek...</>
                                ) : (
                                  <><strong>Chief Supervisor</strong> sedang mempersiapkan pembagian tugas pengerjaan estimasi material...</>
                                )}
                              </p>
                              <div className="w-full bg-hairline/60 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-sage to-accent h-full rounded-full w-[65%] transition-all duration-500" />
                              </div>
                            </div>
                          </div>
                        )}

                        {msg.status === 'completed' && (
                          <div className="space-y-8 pt-2 animate-scale-in">
                            {msg.narrative ? (
                               <div className="space-y-5 prose prose-stone max-w-none">
                                 {String(msg.narrative).split('\n\n').map((para: string, idx: number) => {
                                   if (para.trim().startsWith('-')) {
                                     const listItems = para.split('\n').filter(l => l.trim().startsWith('-'));
                                     return (
                                       <ul key={idx} className="list-none space-y-2 pl-0">
                                         {listItems.map((li, liIdx) => (
                                           <li key={liIdx} className="flex items-start gap-3">
                                             <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0"></span>
                                             <span dangerouslySetInnerHTML={{ __html: li.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>') }} />
                                           </li>
                                         ))}
                                       </ul>
                                     );
                                   }
                                   return <p key={idx} dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>') }} />;
                                 })}
                               </div>
                            ) : (
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
                                    <div className="p-7 space-y-5">
                                      {availableProds.map((prod: any, pIdx: number) => (
                                        <div key={pIdx} className="flex justify-between items-center group">
                                          <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-surface-soft rounded-lg flex items-center justify-center text-[13px] text-muted font-semibold uppercase group-hover:bg-accent-soft group-hover:text-accent transition-colors">
                                              {prod.name.substring(0,2)}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-[15px] text-ink">{prod.name}</p>
                                              <p className="text-[13px] text-muted mt-0.5">Vol: {prod.qty}</p>
                                            </div>
                                          </div>
                                          <p className="font-semibold text-[15px] text-ink">Rp {prod.total.toLocaleString('id-ID')}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-7 text-center">
                                      <p className="text-muted text-[14px] italic">Tidak ada material siap beli dalam daftar. Semua item saat ini memerlukan verifikasi stok.</p>
                                    </div>
                                  )}

                                  {/* Regulasi Terkait Barang Kosong / Menunggu Konfirmasi */}
                                  {unavailableProds.length > 0 && (
                                    <div className="px-7 py-4.5 bg-sage-soft/30 border-t border-hairline flex items-start gap-3">
                                      <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                                      <div className="text-[13.5px] text-ink-2 leading-relaxed">
                                        <span className="font-semibold text-ink block mb-0.5">Catatan Ketersediaan Stok Gudang</span>
                                        Terdapat <strong className="text-accent font-bold">{unavailableProds.length} material</strong> (seperti semen perekat, jenis pelapis cat, ubin, atau kayu kustom) yang sengaja disembunyikan dari daftar belanja utama karena status stok saat ini memerlukan konfirmasi manual oleh tim logistik QHomeMart.
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

        {/* Input Area */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-canvas via-canvas to-transparent pt-10 pb-6 px-6 z-10">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-soft to-hairline rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Ceritakan kebutuhan ubin, cat, panel kayu, batu alam, atau semen proyek Anda..."
              disabled={isProcessing}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleHire();
                }
              }}
              className="relative w-full bg-white border border-hairline focus:border-accent focus:ring-4 focus:ring-accent-soft rounded-[2rem] pl-7 pr-16 py-5 text-[15px] focus:outline-none resize-none overflow-hidden min-h-[64px] max-h-[200px] transition-all disabled:opacity-60 disabled:bg-surface-soft shadow-sm text-ink placeholder:text-muted-light"
              rows={1}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <button 
              onClick={handleHire}
              disabled={!brief.trim() || isProcessing}
              className="absolute right-3.5 bottom-3.5 w-11 h-11 bg-ink hover:bg-accent text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:bg-hairline transition-all shadow-md"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[12px] text-muted-light mt-4 font-medium tracking-wide">QHomeMart Estimator MAS • Didukung Kecerdasan Buatan</p>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`bg-white border-l border-hairline flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out shadow-sm ${isRightSidebarOpen ? 'w-[340px]' : 'w-0 overflow-hidden border-none'}`}>
        <div className="p-5 border-b border-hairline flex items-center justify-between min-w-[340px] bg-surface-soft">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-ink text-[17px]">Log Proses Estimasi (MAS)</h3>
          </div>
          <button onClick={() => setIsRightSidebarOpen(false)} className="p-1.5 text-muted-light hover:text-ink rounded-xl hover:bg-surface-strong transition-colors">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 min-w-[340px] bg-white scrollbar-warm">
          {messages.length === 0 || !messages.find(m => m.role === 'system') ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <Cpu className="w-12 h-12 mb-4 text-muted-light" strokeWidth={1} />
               <p className="text-[13px] text-muted max-w-[200px]">Belum ada proses analisis yang berjalan.</p>
             </div>
          ) : (
            <div className="space-y-6 relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-hairline z-0"></div>
              {(() => {
                const systemLogs = messages.filter(m => m.role === 'system').reverse()[0]?.logs || [];
                return systemLogs.map((log: any, idx: number) => {
                  const isSpinnerActive = isProcessing && log.event === 'working' && idx === systemLogs.length - 1;
                  return (
                    <div key={idx} className="relative z-10 animate-float-up">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                          isSpinnerActive 
                            ? 'bg-white border-hairline text-accent shadow-sm' 
                            : 'bg-sage-soft border-white text-sage'
                        }`}>
                          {isSpinnerActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 bg-surface-soft rounded-lg p-4 border border-hairline shadow-sm">
                          <span className="text-[12px] font-semibold uppercase tracking-widest text-muted block mb-1">
                            {log.title || 'Sistem'}
                          </span>
                          <p className="text-[14px] text-ink leading-relaxed">{log.message}</p>
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
    </div>
  );
}
