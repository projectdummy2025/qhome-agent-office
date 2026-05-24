import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Package, 
  Plus, 
  PanelLeftClose, 
  ShoppingBag, 
  UserCog, 
  Maximize2, 
  Send, 
  ChevronDown, 
  Clock
} from 'lucide-react';

interface HeroSectionProps {
  onStartSimulation: () => void;
  onViewCatalog: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartSimulation, onViewCatalog }) => {
  return (
    <section className="relative overflow-hidden bg-white bg-[url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gridBackground.png')] bg-no-repeat bg-cover bg-center pt-16 pb-28 font-display">
      
      {/* Radial soft ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-red-100/20 blur-3xl pointer-events-none z-0"></div>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Announcement style Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 border border-slate-200 hover:border-slate-350 rounded-full w-max mx-auto px-4 py-2.5 mt-8 bg-white/80 backdrop-blur-sm select-none shadow-sm"
          >
            <span className="text-sm font-semibold text-slate-500">
              Platform Estimasi Material #1 untuk Profesional
            </span>
          </motion.div>
          
          {/* Centered Bold Title */}
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mt-8 mb-6 leading-[1.08] max-w-4xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Hitung Kebutuhan Material {'\n'}
            <span className="bg-gradient-to-r from-accent to-red-500 bg-clip-text text-transparent">
              Proyek Anda
            </span> dalam Hitungan Menit
          </motion.h1>
          
          {/* Subtitle description */}
          <motion.p 
            className="text-sm md:text-base mx-auto max-w-2xl text-center text-slate-600 leading-relaxed max-md:px-2 font-medium mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            QHomeMart membantu arsitek, kontraktor, dan tim procurement mendapatkan estimasi volume material yang akurat, stok real-time, dan spesifikasi teknis — tanpa perlu bolak-balik telepon supplier.
          </motion.p>
          
          {/* Action Buttons */}
          <motion.div 
            className="mx-auto w-full flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button 
              onClick={onStartSimulation}
              className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold transition duration-200 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center"
            >
              Coba Konsultasi Gratis
            </button>
            <button 
              onClick={onViewCatalog}
              className="w-full sm:w-auto flex items-center justify-center border border-slate-300 hover:bg-slate-100/50 rounded-full px-8 py-3.5 text-sm font-bold text-slate-700 transition duration-200 cursor-pointer bg-white/70"
            >
              Lihat Katalog Material
            </button>
          </motion.div>
        </div>

        {/* Pixel-Perfect Static Preview of ChatCanvas Workspace */}
        <motion.div 
          className="w-full rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden relative select-none pointer-events-none"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {/* Mock Browser Header */}
          <div className="w-full h-11 bg-slate-100 border-b border-slate-200 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="rounded bg-white px-4 py-1 text-[11px] text-slate-400 font-mono border border-slate-200/60 w-80 text-center truncate">
              qhomemart.co.id/workspace/chat
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Static Preview
            </span>
          </div>

          {/* Actual Chat Workspace Layout */}
          <div className="flex h-[550px] bg-white overflow-hidden text-slate-900">
            
            {/* Left Sidebar Mockup */}
            <div className="bg-white border-r border-slate-200 flex flex-col h-full w-[260px] flex-shrink-0 hidden md:flex">
              {/* Header Sidebar */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between min-w-[260px]">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[9px] font-semibold text-slate-500 tracking-[0.18em] uppercase">
                    CHAT
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <div className="p-1.5 text-slate-400 bg-slate-50 border border-slate-100 rounded-md">
                    <Package className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="p-1.5 text-slate-400 bg-slate-50 border border-slate-100 rounded-md">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-1.5 text-slate-400 bg-slate-50 border border-slate-100 rounded-md">
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="mx-6 h-px bg-slate-200" />
              
              {/* Search Bar */}
              <div className="px-6 mt-4 min-w-[260px]">
                <div className="relative flex items-center bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                  <Search className="w-3 h-3 text-slate-400 mr-2 flex-shrink-0" />
                  <span className="text-[10px] text-slate-400">Cari simulasi RAB...</span>
                </div>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto pb-4 min-w-[260px] mt-6">
                <div className="px-6">
                  <div className="px-2 mb-2.5 flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">
                      Daftar Simulasi RAB
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Selected Item */}
                    <div className="py-0.5">
                      <div className="w-full flex flex-col justify-center px-3.5 py-2.5 rounded-xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-slate-200">
                        <span className="block text-[9.5px] font-bold uppercase tracking-wider mb-1 text-accent">
                          Lantai
                        </span>
                        <span className="block text-[9.5px] font-semibold text-slate-700 truncate w-full">
                          Granit Carrara Ruang Keluarga
                        </span>
                      </div>
                    </div>
                    {/* Unselected Items */}
                    <div className="py-0.5">
                      <div className="w-full flex flex-col justify-center px-3.5 py-2.5 rounded-xl border bg-transparent border-transparent">
                        <span className="block text-[9.5px] font-bold uppercase tracking-wider mb-1 text-slate-800">
                          Furnitur
                        </span>
                        <span className="block text-[9.5px] font-medium text-slate-500 truncate w-full">
                          Accent Wall Panel Kamar Utama
                        </span>
                      </div>
                    </div>
                    <div className="py-0.5">
                      <div className="w-full flex flex-col justify-center px-3.5 py-2.5 rounded-xl border bg-transparent border-transparent">
                        <span className="block text-[9.5px] font-bold uppercase tracking-wider mb-1 text-slate-800">
                          Bahan Bangunan
                        </span>
                        <span className="block text-[9.5px] font-medium text-slate-500 truncate w-full">
                          Skema Cat Minimalis Japandi
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area Mockup */}
            <div className="flex-1 flex flex-col relative h-full min-w-0 bg-white">
              {/* Chat Header */}
              <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm">
                    <span className="text-[11px] select-none">👤</span>
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-[9.5px] font-bold text-slate-900 leading-none">Ibu Amalia</span>
                      <span className="text-[7.5px] font-light text-slate-300">/</span>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold leading-none">
                        Senior Architect & Designer
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-200 mx-1.5" />
                    <span className="text-[9px] font-bold text-red-500">Keluar</span>
                  </div>
                </div>

                {/* Right side navigation icons */}
                <div className="flex items-center gap-2.5 ml-auto">
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm bg-white border-slate-200 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm bg-white border-slate-200 text-slate-400 relative">
                    <ShoppingBag className="w-3.5 h-3.5 text-accent" />
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm">
                      3
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full border flex items-center justify-center shadow-sm bg-accent/10 border-accent/40 text-accent">
                    <UserCog className="w-3.5 h-3.5" />
                  </div>
                </div>
              </header>

              {/* Chat Feed */}
              <main className="flex-1 overflow-y-auto w-full p-6 space-y-6 bg-white scrollbar-none">
                
                {/* User Message */}
                <div className="flex flex-col items-end w-full animate-float-up">
                  <div className="bg-slate-50/80 border border-slate-200 text-slate-900 px-6 py-3.5 rounded-2xl rounded-tr-none max-w-xl text-[11px] leading-relaxed font-semibold">
                    Halo, tolong hitung kebutuhan granit lantai dan perekat instan untuk luas ruangan 40 m² diagonal.
                  </div>
                </div>

                {/* Agent Response (Thinking block removed) */}
                <div className="w-full mt-4 space-y-4">
                  
                  {/* Narrative outcome with product details formatted as a wrapped paragraph ending with ellipsis */}
                  <div className="max-w-xl text-[11px] text-slate-700 leading-relaxed font-semibold">
                    <p className="text-slate-800">
                      Berdasarkan brief yang diajukan, Ceramic & Tile Estimator telah merekomendasikan penggunaan ubin granit Sandimas Polished 60x60 #11 sebanyak 115 Dus (termasuk wastage margin 10% pola diagonal), dikombinasikan dengan 12 Sak Semen Perekat instan MortarOne (berat 40 kg/sak), serta 6 Unit Grout Nat anti-bakteri. Perhitungan logistik pengiriman dari Gudang Pusat QHomeMart Sleman saat ini sedang diinisiasi...
                    </p>
                  </div>

                </div>
              </main>

              {/* B2B Prompt Console mockup */}
              <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-6 pb-6 px-6 border-t border-slate-200">
                <div className="max-w-3xl mx-auto">
                  <div className="relative flex items-end bg-white border border-slate-200 rounded-[26px] pl-6 pr-2.5 py-2.5 shadow-sm gap-3 justify-between">
                    <span className="flex-1 bg-transparent py-1.5 text-[11px] leading-relaxed text-slate-400 min-h-[22px] font-medium">
                      Sampaikan spesifikasi area, dimensi ruang, atau kebutuhan material proyek Anda...
                    </span>
                    <div className="w-9.5 h-9.5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-9.5 h-9.5 rounded-full bg-slate-950 text-white flex items-center justify-center">
                      <Send className="w-3.5 h-3.5 mr-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Mockup (Aktivitas Staf berdasarkan AgentRoster.md) */}
            <div className="bg-white border-l border-slate-200 flex flex-col h-full w-[300px] flex-shrink-0 hidden lg:flex">
              {/* Sidebar Header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between min-w-[300px]">
                <div className="flex items-center gap-3">
                  <UserCog className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[9px] font-semibold text-slate-500 tracking-[0.18em] uppercase">
                    Aktivitas Staf Kantor
                  </span>
                </div>
                <button className="p-1 text-slate-400">
                  <ChevronDown className="w-3 h-3 -rotate-90" />
                </button>
              </div>
              <div className="mx-6 h-px bg-slate-200" />

              {/* Log Timeline with Digital Employees from AgentRoster.md */}
              <div className="flex-1 overflow-y-auto min-w-[300px] px-6 py-5 space-y-4 scrollbar-none">
                
                {/* Log 1: Chief Project Supervisor */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-white border-2 border-slate-300" />
                    <div className="w-px flex-1 bg-slate-200 mt-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-800">
                        Chief Project Supervisor
                      </span>
                      <span className="text-[7.5px] text-slate-400 font-mono">selesai</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      Menganalisis brief pelanggan dan menugaskan pengerjaan estimasi lantai dan cat.
                    </p>
                  </div>
                </div>

                {/* Log 2: Ceramic & Tile Estimator */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-white border-2 border-slate-300" />
                    <div className="w-px flex-1 bg-slate-200 mt-1.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-800">
                        Ceramic & Tile Estimator
                      </span>
                      <span className="text-[7.5px] text-slate-400 font-mono">selesai</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      Menghitung volume ubin granit 60x60 cm sebanyak 115 dus dan 12 sak perekat instan.
                    </p>
                  </div>
                </div>

                {/* Log 3: Color & Coating Consultant */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-white border-2 border-slate-300" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-800">
                        Color & Coating Consultant
                      </span>
                      <span className="text-[7.5px] text-slate-400 font-mono">selesai</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      Menentukan warna cat interior yang serasi dan menghitung volume cat 2 pail.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;