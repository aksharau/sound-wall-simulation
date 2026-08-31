import React from 'react';
import { AcousticSimulationParams } from '../types';
import { MATERIAL_PRESETS } from '../physics/acoustics';
import { Waves, Sparkles, RotateCcw, Volume2, Shield, Layers } from 'lucide-react';

interface HeaderProps {
  onApplyScenario: (updates: Partial<AcousticSimulationParams>) => void;
  onResetDefaults: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onApplyScenario, onResetDefaults }) => {
  const scenarios = [
    {
      label: 'Apartment Bass Leak',
      icon: '🔊',
      desc: '60 Hz bass easily penetrates drywall',
      config: {
        frequency: 60,
        wallThickness: 0.015,
        material: MATERIAL_PRESETS.find((m) => m.id === 'drywall') || MATERIAL_PRESETS[2],
        simulationSpeed: 0.5,
      },
    },
    {
      label: 'Studio Soundproofing',
      icon: '🛡️',
      desc: 'Dense 30cm concrete with 60dB+ loss',
      config: {
        frequency: 1000,
        wallThickness: 0.30,
        material: MATERIAL_PRESETS.find((m) => m.id === 'concrete') || MATERIAL_PRESETS[0],
        simulationSpeed: 1.0,
      },
    },
    {
      label: 'Glass Half-Wave Peak',
      icon: '⚡',
      desc: 'Resonance transparency at exact d ≈ λ/2',
      config: {
        frequency: 2000,
        wallThickness: 0.02,
        material: MATERIAL_PRESETS.find((m) => m.id === 'glass') || MATERIAL_PRESETS[3],
        simulationSpeed: 0.75,
      },
    },
    {
      label: 'Acoustic Foam Absorption',
      icon: '🧽',
      desc: 'Viscous damping dissipation',
      config: {
        frequency: 1500,
        wallThickness: 0.10,
        material: MATERIAL_PRESETS.find((m) => m.id === 'foam') || MATERIAL_PRESETS[5],
        simulationSpeed: 1.0,
      },
    },
  ];

  return (
    <header className="flex flex-col gap-3 pb-3 border-b border-[#1e293b]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-400 text-black shadow-lg shadow-cyan-500/20">
            <Waves className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Sound Wave Wall Simulator
            </h1>
            <p className="text-xs text-[#94a3b8]">
              Interactive acoustic physics showing reflection, transmission, and attenuation through variable thickness barriers
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="reset-all-defaults-btn"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161f30] hover:bg-[#1e293b] text-[#cbd5e1] hover:text-white border border-[#1e293b] text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Setup</span>
          </button>
        </div>
      </div>

      {/* Preset Scenarios Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Presets:
        </span>
        {scenarios.map((sc) => (
          <button
            key={sc.label}
            id={`scenario-${sc.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onApplyScenario(sc.config)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#111827] hover:bg-[#1e293b] text-[#cbd5e1] hover:text-cyan-300 border border-[#1e293b] hover:border-cyan-800 text-xs font-medium whitespace-nowrap transition-all"
          >
            <span>{sc.icon}</span>
            <span>{sc.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
