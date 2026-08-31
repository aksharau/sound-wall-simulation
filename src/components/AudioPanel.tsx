import React, { useState, useEffect } from 'react';
import { AcousticSimulationParams, PhysicsResults } from '../types';
import { acousticAudio } from '../audio/acousticAudio';
import { Volume2, VolumeX, Headphones, Radio, Mic, Play, Square, Zap } from 'lucide-react';

interface AudioPanelProps {
  params: AcousticSimulationParams;
  physics: PhysicsResults;
  onUpdateParams: (updates: Partial<AcousticSimulationParams>) => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  params,
  physics,
  onUpdateParams,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync audio with physical parameters whenever frequency, material, thickness, or probe changes
  useEffect(() => {
    if (!isPlaying) {
      acousticAudio.stop();
      return;
    }

    let effectiveAttenuationDB = 0;
    if (params.audioListeningMode === 'source') {
      effectiveAttenuationDB = 0; // Pure incident tone
    } else if (params.audioListeningMode === 'transmitted') {
      effectiveAttenuationDB = physics.totalLossDB; // Attenuated through wall
    } else if (params.audioListeningMode === 'probe') {
      // If probe is before wall -> near 0dB, if inside wall -> partial, if after wall -> total loss
      const wallCenter = 1.35;
      const wallStart = (wallCenter - params.wallThickness / 2) / 3.0;
      const wallEnd = (wallCenter + params.wallThickness / 2) / 3.0;

      if (params.probePosition < wallStart) {
        effectiveAttenuationDB = 0;
      } else if (params.probePosition <= wallEnd) {
        const fraction = (params.probePosition - wallStart) / Math.max(0.001, wallEnd - wallStart);
        effectiveAttenuationDB = physics.totalLossDB * fraction;
      } else {
        effectiveAttenuationDB = physics.totalLossDB;
      }
    }

    acousticAudio.start(params.frequency, params.audioVolume);
    acousticAudio.update(
      params.frequency,
      effectiveAttenuationDB,
      params.isAudioMuted,
      params.audioVolume
    );
  }, [
    isPlaying,
    params.frequency,
    params.wallThickness,
    params.material,
    params.probePosition,
    params.audioListeningMode,
    params.isAudioMuted,
    params.audioVolume,
    physics.totalLossDB,
  ]);

  const toggleAudio = () => {
    if (isPlaying) {
      acousticAudio.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      acousticAudio.start(params.frequency, params.audioVolume);
    }
  };

  const handlePulseClick = () => {
    acousticAudio.playPulse();
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 bg-[#111827] rounded-xl border border-[#1e293b] text-[#d1d5db] shadow-lg">
      {/* Play/Stop & Status */}
      <div className="flex items-center gap-3">
        <button
          id="audio-synth-toggle-btn"
          onClick={toggleAudio}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Audio</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen To Sound</span>
            </>
          )}
        </button>

        <button
          id="audio-pulse-sound-btn"
          onClick={handlePulseClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161f30] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#1e293b] text-xs font-semibold"
          title="Audible chirp pulse"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Chirp Pulse</span>
        </button>
      </div>

      {/* Listening Mode Selector */}
      <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-lg border border-[#1e293b]">
        <button
          id="listen-source-mode-btn"
          onClick={() => onUpdateParams({ audioListeningMode: 'source' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            params.audioListeningMode === 'source'
              ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 shadow-sm'
              : 'text-[#94a3b8] hover:text-[#e2e8f0]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>Source (0dB)</span>
        </button>

        <button
          id="listen-transmitted-mode-btn"
          onClick={() => onUpdateParams({ audioListeningMode: 'transmitted' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            params.audioListeningMode === 'transmitted'
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 shadow-sm'
              : 'text-[#94a3b8] hover:text-[#e2e8f0]'
          }`}
        >
          <Headphones className="w-3.5 h-3.5 text-emerald-400" />
          <span>Behind Wall (-{physics.totalLossDB.toFixed(0)}dB)</span>
        </button>

        <button
          id="listen-probe-mode-btn"
          onClick={() => onUpdateParams({ audioListeningMode: 'probe' })}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            params.audioListeningMode === 'probe'
              ? 'bg-rose-950/90 text-rose-300 border border-rose-700/80 shadow-sm'
              : 'text-[#94a3b8] hover:text-[#e2e8f0]'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          <span>Microphone Probe</span>
        </button>
      </div>

      {/* Volume slider & Mute */}
      <div className="flex items-center gap-2.5">
        <button
          id="audio-mute-toggle-btn"
          onClick={() => onUpdateParams({ isAudioMuted: !params.isAudioMuted })}
          className="p-1.5 rounded-lg bg-[#161f30] text-[#cbd5e1] hover:bg-[#1e293b] border border-[#1e293b]"
        >
          {params.isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        <input
          id="audio-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={params.audioVolume}
          onChange={(e) => onUpdateParams({ audioVolume: Number(e.target.value) })}
          className="w-24 sm:w-28 accent-cyan-400 cursor-pointer h-1.5 bg-[#161f30] rounded-lg"
        />
        <span className="text-[11px] font-mono text-[#94a3b8] w-8">
          {Math.round(params.audioVolume * 100)}%
        </span>
      </div>
    </div>
  );
};
