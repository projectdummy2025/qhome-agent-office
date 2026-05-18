import { useState, useEffect, useRef } from 'react';
import { Bot, User, Loader2, Send, CheckCircle2, Cpu, ChevronDown, ChevronUp, Plus, Search, MessageSquare, PanelLeftClose, PanelLeftOpen, Sparkles, Home, ShoppingBag, ArrowRight } from 'lucide-react';

export default function App() {
  const [brief, setBrief] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAgents]);

  const handleNewChat = () => {
    setMessages([]);
    setBrief("");
    setCurrentSessionId(null);
  };

  const handleHire = async () => {
    if (!brief.trim()) return;
    
    if (!currentSessionId) {
       setChatHistory(prev => [brief, ...prev]);
    }
    
    setMessages(prev => [...prev, { role: "user", content: brief }]);
    setBrief("");
    setIsProcessing(true);
    setActiveAgents([]);
    
    try {
      const res = await fetch("http://localhost:8000/api/projects/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, session_id: currentSessionId })
      });
      const dataInfo = await res.json();
      setCurrentSessionId(dataInfo.session_id);
      
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

        if (data.event === "working" && data.agent) {
           setActiveAgents(prev => Array.from(new Set([...prev, data.agent])));
        }

        if (data.event === "completed") {
          sse.close();
          setIsProcessing(false);
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
    <div className="flex h-screen bg-[#faf9f7] font-sans overflow-hidden">
      
      {/* Left Sidebar */}
      <div className={`bg-[#f4f2ef] text-[#3d3935] flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[#e5e1da] ${isSidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden border-none'}`}>
        <div className="p-4 flex items-center justify-between min-w-[260px]">
          <button onClick={handleNewChat} className="p-2 text-[#7c7872] hover:text-[#1c1916] rounded-xl hover:bg-white/60 transition-all" title="Konsultasi Baru">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-[#7c7872] hover:text-[#1c1916] rounded-xl hover:bg-white/60 transition-all" title="Tutup Sidebar">
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-warm pb-4 min-w-[260px]">
          <div className="px-4 space-y-1 mt-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 transition-all text-[14px] font-medium text-[#3d3935]">
              <Search className="w-4 h-4 text-[#7c7872]" /> Cari Desain
            </button>
          </div>

          <div className="mt-8 px-4">
            <div className="px-4 mb-3">
              <span className="text-[11px] font-semibold text-[#b5b0a8] uppercase tracking-widest">Riwayat Proyek</span>
            </div>
            <div className="space-y-1">
              {chatHistory.length === 0 ? (
                <p className="text-[13px] text-[#7c7872] px-4 py-2">Belum ada riwayat.</p>
              ) : (
                chatHistory.map((historyItem, idx) => (
                  <button key={idx} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 transition-all text-sm text-left group">
                    <MessageSquare className="w-4 h-4 text-[#b5b0a8] shrink-0 group-hover:text-[#c47c5a] transition-colors" />
                    <span className="truncate text-[#3d3935] font-medium">{historyItem}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#e5e1da] flex items-center gap-4 hover:bg-white/60 cursor-pointer transition-all min-w-[260px]">
          <div className="w-9 h-9 rounded-full bg-[#e8c5b0] flex items-center justify-center text-[#b36a47] text-sm font-semibold">
            AH
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium text-[#1c1916]">Ahmad</span>
            <span className="text-[11px] text-[#7c7872]">Klien VIP</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0 bg-[#faf9f7]">
        
        {/* Header */}
        <header className="px-6 py-4 bg-[#faf9f7]/90 backdrop-blur-xl border-b border-[#e5e1da] flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-1 text-[#7c7872] hover:text-[#1c1916] rounded-xl hover:bg-[#f4f2ef] transition-all">
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5ede7] flex items-center justify-center">
                <Home className="w-4 h-4 text-[#c47c5a]" />
              </div>
              <h1 className="text-[18px] font-display text-[#1c1916] tracking-wide flex items-center gap-2">
                QHome <span className="font-sans text-[15px] text-[#7c7872] font-normal">Atelier</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeAgents.length > 0 && (
               <div className="flex -space-x-2 mr-3">
                 {activeAgents.map(a => (
                   <div key={a} className="w-8 h-8 rounded-full bg-white border-2 border-[#faf9f7] flex items-center justify-center text-[10px] font-bold text-[#7a9e8e] shadow-sm glow-sage animate-breathe" title={a}>
                     {a.substring(0,2).toUpperCase()}
                   </div>
                 ))}
               </div>
            )}
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} 
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 text-[13px] font-medium ${isRightSidebarOpen ? 'bg-[#7a9e8e] text-white shadow-md' : 'bg-[#f4f2ef] text-[#7c7872] hover:text-[#1c1916] hover:bg-[#ede9e3]'}`}
            >
              <Cpu className="w-4 h-4" />
              <span>Dapur Desain</span>
            </button>
          </div>
        </header>

        {/* Chat History */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-warm">
          <div className="p-6 md:p-10 space-y-10 w-full max-w-4xl mx-auto pb-40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-float-up min-h-[65vh]">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#f5ede7] rounded-full blur-2xl opacity-60"></div>
                  <div className="w-24 h-24 bg-gradient-to-br from-[#f5ede7] to-[#ede9e3] rounded-[2rem] flex items-center justify-center shadow-sm relative rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Sparkles className="w-10 h-10 text-[#c47c5a]" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="space-y-4 max-w-lg">
                  <h2 className="text-4xl md:text-5xl font-display text-[#1c1916] leading-tight">
                    Wujudkan ruang<br />impian Anda.
                  </h2>
                  <p className="text-[#7c7872] text-[16px] leading-relaxed">
                    Ceritakan visi Anda, dan tim desain kami akan meracik gaya, material, hingga kalkulasi yang presisi untuk harmoni hunian Anda.
                  </p>
                </div>
                
                <div className="flex gap-4 mt-8">
                  {["Kamar Tidur Japandi", "Dapur Minimalis", "Ruang Keluarga Hangat"].map((s, i) => (
                    <button key={i} onClick={() => setBrief(`Saya ingin mendesain ulang ${s.toLowerCase()} agar terasa lebih nyaman...`)} className="px-5 py-2.5 rounded-full bg-white border border-[#e5e1da] text-[13px] text-[#3d3935] hover:border-[#c47c5a] hover:text-[#c47c5a] transition-all shadow-sm">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-float-up w-full`}>
                  
                  {msg.role === 'user' && (
                    <div className="bg-[#f5ede7] text-[#1c1916] px-6 py-4 rounded-3xl rounded-tr-xl max-w-2xl text-[15px] leading-relaxed">
                      {msg.content}
                    </div>
                  )}

                  {msg.role === 'system' && (
                    <div className="w-full flex gap-5 mt-6">
                      <div className="w-10 h-10 bg-white border border-[#e5e1da] rounded-2xl flex items-center justify-center text-[#c47c5a] flex-shrink-0 mt-1 shadow-sm">
                        <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 max-w-3xl text-[15.5px] text-[#3d3935] leading-[1.7]">
                        
                        {msg.status !== 'completed' && (
                          <div className="mb-6 flex items-center gap-3 px-5 py-3 bg-[#edf3f0]/60 border border-[#c4d9d1]/50 rounded-2xl text-[#7a9e8e] text-[14px] font-medium animate-breathe">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Merapikan inspirasi dan kalkulasi (Lihat proses di Dapur Desain)...</span>
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
                                             <span className="w-1.5 h-1.5 rounded-full bg-[#c47c5a] mt-2.5 flex-shrink-0"></span>
                                             <span dangerouslySetInnerHTML={{ __html: li.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1c1916]">$1</strong>') }} />
                                           </li>
                                         ))}
                                       </ul>
                                     );
                                   }
                                   return <p key={idx} dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1c1916]">$1</strong>') }} />;
                                 })}
                               </div>
                            ) : (
                               <p className="text-[#7c7872] italic">Menyiapkan kurasi material...</p>
                            )}
                            
                            {/* Premium Quote/Proposal Card */}
                            {msg.products && msg.products.length > 0 && (
                              <div className="bg-white rounded-3xl border border-[#e5e1da] shadow-sm overflow-hidden mt-8 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c47c5a] to-[#e8c5b0]"></div>
                                <div className="px-7 py-5 border-b border-[#e5e1da] flex justify-between items-center bg-[#faf9f7]">
                                  <h4 className="font-display text-[20px] text-[#1c1916]">Kurasi Material</h4>
                                  <span className="text-[12px] font-semibold tracking-widest uppercase text-[#b5b0a8]">RAB Est.</span>
                                </div>
                                <div className="p-7 space-y-5">
                                  {msg.products.map((prod: any, pIdx: number) => (
                                    <div key={pIdx} className="flex justify-between items-center group">
                                      <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#f4f2ef] rounded-xl flex items-center justify-center text-[13px] text-[#7c7872] font-semibold uppercase group-hover:bg-[#f5ede7] group-hover:text-[#c47c5a] transition-colors">
                                          {prod.name.substring(0,2)}
                                        </div>
                                        <div>
                                          <p className="font-medium text-[15px] text-[#1c1916]">{prod.name}</p>
                                          <p className="text-[13px] text-[#7c7872] mt-0.5">Vol: {prod.qty}</p>
                                        </div>
                                      </div>
                                      <p className="font-medium text-[15px] text-[#1c1916]">Rp {prod.total.toLocaleString('id-ID')}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="bg-[#1c1916] p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                                  <div>
                                    <p className="text-[12px] font-medium text-[#7c7872] uppercase tracking-wider mb-1">Total Estimasi Investasi</p>
                                    <p className="text-2xl font-display text-white">
                                      Rp {msg.products.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                  <button className="w-full sm:w-auto bg-[#c47c5a] text-white px-6 py-3.5 rounded-full text-[14px] font-medium hover:bg-[#b36a47] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c47c5a]/20">
                                    <ShoppingBag className="w-4 h-4" /> Wujudkan Sekarang
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#faf9f7] via-[#faf9f7] to-transparent pt-16 pb-8 px-6 z-10">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#e8c5b0] to-[#e5e1da] rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Ceritakan ruangan yang ingin Anda percantik..."
              disabled={isProcessing}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleHire();
                }
              }}
              className="relative w-full bg-white border border-[#e5e1da] focus:border-[#c47c5a] focus:ring-4 focus:ring-[#f5ede7] rounded-[2rem] pl-7 pr-16 py-5 text-[15px] focus:outline-none resize-none overflow-hidden min-h-[64px] max-h-[200px] transition-all disabled:opacity-60 disabled:bg-[#f4f2ef] shadow-sm text-[#1c1916] placeholder:text-[#b5b0a8]"
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
              className="absolute right-3.5 bottom-3.5 w-11 h-11 bg-[#1c1916] hover:bg-[#c47c5a] text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:bg-[#e5e1da] transition-all shadow-md"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[12px] text-[#b5b0a8] mt-4 font-medium tracking-wide">QHome Atelier • Dirancang oleh Kecerdasan Buatan</p>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`bg-[#ffffff] border-l border-[#e5e1da] flex flex-col h-full flex-shrink-0 transition-all duration-300 ease-in-out shadow-sm ${isRightSidebarOpen ? 'w-[340px]' : 'w-0 overflow-hidden border-none'}`}>
        <div className="p-5 border-b border-[#e5e1da] flex items-center justify-between min-w-[340px] bg-[#faf9f7]">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#7a9e8e]" />
            <h3 className="font-display text-[#1c1916] text-[17px]">Dapur Desain</h3>
          </div>
          <button onClick={() => setIsRightSidebarOpen(false)} className="p-1.5 text-[#b5b0a8] hover:text-[#1c1916] rounded-xl hover:bg-[#ede9e3] transition-colors">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 min-w-[340px] bg-white scrollbar-warm">
          {messages.length === 0 || !messages.find(m => m.role === 'system') ? (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
               <Cpu className="w-12 h-12 mb-4 text-[#b5b0a8]" strokeWidth={1} />
               <p className="text-[13px] text-[#7c7872] max-w-[200px]">Belum ada proses analisis yang berjalan.</p>
             </div>
          ) : (
            <div className="space-y-6 relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-[#e5e1da] z-0"></div>
              {messages.filter(m => m.role === 'system').reverse()[0]?.logs?.map((log: any, idx: number) => (
                 <div key={idx} className="relative z-10 animate-float-up">
                   <div className="flex items-start gap-4">
                     <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${log.event === 'completed' ? 'bg-[#edf3f0] border-white text-[#7a9e8e]' : 'bg-white border-[#e5e1da] text-[#c47c5a] shadow-sm'}`}>
                       {log.event === 'working' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                     </div>
                     <div className="flex-1 bg-[#faf9f7] rounded-2xl p-4 border border-[#e5e1da] shadow-sm">
                       <span className="text-[12px] font-semibold uppercase tracking-widest text-[#7c7872] block mb-1">
                         {log.title || 'Sistem'}
                       </span>
                       <p className="text-[14px] text-[#1c1916] leading-relaxed">{log.message}</p>
                     </div>
                   </div>
                 </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
