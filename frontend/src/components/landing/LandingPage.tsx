import React, { useState } from 'react';
import NavigationBar from './NavigationBar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import CatalogPreview from './CatalogPreview';
import PageFooter from './PageFooter';
import SimulationModal from './SimulationModal';

interface LandingPageProps {
  onSelectPersona: (role: string) => void;
  onViewCatalog: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectPersona, onViewCatalog }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-red-100 selection:text-red-900">
      <NavigationBar 
        onViewCatalog={onViewCatalog} 
      />
      
      <main>
        <HeroSection 
          onStartSimulation={() => setModalOpen(true)} 
          onViewCatalog={onViewCatalog} 
        />
        <FeaturesSection />
        <CatalogPreview onViewCatalog={onViewCatalog} />
      </main>

      <PageFooter />

      <SimulationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelectPersona={onSelectPersona} 
      />
    </div>
  );
};

export default LandingPage;