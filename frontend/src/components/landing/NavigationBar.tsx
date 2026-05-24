import React from 'react';

interface NavigationBarProps {
  onViewCatalog: () => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ onViewCatalog }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm py-3 font-display">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex flex-col select-none cursor-pointer">
          <span className="text-[17px] font-extrabold tracking-tight text-slate-900 leading-none uppercase">
            QHomeMart
          </span>
          <span className="text-[11px] font-mono tracking-widest text-slate-400 mt-1.5 uppercase">
            Enterprise
          </span>
        </div>


        {/* CTA Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onViewCatalog}
            className="rounded-full bg-slate-950 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-accent hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none cursor-pointer"
          >
            Katalog Material
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
