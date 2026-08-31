import React, { useState, useMemo, useCallback } from 'react';
import { AcousticSimulationParams, VisualizationMode } from './types';
import { MATERIAL_PRESETS, calculatePhysics } from './physics/acoustics';
import { Header } from './components/Header';
import { WaveCanvas } from './components/WaveCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PhysicsDashboard } from './components/PhysicsDashboard';
import { AudioPanel } from './components/AudioPanel';
import { ProbeOverlay } from './components/ProbeOverlay';

const DEFAULT_PARAMS: AcousticSimulationParams = {
  frequency: 250, // 250 Hz
  wallThickness: 0.15, // 15 cm
  amplitude: 0.85,
  material: MATERIAL_PRESETS[1], // Solid Brick
  cAir: 343,
  rhoAir: 1.204,
  simulationSpeed: 0.5,
  isPaused: false,
  sourceType: 'continuous',
  pulseWidth: 0.15,
  showIncidentWave: true,
  showReflectedWave: true,
  showTransmittedWave: true,
  showSuperposition: true,
  showEnvelope: false,
  showParticlesGrid: true,
  probePosition: 0.85, // probe in transmitted room
  isAudioMuted: false,
  audioVolume: 0.5,
  audioListeningMode: 'source',
};

export default function App() {
  const [params, setParams] = useState<AcousticSimulationParams>(DEFAULT_PARAMS);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('particles');

  const updateParams = useCallback((updates: Partial<AcousticSimulationParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleApplyScenario = useCallback((updates: Partial<AcousticSimulationParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setVisualizationMode('particles');
  }, []);

  // Compute live physics
  const physics = useMemo(() => {
    return calculatePhysics(
      params.frequency,
      params.wallThickness,
      params.material,
      params.cAir,
      params.rhoAir
    );
  }, [params.frequency, params.wallThickness, params.material, params.cAir, params.rhoAir]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#d1d5db] p-3 sm:p-5 flex flex-col gap-4 max-w-7xl mx-auto font-sans">
      {/* Top Header & Presets */}
      <Header
        onApplyScenario={handleApplyScenario}
        onResetDefaults={handleResetDefaults}
      />

      {/* Main Simulation Viewport (Canvas) & Audio Controls */}
      <div className="flex flex-col gap-3">
        <div className="w-full h-[400px] sm:h-[460px]">
          <WaveCanvas
            params={params}
            physics={physics}
            mode={visualizationMode}
            onUpdateParams={updateParams}
          />
        </div>

        {/* Audio Synthesizer Bar */}
        <AudioPanel
          params={params}
          physics={physics}
          onUpdateParams={updateParams}
        />

        {/* Real-time Virtual Microphone Probe Readout */}
        <ProbeOverlay
          params={params}
          physics={physics}
        />
      </div>

      {/* Controls & Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive Variable Controls */}
        <div className="lg:col-span-5 flex flex-col">
          <ControlPanel
            params={params}
            physics={physics}
            mode={visualizationMode}
            onSetMode={setVisualizationMode}
            onUpdateParams={updateParams}
          />
        </div>

        {/* Right: Quantitative Physics Metrics & Frequency Response Charts */}
        <div className="lg:col-span-7 flex flex-col">
          <PhysicsDashboard
            params={params}
            physics={physics}
            onSetFrequency={(f) => updateParams({ frequency: f })}
            onSetThickness={(d) => updateParams({ wallThickness: d })}
          />
        </div>
      </div>
    </div>
  );
}
