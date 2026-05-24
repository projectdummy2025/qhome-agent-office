import React from 'react';
import { CheckCircle } from 'lucide-react';

const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface BentoItem {
  title: string;
  meta: string;
  description: string;
  indicator: string;
  status: string;
  tags: string[];
  colSpan: string;
  hasPersistentHover?: boolean;
}

const FeaturesSection: React.FC = () => {
  const partners = [
    'Adhi Karya',
    'Wijaya Karya',
    'Pembangunan Perumahan',
    'Waskita Karya',
    'Jaya Konstruksi',
  ];

  const features: BentoItem[] = [
    {
      title: 'Kalkulasi Estimasi Material',
      meta: 'Presisi Teknis',
      description:
        'Masukkan spesifikasi dimensi proyek untuk mendapatkan perhitungan kebutuhan material secara menyeluruh dan akurat. Sistem kami menganalisis setiap elemen untuk memastikan estimasi yang tepat.',
      indicator: '01',
      status: 'Aktif',
      tags: ['Estimasi', 'Akurasi', 'Perhitungan'],
      colSpan: 'md:col-span-2 col-span-1',
      hasPersistentHover: true,
    },
    {
      title: 'Ketersediaan Persediaan Real-Time',
      meta: 'Sinkronisasi Langsung',
      description:
        'Verifikasi ketersediaan material sebelum melakukan pemesanan. Informasi stok yang terkini membantu perencanaan proyek yang lebih baik dan efisien.',
      indicator: '02',
      status: 'Sinkron',
      tags: ['Inventaris', 'Logistik'],
      colSpan: 'col-span-1',
    },
    {
      title: 'Katalog Material Komprehensif',
      meta: 'Database Lengkap',
      description:
        'Akses basis data material berkualitas tinggi dengan spesifikasi teknis rinci, daftar harga berdasarkan volume, dan opsi material alternatif untuk fleksibilitas desain proyek Anda.',
      indicator: '03',
      status: 'Terpelihara',
      tags: ['Katalog', 'Spesifikasi', 'Referensi'],
      colSpan: 'md:col-span-3 col-span-1',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 border-t border-slate-200/50 font-display">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        
        {/* Social Proof Section */}
        <div className="mb-28 text-center">
          <span className="text-sm font-mono text-slate-500 tracking-wide block mb-10">
            Dipercaya oleh lebih dari 200 perusahaan konstruksi dan firma desain terkemuka
          </span>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-50 hover:opacity-85 transition-opacity duration-300">
            {partners.map((partnerName, index) => (
              <div key={index} className="flex items-center gap-2 select-none">
                <CheckCircle className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-sm text-slate-700 tracking-tight font-display">
                  {partnerName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-accent tracking-wide block mb-4">
            Solusi Terintegrasi Kami
          </span>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">
            Platform Manajemen Material Terpercaya
          </h2>
        </div>

        {/* Bento Grid Layout (adapted from sample.tsx) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((item, index) => (
            <div
              key={index}
              className={cn(
                'group relative flex h-full flex-col rounded-xl overflow-hidden transition-all duration-300',
                'border border-slate-200 bg-white shadow-sm',
                'hover:shadow-lg hover:border-slate-300 will-change-transform',
                item.colSpan,
                item.hasPersistentHover ? 'shadow-md border-slate-300' : ''
              )}
            >
              {/* Subtle background accent on hover */}
              <div
                className={cn(
                  'absolute top-0 left-0 w-24 h-24 rounded-full transition-opacity duration-300 -z-10',
                  'bg-gradient-to-br from-accent/5 to-transparent',
                  item.hasPersistentHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              />

              {/* Bento Card Body */}
              <div className="relative flex flex-1 flex-col justify-between p-8">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="text-4xl font-light text-accent/40 leading-none select-none">
                      {item.indicator}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold px-3 py-1.5 rounded-md',
                        'bg-slate-100 text-slate-600',
                        'transition-colors duration-300 group-hover:bg-accent/10 group-hover:text-accent whitespace-nowrap'
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 tracking-tight text-lg leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
                      {item.meta}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 rounded text-xs font-medium text-slate-600 bg-slate-50 transition-all duration-200 hover:bg-slate-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;