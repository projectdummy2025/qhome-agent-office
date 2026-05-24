import React from 'react';
import { X } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (role: string) => void;
}

const consultantList = [
  {
    id: 1,
    role: 'architect',
    name: 'Ibu Amalia',
    label: 'Senior Architect & Designer',
    description: 'Evaluasi keselarasan gaya arsitektural, spesifikasi material premium, integrasi visual, dan penyusunan moodboard interior B2B.',
    borderClass: 'border-slate-100 hover:border-blue-400/60 hover:shadow-[0_12px_30px_-5px_rgba(59,130,246,0.08)]',
    glowColor: 'bg-blue-400/10'
  },
  {
    id: 2,
    role: 'contractor',
    name: 'Bapak Joko',
    label: 'General Contractor & Engineer',
    description: 'Kalkulator volume struktural proyek, perhitungan wastage margin semen/perekat, verifikasi standar teknis, dan rancangan RAB.',
    borderClass: 'border-slate-100 hover:border-emerald-400/60 hover:shadow-[0_12px_30px_-5px_rgba(16,185,129,0.08)]',
    glowColor: 'bg-emerald-400/10'
  },
  {
    id: 3,
    role: 'retailer',
    name: 'Ibu Santi',
    label: 'Retail & Procurement Partner',
    description: 'Pemesanan volume besar (bulk procurement), koordinasi alokasi stok pergudangan terdistribusi, dan negosiasi pricing tier korporat.',
    borderClass: 'border-slate-100 hover:border-violet-400/60 hover:shadow-[0_12px_30px_-5px_rgba(139,92,246,0.08)]',
    glowColor: 'bg-purple-400/10'
  },
  {
    id: 4,
    role: 'admin',
    name: 'Bapak Rudi',
    label: 'Lead System Administrator',
    description: 'Manajemen otorisasi diskon volume, intervensi stok kritis, pemutakhiran master catalog, dan audit log koordinasi antar staf.',
    borderClass: 'border-slate-100 hover:border-amber-400/60 hover:shadow-[0_12px_30px_-5px_rgba(245,158,11,0.08)]',
    glowColor: 'bg-amber-400/10',
    isMuted: true
  }
];

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, onSelectPersona }) => {
  if (!isOpen) {
    return null;
  }

  const handleSelect = (consultant: typeof consultantList[0]) => {
    // Update URL query parameters for persona tracking
    window.history.pushState({}, '', `/chat?persona=${consultant.id}`);
    onSelectPersona(consultant.role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl rounded-[32px] bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh] font-display border border-slate-100"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-10 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Block */}
        <div className="px-8 pt-10 pb-8 text-center border-b border-slate-100 bg-slate-50/30 flex flex-col items-center">
          <div className="mb-2 bg-accent/10 border border-accent/25 text-[10px] tracking-[0.2em] uppercase font-bold text-accent px-3 py-1 rounded-full w-max select-none">
            Simulasi B2B
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-2.5 uppercase tracking-[0.12em]">
            Pilih Persona Simulasi
          </h2>
          <p className="text-sm font-semibold text-slate-500 max-w-md leading-relaxed">
            Pilih salah satu persona profesional berikut untuk mensimulasikan alur kerja estimasi dan pengadaan material B2B
          </p>
        </div>

        {/* Grid Section */}
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {consultantList.map((consultant) => {
              return (
                <div 
                  key={consultant.id}
                  onClick={() => handleSelect(consultant)}
                  className={`group cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 relative overflow-hidden bg-white flex flex-col justify-between
                    ${consultant.isMuted 
                      ? 'bg-slate-50/40 opacity-90 border-slate-200/50 hover:bg-white hover:opacity-100' 
                      : 'border-slate-200/80 hover:-translate-y-0.5'
                    } ${consultant.borderClass}`}
                >
                  {/* Decorative Radial Glow */}
                  <div className={`absolute -right-12 -bottom-12 w-36 h-36 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${consultant.glowColor}`} />

                  <div className="relative z-10">
                    {/* Title */}
                    <h3 className="text-base md:text-lg font-bold mb-1 transition-colors duration-200 text-slate-900 group-hover:text-accent">
                      {consultant.name}
                    </h3>
                    
                    {/* Monospace Label */}
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-4 block leading-none">
                      {consultant.label}
                    </p>
                    
                    {/* Description */}
                    <p className="text-xs md:text-sm leading-relaxed font-semibold text-slate-500 group-hover:text-slate-600 transition-colors duration-200">
                      {consultant.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationModal;