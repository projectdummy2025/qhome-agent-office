import React from 'react';
import { motion } from 'framer-motion';

interface CatalogPreviewProps {
  onViewCatalog: (categoryId?: string, search?: string) => void;
}

const categoryList = [
  {
    name: 'Building Material',
    description: 'Semen instan, bahan pengikat, dan material dasar konstruksi berkualitas tinggi.',
    accent: 'from-amber-100 via-white to-white',
    border: 'border-amber-100',
    categoryId: 'building material',
  },
  {
    name: 'Floor',
    description: 'Ubin keramik, granit, dan tile premium untuk estetika lantai terbaik.',
    accent: 'from-blue-100 via-white to-white',
    border: 'border-blue-100',
    categoryId: 'floor',
  },
  {
    name: 'Furniture',
    description: 'Kursi, rak, lemari, panel kayu, dan kebutuhan interior fungsional.',
    accent: 'from-emerald-100 via-white to-white',
    border: 'border-emerald-100',
    categoryId: 'furniture',
  },
  {
    name: 'Sanitary & Plumbing',
    description: 'Toilet close coupled, shower, wastafel, kran, dan sistem perpipaan lengkap.',
    accent: 'from-cyan-100 via-white to-white',
    border: 'border-cyan-100',
    categoryId: 'sanitary & plumbing',
  },
  {
    name: 'Electrical & Lighting',
    description: 'Kabel saklar, lampu LED, fitting, dan kelistrikan proyek berkualitas tinggi.',
    accent: 'from-yellow-100 via-white to-white',
    border: 'border-yellow-100',
    categoryId: 'electrical & lighting',
  },
  {
    name: 'Appliance & Household',
    description: 'Peralatan elektronik rumah tangga, microwave, dan perlengkapan hunian modern.',
    accent: 'from-purple-100 via-white to-white',
    border: 'border-purple-100',
    categoryId: 'appliance & household',
  },
];

const CatalogPreview: React.FC<CatalogPreviewProps> = ({ onViewCatalog }) => {
  return (
    <section className="py-16 md:py-24 bg-white font-display border-t border-slate-100">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-bold text-accent uppercase tracking-wider block mb-3 font-mono">
            Katalog Unggulan
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">
            Katalog Material Pilihan
          </h2>
          <p className="text-sm sm:text-base font-semibold text-slate-500">
            Dari struktur hingga finishing semua tersedia dengan spesifikasi teknis lengkap.
          </p>
        </div>

        {/* 3x2 Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          {categoryList.map((category, index) => (
            <motion.div
              key={index}
              className={`group relative cursor-pointer overflow-hidden rounded-[28px] border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${category.border}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              onClick={() => onViewCatalog(category.categoryId)}
            >
              <div className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${category.accent}`} />
              <div className="relative flex min-h-[230px] flex-col justify-between p-6 sm:p-8">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Kategori
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {category.name}
                  </h3>
                  <p className="max-w-xl text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>
                </div>
                <div className="pt-6">
                  <span className="text-sm font-semibold text-slate-900">
                    Lihat Katalog
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button below grid */}
        <div className="text-center">
          <button 
            onClick={() => onViewCatalog()}
            className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-transparent px-8 py-3.5 text-sm font-bold text-slate-700 hover:border-slate-950 hover:text-slate-950 transition-all duration-200 cursor-pointer"
          >
            Lihat Semua Kategori
          </button>
        </div>

      </div>
    </section>
  );
};

export default CatalogPreview;