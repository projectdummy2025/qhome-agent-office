import { FileText, Download, ArrowLeft, Clock } from 'lucide-react';

export default function OrderHistory({
  chatHistory,
  onBack,
  onDownloadPdf
}: {
  chatHistory: any[];
  onBack: () => void;
  onDownloadPdf: (sessionId: string) => void;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-ink">
      <header className="w-full border-b border-hairline bg-canvas sticky top-0 z-40">
        <div className="max-w-[1400px] w-full mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-ink tracking-widest uppercase">QHomeMart</span>
            <span className="text-[11px] font-light text-muted-light">/</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mt-0.5">Order History</span>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-wider text-muted hover:text-ink transition-colors cursor-pointer focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </header>

      <div className="w-full max-w-[1000px] mx-auto flex-1 flex flex-col px-6 md:px-12 py-10">
        <div className="mb-8 border-b border-hairline/60 pb-5 flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-light tracking-tight text-ink">
              Riwayat <span className="font-extrabold">Pesanan & Estimasi</span>
            </h1>
            <p className="text-[13px] text-muted mt-1.5 font-medium">Daftar arsip sesi konsultasi B2B dan dokumen nota PDF Anda.</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full border border-hairline flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5 text-accent" />
          </div>
        </div>

        {chatHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-surface-soft border border-hairline flex items-center justify-center text-muted-light mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-[18px] font-bold text-ink tracking-tight">Belum Ada Riwayat</h2>
            <p className="text-[12.5px] text-muted max-w-sm mt-1 mb-6 leading-relaxed">
              Anda belum memiliki riwayat pesanan atau estimasi yang tersimpan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chatHistory.map((session, idx) => {
              let titleDisplay = session.title || "";
              titleDisplay = titleDisplay.replace(/<think>[\s\S]*?<\/think>/gi, "");
              titleDisplay = titleDisplay.replace(/<think>[\s\S]*/gi, "").trim();
              if (!titleDisplay) {
                titleDisplay = "Konsultasi B2B";
              }

              return (
                <div key={session.id || idx} className="bg-white border border-hairline p-5 rounded-2xl flex flex-col gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-accent/40 transition-colors">
                  <div>
                    <h3 className="text-[14.5px] font-bold text-ink truncate mb-1">{titleDisplay}</h3>
                    <p className="text-[11.5px] text-muted-light font-mono truncate">{session.id}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-hairline/60 flex justify-end">
                    <button
                      onClick={() => onDownloadPdf(session.id)}
                      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all flex items-center gap-1.5 focus:outline-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
