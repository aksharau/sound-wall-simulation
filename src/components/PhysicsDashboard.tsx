import React, { useState, useMemo } from 'react';
import { AcousticSimulationParams, PhysicsResults } from '../types';
import { generateFrequencyResponseCurve, generateThicknessResponseCurve } from '../physics/acoustics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  ShieldAlert, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  AlertTriangle,
  Zap,
  VolumeX,
  Volume2
} from 'lucide-react';

interface PhysicsDashboardProps {
  params: AcousticSimulationParams;
  physics: PhysicsResults;
  onSetFrequency: (freq: number) => void;
  onSetThickness: (thickness: number) => void;
}

export const PhysicsDashboard: React.FC<PhysicsDashboardProps> = ({
  params,
  physics,
  onSetFrequency,
  onSetThickness,
}) => {
  const [activeTab, setActiveTab] = useState<'freq-curve' | 'thickness-curve' | 'theory'>('freq-curve');

  // Memoized frequency response curve points
  const freqData = useMemo(() => {
    return generateFrequencyResponseCurve(
      params.wallThickness,
      params.material,
      params.cAir,
      params.rhoAir
    );
  }, [params.wallThickness, params.material, params.cAir, params.rhoAir]);

  // Memoized thickness response curve points
  const thicknessData = useMemo(() => {
    return generateThicknessResponseCurve(
      params.frequency,
      params.material,
      params.cAir,
      params.rhoAir
    );
  }, [params.frequency, params.material, params.cAir, params.rhoAir]);

  const transPct = (physics.powerTransCoeff * 100).toFixed(1);
  const reflectPct = (physics.powerReflectCoeff * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 bg-[#111827] rounded-xl border border-[#1e293b] text-[#d1d5db] shadow-xl">
      {/* 1. Live Quantitative Acoustic Metrics Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            Live Acoustic Physics Readouts
          </h3>
          {physics.isHalfWaveResonance && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-600 animate-pulse">
              <Zap className="w-3 h-3 text-amber-400" />
              Half-Wave Resonance Transparency (d ≈ nλ/2)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Transmission Card */}
          <div className="p-3.5 rounded-lg bg-[#0b0e14] border border-[#1e293b] flex flex-col justify-between">
            <div className="text-[11px] text-[#94a3b8] flex items-center justify-between">
              <span>Transmitted Power (τ)</span>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {transPct}%
              </div>
              <div className="text-[11px] text-[#94a3b8] font-mono">
                Amp T = {physics.pressureTransCoeff.toFixed(3)}
              </div>
            </div>
            <div className="w-full bg-[#161f30] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, physics.powerTransCoeff * 100))}%` }}
              />
            </div>
          </div>

          {/* Reflection Card */}
          <div className="p-3.5 rounded-lg bg-[#0b0e14] border border-[#1e293b] flex flex-col justify-between">
            <div className="text-[11px] text-[#94a3b8] flex items-center justify-between">
              <span>Reflected Power (R)</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-amber-400">
                {reflectPct}%
              </div>
              <div className="text-[11px] text-[#94a3b8] font-mono">
                Amp R = {physics.pressureReflectCoeff.toFixed(3)}
              </div>
            </div>
            <div className="w-full bg-[#161f30] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, physics.powerReflectCoeff * 100))}%` }}
              />
            </div>
          </div>

          {/* Transmission Loss dB Card */}
          <div className="p-3.5 rounded-lg bg-[#0b0e14] border border-[#1e293b] flex flex-col justify-between">
            <div className="text-[11px] text-[#94a3b8] flex items-center justify-between">
              <span>Transmission Loss (STL)</span>
              <VolumeX className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono text-cyan-300">
                {physics.totalLossDB.toFixed(1)} <span className="text-sm font-normal text-[#94a3b8]">dB</span>
              </div>
              <div className="text-[11px] text-[#94a3b8] font-mono">
                Mass Law: {physics.massLawTL_DB.toFixed(1)} dB
              </div>
            </div>
            <div className="text-[10px] text-cyan-400/90 font-medium">
              {physics.totalLossDB > 45 ? 'Exceptional Isolation' : physics.totalLossDB > 25 ? 'Moderate Barrier' : 'High Sound Leakage'}
            </div>
          </div>

          {/* Acoustic Impedances Card */}
          <div className="p-3.5 rounded-lg bg-[#0b0e14] border border-[#1e293b] flex flex-col justify-between">
            <div className="text-[11px] text-[#94a3b8] flex items-center justify-between">
              <span>Impedance Mismatch</span>
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="my-1.5">
              <div className="text-xl font-bold font-mono text-indigo-300">
                {physics.impedanceRatio > 1000 ? `${(physics.impedanceRatio / 1000).toFixed(1)}k : 1` : `${physics.impedanceRatio.toFixed(1)} : 1`}
              </div>
              <div className="text-[11px] text-[#94a3b8] font-mono">
                SWR: {physics.standingWaveRatio.toFixed(2)}
              </div>
            </div>
            <div className="text-[10px] text-[#64748b] font-mono truncate">
              Z = {(physics.zWall).toLocaleString()} Rayls
            </div>
          </div>
        </div>
      </div>

      {/* 2. Analytical Graphs & Theory Tabs */}
      <div className="flex flex-col gap-3">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 border-b border-[#1e293b] pb-2 overflow-x-auto">
          <button
            id="tab-freq-curve"
            onClick={() => setActiveTab('freq-curve')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'freq-curve'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'text-[#94a3b8] hover:text-[#e2e8f0]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Transmission Loss vs. Frequency (STL Spectrum)
          </button>

          <button
            id="tab-thickness-curve"
            onClick={() => setActiveTab('thickness-curve')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'thickness-curve'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'text-[#94a3b8] hover:text-[#e2e8f0]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Transmission vs. Thickness
          </button>

          <button
            id="tab-theory"
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'theory'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                : 'text-[#94a3b8] hover:text-[#e2e8f0]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Acoustic Principles
          </button>
        </div>

        {/* Tab Content: Frequency Response */}
        {activeTab === 'freq-curve' && (
          <div className="p-4 bg-[#0b0e14] rounded-lg border border-[#1e293b]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Sound Transmission Loss (STL in dB) across Audio Spectrum
                </h4>
                <p className="text-[11px] text-[#94a3b8]">
                  Higher dB means better sound blocking. Notice how bass frequencies (&lt;200 Hz) have much lower loss than treble.
                </p>
              </div>
              <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800 self-start">
                Current f = {params.frequency} Hz (STL = {physics.totalLossDB.toFixed(1)} dB)
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={freqData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="frequency"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `${val}Hz`}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    unit="dB"
                    domain={[0, 'dataMax + 10']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                    formatter={(value: number, name: string) => [
                      `${value} dB`,
                      name === 'transmissionLossDB' ? 'Exact Wave Transmission Loss' : 'Theoretical Mass Law'
                    ]}
                    labelFormatter={(label) => `Frequency: ${label} Hz`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine x={params.frequency} stroke="#38bdf8" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'Operating f', fill: '#38bdf8', fontSize: 10, position: 'top' }} />
                  <Line
                    type="monotone"
                    dataKey="transmissionLossDB"
                    name="Exact Wave STL (dB)"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="massLawDB"
                    name="Mass Law Approximation (dB)"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab Content: Thickness Curve */}
        {activeTab === 'thickness-curve' && (
          <div className="p-4 bg-[#0b0e14] rounded-lg border border-[#1e293b]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Power Transmission (%) vs. Wall Thickness at {params.frequency} Hz
                </h4>
                <p className="text-[11px] text-[#94a3b8]">
                  Observe how transmission drops exponentially with thickness, with periodic resonance transparency peaks at half-wavelength multiples.
                </p>
              </div>
              <div className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2 py-1 rounded border border-amber-800 self-start">
                Current d = {(params.wallThickness * 100).toFixed(1)} cm ({transPct}% Transmission)
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={thicknessData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="thicknessCm"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => `${val}cm`}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px', color: '#f1f5f9' }}
                    formatter={(value: number) => [`${value}%`, 'Transmitted Power']}
                    labelFormatter={(label) => `Thickness: ${label} cm`}
                  />
                  <ReferenceLine
                    x={Number((params.wallThickness * 100).toFixed(1))}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{ value: 'Current Wall', fill: '#f59e0b', fontSize: 10, position: 'top' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transmissionPct"
                    name="Transmitted Energy (%)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab Content: Acoustic Physics Principles & Equations */}
        {activeTab === 'theory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-[#0b0e14] rounded-lg border border-[#1e293b] text-xs">
            <div className="p-3.5 bg-[#161f30] rounded-lg border border-[#1e293b] flex flex-col gap-2">
              <h5 className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                1. Acoustic Impedance Mismatch
              </h5>
              <p className="text-[#cbd5e1] leading-relaxed text-[11px]">
                Specific acoustic impedance is given by <code className="font-mono bg-[#0b0e14] px-1 py-0.5 rounded text-cyan-200 border border-[#1e293b]">Z = ρ · c</code>.
                When sound hits a wall, the huge mismatch between air (<code className="font-mono text-cyan-300">~413 Rayls</code>) and dense solid materials (<code className="font-mono text-cyan-300">&gt;1,000,000 Rayls</code>) forces the majority of sound energy to reflect back like light off a mirror.
              </p>
            </div>

            <div className="p-3.5 bg-[#161f30] rounded-lg border border-[#1e293b] flex flex-col gap-2">
              <h5 className="font-bold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                2. Why Bass Leaks More (The Mass Law)
              </h5>
              <p className="text-[#cbd5e1] leading-relaxed text-[11px]">
                Transmission loss follows the acoustic Mass Law: <code className="font-mono bg-[#0b0e14] px-1 py-0.5 rounded text-amber-200 border border-[#1e293b]">TL ≈ 20·log10(m·f) - 47 dB</code>, where <code className="font-mono text-amber-300">m = ρ · d</code> (surface mass).
                Every doubling of frequency or wall thickness increases sound isolation by <strong className="text-white">6 dB</strong>. This is why low-frequency sub-bass travels through walls far more easily than speech or high treble!
              </p>
            </div>

            <div className="p-3.5 bg-[#161f30] rounded-lg border border-[#1e293b] flex flex-col gap-2">
              <h5 className="font-bold text-purple-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                3. Half-Wave Resonance Transparency
              </h5>
              <p className="text-[#cbd5e1] leading-relaxed text-[11px]">
                When wall thickness equals an exact multiple of half the internal acoustic wavelength (<code className="font-mono bg-[#0b0e14] px-1 py-0.5 rounded text-purple-200 border border-[#1e293b]">d = n · λ_wall / 2</code>), the internal bouncing waves interfere constructively, causing transmission transparency notches where sound passes with minimal reflection!
              </p>
            </div>

            <div className="p-3.5 bg-[#161f30] rounded-lg border border-[#1e293b] flex flex-col gap-2">
              <h5 className="font-bold text-emerald-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                4. Standing Wave Formation
              </h5>
              <p className="text-[#cbd5e1] leading-relaxed text-[11px]">
                On the incident side (left room), the incoming wave and the strong reflected wave superimpose to form a standing wave with stationary nodes (zero pressure) and antinodes (maximum pressure), quantified by the Standing Wave Ratio <code className="font-mono bg-[#0b0e14] px-1 py-0.5 rounded text-emerald-200 border border-[#1e293b]">SWR = (1 + |R|) / (1 - |R|)</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
