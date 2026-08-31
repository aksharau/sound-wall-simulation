import React, { useRef, useEffect } from 'react';
import { AcousticSimulationParams, PhysicsResults } from '../types';
import { sampleWaveAtPoint } from '../physics/acoustics';
import { Mic, Radio, Shield, Volume2 } from 'lucide-react';

interface ProbeOverlayProps {
  params: AcousticSimulationParams;
  physics: PhysicsResults;
}

export const ProbeOverlay: React.FC<ProbeOverlayProps> = ({ params, physics }) => {
  const oscCanvasRef = useRef<HTMLCanvasElement>(null);

  const totalLengthMeters = 3.0;
  const wallCenter = 1.35;
  const wallStartX = wallCenter - params.wallThickness / 2;
  const wallEndX = wallCenter + params.wallThickness / 2;

  const probeMeters = params.probePosition * totalLengthMeters;
  const isInsideWall = probeMeters >= wallStartX && probeMeters <= wallEndX;
  const isIncidentSide = probeMeters < wallStartX;
  const isTransmittedSide = probeMeters > wallEndX;

  const regionName = isIncidentSide
    ? 'Incident Room (Air 1)'
    : isInsideWall
    ? `Inside Wall Slab (${params.material.name})`
    : 'Transmitted Room (Air 2)';

  const regionColor = isIncidentSide
    ? 'text-cyan-400 border-cyan-800 bg-cyan-950/40'
    : isInsideWall
    ? 'text-purple-400 border-purple-800 bg-purple-950/40'
    : 'text-emerald-400 border-emerald-800 bg-emerald-950/40';

  // Sample current probe value
  const sampleNow = sampleWaveAtPoint(
    probeMeters,
    performance.now() / 1000,
    totalLengthMeters,
    wallStartX,
    wallEndX,
    params.frequency,
    params.amplitude,
    params.material,
    params.cAir,
    params.rhoAir
  );

  // Local SPL decibels estimate relative to source and absolute dB SPL:
  const sourceSPL = params.sourceSPL ?? 90;
  let relativeLossDB = 0;
  if (isIncidentSide) {
    relativeLossDB = 0;
  } else if (isInsideWall) {
    const frac = (probeMeters - wallStartX) / Math.max(0.001, wallEndX - wallStartX);
    relativeLossDB = -physics.totalLossDB * frac;
  } else {
    relativeLossDB = -physics.totalLossDB;
  }

  const localSPL = Math.max(0, sourceSPL + relativeLossDB);

  // Mini oscilloscope animation
  useEffect(() => {
    const canvas = oscCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const renderOsc = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Center grid line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Oscilloscope wave trace over time
      ctx.strokeStyle = isIncidentSide ? '#38bdf8' : isInsideWall ? '#c084fc' : '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const timeNow = performance.now() / 1000;
      const period = 1 / params.frequency;
      const samples = 60;

      for (let i = 0; i <= samples; i++) {
        const tSample = timeNow - ((samples - i) / samples) * period * 3;
        const s = sampleWaveAtPoint(
          probeMeters,
          tSample,
          totalLengthMeters,
          wallStartX,
          wallEndX,
          params.frequency,
          params.amplitude,
          params.material,
          params.cAir,
          params.rhoAir
        );
        const y = h / 2 - s.totalPressure * (h * 0.4);
        const x = (i / samples) * w;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(renderOsc);
    };

    animId = requestAnimationFrame(renderOsc);
    return () => cancelAnimationFrame(animId);
  }, [probeMeters, params, physics, isIncidentSide, isInsideWall, wallStartX, wallEndX]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-[#111827] rounded-xl border border-[#1e293b] text-xs text-[#d1d5db] shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-400 shadow-sm">
          <Mic className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Virtual Microphone Probe</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${regionColor}`}>
              {regionName}
            </span>
          </div>
          <div className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
            x = {probeMeters.toFixed(2)} m ({(params.probePosition * 100).toFixed(0)}% across room)
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Oscilloscope canvas */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-[#94a3b8] mb-1">Local Oscilloscope P(t)</span>
          <canvas
            ref={oscCanvasRef}
            width={120}
            height={36}
            className="rounded-lg border border-[#1e293b] bg-[#090d16]"
          />
        </div>

        {/* Local SPL dB */}
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-[#94a3b8]">Probe Measured Sound Level</span>
          <span className="text-sm font-bold font-mono text-cyan-400">
            {localSPL.toFixed(1)} dB SPL
          </span>
          <span className="text-[10px] text-[#64748b] font-mono">
            {relativeLossDB === 0 ? 'Source Incident' : `${relativeLossDB.toFixed(1)} dB atten.`}
          </span>
        </div>
      </div>
    </div>
  );
};
