import React from 'react';
import { AcousticSimulationParams, PhysicsResults, VisualizationMode, Material } from '../types';
import { MATERIAL_PRESETS } from '../physics/acoustics';
import { 
  Sliders, 
  Layers, 
  Activity, 
  Waves, 
  Zap, 
  Sparkles, 
  Grid, 
  Gauge, 
  Volume2, 
  Info,
  Radio
} from 'lucide-react';

interface ControlPanelProps {
  params: AcousticSimulationParams;
  physics: PhysicsResults;
  mode: VisualizationMode;
  onSetMode: (mode: VisualizationMode) => void;
  onUpdateParams: (updates: Partial<AcousticSimulationParams>) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  physics,
  mode,
  onSetMode,
  onUpdateParams,
}) => {
  // Preset frequency bands
  const frequencyPresets = [
    { label: 'Sub-bass', freq: 60, desc: 'Deep rumble' },
    { label: 'Bass', freq: 120, desc: 'Kick & Bassline' },
    { label: 'Mid Speech', freq: 500, desc: 'Human Vowels' },
    { label: 'Upper Mid', freq: 1500, desc: 'Consonants' },
    { label: 'High Treble', freq: 3500, desc: 'Sharp Sibilance' },
  ];

  // Preset thickness sizes
  const thicknessPresets = [
    { label: 'Glass', thickness: 0.008, desc: '8 mm' },
    { label: 'Drywall', thickness: 0.015, desc: '1.5 cm' },
    { label: 'Stud Wall', thickness: 0.05, desc: '5 cm' },
    { label: 'Brick', thickness: 0.15, desc: '15 cm' },
    { label: 'Concrete', thickness: 0.30, desc: '30 cm' },
  ];

  const handleCustomMaterialChange = (field: keyof Material, value: number) => {
    if (params.material.id === 'custom') {
      onUpdateParams({
        material: {
          ...params.material,
          [field]: value,
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-[#111827] rounded-xl border border-[#1e293b] text-[#d1d5db] shadow-xl">
      {/* 1. Visualization Mode Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Visualization Mode
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            id="mode-particles-btn"
            onClick={() => onSetMode('particles')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
              mode === 'particles'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-[#161f30] border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
            }`}
          >
            <Grid className="w-4 h-4 mb-1 text-cyan-400" />
            <span className="font-semibold">Air Molecules</span>
            <span className="text-[10px] text-[#64748b]">Compression grid</span>
          </button>

          <button
            id="mode-waveform-btn"
            onClick={() => onSetMode('waveform')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
              mode === 'waveform'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-[#161f30] border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
            }`}
          >
            <Waves className="w-4 h-4 mb-1 text-cyan-400" />
            <span className="font-semibold">Pressure Wave</span>
            <span className="text-[10px] text-[#64748b]">Superposition 1D</span>
          </button>

          <button
            id="mode-heatmap-btn"
            onClick={() => onSetMode('heatmap')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
              mode === 'heatmap'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-[#161f30] border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
            }`}
          >
            <Layers className="w-4 h-4 mb-1 text-cyan-400" />
            <span className="font-semibold">Pressure Field</span>
            <span className="text-[10px] text-[#64748b]">2D Wavefronts</span>
          </button>

          <button
            id="mode-pulse-btn"
            onClick={() => onSetMode('pulse')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
              mode === 'pulse'
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/50'
                : 'bg-[#161f30] border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
            }`}
          >
            <Zap className="w-4 h-4 mb-1 text-cyan-400" />
            <span className="font-semibold">Wave Packet</span>
            <span className="text-[10px] text-[#64748b]">Pulse transit</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-[#1e293b]" />

      {/* 2. Frequency & Wavelength Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="freq-slider" className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Sound Frequency (f) & Wavelength (λ)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              {params.frequency} Hz
            </span>
            <span className="text-xs font-mono text-[#94a3b8]">
              λ = {physics.wavelengthAir.toFixed(2)} m
            </span>
          </div>
        </div>

        {/* Frequency Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#64748b] w-10">20 Hz</span>
          <input
            id="freq-slider"
            type="range"
            min="30"
            max="4000"
            step="5"
            value={params.frequency}
            onChange={(e) => onUpdateParams({ frequency: Number(e.target.value) })}
            className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-[#161f30] rounded-lg appearance-none"
          />
          <span className="text-[11px] font-mono text-[#64748b] w-12 text-right">4.0 kHz</span>
        </div>

        {/* Wavelength Slider */}
        <div className="flex items-center gap-3 bg-[#0b0e14] p-2 rounded-lg border border-[#1e293b]">
          <span className="text-[11px] text-[#94a3b8]">Direct λ slider:</span>
          <input
            id="wavelength-slider"
            type="range"
            min="0.08"
            max="6.0"
            step="0.02"
            value={physics.wavelengthAir}
            onChange={(e) => {
              const lambda = Number(e.target.value);
              const freq = Math.round(params.cAir / lambda);
              onUpdateParams({ frequency: Math.max(30, Math.min(4000, freq)) });
            }}
            className="flex-1 accent-indigo-400 cursor-pointer h-1.5 bg-[#161f30] rounded-lg"
          />
          <span className="text-[11px] font-mono text-indigo-300 w-16 text-right font-semibold">
            {physics.wavelengthAir.toFixed(2)} m
          </span>
        </div>

        {/* Frequency Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {frequencyPresets.map((p) => (
            <button
              key={p.label}
              id={`freq-preset-${p.freq}`}
              onClick={() => onUpdateParams({ frequency: p.freq })}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                params.frequency === p.freq
                  ? 'bg-cyan-900/60 border-cyan-500 text-cyan-200'
                  : 'bg-[#161f30] border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
              }`}
            >
              {p.label} ({p.freq}Hz)
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#1e293b]" />

      {/* 3. Wall Thickness Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor="thickness-slider" className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Wall Thickness (d)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
              {(params.wallThickness * 100).toFixed(1)} cm
            </span>
            <span className="text-xs font-mono text-[#94a3b8]">
              ({physics.thicknessInWavelengths.toFixed(2)} λ_wall)
            </span>
          </div>
        </div>

        {/* Thickness Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#64748b] w-10">0.5 cm</span>
          <input
            id="thickness-slider"
            type="range"
            min="0.005"
            max="0.60"
            step="0.005"
            value={params.wallThickness}
            onChange={(e) => onUpdateParams({ wallThickness: Number(e.target.value) })}
            className="flex-1 accent-amber-400 cursor-pointer h-2 bg-[#161f30] rounded-lg appearance-none"
          />
          <span className="text-[11px] font-mono text-[#64748b] w-12 text-right">60 cm</span>
        </div>

        {/* Thickness Presets */}
        <div className="flex flex-wrap gap-1.5">
          {thicknessPresets.map((t) => (
            <button
              key={t.label}
              id={`thick-preset-${Math.round(t.thickness * 100)}`}
              onClick={() => onUpdateParams({ wallThickness: t.thickness })}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                Math.abs(params.wallThickness - t.thickness) < 0.002
                  ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                  : 'bg-[#161f30] border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#e2e8f0]'
              }`}
            >
              {t.label} ({t.desc})
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#1e293b]" />

      {/* 4. Wall Material Presets Selection */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Wall Material Selection
          </label>
          <span className="text-xs text-[#94a3b8] font-mono">
            Z = {(physics.zWall / 1000).toFixed(1)} kRayls
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MATERIAL_PRESETS.map((mat) => {
            const isSelected = params.material.id === mat.id;
            return (
              <button
                key={mat.id}
                id={`material-${mat.id}-btn`}
                onClick={() => onUpdateParams({ material: mat })}
                className={`flex flex-col text-left p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[#1e293b] border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                    : 'bg-[#161f30] border-[#1e293b] hover:bg-[#1e293b]/80'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: mat.borderColor }}
                  />
                  <span className="text-xs font-semibold text-white truncate">
                    {mat.name}
                  </span>
                </div>
                <div className="text-[10px] text-[#94a3b8] flex flex-col font-mono">
                  <span>c = {mat.soundSpeed} m/s</span>
                  <span>ρ = {mat.density} kg/m³</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom material editor if Custom selected */}
        {params.material.id === 'custom' && (
          <div className="mt-2 p-3 bg-[#0b0e14] rounded-lg border border-teal-800/60 flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-teal-300">Custom Material Properties:</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[#94a3b8]">Density (kg/m³)</label>
                <input
                  type="number"
                  min="20"
                  max="10000"
                  value={params.material.density}
                  onChange={(e) => handleCustomMaterialChange('density', Number(e.target.value))}
                  className="w-full bg-[#161f30] border border-[#1e293b] rounded px-2 py-1 text-xs text-[#e2e8f0] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#94a3b8]">Sound Speed (m/s)</label>
                <input
                  type="number"
                  min="100"
                  max="7000"
                  value={params.material.soundSpeed}
                  onChange={(e) => handleCustomMaterialChange('soundSpeed', Number(e.target.value))}
                  className="w-full bg-[#161f30] border border-[#1e293b] rounded px-2 py-1 text-xs text-[#e2e8f0] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#94a3b8]">Damping (dB/m)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={params.material.damping}
                  onChange={(e) => handleCustomMaterialChange('damping', Number(e.target.value))}
                  className="w-full bg-[#161f30] border border-[#1e293b] rounded px-2 py-1 text-xs text-[#e2e8f0] font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-[#1e293b]" />

      {/* 5. Simulation Speed & Visual Toggles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Speed */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#94a3b8]">Sim Speed:</span>
          {[0.25, 0.5, 1.0, 1.5].map((spd) => (
            <button
              key={spd}
              id={`sim-speed-${spd}x`}
              onClick={() => onUpdateParams({ simulationSpeed: spd })}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                params.simulationSpeed === spd
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-[#161f30] text-[#94a3b8] hover:bg-[#1e293b]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Waveform component checkboxes */}
        {mode === 'waveform' && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#cbd5e1]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={params.showIncidentWave}
                onChange={(e) => onUpdateParams({ showIncidentWave: e.target.checked })}
                className="rounded accent-cyan-400 bg-[#161f30]"
              />
              <span className="text-cyan-400">Incident</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={params.showReflectedWave}
                onChange={(e) => onUpdateParams({ showReflectedWave: e.target.checked })}
                className="rounded accent-amber-400 bg-[#161f30]"
              />
              <span className="text-amber-400">Reflected</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={params.showEnvelope}
                onChange={(e) => onUpdateParams({ showEnvelope: e.target.checked })}
                className="rounded accent-yellow-400 bg-[#161f30]"
              />
              <span className="text-yellow-400">Envelope</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
