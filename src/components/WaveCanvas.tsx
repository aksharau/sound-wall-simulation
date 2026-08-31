import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AcousticSimulationParams, PhysicsResults, VisualizationMode } from '../types';
import { sampleWaveAtPoint } from '../physics/acoustics';
import { Volume2, Mic, MoveHorizontal, Play, Pause, RotateCcw, Radio } from 'lucide-react';

interface WaveCanvasProps {
  params: AcousticSimulationParams;
  physics: PhysicsResults;
  mode: VisualizationMode;
  onUpdateParams: (updates: Partial<AcousticSimulationParams>) => void;
}

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  params,
  physics,
  mode,
  onUpdateParams,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation state
  const timeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction state
  const [isDraggingProbe, setIsDraggingProbe] = useState(false);
  const [isDraggingWall, setIsDraggingWall] = useState(false);
  const [dragWallEdge, setDragWallEdge] = useState<'left' | 'right' | 'center' | null>(null);
  const [pulseTime, setPulseTime] = useState<number>(0);
  const [isPulseActive, setIsPulseActive] = useState<boolean>(false);

  // Canvas dimensions in meters (world coordinate system)
  const totalLengthMeters = 3.0; // 3 meters total simulated room space
  // Wall centered around 1.3 meters
  const wallCenter = 1.35;
  const wallStartX = wallCenter - params.wallThickness / 2;
  const wallEndX = wallCenter + params.wallThickness / 2;

  // Trigger pulse packet
  const triggerPulse = useCallback(() => {
    setPulseTime(0);
    setIsPulseActive(true);
  }, []);

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;

    const render = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const dt = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (!params.isPaused) {
        timeRef.current += dt * params.simulationSpeed;
        if (isPulseActive) {
          setPulseTime((prev) => prev + dt * params.simulationSpeed);
        }
      }

      const t = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear background
      ctx.fillStyle = '#0b0e14'; // Sleek dark canvas background
      ctx.fillRect(0, 0, width, height);

      // Conversions: meters to canvas pixels
      const meterToPx = (m: number) => (m / totalLengthMeters) * width;
      const pxToMeter = (px: number) => (px / width) * totalLengthMeters;

      const wallStartPx = meterToPx(wallStartX);
      const wallEndPx = meterToPx(wallEndX);
      const wallWidthPx = Math.max(4, wallEndPx - wallStartPx);

      // 1. Draw Medium Backgrounds
      // Air left
      const airGradLeft = ctx.createLinearGradient(0, 0, wallStartPx, 0);
      airGradLeft.addColorStop(0, 'rgba(11, 14, 20, 0.95)');
      airGradLeft.addColorStop(1, 'rgba(17, 24, 39, 0.95)');
      ctx.fillStyle = airGradLeft;
      ctx.fillRect(0, 0, wallStartPx, height);

      // Wall Slab
      ctx.fillStyle = `${params.material.color}33`; // 20% opacity
      ctx.fillRect(wallStartPx, 0, wallWidthPx, height);

      // Wall pattern texture
      ctx.strokeStyle = `${params.material.borderColor}44`;
      ctx.lineWidth = 1;
      const patternSpacing = 16;
      for (let x = wallStartPx; x < wallEndPx; x += patternSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + patternSpacing, height);
        ctx.stroke();
      }

      // Air right
      const airGradRight = ctx.createLinearGradient(wallEndPx, 0, width, 0);
      airGradRight.addColorStop(0, 'rgba(17, 24, 39, 0.95)');
      airGradRight.addColorStop(1, 'rgba(11, 14, 20, 0.95)');
      ctx.fillStyle = airGradRight;
      ctx.fillRect(wallEndPx, 0, width - wallEndPx, height);

      // Wall Boundary Borders
      ctx.strokeStyle = params.material.borderColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(wallStartPx, 0);
      ctx.lineTo(wallStartPx, height);
      ctx.moveTo(wallEndPx, 0);
      ctx.lineTo(wallEndPx, height);
      ctx.stroke();

      // Draw Grid & Scale Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const meterStep = 0.5;
      for (let m = 0; m <= totalLengthMeters; m += meterStep) {
        const x = meterToPx(m);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '10px "Fira Code", monospace';
        ctx.fillText(`${m.toFixed(1)}m`, x + 4, height - 10);
      }

      // Draw Center Baseline
      const centerY = height * 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // ==========================================
      // RENDERING BY VISUALIZATION MODE
      // ==========================================

      if (mode === 'waveform') {
        // --- 1D CONTINUOUS PRESSURE WAVEFORM ---
        const sampleStepPx = 2;
        const maxAmpPx = height * 0.35;

        // Draw envelopes if enabled
        if (params.showEnvelope) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)'; // Amber
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;

          // Upper envelope
          for (let px = 0; px <= width; px += sampleStepPx * 2) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const envY = centerY - sample.envelope * maxAmpPx;
            if (px === 0) ctx.moveTo(px, envY);
            else ctx.lineTo(px, envY);
          }
          ctx.stroke();

          // Lower envelope
          ctx.beginPath();
          for (let px = 0; px <= width; px += sampleStepPx * 2) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const envY = centerY + sample.envelope * maxAmpPx;
            if (px === 0) ctx.moveTo(px, envY);
            else ctx.lineTo(px, envY);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Separate Wave Components if requested
        if (params.showIncidentWave) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)'; // Cyan
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 3]);
          for (let px = 0; px <= wallStartPx; px += sampleStepPx) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const y = centerY - sample.incident * maxAmpPx;
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (params.showReflectedWave) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)'; // Amber
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          for (let px = 0; px <= wallStartPx; px += sampleStepPx) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const y = centerY - sample.reflected * maxAmpPx;
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Main Superposition Pressure Waveform
        if (params.showSuperposition) {
          // Glow effect
          ctx.shadowBlur = 12;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';

          // Region 1: Incident side superposition
          ctx.beginPath();
          ctx.strokeStyle = '#38bdf8'; // Bright Sky Blue
          ctx.lineWidth = 3;
          for (let px = 0; px <= wallStartPx; px += sampleStepPx) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const y = centerY - sample.totalPressure * maxAmpPx;
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();

          // Region 2: Wall internal wave
          ctx.beginPath();
          ctx.strokeStyle = '#c084fc'; // Purple
          ctx.lineWidth = 3.5;
          ctx.shadowColor = 'rgba(192, 132, 252, 0.7)';
          for (let px = wallStartPx; px <= wallEndPx; px += sampleStepPx) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const y = centerY - sample.totalPressure * maxAmpPx;
            if (px === wallStartPx) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();

          // Region 3: Transmitted wave
          ctx.beginPath();
          ctx.strokeStyle = '#34d399'; // Emerald
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgba(52, 211, 153, 0.7)';
          for (let px = wallEndPx; px <= width; px += sampleStepPx) {
            const xM = pxToMeter(px);
            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );
            const y = centerY - sample.totalPressure * maxAmpPx;
            if (px === wallEndPx) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          ctx.stroke();

          ctx.shadowBlur = 0;
        }

      } else if (mode === 'particles') {
        // --- 2D LONGITUDINAL PARTICLES (COMPRESSION & RAREFACTION) ---
        const rows = 14;
        const cols = 90;
        const colSpacing = width / cols;
        const rowSpacing = height / (rows + 1);

        for (let r = 1; r <= rows; r++) {
          const baseY = r * rowSpacing;

          for (let c = 0; c <= cols; c++) {
            const baseX = c * colSpacing;
            const xM = pxToMeter(baseX);

            const sample = sampleWaveAtPoint(
              xM, t, totalLengthMeters, wallStartX, wallEndX,
              params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
            );

            // Longitudinal displacement along X axis
            const maxDispPx = 18;
            const dispX = sample.particleDisplacement * maxDispPx;
            const particleX = Math.max(2, Math.min(width - 2, baseX + dispX));

            const isInsideWall = xM >= wallStartX && xM <= wallEndX;
            const pNorm = Math.max(-1, Math.min(1, sample.totalPressure / Math.max(0.1, params.amplitude)));

            // Color by local compression / rarefaction:
            // High pressure (compression) -> Red/Amber
            // Low pressure (rarefaction) -> Cyan/Blue
            let pColor = 'rgba(148, 163, 184, 0.8)';
            if (pNorm > 0) {
              // Compression
              const intensity = Math.min(1, pNorm);
              pColor = `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`; // Red
            } else {
              // Rarefaction
              const intensity = Math.min(1, -pNorm);
              pColor = `rgba(56, 189, 248, ${0.4 + intensity * 0.6})`; // Cyan
            }

            if (isInsideWall) {
              // Wall solid lattice atom
              ctx.fillStyle = params.material.borderColor;
              ctx.beginPath();
              ctx.arc(particleX, baseY, 3.2, 0, Math.PI * 2);
              ctx.fill();

              // Draw lattice bonds
              if (c > 0 && pxToMeter((c - 1) * colSpacing) >= wallStartX) {
                ctx.strokeStyle = `${params.material.borderColor}44`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particleX, baseY);
                ctx.lineTo(particleX - colSpacing, baseY);
                ctx.stroke();
              }
            } else {
              // Air molecule
              ctx.fillStyle = pColor;
              ctx.beginPath();
              ctx.arc(particleX, baseY, 2.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

      } else if (mode === 'heatmap') {
        // --- 2D PRESSURE FIELD HEATMAP / WAVEFRONTS ---
        const stripWidth = 4;
        for (let px = 0; px < width; px += stripWidth) {
          const xM = pxToMeter(px);
          const sample = sampleWaveAtPoint(
            xM, t, totalLengthMeters, wallStartX, wallEndX,
            params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
          );

          const pNorm = Math.max(-1, Math.min(1, sample.totalPressure / Math.max(0.1, params.amplitude)));
          const isInsideWall = xM >= wallStartX && xM <= wallEndX;

          if (isInsideWall) {
            // Wall field
            const alpha = 0.2 + Math.abs(pNorm) * 0.4;
            ctx.fillStyle = `${params.material.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
          } else if (pNorm > 0) {
            // Compression (warm red/orange)
            ctx.fillStyle = `rgba(239, 68, 68, ${pNorm * 0.65})`;
          } else {
            // Rarefaction (cool cyan/blue)
            ctx.fillStyle = `rgba(14, 165, 233, ${-pNorm * 0.65})`;
          }
          ctx.fillRect(px, 0, stripWidth, height);
        }

        // Overlay wavefront crest curves
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.5;
        const lambdaAirPx = meterToPx(physics.wavelengthAir);
        if (lambdaAirPx > 6) {
          // Incident wavefronts
          const phaseOffset = ((params.cAir * t) % physics.wavelengthAir) / physics.wavelengthAir;
          for (let x = (phaseOffset * lambdaAirPx); x < wallStartPx; x += lambdaAirPx) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }

          // Transmitted wavefronts
          for (let x = wallEndPx + (phaseOffset * lambdaAirPx); x < width; x += lambdaAirPx) {
            ctx.strokeStyle = `rgba(52, 211, 153, ${Math.max(0.1, physics.pressureTransCoeff * 0.8)})`;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
        }

      } else if (mode === 'pulse') {
        // --- WAVE PACKET / ACOUSTIC PULSE SIMULATION ---
        const pulseSpeedAir = params.cAir; // 343 m/s scaled
        const pulseSpeedWall = params.material.soundSpeed;
        const pulseDuration = totalLengthMeters / 343; // nominal transit
        const virtualTime = (pulseTime * 0.6) % (pulseDuration * 2.2);

        // Position of main center
        const sigma = 0.15; // pulse width in meters
        const k1 = (2 * Math.PI * params.frequency) / params.cAir;
        const maxAmpPx = height * 0.35;

        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';

        const sampleStepPx = 2;
        for (let px = 0; px <= width; px += sampleStepPx) {
          const xM = pxToMeter(px);
          let pulseVal = 0;

          // Incident packet: traveling from x=0 towards wallStart
          const xCenterInc = virtualTime * pulseSpeedAir;
          if (xM <= wallStartX) {
            // Forward incident pulse
            const dInc = xM - xCenterInc;
            const envInc = Math.exp(-(dInc * dInc) / (2 * sigma * sigma));
            const waveInc = envInc * Math.cos(k1 * dInc);

            // Reflected pulse: starts when center passes wallStartX
            let waveRef = 0;
            if (xCenterInc > wallStartX) {
              const dRefCenter = wallStartX - (xCenterInc - wallStartX);
              const dRef = xM - dRefCenter;
              const envRef = Math.exp(-(dRef * dRef) / (2 * sigma * sigma));
              waveRef = physics.pressureReflectCoeff * envRef * Math.cos(-k1 * dRef + Math.PI);
            }

            pulseVal = waveInc + waveRef;
          } else if (xM <= wallEndX) {
            // Inside wall pulse
            if (xCenterInc > wallStartX) {
              const timeInWall = (xCenterInc - wallStartX) / pulseSpeedAir;
              const xWallCenter = wallStartX + timeInWall * pulseSpeedWall;
              const dWall = xM - xWallCenter;
              const envWall = Math.exp(-(dWall * dWall) / (2 * (sigma * 0.7) * (sigma * 0.7)));
              pulseVal = envWall * (2 / (physics.impedanceRatio + 1)) * Math.cos((2 * Math.PI * params.frequency / pulseSpeedWall) * dWall);
            }
          } else {
            // Transmitted pulse past wallEnd
            const wallTransitTime = (wallEndX - wallStartX) / pulseSpeedWall;
            const timePastWall = (xCenterInc - wallStartX) / pulseSpeedAir - wallTransitTime;
            if (timePastWall > 0) {
              const xTransCenter = wallEndX + timePastWall * pulseSpeedAir;
              const dTrans = xM - xTransCenter;
              const envTrans = Math.exp(-(dTrans * dTrans) / (2 * sigma * sigma));
              pulseVal = physics.pressureTransCoeff * envTrans * Math.cos(k1 * dTrans);
            }
          }

          const y = centerY - pulseVal * params.amplitude * maxAmpPx;
          if (px === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ==========================================
      // TRANSDUCER / SPEAKER ICON ON LEFT
      // ==========================================
      const speakerX = 14;
      const speakerY = centerY;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.rect(speakerX - 6, speakerY - 20, 10, 40);
      ctx.fill();

      // Cone
      ctx.beginPath();
      ctx.moveTo(speakerX + 4, speakerY - 14);
      ctx.lineTo(speakerX + 18, speakerY - 26);
      ctx.lineTo(speakerX + 18, speakerY + 26);
      ctx.lineTo(speakerX + 4, speakerY + 14);
      ctx.closePath();
      ctx.fillStyle = '#0369a1';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sound arcs
      if (!params.isPaused) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2;
        const waveArcPhase = (t * 6) % 3;
        for (let a = 1; a <= 3; a++) {
          const r = 24 + a * 10 + waveArcPhase * 4;
          ctx.beginPath();
          ctx.arc(speakerX + 18, speakerY, r, -Math.PI / 4, Math.PI / 4);
          ctx.stroke();
        }
      }

      // ==========================================
      // VIRTUAL MICROPHONE / PROBE
      // ==========================================
      const probePx = params.probePosition * width;
      const probeMeters = pxToMeter(probePx);
      const probeSample = sampleWaveAtPoint(
        probeMeters, t, totalLengthMeters, wallStartX, wallEndX,
        params.frequency, params.amplitude, params.material, params.cAir, params.rhoAir
      );

      // Probe vertical line
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)'; // Rose 500
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(probePx, 0);
      ctx.lineTo(probePx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Probe head
      const probeY = 40;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(probePx, probeY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulse ring around probe
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.arc(probePx, probeY, 14 + Math.sin(t * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Probe badge
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1;
      const badgeW = 96;
      const badgeH = 24;
      const badgeX = Math.min(width - badgeW - 10, Math.max(10, probePx - badgeW / 2));
      ctx.beginPath();
      ctx.roundRect(badgeX, probeY + 12, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fda4af';
      ctx.font = '10px "Fira Code", monospace';
      const probePressureVal = (probeSample.totalPressure * 100).toFixed(1);
      ctx.fillText(`P: ${probePressureVal}%`, badgeX + 8, probeY + 28);

      // ==========================================
      // ANNOTATIONS & LABELS
      // ==========================================
      // Wall label on top
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      const wallTitle = `${params.material.name} (${(params.wallThickness * 100).toFixed(1)} cm)`;
      const wallTitleWidth = ctx.measureText(wallTitle).width;
      const wallTitleX = Math.max(10, Math.min(width - wallTitleWidth - 10, (wallStartPx + wallEndPx) / 2 - wallTitleWidth / 2));
      
      // Background pill for wall title
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
      ctx.strokeStyle = params.material.borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(wallTitleX - 8, 12, wallTitleWidth + 16, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(wallTitle, wallTitleX, 29);

      // Thickness dimension arrow underneath wall
      const dimY = height - 24;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wallStartPx, dimY);
      ctx.lineTo(wallEndPx, dimY);
      // Arrow ticks
      ctx.moveTo(wallStartPx, dimY - 4);
      ctx.lineTo(wallStartPx, dimY + 4);
      ctx.moveTo(wallEndPx, dimY - 4);
      ctx.lineTo(wallEndPx, dimY + 4);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px "Fira Code", monospace';
      const thickText = `d = ${(params.wallThickness * 100).toFixed(1)} cm (${physics.thicknessInWavelengths.toFixed(2)} λ_wall)`;
      const thickTextW = ctx.measureText(thickText).width;
      ctx.fillText(thickText, (wallStartPx + wallEndPx) / 2 - thickTextW / 2, dimY - 6);

      // Regions labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Medium 1: Air (Incident & Reflected)', 16, 24);
      ctx.fillText('Medium 3: Air (Transmitted)', width - 180, 24);

      if (isMounted) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [params, physics, mode, totalLengthMeters, wallStartX, wallEndX, isPulseActive, pulseTime]);

  // Handle ResizeObserver for responsive high-DPI canvas
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
          }
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Mouse & Touch interaction handlers for dragging wall or probe
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const normX = xPx / rect.width;
    const xMeters = (normX) * totalLengthMeters;

    // Check if clicked near probe
    const probePx = params.probePosition * rect.width;
    if (Math.abs(xPx - probePx) < 24) {
      setIsDraggingProbe(true);
      return;
    }

    // Check if clicked near wall edges or center
    const wallStartPx = (wallStartX / totalLengthMeters) * rect.width;
    const wallEndPx = (wallEndX / totalLengthMeters) * rect.width;

    if (Math.abs(xPx - wallStartPx) < 14) {
      setIsDraggingWall(true);
      setDragWallEdge('left');
    } else if (Math.abs(xPx - wallEndPx) < 14) {
      setIsDraggingWall(true);
      setDragWallEdge('right');
    } else if (xPx >= wallStartPx && xPx <= wallEndPx) {
      setIsDraggingWall(true);
      setDragWallEdge('center');
    } else {
      // Clicked elsewhere -> place probe there
      onUpdateParams({ probePosition: Math.max(0.02, Math.min(0.98, normX)) });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const normX = Math.max(0.01, Math.min(0.99, xPx / rect.width));

    if (isDraggingProbe) {
      onUpdateParams({ probePosition: normX });
    } else if (isDraggingWall) {
      const currentXMeter = normX * totalLengthMeters;
      if (dragWallEdge === 'right') {
        const newThickness = Math.max(0.02, Math.min(0.70, (currentXMeter - wallStartX)));
        onUpdateParams({ wallThickness: Number(newThickness.toFixed(3)) });
      } else if (dragWallEdge === 'left') {
        const newThickness = Math.max(0.02, Math.min(0.70, (wallEndX - currentXMeter)));
        onUpdateParams({ wallThickness: Number(newThickness.toFixed(3)) });
      }
    }
  };

  const handlePointerUp = () => {
    setIsDraggingProbe(false);
    setIsDraggingWall(false);
    setDragWallEdge(null);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0e14] rounded-xl border border-[#1e293b] overflow-hidden shadow-2xl">
      {/* Top Canvas Controls Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#111827] border-b border-[#1e293b] text-xs text-[#d1d5db]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161f30] border border-[#1e293b] text-cyan-300 font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-white">f = {params.frequency} Hz</span>
            <span className="text-[#64748b]">|</span>
            <span className="font-mono text-[#cbd5e1]">λ = {physics.wavelengthAir.toFixed(2)} m</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161f30] border border-[#1e293b] text-[#cbd5e1]">
            <span className="text-amber-400 font-medium font-mono">d = {(params.wallThickness * 100).toFixed(1)} cm</span>
            <span className="text-[#64748b]">|</span>
            <span className="text-[#94a3b8] font-mono">λ_w = {physics.wavelengthWall.toFixed(2)} m</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {mode === 'pulse' && (
            <button
              id="trigger-pulse-btn"
              onClick={triggerPulse}
              className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold shadow transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Emit Pulse</span>
            </button>
          )}

          <button
            id="play-pause-canvas-btn"
            onClick={() => onUpdateParams({ isPaused: !params.isPaused })}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              params.isPaused
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                : 'bg-[#161f30] border-[#1e293b] text-[#cbd5e1] hover:bg-[#1e293b]'
            }`}
          >
            {params.isPaused ? (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            id="reset-time-btn"
            onClick={() => {
              timeRef.current = 0;
              setPulseTime(0);
            }}
            title="Reset Time Phase"
            className="p-1 rounded-md bg-[#161f30] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#1e293b]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Main Canvas */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[340px] cursor-crosshair select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {/* Interactive Helper Overlay Tooltip */}
        <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-2 text-[11px] text-[#94a3b8] bg-[#111827]/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[#1e293b]">
          <MoveHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Drag wall borders or microphone probe directly on canvas</span>
        </div>

        {/* Legend for Waveform mode */}
        {mode === 'waveform' && (
          <div className="absolute top-3 right-4 flex flex-wrap gap-2.5 text-[11px] bg-[#111827]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1e293b] text-[#cbd5e1] shadow-lg">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-cyan-400 rounded-full inline-block"></span>
              Incident
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-amber-400 rounded-full inline-block"></span>
              Reflected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-purple-400 rounded-full inline-block"></span>
              Internal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-emerald-400 rounded-full inline-block"></span>
              Transmitted
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
